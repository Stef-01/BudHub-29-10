// services/foodImageDataset.ts

/**
 * Food Image Dataset Service
 *
 * Manages permanent, shared food images that are displayed to all users.
 * Unlike user recipe images, these are part of the core dataset and stored
 * in a separate table in SQLite.
 */

import { buildKey, resizeImage } from './imageProcessingService';
import { sqliteStore } from './sqliteStore';
import { urlManager } from './urlManager';
import { getNutriServeFoodImageUrl } from './publicImageLoader';

export interface FoodImageUrls {
  thumb: string;
  preview: string;
  original: string;
}

export interface FoodImageState {
  foodId: string;
  key: string;
  urls: FoodImageUrls;
}

/**
 * Uploads and processes a food image from a file.
 * Creates 3 sizes and stores them permanently in SQLite.
 *
 * @param foodId - The food item ID (e.g., 'rice_white', 'chana_masala')
 * @param imageFile - The image file to upload
 */
export async function uploadFoodImage(foodId: string, imageFile: File): Promise<void> {
  console.log(`[FoodDataset] Uploading image for ${foodId}`);

  // Read the file as a Blob
  const originalBlob = new Blob([await imageFile.arrayBuffer()], { type: imageFile.type });

  // Generate content-addressed key from the original image
  const key = await buildKey(await originalBlob.arrayBuffer());
  console.log(`[FoodDataset] Generated key: ${key}`);

  // Create resized versions
  const preview = await resizeImage(originalBlob, 800, 0.88);
  const thumb = await resizeImage(originalBlob, 200, 0.85);

  // Convert to Uint8Array for storage
  const originalArray = new Uint8Array(await originalBlob.arrayBuffer());
  const previewArray = new Uint8Array(await preview.arrayBuffer());
  const thumbArray = new Uint8Array(await thumb.arrayBuffer());

  // Save to SQLite food_images table
  await sqliteStore.saveFoodImage({
    food_id: foodId,
    image_key: key,
    original: originalArray,
    preview: previewArray,
    thumb: thumbArray,
    created_at: new Date().toISOString()
  });

  console.log(`[FoodDataset] Successfully saved image for ${foodId}`);
}

/**
 * Retrieves a food image by food ID.
 * Checks public/dataset/food-images first (direct file access),
 * then falls back to SQLite database.
 *
 * @param foodId - The food item ID
 * @returns Image state with URLs, or null if not found
 */
export async function getFoodImage(foodId: string): Promise<FoodImageState | null> {
  // 1. FIRST: Check public/dataset/food-images folder
  try {
    const publicImageUrl = await getNutriServeFoodImageUrl(foodId);
    if (publicImageUrl) {
      console.log(`[FoodDataset] Using public folder image for ${foodId}: ${publicImageUrl}`);

      // Return the same URL for all sizes (browser will scale as needed)
      return {
        foodId,
        key: `public:${foodId}`,
        urls: {
          thumb: publicImageUrl,
          preview: publicImageUrl,
          original: publicImageUrl,
        }
      };
    }
  } catch (e) {
    console.log(`[FoodDataset] No public folder image for ${foodId}, checking database...`);
  }

  // 2. FALLBACK: Check SQLite database
  const record = await sqliteStore.getFoodImage(foodId);

  if (!record) {
    return null;
  }

  console.log(`[FoodDataset] Using database image for ${foodId}`);

  // Convert Uint8Array back to Blob
  const originalBlob = new Blob([record.original], { type: 'image/webp' });
  const previewBlob = new Blob([record.preview], { type: 'image/webp' });
  const thumbBlob = new Blob([record.thumb], { type: 'image/webp' });

  // Create managed object URLs
  const urls: FoodImageUrls = {
    thumb: urlManager.create(thumbBlob, `food:${foodId}:thumb`),
    preview: urlManager.create(previewBlob, `food:${foodId}:preview`),
    original: urlManager.create(originalBlob, `food:${foodId}:original`)
  };

  return {
    foodId,
    key: record.image_key,
    urls
  };
}

/**
 * Checks if a food image exists.
 *
 * @param foodId - The food item ID
 * @returns true if image exists, false otherwise
 */
export async function hasFoodImage(foodId: string): Promise<boolean> {
  const record = await sqliteStore.getFoodImage(foodId);
  return record !== null;
}

/**
 * Deletes a food image.
 *
 * @param foodId - The food item ID
 */
export async function deleteFoodImage(foodId: string): Promise<void> {
  await sqliteStore.deleteFoodImage(foodId);
  console.log(`[FoodDataset] Deleted image for ${foodId}`);
}

/**
 * Gets all food IDs that have images.
 *
 * @returns Array of food IDs
 */
export async function getAllFoodImagesIds(): Promise<string[]> {
  return await sqliteStore.getAllFoodImageIds();
}

/**
 * Bulk seed images from a dataset.
 * Useful for initial population or updates.
 *
 * @param dataset - Array of {foodId, imageFile} objects
 * @param onProgress - Optional callback for progress updates
 */
export async function seedFoodImages(
  dataset: Array<{ foodId: string; imageFile: File }>,
  onProgress?: (current: number, total: number, foodId: string) => void
): Promise<void> {
  console.log(`[FoodDataset] Seeding ${dataset.length} images`);

  for (let i = 0; i < dataset.length; i++) {
    const { foodId, imageFile } = dataset[i];

    try {
      await uploadFoodImage(foodId, imageFile);
      onProgress?.(i + 1, dataset.length, foodId);
    } catch (error) {
      console.error(`[FoodDataset] Failed to seed image for ${foodId}:`, error);
      // Continue with next image instead of failing completely
    }
  }

  console.log(`[FoodDataset] Seeding complete`);
}
