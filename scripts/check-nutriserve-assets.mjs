import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/assets/nutriserve/manifest.json'), 'utf8'));
const registry = fs.readFileSync(path.join(root, 'src/features/nutriserve/assets/characters.ts'), 'utf8');
const seen = new Set();
function decodeRGBA(bytes) {
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  assert.equal(bytes[24], 8, 'Only 8-bit PNG is accepted');
  assert.equal(bytes[25], 6, 'An RGBA PNG with real alpha is required');
  assert.equal(bytes[28], 0, 'Interlaced PNG is not accepted by this validator');
  const idat = [];
  for (let p = 8; p < bytes.length;) {
    const n = bytes.readUInt32BE(p), kind = bytes.toString('ascii', p + 4, p + 8);
    assert.ok(p + n + 12 <= bytes.length, 'Truncated PNG');
    if (kind === 'IDAT') idat.push(bytes.subarray(p + 8, p + 8 + n));
    p += n + 12;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat)), stride = width * 4;
  assert.equal(raw.length, (stride + 1) * height);
  const rgba = Buffer.alloc(stride * height);
  const paeth = (a, b, c) => { const p = a + b - c, da = Math.abs(p - a), db = Math.abs(p - b), dc = Math.abs(p - c); return da <= db && da <= dc ? a : db <= dc ? b : c; };
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]; assert.ok(filter <= 4);
    for (let x = 0; x < stride; x++) {
      const i = y * stride + x, a = x >= 4 ? rgba[i - 4] : 0, b = y ? rgba[i - stride] : 0, c = y && x >= 4 ? rgba[i - stride - 4] : 0;
      const predictor = [0, a, b, Math.floor((a + b) / 2), paeth(a, b, c)][filter];
      rgba[i] = (raw[y * (stride + 1) + x + 1] + predictor) & 255;
    }
  }
  return { width, height, rgba };
}
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
