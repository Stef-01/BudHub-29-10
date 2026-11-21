import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { decodeRGBA } from './lib/png-rgba.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/assets/nutriserve/garnishes/manifest.json'), 'utf8'));
const registry = fs.readFileSync(path.join(root, 'src/features/nutriserve/assets/garnishes.ts'), 'utf8');
assert.deepEqual(manifest.assets.map(a => a.id).sort(), ['coriander', 'green_chilli', 'lemon', 'onion', 'pomegranate']);
let totalBytes = 0, decodedBytes = 0;
for (const asset of manifest.assets) {
  const p = path.resolve(root, 'public', '.' + asset.path);
  assert.ok(p.startsWith(path.join(root, 'public/assets/nutriserve/garnishes') + path.sep));
  assert.ok(registry.includes(asset.path));
  const bytes = fs.readFileSync(p), { width, height, rgba } = decodeRGBA(bytes);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), asset.sha256);
  assert.equal(bytes.length, asset.bytes);
  assert.equal(width, asset.width); assert.equal(height, asset.height);
  let transparent = 0, opaqueLike = 0;
  for (let i = 3; i < rgba.length; i += 4) { if (rgba[i] === 0) transparent++; if (rgba[i] >= 245) opaqueLike++; }
  assert.equal(transparent, asset.alpha.transparentPixels);
  assert.equal(opaqueLike, asset.alpha.opaqueLikePixels);
  assert.ok(transparent > width * height * .35 && opaqueLike > width * height * .1);
  for (const [x, y] of [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]]) assert.equal(rgba[(y * width + x) * 4 + 3], 0);
  if (asset.id === 'onion') assert.equal(rgba[(Math.floor(height / 2) * width + Math.floor(width / 2)) * 4 + 3], 0, 'Onion hole must remain transparent');
  assert.equal(asset.review.status, 'accepted-pilot-garnish');
  assert.ok(asset.review.evidenceIds.length > 0, 'Visual review evidence required');
  totalBytes += bytes.length; decodedBytes += width * height * 4;
  console.log(`PASS ${asset.id}: source hash, dimensions, alpha, registry and review`);
}
console.log(`Five garnish masters: ${totalBytes} source bytes; ${decodedBytes} decoded RGBA bytes. Runtime copies are checked separately.`);
