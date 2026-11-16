import zlib from 'node:zlib';
import assert from 'node:assert/strict';
export function decodeRGBA(bytes) {
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
