// services/imageProcessingService.ts

// Canonicalize an object for stable hashing. It sorts keys and normalizes whitespace.
function canonicalize(v: any): any {
  if (v === null || typeof v === 'undefined') return null;
  if (typeof v === "string") return v.replace(/\s+/g, " ").trim();
  if (Array.isArray(v)) return v.map(canonicalize).sort();
  if (typeof v === "object") {
    return Object.fromEntries(Object.keys(v).sort().map(k => [k, canonicalize(v[k])]));
  }
  return v;
}

// Hashes a string or ArrayBuffer using SHA-256 via the Web Crypto API.
async function digest(data: string | ArrayBuffer): Promise<string> {
  const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Builds a stable, canonical cache key from a generation specification object
 * or from the raw binary content of a file.
 */
export async function buildKey(specOrBuffer: object | ArrayBuffer): Promise<string> {
  // CRITICAL FIX: Explicitly check for ArrayBuffer. `typeof specOrBuffer` returns 'object' for an ArrayBuffer,
  // which caused the previous logic to stringify the buffer to '{}' and result in the same hash for all user-uploaded images.
  const data = specOrBuffer instanceof ArrayBuffer
    ? specOrBuffer
    : JSON.stringify(canonicalize(specOrBuffer));
  const sha = await digest(data);
  return `sha256:${sha}`;
}

/**
 * Resizes an image Blob to a specified width using a canvas.
 * Maintains aspect ratio.
 */
export function resizeImage(blob: Blob, width: number, quality: number = 0.88): Promise<Blob> {
    return new Promise((resolve, reject) => {
        createImageBitmap(blob).then(imageBitmap => {
            const height = (width / imageBitmap.width) * imageBitmap.height;
            
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context for image resizing.'));
            }

            ctx.drawImage(imageBitmap, 0, 0, width, height);
            
            canvas.toBlob(
                (resizedBlob) => {
                    if (!resizedBlob) {
                        return reject(new Error('Canvas toBlob returned null.'));
                    }
                    resolve(resizedBlob);
                },
                'image/webp',
                quality
            );
        }).catch(reject);
    });
}

/**
 * Converts a base64 data URI to a Blob.
 */
export async function dataUriToBlob(dataUri: string): Promise<Blob> {
    const response = await fetch(dataUri);
    const blob = await response.blob();
    return blob;
}

/**
 * Converts a Blob to a Uint8Array.
 */
export async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Converts a Uint8Array back to a Blob, attempting to infer MIME type.
 */
export function uint8ArrayToBlob(uint8Array: Uint8Array, type: string = ''): Blob {
    // Basic magic number sniffing for common types.
    if (type === '') {
        if (uint8Array[0] === 0xFF && uint8Array[1] === 0xD8) type = 'image/jpeg';
        else if (uint8Array[0] === 0x89 && uint8Array[1] === 0x50) type = 'image/png';
        else if (uint8Array[0] === 0x52 && uint8Array[1] === 0x49) type = 'image/webp';
    }
    return new Blob([uint8Array], { type });
}