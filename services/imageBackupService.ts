// services/imageBackupService.ts

/**
 * A localStorage-based backup service for critical user data and image metadata.
 * This is a failsafe in case IndexedDB is cleared by the browser.
 * NOTE: localStorage has size limits (5-10MB). We only back up essential, lightweight data.
 */
import type { ImageArtifacts } from './imageStoreService';
import type { Plant, Recipe } from '../types';

const GARDEN_BACKUP_KEY = 'backup_user_garden';
const COOKBOOK_BACKUP_KEY = 'backup_user_cookbook';
const IMAGE_MANIFEST_BACKUP_PREFIX = 'backup_img_manifest_';

function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// --- Image Manifest Backup ---

/**
 * Backs up the essential, non-recoverable parts of an image artifact.
 * - For user uploads (irreplaceable), we back up the small thumbnail.
 * - For AI generations (reproducible), we only back up the manifest.
 */
export async function backupImageManifest(key: string, artifacts: ImageArtifacts): Promise<void> {
    try {
        let backupPayload: any = { manifest: artifacts.manifest };
        const source = artifacts.manifest?.request?.source;

        if (source === 'user_upload') {
            backupPayload.thumbB64 = await blobToBase64(artifacts.thumb);
        }

        localStorage.setItem(`${IMAGE_MANIFEST_BACKUP_PREFIX}${key}`, JSON.stringify(backupPayload));
    } catch (error) {
        console.warn(`Failed to back up image manifest for key ${key}.`, error);
    }
}

export function getImageManifestBackup(key: string): { manifest: any; thumbB64?: string } | null {
    const backupJSON = localStorage.getItem(`${IMAGE_MANIFEST_BACKUP_PREFIX}${key}`);
    if (!backupJSON) return null;
    try {
        return JSON.parse(backupJSON);
    } catch {
        return null;
    }
}


// --- User Garden Backup & Restore ---

export async function backupUserGarden(plants: Plant[]): Promise<void> {
    try {
        // We only need to store the IDs, as the full plant data is in the catalog.
        const plantIds = plants.map(p => p.id);
        localStorage.setItem(GARDEN_BACKUP_KEY, JSON.stringify(plantIds));
    } catch (error) {
        console.warn('Failed to back up user garden.', error);
    }
}

export function restoreUserGarden(): number[] | null {
    const gardenJSON = localStorage.getItem(GARDEN_BACKUP_KEY);
    if (!gardenJSON) return null;
    try {
        const plantIds = JSON.parse(gardenJSON);
        if (Array.isArray(plantIds) && plantIds.every(id => typeof id === 'number')) {
            return plantIds;
        }
        return null;
    } catch {
        return null;
    }
}

// --- User Cookbook Backup & Restore ---

export async function backupUserCookbook(recipes: Recipe[]): Promise<void> {
    try {
        // We can store the full recipe objects as they contain user-specific data.
        localStorage.setItem(COOKBOOK_BACKUP_KEY, JSON.stringify(recipes));
    } catch (error) {
        console.warn('Failed to back up user cookbook.', error);
    }
}

export function restoreUserCookbook(): Recipe[] | null {
    const cookbookJSON = localStorage.getItem(COOKBOOK_BACKUP_KEY);
    if (!cookbookJSON) return null;
    try {
        const recipes = JSON.parse(cookbookJSON);
        // Basic validation
        if (Array.isArray(recipes) && recipes.every(r => r.id && r.name)) {
            return recipes;
        }
        return null;
    } catch {
        return null;
    }
}