// C01: simulation spine.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceGame, applyCommand, createGame, deserializeGame, serializeGame, PREP_SLOT_COUNT, SaveError } from '../src/features/nutriserve/simulation/index.ts';
import { game, cmd, reject, advanceUntil, atCounter, buildPerfect } from './nutriserve-helpers.mjs';

test('a new game has four empty prep slots, a scheduled day and no wall-clock state', () => {
  const s = game();
  assert.equal(PREP_SLOT_COUNT, 4);
  assert.equal(s.prepSlots.length, 4);
  assert.ok(s.prepSlots.every((slot) => !slot.dishId && slot.heat === 0));
  assert.equal(s.day.customers.length, 3);
  assert.ok(s.day.customers.every((c) => c.phase === 'scheduled'));
  assert.equal(s.nowMs, 0);
});

test('same seed gives the same day; different seeds differ', () => {
  const a = game(7), b = game(7), c = game(8);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.day.customers.map((x) => [x.catalogId, x.arrivalMs]), c.day.customers.map((x) => [x.catalogId, x.arrivalMs]));
});

test('customers walk in, reach the counter, and the order is taken from the first in line', () => {
  let s = advanceUntil(game(), atCounter);
  const first = s.day.customers.find((c) => c.phase === 'at_counter');
  assert.equal(first.atCounterMs, first.arrivalMs + 2500);
  s = cmd(s, { type: 'takeOrder' });
  assert.equal(s.tickets.length, 1);
  assert.equal(s.tickets[0].customerId, first.id);
  assert.equal(s.day.customers.find((c) => c.id === first.id).phase, 'waiting_food');
  assert.match(reject(s, { type: 'takeOrder' }), /Nobody/);
});

test('a second customer arrives while prep continues offscreen', () => {
  let s = advanceUntil(game(), atCounter);
  s = cmd(s, { type: 'takeOrder' });
  const ticket = s.tickets[0];
  const built = buildPerfect(s, ticket);
  s = cmd(built.s, { type: 'startPrep', dishId: built.dishId, slot: 2 });
  s = cmd(s, { type: 'selectStation', station: 'order' });
  const unitsBefore = s.dishes.find((d) => d.id === built.dishId).prep.milliUnits;
  s = advanceUntil(s, atCounter);
  const second = s.day.customers.filter((c) => c.phase === 'at_counter');
  assert.equal(second.length, 1, 'second customer at the counter');
  assert.equal(s.selected.station, 'order');
  const unitsAfter = s.dishes.find((d) => d.id === built.dishId).prep.milliUnits;
  assert.ok(unitsAfter > unitsBefore, 'prep advanced while the player was at the order station');
  s = cmd(s, { type: 'takeOrder' });
  assert.equal(s.tickets.length, 2, 'two concurrent tickets');
});

test('advancing in one chunk or many gives the identical state', () => {
  let base = advanceUntil(game(3), atCounter);
  base = cmd(base, { type: 'takeOrder' });
  const { s: built, dishId } = buildPerfect(base, base.tickets[0]);
  let s = cmd(built, { type: 'startPrep', dishId, slot: 0 });
  s = cmd(s, { type: 'setBoost', slot: 0, held: true });
  const oneChunk = advanceGame(s, 7_777);
  let many = s;
  const chunks = [1, 3, 16, 17, 250, 999, 4, 6_487];
  for (const dt of chunks) many = advanceGame(many, dt);
  assert.equal(chunks.reduce((a, b) => a + b, 0), 7_777);
  assert.deepEqual(many, oneChunk);
  let tiny = s;
  for (let i = 0; i < 777; i++) tiny = advanceGame(tiny, 10);
  assert.deepEqual(advanceGame(tiny, 7), oneChunk);
});

test('a recorded command log replays to the identical state', () => {
  const play = () => {
    let s = advanceUntil(game(11), atCounter, 600_000, 250);
    s = cmd(s, { type: 'takeOrder' });
    const { s: b, dishId } = buildPerfect(s, s.tickets[0]);
    s = cmd(b, { type: 'startPrep', dishId, slot: 1 });
    s = advanceGame(s, 5_000);
    return s;
  };
  assert.deepEqual(play(), play());
});

test('pause freezes every clock; resume continues', () => {
  let s = advanceUntil(game(), atCounter);
  s = cmd(s, { type: 'takeOrder' });
  const { s: b, dishId } = buildPerfect(s, s.tickets[0]);
  s = cmd(b, { type: 'startPrep', dishId, slot: 0 });
  s = cmd(s, { type: 'pause' });
  const frozen = advanceGame(s, 60_000);
  assert.equal(frozen, s, 'paused advance returns the same state');
  assert.match(reject(s, { type: 'finishPrep', slot: 0 }), /paused/);
  s = cmd(s, { type: 'resume' });
  assert.ok(advanceGame(s, 1000).nowMs === s.nowMs + 1000);
});

test('save mid-prep, restore, and continue matches never saving', () => {
  let s = advanceUntil(game(5), atCounter);
  s = cmd(s, { type: 'takeOrder' });
  const { s: b, dishId } = buildPerfect(s, s.tickets[0]);
  s = cmd(b, { type: 'startPrep', dishId, slot: 3 });
  s = advanceGame(s, 4_321);
  const restored = deserializeGame(serializeGame(s));
  // JSON drops keys whose value is undefined; compare canonical JSON forms.
  const canon = (x) => JSON.stringify(x);
  assert.equal(canon(restored), canon(s));
  assert.equal(canon(advanceGame(restored, 20_000)), canon(advanceGame(s, 20_000)));
  assert.equal(restored.prepSlots[3].dishId, dishId, 'stable ids survive');
});

test('damaged or foreign saves are rejected', () => {
  const good = serializeGame(game());
  assert.throws(() => deserializeGame('{nope'), SaveError);
  assert.throws(() => deserializeGame(JSON.stringify({ format: 'other', state: {} })), SaveError);
  const broken = JSON.parse(good);
  broken.state.prepSlots = broken.state.prepSlots.slice(0, 3);
  assert.throws(() => deserializeGame(JSON.stringify(broken)), /prepSlots/);
  const future = JSON.parse(good);
  future.schemaVersion = 99;
  assert.throws(() => deserializeGame(JSON.stringify(future)), /version/);
});

test('invalid transitions are rejected without changing state', () => {
  let s = advanceUntil(game(), atCounter);
  s = cmd(s, { type: 'takeOrder' });
  reject(s, { type: 'startPrep', dishId: 'd999', slot: 0 });
  s = cmd(s, { type: 'startDish', size: 'small' });
  const dishId = s.dishes[0].id;
  assert.match(reject(s, { type: 'startDish', size: 'large' }), /build counter/);
  reject(s, { type: 'startPrep', dishId, slot: 0 }); // not finished building
  reject(s, { type: 'beginPour', dishId, component: 'base', foodId: 'not_a_food' });
  s = cmd(s, { type: 'beginPour', dishId, component: 'base', foodId: 'rice_white' });
  assert.match(reject(s, { type: 'beginPour', dishId, component: 'main', foodId: 'palak_dal' }), /holding/);
  s = advanceGame(s, 500);
  s = cmd(s, { type: 'endPour' });
  assert.match(reject(s, { type: 'beginPour', dishId, component: 'base', foodId: 'rice_brown' }), /already/);
  reject(s, { type: 'serve', dishId, ticketId: s.tickets[0].id }); // not ready
  reject(s, { type: 'startPrep', dishId, slot: 9 });
  reject(s, { type: 'nextDay' });
  assert.throws(() => advanceGame(s, 1.5), RangeError);
  assert.throws(() => advanceGame(s, -1), RangeError);
});

test('trash frees a busy prep slot', () => {
  let s = advanceUntil(game(), atCounter);
  s = cmd(s, { type: 'takeOrder' });
  const { s: b, dishId } = buildPerfect(s, s.tickets[0]);
  s = cmd(b, { type: 'startPrep', dishId, slot: 0 });
  s = cmd(s, { type: 'trash', dishId });
  assert.equal(s.prepSlots[0].dishId, undefined);
  assert.equal(s.dishes[0].stage, 'trashed');
  reject(s, { type: 'trash', dishId });
});
