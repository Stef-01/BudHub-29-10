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
