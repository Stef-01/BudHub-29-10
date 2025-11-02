// services/imageService.ts

import { GoogleGenAI } from "@google/genai";
import type { Recipe } from '../types';
import { buildKey, resizeImage, dataUriToBlob } from './imageProcessingService';
import { saveImageArtifacts, saveAlias, type ImageArtifacts } from './imageStoreService';
import { getDb, STORES } from './db';
import { sqliteStore } from './sqliteStore';

// This is also defined in geminiService.ts. It's better to keep it consistent.
// Or even better, have a single point of initialization. For now, I'll just copy it.
const API_KEY = process.env.API_KEY;
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

if (!ai) {
  console.warn("API key not found in imageService. Image generation will be disabled.");
}

/**
 * Generates an image for a given recipe using the Gemini API,
 * processes it into different sizes, and stores it in IndexedDB and SQLite.
 * 
 * IMPORTANT: Checks both IndexedDB and SQLite for existing images to prevent
 * redundant generation, especially when IndexedDB cache is cleared.
 */
export async function generateAndStoreRecipeImage(recipe: Recipe): Promise<{ key: string }> {
  if (!ai) {
    throw new Error("Gemini API not initialized. Cannot generate images.");
  }

  const prompt = `
    A vibrant, appetizing, professional food photograph of "${recipe.name}".
    The dish should be presented beautifully on a simple, clean background.
    Style: photorealistic, food magazine style, high detail, delicious lighting.
    Ingredients visible could include: ${recipe.keyIngredients.join(', ')}.
    Course: ${recipe.course}.
  `.trim();

  // The generation request will be used to create a stable key
  const generationSpec = {
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      recipeId: recipe.id, // Include recipeId to ensure uniqueness if prompts are similar
  };

  const key = await buildKey(generationSpec);

  // Check IndexedDB first
  const db = await getDb();
  const existingArtifacts = await db.get(STORES.IMAGE_ARTIFACTS, key);
  
  if (existingArtifacts) {
    console.log(`Image for recipe "${recipe.name}" already exists in IndexedDB (key: ${key}). Skipping generation.`);
    await saveAlias(recipe.id, key);
    return { key };
  }

  // Check SQLite as fallback
  try {
    const sqliteRecord = await sqliteStore.getImage(key);
    if (sqliteRecord) {
      console.log(`Image for recipe "${recipe.name}" found in SQLite but missing from IndexedDB (key: ${key}). Skipping generation.`);
      // The read-through cache in getRecipeImageState will handle repopulation.
      // We just need to ensure the alias exists so it can be found.
      await saveAlias(recipe.id, key);
      return { key };
    }
  } catch (sqliteError) {
    console.warn(`SQLite check failed for key ${key}:`, sqliteError);
    // Continue with generation if SQLite check fails
  }

  console.log(`Generating image for recipe "${recipe.name}" with key: ${key}`);

  try {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error("API returned no images.");
    }

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    const originalBlob = await dataUriToBlob(`data:image/jpeg;base64,${base64ImageBytes}`);

    // Process and store the image
    const [preview, thumb] = await Promise.all([
      resizeImage(originalBlob, 1024), // For detail view
      resizeImage(originalBlob, 256), // For cards/thumbnails
    ]);

    const manifest = {
      request: {
        source: 'ai_generated',
        spec: generationSpec,
      },
      timestamps: {
        created_utc: new Date().toISOString(),
      },
    };
    
    const artifacts: ImageArtifacts = {
        original: originalBlob,
        preview,
        thumb,
        manifest,
    };
    
    await saveImageArtifacts(key, recipe.id, artifacts);

    return { key };

  } catch (error) {
    console.error(`Error generating image for recipe "${recipe.name}":`, error);
    // Re-throwing to be handled by the caller (ImageGenerationContext)
    if (error instanceof Error) {
        // Check for specific rate limit error text if available from the SDK
        if (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED')) {
           throw new Error(`429: ${error.message}`);
        }
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred during image generation.");
  }
}

/**
 * Processes a user-uploaded image file for a recipe, resizes it,
 * generates a content-addressed key, and stores it in IndexedDB and SQLite.
 */
export async function processAndStoreUserImage(recipe: Recipe, imageFile: File): Promise<{ key: string }> {
    const originalBlob = new Blob([imageFile], { type: imageFile.type });
    const arrayBuffer = await imageFile.arrayBuffer();
    const key = await buildKey(arrayBuffer); // Content-address the image

    console.log(`Processing user image for recipe "${recipe.name}" with key: ${key}`);

    try {
        const [preview, thumb] = await Promise.all([
            resizeImage(originalBlob, 1024),
            resizeImage(originalBlob, 256),
        ]);
        
        const manifest = {
            request: {
                source: 'user_upload',
                originalFilename: imageFile.name,
            },
            timestamps: {
                created_utc: new Date().toISOString(),
            },
        };
        
        const artifacts: ImageArtifacts = {
            original: originalBlob,
            preview,
            thumb,
            manifest,
        };

        await saveImageArtifacts(key, recipe.id, artifacts);

        return { key };
    } catch (error) {
        console.error(`Error processing user image for recipe "${recipe.name}":`, error);
        if (error instanceof Error) {
            throw new Error(`Image Processing Error: ${error.message}`);
        }
        throw new Error("An unknown error occurred during image processing.");
    }
}
