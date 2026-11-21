import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { decodeRGBA } from './lib/png-rgba.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/assets/nutriserve/food/manifest.json'), 'utf8'));
const registry = fs.readFileSync(path.join(root, 'src/features/nutriserve/assets/foodSurfaces.ts'), 'utf8');
assert.deepEqual(manifest.assets.map(a => a.id).sort(), ['chana_masala', 'katori', 'palak_dal', 'rice_white']);
let totalBytes = 0, decodedBytes = 0;
for (const asset of manifest.assets) {
  const p = path.resolve(root, 'public', '.' + asset.path);
  assert.ok(p.startsWith(path.join(root, 'public/assets/nutriserve/food') + path.sep));
  assert.ok(registry.includes(asset.path));
  const bytes = fs.readFileSync(p), { width, height, rgba } = decodeRGBA(bytes);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), asset.sha256);
  assert.equal(bytes.length, asset.bytes); assert.equal(width, asset.width); assert.equal(height, asset.height);
  let transparent = 0, opaqueLike = 0, left = width, top = height, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const a = rgba[(y * width + x) * 4 + 3];
    if (!a) transparent++; if (a >= 245) opaqueLike++;
    if (a > 8) { left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y); }
  }
  assert.equal(transparent, asset.alpha.transparentPixels); assert.equal(opaqueLike, asset.alpha.opaqueLikePixels);
  assert.ok(transparent > width * height * .15 && opaqueLike > width * height * .4);
  assert.deepEqual({ left, top, right, bottom, threshold: 8 }, asset.visibleBounds);
  assert.ok(Math.abs((right - left + 1) / (bottom - top + 1) - 1) < .08, 'Top asset must be approximately circular');
  for (const [x, y] of [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]]) assert.equal(rgba[(y * width + x) * 4 + 3], 0);
  assert.equal(asset.review.status, 'accepted-pilot-top'); assert.ok(asset.review.evidenceIds.length);
  totalBytes += bytes.length; decodedBytes += width * height * 4;
  console.log(`PASS ${asset.id}: hash, alpha, dimensions, bounds, circular footprint, registry and visual review`);
}
assert.deepEqual(manifest.geometry.center, [120, 120]);
assert.equal(manifest.geometry.foodRadius, 100); assert.equal(manifest.geometry.inputUnitRadius, 1);
console.log(`Four top-view masters: ${totalBytes} source bytes, ${decodedBytes} decoded RGBA bytes.`);
