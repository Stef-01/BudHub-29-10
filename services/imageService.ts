// services/imageService.ts

import { GoogleGenAI, Modality } from "@google/genai";
import type { Recipe } from "../types";
import { buildKey, resizeImage, dataUriToBlob } from './imageProcessingService';
import { saveImageArtifacts, getRecipeImageState, ImageUrls, getArtifacts, saveAlias, getAlias } from './imageStoreService';

const API_KEY = process.env.API_KEY;
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// A simple deterministic hash function to get a number from a string.
// Used to select a shot plan consistently for a given recipe ID.
function simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

const shotPlans = [
    "Overhead thali spread on a banana leaf or traditional steel tray, showcasing multiple small dishes.",
    "Three-quarter hero shot at table height with a very shallow depth of field (f/2.8-f/4 look), making the main dish the star.",
    "Tight macro shot focusing on the textures of the food and its fresh garnish.",
    "Action shot: a hand pouring sauce or a ladle lifting a portion, showing viscosity and steam.",
    "Clean studio plate shot on a neutral, slightly textured background (like dark slate or white marble) with ample negative space for UI overlays.",
    "Cozy lifestyle table scene for two, with hands just out of frame, suggesting a shared meal.",
    "A tiffin box or stacked container setup, as if prepared for a journey or lunch.",
    "Rustic street food style presentation on a stone slab or newspaper liner.",
    "Glamour shot for a dessert or beverage on a reflective marble or slate surface.",
    "Close-up on a stack of flatbreads (like roti or naan) showing blistering and char.",
    "Family-style presentation in a central serving bowl, surrounded by smaller side bowls of chutneys and raita."
];

// The generation spec. Any change here will result in a new image hash.
export const getGenerationSpec = (recipe: Recipe) => {
    const { name, ingredients, course, diet_tags, id } = recipe;
    const keyIngredients = ingredients
        .split('\n')
        .slice(0, 3)
        .map(line => line.replace(/^[\d\s\-•]+/, '').trim())
        .join(', ');

    // Replace Math.random() with a deterministic selection based on the recipe ID.
    // This ensures that the generated prompt (and thus the image key) is stable for each recipe.
    const recipeIdHash = simpleHash(id);
    const shotIndex = Math.abs(recipeIdHash) % shotPlans.length;
    const deterministicShot = shotPlans[shotIndex];

    const prompt = `
**Goal:** A photorealistic, appetizing image of a healthy Indian dish for a contemporary menu.

**Dish Details:**
- **Name:** ${name}
- **Type:** A ${diet_tags.join(', ')} Indian ${course}.
- **Key Ingredients to Show:** ${keyIngredients}.

**Creative Direction:**
- **Angle & Composition:** ${deterministicShot}. Apply the rule of thirds. The main dish should be the sharp, clear hero of the image. Create a soft, blurred background (creamy bokeh).
- **Lighting:** Use soft, natural light, like from a window. Create gentle shadows for depth. The colors should be vibrant but realistic. For hot dishes, show a little bit of natural-looking steam.
- **Plating:** Serve in authentic dishes (like copper, brass, or clay bowls). Garnish with fresh herbs (like cilantro or curry leaves). Place on a simple, high-quality surface like dark slate or warm wood. The background should be simple.
- **Quality:** High-resolution, professional food photography. The image should look like it was taken with a prime lens (50mm or 85mm style). No AI mistakes like weird utensils.

**Do Not Include:**
- People's faces, logos, or text.
- Cartoon styles or illustrations.
    `.trim();

    return {
        prompt,
        model: 'gemini-2.5-flash-image',
        pipeline_version: '1.3', // Bumped version to trigger regeneration with new, safer prompt
    };
};

async function callGeminiImageAPI(prompt: string): Promise<Blob> {
    if (!ai) {
        throw new Error("API key not configured for Gemini.");
    }
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const candidate = response?.candidates?.[0];
    
    // Check for the success case first: a candidate with valid image data.
    const imagePart = candidate?.content?.parts?.find(p => p.inlineData);
    if (imagePart?.inlineData) {
        const dataUri = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        return await dataUriToBlob(dataUri);
    }

    // If we reach here, generation failed. Construct a detailed error message.
    console.error("Image generation blocked or failed. Full response:", JSON.stringify(response, null, 2));

    const feedback = response?.promptFeedback;
    let errorMessage = "Image generation failed.";

    if (feedback?.blockReasonMessage) {
        errorMessage = `Image generation blocked. Reason: ${feedback.blockReasonMessage}`;
    } else if (feedback?.blockReason) {
        errorMessage = `Image generation blocked. Reason: ${feedback.blockReason}`;
    } else if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
        errorMessage = `Image generation failed. Reason: ${candidate.finishReason.replace(/_/g, ' ')}`;
    } else if (!candidate) {
        errorMessage = "Image generation failed: No response candidate returned from API.";
    } else {
        errorMessage = "Image generation failed: API candidate did not contain image data.";
    }

    throw new Error(errorMessage);
}

/**
 * The main function to get a recipe image.
 * It follows the permanent, write-through cache architecture.
 */
export async function generateAndStoreRecipeImage(recipe: Recipe): Promise<{ key: string, urls: ImageUrls }> {
    if (!ai) {
        throw new Error("API key not configured for Gemini.");
    }

    const spec = getGenerationSpec(recipe);
    const key = await buildKey(spec);

    // This check is a final safeguard against re-generating an image that's already correct.
    // The primary logic for enqueueing is in useRecipeImage.
    const alias = await getAlias(recipe.id);
    if (alias && alias.key === key) {
        const existingState = await getRecipeImageState(recipe.id);
        if (existingState) {
            // It already exists and is correct, return the existing data.
            const { key: _key, ...urls } = existingState;
            return { key, urls };
        }
    }
    
    // If we're here, either no image exists for this recipe, or the spec has changed (new key).
    // Proceed with generation.

    // 1. Call Gemini to get the original image bytes (as a Blob)
    const originalBlob = await callGeminiImageAPI(spec.prompt);

    // 2. Create derivatives (preview and thumb)
    const [previewBlob, thumbBlob] = await Promise.all([
        resizeImage(originalBlob, 1024),
        resizeImage(originalBlob, 256),
    ]);
    
    // 3. Create the manifest
    const manifest = {
        key,
        request: { ...spec, source: 'ai_generated' },
        timestamps: { created_utc: new Date().toISOString() },
    };

    // 4. Persist everything atomically. This also updates/creates the alias.
    await saveImageArtifacts(key, recipe.id, {
        original: originalBlob,
        preview: previewBlob,
        thumb: thumbBlob,
        manifest,
    });

    // 5. Expose object URLs for the UI
    const urls = {
        original: URL.createObjectURL(originalBlob),
        preview: URL.createObjectURL(previewBlob),
        thumb: URL.createObjectURL(thumbBlob),
    };
    
    return { key, urls };
}


export async function processAndStoreUserImage(recipe: Recipe, imageFile: File): Promise<{ key: string }> {
    const buffer = await imageFile.arrayBuffer();
    const key = await buildKey(buffer);

    const existingArtifacts = await getArtifacts(key);
    if (existingArtifacts) {
        await saveAlias(recipe.id, key);
        return { key };
    }

    const [previewBlob, thumbBlob] = await Promise.all([
        resizeImage(imageFile, 1024),
        resizeImage(imageFile, 256),
    ]);

    const manifest = {
        key,
        request: { source: 'user_upload', filename: imageFile.name, size: imageFile.size },
        timestamps: { created_utc: new Date().toISOString() },
    };

    await saveImageArtifacts(key, recipe.id, {
        original: imageFile,
        preview: previewBlob,
        thumb: thumbBlob,
        manifest,
    });

    return { key };
}