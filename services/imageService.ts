// services/imageService.ts

import { GoogleGenAI, Modality } from "@google/genai";
import type { Recipe } from "../types";
import { buildKey, resizeImage, dataUriToBlob } from './imageProcessingService';
import { saveImageArtifacts, getRecipeImageUrls, ImageUrls, getArtifacts, saveAlias } from './imageStoreService';

const API_KEY = process.env.API_KEY;
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// The generation spec. Any change here will result in a new image hash.
const getGenerationSpec = (recipe: Recipe) => {
    const { name, ingredients, course, diet_tags } = recipe;
    const keyIngredients = ingredients
        .split('\n')
        .slice(0, 3)
        .map(line => line.replace(/^[\d\s\-•]+/, '').trim())
        .join(', ');

    const prompt = `
Professional food photography of ${name}, a traditional Indian ${course} dish.
The dish should be beautifully plated and styled with:
- Key visual elements: ${keyIngredients}
- Vibrant colors and authentic presentation
- Garnished traditionally (e.g., cilantro, lime, ginger)
- Served in appropriate dishware (like a kadai, thali, bowl, or plate)
- Soft, natural lighting creating a gentle ambiance
- Shallow depth of field to make the dish pop
- Restaurant-quality food styling
- An appetizing, magazine-worthy composition
${diet_tags.length > 0 ? `- Visual emphasis on it being ${diet_tags.join(', ')}` : ''}

Style: photorealistic, high-resolution, professional food photography.
Mood: warm, inviting, appetizing.
Do not include text or watermarks.
    `.trim();

    return {
        prompt,
        model: 'gemini-2.5-flash-image',
        pipeline_version: '1.0',
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
      
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const dataUri = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            return await dataUriToBlob(dataUri);
        }
    }
    throw new Error("No image data found in Gemini response.");
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

    // Short-circuit if alias and artifacts are already on disk (in IndexedDB)
    const existingUrls = await getRecipeImageUrls(recipe.id);
    if (existingUrls) {
        return { key, urls: existingUrls };
    }

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
        request: spec,
        timestamps: { created_utc: new Date().toISOString() },
    };

    // 4. Persist everything atomically
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