// services/imageBackupService.ts
import type { ImageArtifacts } from "./imageStoreService";

const PREFIX = 'vibe_img_backup_';
const ALIAS_PREFIX = `${PREFIX}alias_`;
const MANIFEST_PREFIX = `${PREFIX}manifest_`;
const THUMB_PREFIX = `${PREFIX}thumb_`;

function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Creates a failsafe backup of image artifacts in localStorage.
 * This is called *after* a successful write to the primary IndexedDB store.
 * - For user uploads, it backs up the small thumbnail blob as a base64 string.
 * - For all images, it backs up the manifest and the recipe-to-key alias.
 */
export async function backupArtifacts(key: string, recipeId: string, artifacts: ImageArtifacts): Promise<void> {
    try {
        // Always back up the alias and manifest.
        localStorage.setItem(`${ALIAS_PREFIX}${recipeId}`, key);
        localStorage.setItem(`${MANIFEST_PREFIX}${key}`, JSON.stringify(artifacts.manifest));

        // For irreplaceable user uploads, also back up the thumbnail.
        if (artifacts.manifest?.request?.source === 'user_upload') {
            const thumbDataUri = await blobToBase64(artifacts.thumb);
            localStorage.setItem(`${THUMB_PREFIX}${key}`, thumbDataUri);
        }
    } catch (e) {
        console.error("Failed to write to localStorage backup. It might be full.", e);
        // Here, we could implement a strategy to clear old backups if the storage is full.
    }
}

/**
 * Checks localStorage for a backup if the primary store fails.
 * This is the core of the recovery mechanism.
 */
export async function getBackupState(recipeId: string): Promise<{ key: string; manifest: any; thumbDataUri?: string } | null> {
    const key = localStorage.getItem(`${ALIAS_PREFIX}${recipeId}`);
    if (!key) {
        return null;
    }

    const manifestStr = localStorage.getItem(`${MANIFEST_PREFIX}${key}`);
    if (!manifestStr) {
        return null;
    }

    try {
        const manifest = JSON.parse(manifestStr);
        const thumbDataUri = localStorage.getItem(`${THUMB_PREFIX}${key}`) || undefined;
        
        return { key, manifest, thumbDataUri };
    } catch (e) {
        console.error(`Failed to parse backup manifest for key ${key}`, e);
        return null;
    }
}

/**
 * Clears all image-related backups from localStorage. Useful for debugging.
 */
export function clearAllImageBackups(): void {
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(PREFIX)) {
            localStorage.removeItem(key);
        }
    });
    console.log("All image backups cleared from localStorage.");
}