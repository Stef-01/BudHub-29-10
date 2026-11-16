import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { decodeRGBA } from './lib/png-rgba.mjs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/assets/nutriserve/manifest.json'), 'utf8'));
const registry = fs.readFileSync(path.join(root, 'src/features/nutriserve/assets/characters.ts'), 'utf8');
const seen = new Set();
for (const asset of manifest.characters) {
  assert.ok(!seen.has(asset.id), `Duplicate ${asset.id}`); seen.add(asset.id);
  assert.equal(asset.state, 'idle');
  assert.ok(asset.path.startsWith('/assets/nutriserve/characters/'));
  const p = path.resolve(root, 'public', '.' + asset.path);
  assert.ok(p.startsWith(path.join(root, 'public/assets/nutriserve/characters') + path.sep));
  assert.ok(registry.includes(asset.path), `Registry missing ${asset.id}`);
  const bytes = fs.readFileSync(p);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), asset.sha256);
  assert.equal(bytes.length, asset.bytes);
  const { width, height, rgba } = decodeRGBA(bytes);
  assert.equal(width, asset.width); assert.equal(height, asset.height);
  let transparent = 0, opaqueLike = 0;
  for (let i = 3; i < rgba.length; i += 4) { if (!rgba[i]) transparent++; if (rgba[i] >= 245) opaqueLike++; }
  assert.equal(transparent, asset.alpha.transparentPixels);
  assert.equal(opaqueLike, asset.alpha.opaqueLikePixels);
  assert.ok(transparent > width * height * .4 && opaqueLike > width * height * .15);
  for (const [x, y] of [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]]) assert.equal(rgba[(y * width + x) * 4 + 3], 0);
  assert.equal(asset.review.status, 'accepted-pilot-idle', `${asset.id} needs a visual review`);
  console.log(`PASS ${asset.id}: ${width}×${height}, real alpha, source hash and review match`);
}
assert.equal(seen.size, 6, 'This release is the six-customer pilot');
console.log('Asset integrity verified. Visual similarity requires human/render review; this check does not establish it.');
