// Regression tests for the first independent audit of the simulation core (2026-11-11).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceGame, createGame, deserializeGame, serializeGame, gradeIndianBuildV1, gradeFinishV1, newProfile, SaveError } from '../src/features/nutriserve/simulation/index.ts';
import { game, cmd, reject, advanceUntil, atCounter, pour, buildPerfect } from './nutriserve-helpers.mjs';

const withTicket = (seed = 42) => {
  let s = advanceUntil(game(seed), atCounter);
  s = cmd(s, { type: 'takeOrder' });
  return { s, ticket: s.tickets[0] };
};
const canon = (x) => JSON.stringify(x);

test('ids never resolve to inherited object properties', () => {
  let { s } = withTicket();
  for (const upgradeId of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) assert.match(reject(s, { type: 'buyUpgrade', upgradeId }), /Unknown/);
  const { s: b, dishId } = buildPerfect(s, s.tickets[0]);
  s = cmd(b, { type: 'startPrep', dishId, slot: 0 });
  s = cmd(s, { type: 'finishPrep', slot: 0 });
  assert.match(reject(s, { type: 'beginDrizzle', dishId, drizzleId: 'toString', x: 0, y: 0 }), /Unknown/);
  assert.match(reject(s, { type: 'placeGarnish', dishId, garnishId: 'constructor', x: 0, y: 0 }), /Unknown/);
  const nan = structuredClone(s);
  nan.profile.coins = NaN;
  assert.match(reject(nan, { type: 'buyUpgrade', upgradeId: 'rice_scoop' }), /not a number/);
});

test('a wrong vessel never outscores the right vessel with a wrong or missing base', () => {
  const { s, ticket } = withTicket();
  const otherSize = ticket.order.size === 'large' ? 'small' : 'large';
  const otherBase = ticket.order.baseId === 'rice_white' ? 'rice_brown' : 'rice_white';
  const build = (size, baseFood, baseMs) => {
    let x = cmd(s, { type: 'startDish', size });
    const id = x.dishes.at(-1).id;
    if (baseFood) x = pour(x, id, 'base', baseFood, baseMs);
    x = pour(x, id, 'main', ticket.order.mainId, Math.round((ticket.order.idealG.main * 1000) / 90));
    x = pour(x, id, 'side', ticket.order.sideId, Math.round((ticket.order.idealG.side * 1000) / 50));
    return gradeIndianBuildV1(x.dishes.at(-1), ticket.order).score;
  };
  const wrongVessel = build(otherSize, undefined, 0);
  for (const [food, ms] of [[undefined, 0], [otherBase, 5_000], [otherBase, 100], [ticket.order.baseId, 9_000]]) {
    assert.ok(build(ticket.order.size, food, ms) >= wrongVessel, `right vessel (${food}, ${ms} ms) >= wrong vessel ${wrongVessel}`);
  }
});

test('the rice scoop bonus needs the right base food', () => {
  const { s, ticket } = withTicket();
  const otherBase = ticket.order.baseId === 'rice_white' ? 'rice_brown' : 'rice_white';
  let x = cmd(s, { type: 'startDish', size: ticket.order.size });
  const id = x.dishes.at(-1).id;
  x = pour(x, id, 'base', otherBase, Math.round((ticket.order.idealG.base * 1000) / 80));
  const dish = x.dishes.at(-1);
  const effects = { buildFurniture: { cup: true, mixable: false, syrup: false }, prepFurniture: false, waitingGraceMs: 0, finishBonus: 0 };
  assert.equal(gradeIndianBuildV1(dish, ticket.order, effects).score, gradeIndianBuildV1(dish, ticket.order).score);
});

test('an even ghee tadka of the right amount can reach full marks', () => {
  const { s, ticket } = withTicket();
  const order = { ...ticket.order, size: 'medium', finish: [{ kind: 'drizzle', id: 'ghee_tadka' }] };
  const dish = { size: 'medium', stage: 'finishing', build: {}, finish: { drizzles: {}, garnishes: [], steps: ['drizzle:ghee_tadka'] } };
  const cells = new Array(36).fill(0);
  const inside = [];
  for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) { const x = ((c + 0.5) / 6) * 2 - 1, y = ((r + 0.5) / 6) * 2 - 1; if (x * x + y * y <= 1) inside.push(r * 6 + c); }
  const per = Math.floor(5_000 / inside.length);
  inside.forEach((i) => (cells[i] = per));
  dish.finish.drizzles.ghee_tadka = { cellsMg: cells, insideMg: per * inside.length, spilledMg: 0 };
  assert.equal(gradeFinishV1(dish, order).score, 100);
  void s;
});

test('crafted or corrupt saves are rejected with SaveError, never a crash later', () => {
  let { s } = withTicket();
  const { s: b, dishId } = buildPerfect(s, s.tickets[0]);
  s = cmd(b, { type: 'startPrep', dishId, slot: 0 });
  const good = JSON.parse(serializeGame(s));
  const mutate = (fn) => {
    const f = structuredClone(good);
    fn(f.state);
    return JSON.stringify(f);
  };
  const cases = {
    'same dish in two slots': (st) => (st.prepSlots[1].dishId = dishId),
    'slot/dish mismatch': (st) => (st.dishes.find((d) => d.id === dishId).prep.slot = 2),
    'cooking dish without prep': (st) => delete st.dishes.find((d) => d.id === dishId).prep,
    'upgrades null': (st) => (st.profile.upgrades = null),
    'unknown upgrade': (st) => (st.profile.upgrades = ['constructor']),
    'selected missing': (st) => delete st.selected,
    'bad prep level': (st) => (st.tickets[0].order.prepLevel = 'burnt'),
    'tickets object': (st) => (st.tickets = {}),
    'null ticket': (st) => (st.tickets = [null]),
    'null slot': (st) => (st.prepSlots[0] = null),
    'param versions differ': (st) => (st.paramVersions.prep = 'prep-v0'),
    'nextId below ids': (st) => (st.nextId = 1),
    'unknown customer': (st) => (st.day.customers[1].catalogId = 'nobody'),
    'NaN coins': (st) => (st.profile.coins = null),
    'negative day': (st) => (st.day.number = 0),
    'paused not boolean': (st) => (st.paused = 'yes'),
  };
  for (const [name, fn] of Object.entries(cases)) {
    assert.throws(() => deserializeGame(mutate(fn)), SaveError, name);
  }
  assert.equal(canon(deserializeGame(JSON.stringify(good))), canon(s));
});

test('schema v1 saves migrate to v2 with a run id', () => {
  const v2 = JSON.parse(serializeGame(game(77)));
  const v1 = structuredClone(v2);
  v1.schemaVersion = 1;
  v1.state.schemaVersion = 1;
  delete v1.state.runId;
  const restored = deserializeGame(JSON.stringify(v1));
  assert.equal(restored.schemaVersion, 2);
  assert.equal(restored.runId, v2.state.runId);
});

test('finishPrep only finishes the dish actually cooking in that slot', () => {
  let { s } = withTicket();
  const { s: b, dishId } = buildPerfect(s, s.tickets[0]);
  s = cmd(b, { type: 'startPrep', dishId, slot: 0 });
  const crafted = structuredClone(s);
  crafted.dishes.find((d) => d.id === dishId).stage = 'served';
  reject(crafted, { type: 'finishPrep', slot: 0 });
});

test('a customer with a stale catalog id leaves instead of blocking the day', () => {
  const s0 = game(42);
  const crafted = structuredClone(s0);
  crafted.day.customers[0].catalogId = 'renamed_customer';
  let s = advanceUntil(crafted, (x) => x.day.customers[0].phase === 'gone' || atCounter(x));
  assert.equal(s.day.customers[0].phase, 'gone');
});

test('held controls are fully released: no empty portion is left behind, boosts let go', () => {
  let { s } = withTicket();
  s = cmd(s, { type: 'startDish', size: 'medium' });
  const dishId = s.dishes[0].id;
  for (const leave of [{ type: 'selectStation', station: 'order' }, { type: 'pause' }, { type: 'finishBuild', dishId }]) {
    let x = cmd(s, { type: 'beginPour', dishId, component: 'main', foodId: 'rajma_masala' });
    x = cmd(x, leave);
    assert.equal(x.held, undefined);
    assert.equal(x.dishes[0].build.main, undefined, `no empty rajma after ${leave.type}`);
  }
  const { s: b, dishId: d2 } = buildPerfect(cmd(s, { type: 'trash', dishId }), s.tickets[0]);
  let x = cmd(b, { type: 'startPrep', dishId: d2, slot: 1 });
  x = cmd(x, { type: 'setBoost', slot: 1, held: true });
  x = cmd(x, { type: 'selectStation', station: 'order' });
  assert.equal(x.prepSlots[1].boostHeld, false);
  x = advanceGame(x, 3_000);
  assert.equal(x.prepSlots[1].overheated, false, 'no offscreen overheating from a forgotten boost');
});

test('malformed command values are rejected', () => {
  let { s } = withTicket();
  reject(s, { type: 'startDish', size: 'huge' });
  reject(s, { type: 'selectStation', station: 'basement' });
  s = cmd(s, { type: 'startDish', size: 'small' });
  reject(s, { type: 'beginPour', dishId: s.dishes[0].id, component: 'foo', foodId: 'rice_white' });
  reject(s, { type: 'setBoost', slot: 'length', held: true });
  reject(s, { type: 'setBoost', slot: 0, held: 'yes' });
  reject(s, { type: 'finishPrep', slot: -1 });
  reject(s, { type: 'startPrep', dishId: s.dishes[0].id, slot: 1.5 });
});

test('day options are validated; a reused profile starts on its next day; a finished day is never stuck paused', () => {
  assert.throws(() => createGame({ seed: 1, day: -5 }), RangeError);
  assert.throws(() => createGame({ seed: 1, day: 0 }), RangeError);
  const profile = { ...newProfile(), creditedDays: [1, 2] };
  assert.equal(createGame({ seed: 1, profile }).day.number, 3);
  const done = structuredClone(game(1));
  done.day.completed = true;
  done.paused = true;
  const resumed = cmd(done, { type: 'resume' });
  assert.equal(resumed.paused, false);
  assert.equal(advanceGame(resumed, 10).day.completed, true);
});
