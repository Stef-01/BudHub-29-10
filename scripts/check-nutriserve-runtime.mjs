import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = path.join(root, 'public');
const manifest = JSON.parse(fs.readFileSync(path.join(publicRoot, 'assets/nutriserve/runtime/manifest.json')));
const registry = fs.readFileSync(path.join(root, 'src/features/nutriserve/assets/runtimeImages.ts'), 'utf8');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function read(url) {
  const p = path.resolve(publicRoot, '.' + url);
  assert.ok(p.startsWith(path.join(publicRoot, 'assets/nutriserve') + path.sep));
  return fs.readFileSync(p);
}
let count = 0;
for (const asset of manifest.assets) {
  const source = read(asset.source);
  assert.equal(hash(source), asset.sourceSha256); assert.equal(source.length, asset.sourceBytes);
  for (const v of asset.variants) {
    const bytes = read(v.path);
    assert.equal(hash(bytes), v.sha256); assert.equal(bytes.length, v.bytes);
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
    // Lossless VP8L dimensions may follow an optional VP8X/ALPH chunk.
    let offset = 12, dimensions;
    while (offset + 8 <= bytes.length) {
      const tag = bytes.toString('ascii', offset, offset + 4), length = bytes.readUInt32LE(offset + 4);
      if (tag === 'VP8L') {
        assert.equal(bytes[offset + 8], 0x2f);
        const bits = bytes.readUInt32LE(offset + 9);
        dimensions = [(bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1];
      }
      offset += 8 + length + (length % 2);
    }
    assert.deepEqual(dimensions, [v.width, v.height]);
    assert.ok(Math.abs(v.width / v.height - asset.sourceWidth / asset.sourceHeight) < .002);
    assert.ok(registry.includes(v.path));
    count++;
  }
}
assert.equal(manifest.assets.length, 15); assert.equal(count, 27);
console.log(`PASS 15 sources / ${count} lossless WebP variants: hashes, byte sizes, dimensions, aspect and registry paths. Use the pinned Python --check for decoded-pixel equivalence.`);
