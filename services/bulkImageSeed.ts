// services/bulkImageSeed.ts

/**
 * Bulk Image Seeding Service
 *
 * Processes images from public/dataset folders and populates the database.
 * Supports both food images and recipe images.
 */

import { buildKey, resizeImage } from './imageProcessingService';
import { sqliteStore } from './sqliteStore';

export interface SeedProgress {
  current: number;
  total: number;
  itemId: string;
  status: 'processing' | 'success' | 'error';
  message?: string;
}

export type SeedProgressCallback = (progress: SeedProgress) => void;

/**
 * Processes a single image file and returns processed blobs.
 */
async function processImage(file: File): Promise<{
  key: string;
  original: Uint8Array;
  preview: Uint8Array;
  thumb: Uint8Array;
}> {
  // Read file as blob
  const originalBlob = new Blob([await file.arrayBuffer()], { type: file.type });

  // Generate content-addressed key
  const key = await buildKey(await originalBlob.arrayBuffer());

  // Create resized versions
  const preview = await resizeImage(originalBlob, 800, 0.88);
  const thumb = await resizeImage(originalBlob, 200, 0.85);

  // Convert to Uint8Array for storage
  const originalArray = new Uint8Array(await originalBlob.arrayBuffer());
  const previewArray = new Uint8Array(await preview.arrayBuffer());
  const thumbArray = new Uint8Array(await thumb.arrayBuffer());

  return {
    key,
    original: originalArray,
    preview: previewArray,
    thumb: thumbArray,
  };
}

/**
 * Extracts item ID from filename.
 * Example: "rice_white.jpg" → "rice_white"
 */
function getItemIdFromFilename(filename: string): string {
  return filename.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
}

/**
 * Seeds food images from File objects.
 *
 * @param files - Array of image files
 * @param onProgress - Optional progress callback
 * @returns Summary of results
 */
export async function seedFoodImages(
  files: File[],
  onProgress?: SeedProgressCallback
): Promise<{
  success: number;
  failed: number;
  errors: Array<{ itemId: string; error: string }>;
}> {
  console.log(`[BulkSeed] Starting food image seed with ${files.length} files`);

  let successCount = 0;
  let failedCount = 0;
  const errors: Array<{ itemId: string; error: string }> = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const itemId = getItemIdFromFilename(file.name);

    onProgress?.({
      current: i + 1,
      total: files.length,
      itemId,
      status: 'processing',
    });

    try {
      // Process image
      const processed = await processImage(file);

      // Save to database
      await sqliteStore.saveFoodImage({
        food_id: itemId,
        image_key: processed.key,
        original: processed.original,
        preview: processed.preview,
        thumb: processed.thumb,
        created_at: new Date().toISOString(),
      });

      successCount++;
      onProgress?.({
        current: i + 1,
        total: files.length,
        itemId,
        status: 'success',
        message: `✓ Uploaded ${itemId}`,
      });
    } catch (error) {
      failedCount++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push({ itemId, error: errorMessage });

      onProgress?.({
        current: i + 1,
        total: files.length,
        itemId,
        status: 'error',
        message: `✗ Failed: ${errorMessage}`,
      });

      console.error(`[BulkSeed] Failed to process ${itemId}:`, error);
    }
  }

  console.log(`[BulkSeed] Food image seed complete: ${successCount} success, ${failedCount} failed`);

  return { success: successCount, failed: failedCount, errors };
}

/**
 * Seeds recipe images from File objects.
 *
 * @param files - Array of image files
 * @param onProgress - Optional progress callback
 * @returns Summary of results
 */
export async function seedRecipeImages(
  files: File[],
  onProgress?: SeedProgressCallback
): Promise<{
  success: number;
  failed: number;
  errors: Array<{ itemId: string; error: string }>;
}> {
  console.log(`[BulkSeed] Starting recipe image seed with ${files.length} files`);

  let successCount = 0;
  let failedCount = 0;
  const errors: Array<{ itemId: string; error: string }> = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const itemId = getItemIdFromFilename(file.name);

    onProgress?.({
      current: i + 1,
      total: files.length,
      itemId,
      status: 'processing',
    });

    try {
      // Process image
      const processed = await processImage(file);

      // Save to database
      await sqliteStore.saveRecipeImage({
        recipe_id: itemId,
        image_key: processed.key,
        original: processed.original,
        preview: processed.preview,
        thumb: processed.thumb,
        created_at: new Date().toISOString(),
      });

      successCount++;
      onProgress?.({
        current: i + 1,
        total: files.length,
        itemId,
        status: 'success',
        message: `✓ Uploaded ${itemId}`,
      });
    } catch (error) {
      failedCount++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push({ itemId, error: errorMessage });

      onProgress?.({
        current: i + 1,
        total: files.length,
        itemId,
        status: 'error',
        message: `✗ Failed: ${errorMessage}`,
      });

      console.error(`[BulkSeed] Failed to process ${itemId}:`, error);
    }
  }

  console.log(`[BulkSeed] Recipe image seed complete: ${successCount} success, ${failedCount} failed`);

  return { success: successCount, failed: failedCount, errors };
}

/**
 * Validates image files before processing.
 *
 * @param files - Files to validate
 * @returns Validation result with valid files and errors
 */
export function validateImageFiles(files: File[]): {
  valid: File[];
  invalid: Array<{ filename: string; reason: string }>;
} {
  const valid: File[] = [];
  const invalid: Array<{ filename: string; reason: string }> = [];

  const validExtensions = /\.(jpg|jpeg|png|webp|gif)$/i;
  const maxSize = 10 * 1024 * 1024; // 10MB

  for (const file of files) {
    // Check extension
    if (!validExtensions.test(file.name)) {
      invalid.push({
        filename: file.name,
        reason: 'Invalid file type (must be JPG, PNG, WebP, or GIF)',
      });
      continue;
    }

    // Check size
    if (file.size > maxSize) {
      invalid.push({
        filename: file.name,
        reason: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB, max 10MB)`,
      });
      continue;
    }

    // Check if actually an image
    if (!file.type.startsWith('image/')) {
      invalid.push({
        filename: file.name,
        reason: 'Not an image file',
      });
      continue;
    }

    valid.push(file);
  }

  return { valid, invalid };
}
