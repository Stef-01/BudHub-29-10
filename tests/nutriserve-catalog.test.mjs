// The generated pure catalog must match its TypeScript sources, and every pilot sprite must exist.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { PILOT_CUSTOMER_POOL } from '../src/features/nutriserve/simulation/index.ts';
import { CATALOG_CUSTOMERS } from '../src/features/nutriserve/data/catalog.generated.ts';
import { CUSTOMER_SPRITES } from '../src/features/nutriserve/assets/characters.ts';

test('generated catalog is up to date with services/nutriServeFoodData.ts and nutriserveCharacters.ts', () => {
  execFileSync(process.execPath, ['scripts/generate-nutriserve-catalog.mjs', '--check'], { stdio: 'pipe' });
});

test('the remaster pool is exactly the customers with accepted pilot art', () => {
  assert.deepEqual([...PILOT_CUSTOMER_POOL].sort(), Object.keys(CUSTOMER_SPRITES).sort());
  for (const id of PILOT_CUSTOMER_POOL) assert.ok(CATALOG_CUSTOMERS.some((c) => c.id === id), id);
});

test('every accepted sprite has manifest placement data and the stage maths round-trips', async () => {
  const { getSpritePlacement, spriteBoxAtFoot } = await import('../src/features/nutriserve/assets/anchors.ts');
  const { clientToStage, clientToLocal, STAGE_W } = await import('../src/features/nutriserve/ui/stage.ts');
  for (const id of Object.keys(CUSTOMER_SPRITES)) {
    const p = getSpritePlacement(id);
    assert.ok(p, `${id} has placement`);
    const b = spriteBoxAtFoot(p, 200, 330, 240);
    assert.ok(Math.abs(b.left + p.footAnchor[0] * b.width - 200) < 1e-9 && Math.abs(b.top + p.footAnchor[1] * b.height - 330) < 1e-9);
    assert.ok(!p.statesNotProduced.includes('idle'));
  }
  const rect = { left: 10, top: 20, width: 320, height: 240 };
  assert.deepEqual(clientToStage(rect, 10 + 160, 20 + 120), { x: STAGE_W / 2, y: 240 });
  assert.deepEqual(clientToLocal({ left: 0, top: 0, width: 100, height: 100 }, 50, 50), { x: 0, y: 0 });
});
