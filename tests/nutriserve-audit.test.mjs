// Regression tests for the first independent audit of the simulation core (2026-11-11).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceGame, createGame, deserializeGame, deserializeGameWithNotes, serializeGame, gradeBuild, gradeFinishV1, newProfile, SaveError } from '../src/features/nutriserve/simulation/index.ts';
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
    return gradeBuild(x.dishes.at(-1), ticket.order).score;
  };
  const wrongVessel = build(otherSize, undefined, 0);
  for (const [food, ms] of [[undefined, 0], [otherBase, 5_000], [otherBase, 100], [ticket.order.baseId, 9_000]]) {
    assert.ok(build(ticket.order.size, food, ms) >= wrongVessel, `right vessel (${food}, ${ms} ms) >= wrong vessel ${wrongVessel}`);
  }
});

test('the rice scoop widens the exact band only for the right base food (build-v5)', () => {
  const { s, ticket } = withTicket();
  const otherBase = ticket.order.baseId === 'rice_white' ? 'rice_brown' : 'rice_white';
  const scoop = upgradeEffects(['rice_scoop']);
  const withBase = (food, factor) => {
    let x = cmd(s, { type: 'startDish', size: ticket.order.size });
    const id = x.dishes.at(-1).id;
    x = pour(x, id, 'base', food, Math.round((ticket.order.idealG.base * factor * 1000) / 80));
    x = pour(x, id, 'main', ticket.order.mainId, Math.round((ticket.order.idealG.main * 1000) / 90));
    x = pour(x, id, 'side', ticket.order.sideId, Math.round((ticket.order.idealG.side * 1000) / 50));
    return x.dishes.at(-1);
  };
  const wrong = withBase(otherBase, 1);
  assert.equal(gradeBuild(wrong, ticket.order, scoop).score, gradeBuild(wrong, ticket.order).score);
  // 15% over the line: exact with the scoop (20% band), not without (10%).
  const generous = withBase(ticket.order.baseId, 1.15);
  assert.equal(gradeBuild(generous, ticket.order, scoop).score, 100);
  assert.ok(gradeBuild(generous, ticket.order).score < 100);
  // The ladles widen the main and side bands, not the base's.
  assert.ok(gradeBuild(generous, ticket.order, upgradeEffects(['steel_ladles'])).score < 100);
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
    'selected missing': (st) => delete st.selected,
    'bad prep level': (st) => (st.tickets[0].order.prepLevel = 'burnt'),
    'tickets object': (st) => (st.tickets = {}),
    'null ticket': (st) => (st.tickets = [null]),
    'null slot': (st) => (st.prepSlots[0] = null),
    'param versions differ': (st) => (st.paramVersions.prep = 'prep-v0'),
    'nextId below ids': (st) => (st.nextId = 1),
    'no known customers in the pool': (st) => (st.customerPool = ['nobody']),
    'NaN coins': (st) => (st.profile.coins = null),
    'negative day': (st) => (st.day.number = 0),
    'paused not boolean': (st) => (st.paused = 'yes'),
  };
  for (const [name, fn] of Object.entries(cases)) {
    assert.throws(() => deserializeGame(mutate(fn)), SaveError, name);
  }
  assert.equal(canon(deserializeGame(JSON.stringify(good))), canon(s));
  // An upgrade id this version doesn't have is dropped on load (named), not trusted and not fatal.
  const odd = deserializeGameWithNotes(mutate((st) => (st.profile.upgrades = ['constructor'])));
  assert.deepEqual(odd.state.profile.upgrades, []);
  assert.equal(odd.notes.length, 1);
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

test('a save made before a customer was renamed still loads; that customer leaves', () => {
  let s = advanceUntil(game(42), atCounter);
  const f = JSON.parse(serializeGame(s));
  const front = f.state.day.customers.find((c) => c.phase === 'at_counter');
  front.catalogId = 'renamed_customer';
  f.state.day.customers.find((c) => c.phase === 'scheduled').catalogId = 'renamed_too';
  f.state.customerPool.push('renamed_customer');
  let r = deserializeGame(JSON.stringify(f));
  assert.ok(!r.customerPool.includes('renamed_customer'), 'unknown ids leave the pool');
  r = advanceGame(r, 1);
  assert.equal(r.day.customers.find((c) => c.id === front.id).phase, 'gone');
  r = advanceGame(r, 600_000);
  assert.ok(r.day.customers.every((c) => c.phase !== 'at_counter' || c.catalogId !== 'renamed_too'));
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

// --- Second audit (renderer and fix verification), 2026-11-11 ------------------------------------
import { salvageSave } from '../src/features/nutriserve/simulation/index.ts';
import { FINISH_V1, BUILD_V1 } from '../src/features/nutriserve/simulation/params.ts';

function finishing(seed = 42, rank = 1) {
  let s = advanceUntil(game(seed, { profile: { ...newProfile(), rank } }), atCounter);
  s = cmd(s, { type: 'takeOrder' });
  const { s: b, dishId } = buildPerfect(s, s.tickets[0]);
  s = cmd(b, { type: 'startPrep', dishId, slot: 0 });
  s = advanceGame(s, 12_000);
  s = cmd(s, { type: 'finishPrep', slot: 0 });
  return { s, dishId, ticket: s.tickets[0] };
}

test('releaseHolds ends a drizzle or pour from any state, even paused or after the day', () => {
  let { s, dishId } = finishing();
  s = cmd(s, { type: 'beginDrizzle', dishId, drizzleId: 'curd_swirl', x: 0, y: 0 });
  s = cmd(s, { type: 'pause' });
  s = cmd(s, { type: 'releaseHolds' });
  assert.equal(s.held, undefined);
  s = cmd(s, { type: 'resume' });
  const before = s.dishes.find((d) => d.id === dishId).finish.drizzles.curd_swirl.insideMg;
  s = advanceGame(s, 2_000);
  assert.equal(s.dishes.find((d) => d.id === dishId).finish.drizzles.curd_swirl.insideMg, before, 'nothing keeps drizzling');
});

test('a restored save never resumes a held pour, drizzle or boost', () => {
  let { s, dishId } = finishing();
  s = cmd(s, { type: 'beginDrizzle', dishId, drizzleId: 'curd_swirl', x: 0.2, y: 0 });
  s = advanceGame(s, 25); // pending, not yet landed
  const restored = deserializeGame(serializeGame(s));
  assert.equal(restored.held, undefined);
  assert.equal(restored.dishes.find((d) => d.id === dishId).finish.drizzles.curd_swirl.insideMg, 25 * 12, 'the pending drizzle landed');

  let { s: p } = withTicket(7);
  p = cmd(p, { type: 'startDish', size: 'medium' });
  const pd = p.dishes.at(-1).id;
  p = cmd(p, { type: 'beginPour', dishId: pd, component: 'base', foodId: p.tickets[0].order.baseId });
  const pr = deserializeGame(serializeGame(p));
  assert.equal(pr.held, undefined);
  assert.equal(pr.dishes.find((d) => d.id === pd).build.base, undefined, 'the empty portion is dropped');
});

test('saves with inconsistent customers, tickets, results or held fields are rejected', () => {
  const { s, dishId } = finishing();
  const text = serializeGame(s);
  const bad = (mutate) => {
    const f = JSON.parse(text);
    mutate(f.state);
    assert.throws(() => deserializeGame(JSON.stringify(f)), SaveError);
  };
  bad((st) => (st.day.customers = []));
  bad((st) => (st.tickets[0].customerId = 'c999'));
  bad((st) => (st.day.customers.find((c) => c.phase === 'waiting_food').ticketId = undefined));
  bad((st) => {
    const c = st.day.customers.find((c) => c.phase === 'waiting_food');
    c.phase = 'walking_out';
    delete c.leftAtMs;
  });
  bad((st) => st.day.results.push({ ticketId: 't1', scores: {} }));
  bad((st) => (st.held = { kind: 'drizzle', dishId, drizzleId: 'toString', x: 0, y: 0, px: 0, py: 0, pendingMg: 0, pendingMs: 0 }));
  bad((st) => (st.held = { kind: 'drizzle', dishId, drizzleId: 'curd_swirl', x: NaN, y: 0, px: 0, py: 0, pendingMg: 0, pendingMs: 0 }));
  bad((st) => (st.held = { kind: 'pour', dishId, component: 'base', foodId: 'rice_white' })); // dish is not building
});

test('drizzle coverage does not depend on how often the pointer reports', () => {
  const { s: start, dishId } = finishing();
  // A quick zig-zag across the vessel: three passes of 1.7 units in 240 ms each.
  const path = (t) => {
    const pass = Math.min(2, Math.floor(t * 3));
    const u = t * 3 - pass;
    const x = pass % 2 ? 0.85 - 1.7 * u : -0.85 + 1.7 * u;
    return { x, y: -0.5 + 0.5 * pass };
  };
  const total = 720;
  const run = (sampleMs) => {
    let s = cmd(start, { type: 'beginDrizzle', dishId, drizzleId: 'curd_swirl', ...path(0) });
    for (let t = sampleMs; t <= total; t += sampleMs) {
      s = advanceGame(s, sampleMs);
      s = cmd(s, { type: 'moveDrizzle', ...path(Math.min(1, t / total)) });
    }
    s = cmd(s, { type: 'endDrizzle' });
    return s.dishes.find((d) => d.id === dishId).finish.drizzles.curd_swirl;
  };
  const covered = (d) => d.cellsMg.filter((mg) => mg > 0).length;
  const fast = run(8); // 120 Hz
  for (const sampleMs of [16, 40, 60]) {
    const slow = run(sampleMs);
    assert.equal(slow.insideMg + slow.spilledMg, fast.insideMg + fast.spilledMg);
    assert.ok(Math.abs(covered(fast) - covered(slow)) <= 1, `${sampleMs} ms samples cover like 8 ms (${covered(slow)} vs ${covered(fast)})`);
  }
});

test('each drizzle has its own rate, so a medium ghee tadka takes about as long as a curd swirl', () => {
  const { s: start, dishId } = finishing(42, 2);
  for (const id of ['curd_swirl', 'ghee_tadka']) {
    let s = cmd(start, { type: 'beginDrizzle', dishId, drizzleId: id, x: 0, y: 0 });
    s = advanceGame(s, 1_000);
    s = cmd(s, { type: 'endDrizzle' });
    assert.equal(s.dishes.find((d) => d.id === dishId).finish.drizzles[id].insideMg, 1_000 * FINISH_V1.drizzleRateMgPerMs[id]);
  }
  const msToTarget = (id, targetG) => (targetG * 1000) / FINISH_V1.drizzleRateMgPerMs[id];
  assert.ok(Math.abs(msToTarget('curd_swirl', 20) - msToTarget('ghee_tadka', 5)) < 200);
});

test('rank-locked drizzles and garnishes are rejected', () => {
  const { s, dishId } = finishing(42, 1);
  assert.match(reject(s, { type: 'beginDrizzle', dishId, drizzleId: 'ghee_tadka', x: 0, y: 0 }), /unlocks at rank 2/);
  assert.match(reject(s, { type: 'placeGarnish', dishId, garnishId: 'pomegranate', x: 0, y: 0 }), /unlocks at rank 4/);
  cmd(s, { type: 'placeGarnish', dishId, garnishId: 'coriander', x: 0, y: 0 });
});

test('every press pours at least the minimum, added to what was there', () => {
  let { s } = withTicket();
  s = cmd(s, { type: 'startDish', size: 'medium' });
  const dishId = s.dishes.at(-1).id;
  const foodId = s.tickets[0].order.mainId;
  const least = BUILD_V1.pourRateMgPerMs.main * BUILD_V1.minPressMs;
  s = cmd(s, { type: 'beginPour', dishId, component: 'main', foodId });
  s = cmd(s, { type: 'endPour' });
  s = cmd(s, { type: 'beginPour', dishId, component: 'main', foodId });
  s = advanceGame(s, 30);
  s = cmd(s, { type: 'endPour' });
  assert.equal(s.dishes.at(-1).build.main.mg, 2 * least, 'two quick presses = two minimum pours');
  s = cmd(s, { type: 'beginPour', dishId, component: 'main', foodId });
  s = advanceGame(s, 500);
  s = cmd(s, { type: 'endPour' });
  assert.equal(s.dishes.at(-1).build.main.mg, 2 * least + 500 * 90, 'a real hold pours exactly its time');
  // An involuntary release (station change) adds nothing and leaves no empty portion.
  s = cmd(s, { type: 'beginPour', dishId, component: 'side', foodId: s.tickets[0].order.sideId });
  s = cmd(s, { type: 'selectStation', station: 'order' });
  assert.equal(s.dishes.at(-1).build.side, undefined);
});

test('a save that cannot be restored still yields its progress', () => {
  let { s } = withTicket();
  s = structuredClone(s);
  s.profile = { ...s.profile, rank: 3, coins: 41, points: 120, upgrades: ['rice_scoop'], creditedDays: [1, 2], reportedDays: [1, 2] };
  const f = JSON.parse(serializeGame(s));
  f.state.paramVersions.finish = 'finish-v0';
  const text = JSON.stringify(f);
  assert.throws(() => deserializeGame(text), SaveError);
  const salvage = salvageSave(text, 'rules changed');
  assert.equal(salvage.profile.rank, 3);
  assert.equal(salvage.runId, s.runId);
  const next = createGame({ seed: 5, profile: salvage.profile, runId: salvage.runId });
  assert.equal(next.day.number, 3, 'starts the next uncredited day');
  assert.equal(next.profile.coins, 41);
  assert.equal(salvageSave('not json', 'x').profile, undefined);
  // A retired upgrade id is dropped (and named), not a reason to lose everything.
  const retired = JSON.parse(text);
  retired.state.profile.upgrades = ['rice_scoop', 'retired_thing', 'rice_scoop'];
  const kept = salvageSave(JSON.stringify(retired), 'x');
  assert.deepEqual(kept.profile.upgrades, ['rice_scoop']);
  assert.deepEqual(kept.droppedUpgrades, ['retired_thing']);
  // ...and the save itself still loads: the day continues, the retired upgrade is named.
  const current = JSON.parse(serializeGame(s));
  current.state.profile.upgrades = ['rice_scoop', 'retired_thing', 'rice_scoop'];
  const loaded = deserializeGameWithNotes(JSON.stringify(current));
  assert.deepEqual(loaded.state.profile.upgrades, ['rice_scoop']);
  assert.deepEqual(loaded.notes, ['Retired upgrade removed: retired_thing']);
  // Upgrades retired by a rules change (progression-v3) are named and their coins come back.
  const bought = JSON.parse(text);
  bought.state.profile.upgrades = ['rice_scoop', 'serving_trolley', 'head_chef_whites'];
  const refunded = salvageSave(JSON.stringify(bought), 'rules changed');
  assert.deepEqual(refunded.droppedUpgrades, ['Serving trolley', "Head chef's whites"]);
  assert.equal(refunded.refundedCoins, 230);
  assert.equal(refunded.profile.coins, 41 + 230);
  const sameRules = JSON.parse(serializeGame(s));
  sameRules.state.profile.upgrades = ['serving_trolley'];
  const restored = deserializeGameWithNotes(JSON.stringify(sameRules));
  assert.equal(restored.state.profile.coins, s.profile.coins + 90);
  assert.deepEqual(restored.notes, ['Retired upgrade removed: Serving trolley (90 coins refunded)']);
  const garbage = JSON.parse(text);
  garbage.state.profile.coins = 'lots';
  assert.equal(salvageSave(JSON.stringify(garbage), 'x').profile, undefined);
});

// --- Third audit, 2026-11-11 -------------------------------------------------------------------
import { contentShare, aggregateV2 } from '../src/features/nutriserve/simulation/index.ts';

test('an overheated slot lets go of a latched boost and stops cooking until it cools', () => {
  let p = advanceUntil(game(11), atCounter);
  p = cmd(p, { type: 'takeOrder' });
  const { s: b, dishId: d } = buildPerfect(p, p.tickets[0]);
  p = cmd(b, { type: 'startPrep', dishId: d, slot: 0 });
  p = cmd(p, { type: 'setBoost', slot: 0, held: true }); // a latched (clicked) boost
  p = advanceGame(p, 2_000);
  assert.equal(p.prepSlots[0].overheated, true);
  p = advanceGame(p, 10_000); // long after it cooled
  assert.equal(p.prepSlots[0].boostHeld, false);
  assert.equal(p.prepSlots[0].overheated, false, 'it does not overheat again by itself');
});

test('an empty or wrong katori no longer earns waiting, prep and finish credit', () => {
  let s = advanceUntil(game(42), atCounter);
  s = cmd(s, { type: 'takeOrder' });
  const ticket = s.tickets[0];
  s = cmd(s, { type: 'startDish', size: ticket.order.size });
  const dishId = s.dishes.at(-1).id;
  s = cmd(s, { type: 'finishBuild', dishId });
  s = cmd(s, { type: 'startPrep', dishId, slot: 0 });
  s = cmd(s, { type: 'finishPrep', slot: 0 });
  s = cmd(s, { type: 'finishDish', dishId });
  s = cmd(s, { type: 'serve', dishId, ticketId: ticket.id });
  const r = s.day.results[0];
  assert.equal(r.contentShare, 0);
  assert.equal(r.scores.total, 0, `empty katori total ${r.scores.total}`);
  assert.equal(r.tip, 0);
  // Half the ordered food or more keeps full credit; below that it scales.
  assert.equal(aggregateV2({ waiting: 100, build: 40, prep: 100, finish: 100 }, 0.5), 85);
  assert.equal(aggregateV2({ waiting: 100, build: 40, prep: 100, finish: 100 }, 0.25), 48);
  const half = { size: ticket.order.size, build: { base: { foodId: ticket.order.baseId, mg: ticket.order.idealG.base * 1000 * 2 } } };
  assert.ok(contentShare(half, ticket.order) < 0.4, 'extra of one food does not count past what was ordered');
});

test('a dish remembers the ticket it was started for, and the views follow it', () => {
  let s = advanceUntil(game(42), atCounter);
  s = cmd(s, { type: 'takeOrder' });
  const first = s.tickets[0];
  s = cmd(s, { type: 'startDish', size: first.order.size });
  const dishId = s.dishes.at(-1).id;
  assert.equal(s.dishes.at(-1).forTicketId, first.id);
  s = advanceUntil(s, atCounter);
  s = cmd(s, { type: 'takeOrder' }); // selects the new ticket
  assert.notEqual(s.selected.ticketId, first.id);
  s = cmd(s, { type: 'selectStation', station: 'build' });
  assert.equal(s.selected.ticketId, first.id, 'Build shows the dish on the counter');
  s = cmd(s, { type: 'selectTicket', ticketId: s.tickets[1].id });
  s = cmd(s, { type: 'selectDish', dishId });
  assert.equal(s.selected.ticketId, first.id, 'selecting a dish shows its ticket');
  const restored = deserializeGame(serializeGame(s));
  assert.equal(restored.dishes.find((d) => d.id === dishId).forTicketId, first.id);
});

test('hand-edited saves with impossible combinations are rejected', () => {
  const { s, dishId } = finishing();
  const text = serializeGame(s);
  const bad = (what, mutate) => {
    const f = JSON.parse(text);
    mutate(f.state);
    assert.throws(() => deserializeGame(JSON.stringify(f)), SaveError, what);
  };
  bad('served ticket, customer still waiting', (st) => (st.tickets[0].servedAtMs = st.nowMs));
  bad('completed day not credited', (st) => (st.day.completed = true));
  bad('short drizzle grid', (st) => (st.dishes.find((d) => d.id === dishId).finish.drizzles = { curd_swirl: { cellsMg: [], insideMg: 0, spilledMg: 0 } }));
  bad('rank does not match points', (st) => (st.profile.rank = 7));
  bad('no catalog id on a ticket', (st) => delete st.tickets[0].catalogCustomerId);
  bad('dish for a missing ticket', (st) => (st.dishes[0].forTicketId = 't999'));
});

import { serviceNutritionReport } from '../src/features/nutriserve/nutrition/nutrition.ts';
import { getCatalogCustomer } from '../src/features/nutriserve/simulation/index.ts';

test('the nutrition report never blames the player for a perfectly served order', () => {
  const { s, dishId, ticket } = finishing();
  const customer = getCatalogCustomer(ticket.catalogCustomerId);
  let f = s;
  for (const step of ticket.order.finish) {
    if (step.kind === 'drizzle') continue; // handled below with an exact deposit
    for (let i = 0; i < step.count; i++) f = cmd(f, { type: 'placeGarnish', dishId, garnishId: step.id, x: 0.3 * Math.cos(i), y: 0.3 * Math.sin(i) });
  }
  const dish = structuredClone(f.dishes.find((d) => d.id === dishId));
  const drizzle = ticket.order.finish.find((x) => x.kind === 'drizzle');
  if (drizzle) dish.finish.drizzles[drizzle.id] = { cellsMg: new Array(36).fill(0), insideMg: FINISH_V1.drizzleTargetG[drizzle.id][ticket.order.size] * 1000, spilledMg: 0 };
  const perfect = serviceNutritionReport(dish, ticket.order, customer.order);
  assert.deepEqual(perfect.changes, [], perfect.changes.join(' | '));
  assert.ok(Math.abs(perfect.served.totals.calories_kcal - perfect.ordered.calories_kcal) < 1);

  const heavy = structuredClone(dish);
  heavy.build.base.mg += 60_000;
  delete heavy.build.side;
  const off = serviceNutritionReport(heavy, ticket.order, customer.order);
  assert.equal(off.changes.length, 2);
  assert.ok(off.changes.some((c) => /^60 g more .* than ordered: \+\d+ kcal$/.test(c)), off.changes.join(' | '));
  assert.ok(off.changes.some((c) => /^No .* \(side\): −\d+ kcal$/.test(c)), off.changes.join(' | '));
});

// --- Fourth audit, 2026-11-11 ------------------------------------------------------------------
import { rewardsV2, orderComplete, ticketForNewDish, serveNotes } from '../src/features/nutriserve/simulation/index.ts';

test('five stars and the great bonus need a complete order (economy-v2)', () => {
  assert.deepEqual(rewardsV2(92, 'large', true), { tip: 10, points: 9, stars: 5 });
  assert.deepEqual(rewardsV2(92, 'large', false), { tip: 7, points: 9, stars: 4 });
  const { s, dishId, ticket } = finishing();
  const dish = s.dishes.find((d) => d.id === dishId);
  const finished = structuredClone(dish);
  for (const step of ticket.order.finish) {
    if (step.kind === 'drizzle') finished.finish.drizzles[step.id] = { cellsMg: new Array(36).fill(0), insideMg: 5000, spilledMg: 0 };
    else for (let i = 0; i < step.count; i++) finished.finish.garnishes.push({ id: step.id, x: 0, y: 0, fell: false });
  }
  assert.equal(orderComplete(finished, ticket.order), true);
  const noSide = structuredClone(finished);
  delete noSide.build.side;
  assert.equal(orderComplete(noSide, ticket.order), false);
  if (ticket.order.finish.some((f) => f.kind === 'garnish')) {
    const fell = structuredClone(finished);
    fell.finish.garnishes.forEach((g) => (g.fell = true));
    assert.equal(orderComplete(fell, ticket.order), false, 'fallen garnish is not on the dish');
  }
});

test('every serve records plain reasons for its scores', () => {
  let s = advanceUntil(game(42), atCounter);
  s = cmd(s, { type: 'takeOrder' });
  const ticket = s.tickets[0];
  s = cmd(s, { type: 'startDish', size: ticket.order.size });
  const dishId = s.dishes.at(-1).id;
  s = pour(s, dishId, 'base', ticket.order.baseId, Math.round((ticket.order.idealG.base * 1000) / 80) + 500); // 40 g over
  s = pour(s, dishId, 'main', ticket.order.mainId, Math.round((ticket.order.idealG.main * 1000) / 90));
  s = cmd(s, { type: 'finishBuild', dishId }); // no side
  s = cmd(s, { type: 'startPrep', dishId, slot: 0 });
  s = cmd(s, { type: 'finishPrep', slot: 0 }); // raw
  s = cmd(s, { type: 'finishDish', dishId });
  s = cmd(s, { type: 'serve', dishId, ticketId: ticket.id });
  const notes = s.day.results[0].notes;
  assert.ok(notes.includes('Base +40 g'), notes.join(' | '));
  assert.ok(notes.includes('No side'), notes.join(' | '));
  assert.ok(notes.some((n) => /^Undercooked: 0 of \d+ prep units$/.test(n)), notes.join(' | '));
  assert.equal(s.day.results[0].complete, false);
  assert.ok(s.day.results[0].stars <= 4);
});

test('a cancelled touch pour leaves the portion as it was; a one-tap mis-pick can be swapped', () => {
  let { s } = withTicket();
  s = cmd(s, { type: 'startDish', size: 'medium' });
  const dishId = s.dishes.at(-1).id;
  const t = s.tickets[0].order;
  s = pour(s, dishId, 'main', t.mainId, 300);
  const before = s.dishes.at(-1).build.main.mg;
  s = cmd(s, { type: 'beginPour', dishId, component: 'main', foodId: t.mainId });
  s = advanceGame(s, 400);
  s = cmd(s, { type: 'cancelPour' });
  assert.equal(s.dishes.at(-1).build.main.mg, before);
  s = cmd(s, { type: 'beginPour', dishId, component: 'side', foodId: t.sideId });
  s = advanceGame(s, 400);
  s = cmd(s, { type: 'cancelPour' });
  assert.equal(s.dishes.at(-1).build.side, undefined, 'a cancelled first pour leaves no portion');
  // A single quick tap of the wrong base can be replaced by the right one...
  const wrongBase = t.baseId === 'rice_white' ? 'rice_brown' : 'rice_white';
  s = cmd(s, { type: 'beginPour', dishId, component: 'base', foodId: wrongBase });
  s = cmd(s, { type: 'endPour' });
  s = pour(s, dishId, 'base', t.baseId, 500);
  assert.equal(s.dishes.at(-1).build.base.foodId, t.baseId);
  assert.equal(s.dishes.at(-1).build.base.mg, 500 * 80);
  // ...but a real portion cannot.
  assert.match(reject(s, { type: 'beginPour', dishId, component: 'base', foodId: wrongBase }), /trash the dish/);
});

test('boost cannot be turned on while the handi is overheated', () => {
  let p = advanceUntil(game(11), atCounter);
  p = cmd(p, { type: 'takeOrder' });
  const { s: b, dishId } = buildPerfect(p, p.tickets[0]);
  p = cmd(b, { type: 'startPrep', dishId, slot: 0 });
  p = cmd(p, { type: 'setBoost', slot: 0, held: true });
  p = advanceGame(p, 2_000);
  assert.equal(p.prepSlots[0].overheated, true);
  assert.match(reject(p, { type: 'setBoost', slot: 0, held: true }), /Too hot/);
  cmd(p, { type: 'setBoost', slot: 0, held: false });
});

test('finish guidance follows the dish on the vessel after Done; new dishes go to tickets without one', () => {
  let s = advanceUntil(game(42), atCounter);
  s = cmd(s, { type: 'takeOrder' });
  s = advanceUntil(s, atCounter);
  s = cmd(s, { type: 'takeOrder' });
  const [t1, t2] = s.tickets;
  const made = [];
  for (const t of [t1, t2]) {
    s = cmd(s, { type: 'selectTicket', ticketId: t.id });
    const r = buildPerfect(s, t);
    s = r.s;
    made.push(r.dishId);
    assert.equal(s.dishes.find((d) => d.id === r.dishId).forTicketId, t.id);
  }
  made.forEach((dishId, slot) => (s = cmd(s, { type: 'startPrep', dishId, slot })));
  s = advanceGame(s, 6_000);
  s = cmd(s, { type: 'finishPrep', slot: 0 });
  s = cmd(s, { type: 'finishPrep', slot: 1 });
  s = cmd(s, { type: 'selectStation', station: 'finish' });
  s = cmd(s, { type: 'selectDish', dishId: made[1] });
  assert.equal(s.selected.ticketId, t2.id);
  s = cmd(s, { type: 'finishDish', dishId: made[1] });
  assert.equal(s.selected.ticketId, t1.id, 'after Done the paper ticket shows the dish now on the vessel');
});

test('Build suggests the oldest ticket that has no dish yet, not the one just made', () => {
  let s = advanceUntil(game(42), atCounter);
  s = cmd(s, { type: 'takeOrder' });
  s = advanceUntil(s, atCounter);
  s = cmd(s, { type: 'takeOrder' }); // #2 shown, but not picked by the player
  const [t1, t2] = s.tickets;
  assert.equal(ticketForNewDish(s).id, t1.id, 'an automatic selection is not a pick: the oldest ticket without a dish comes first');
  s = cmd(s, { type: 'selectTicket', ticketId: t2.id }); // the player picks #2
  const { s: built } = buildPerfect(s, t2);
  s = built;
  assert.equal(s.dishes.at(-1).forTicketId, t2.id);
  assert.equal(s.selected.ticketId, t1.id, 'sending #2 to prep moves the selection to #1, which has no dish yet');
  assert.equal(ticketForNewDish(s).id, t1.id);
  // The player's own pick is always honoured, and the paper ticket follows the new dish.
  s = cmd(s, { type: 'selectTicket', ticketId: t2.id });
  assert.equal(ticketForNewDish(s).id, t2.id);
  s = cmd(s, { type: 'startDish', size: t2.order.size });
  assert.equal(s.dishes.at(-1).forTicketId, t2.id);
  assert.equal(s.selected.ticketId, t2.id);
});

test('half portions are not a complete order (economy-v3)', () => {
  const { s, dishId, ticket } = finishing();
  const dish = structuredClone(s.dishes.find((d) => d.id === dishId));
  for (const step of ticket.order.finish) {
    if (step.kind === 'drizzle') dish.finish.drizzles[step.id] = { cellsMg: new Array(36).fill(0), insideMg: 50_000, spilledMg: 0 };
    else for (let i = 0; i < step.count; i++) dish.finish.garnishes.push({ id: step.id, x: 0, y: 0, fell: false });
  }
  assert.equal(orderComplete(dish, ticket.order), true);
  const half = structuredClone(dish);
  for (const c of ['base', 'main', 'side']) half.build[c].mg = Math.round(half.build[c].mg / 2);
  assert.equal(orderComplete(half, ticket.order), false);
  const drizzle = ticket.order.finish.find((f) => f.kind === 'drizzle');
  if (drizzle) {
    const thin = structuredClone(dish);
    thin.finish.drizzles[drizzle.id].insideMg = 1_000; // a dab, not the ordered drizzle
    assert.equal(orderComplete(thin, ticket.order), false);
  }
});

test('the nutrition report names missing, extra and unordered garnish', () => {
  const { s, dishId, ticket } = finishing();
  const customer = getCatalogCustomer(ticket.catalogCustomerId);
  const order = { ...ticket.order, finish: [{ kind: 'garnish', id: 'coriander', count: 3 }] };
  const dish = structuredClone(s.dishes.find((d) => d.id === dishId));
  const none = serviceNutritionReport(dish, order, customer.order);
  assert.ok(none.changes.includes('No Coriander (3 ordered)') || none.changes.some((c) => /^No .* \(3 ordered\)$/.test(c)), none.changes.join(' | '));
  for (let i = 0; i < 12; i++) dish.finish.garnishes.push({ id: 'onion', x: 0, y: 0, fell: false });
  dish.finish.garnishes.push({ id: 'coriander', x: 0, y: 0, fell: false });
  const extra = serviceNutritionReport(dish, order, customer.order);
  assert.ok(extra.changes.some((c) => /^12 unordered .*: \+\d+ kcal$/.test(c)), extra.changes.join(' | '));
  assert.ok(extra.changes.some((c) => /^2 fewer .* than ordered$/.test(c)), extra.changes.join(' | '));
});

// --- Fifth audit, 2026-11-11 -------------------------------------------------------------------
test('score notes use labels, say which way a drizzle was off, and skip rounding-zero penalties', () => {
  const { s, dishId, ticket } = finishing(42, 4);
  const dish = structuredClone(s.dishes.find((d) => d.id === dishId));
  const order = { ...ticket.order, finish: [{ kind: 'drizzle', id: 'curd_swirl' }, { kind: 'garnish', id: 'green_chilli', count: 2 }] };
  dish.finish.drizzles.curd_swirl = { cellsMg: new Array(36).fill(0), insideMg: 60_000, spilledMg: 0 };
  dish.finish.garnishes.push({ id: 'onion', x: 0.01, y: 0, fell: false });
  const grade = gradeFinishV1(dish, order);
  const reasons = grade.penalties.map((p) => p.reason);
  assert.ok(reasons.includes('Missing 2 Green chilli') || reasons.some((r) => /^Missing 2 Green/.test(r)), reasons.join(' | '));
  assert.ok(reasons.some((r) => /^Too much Curd swirl$/.test(r)), reasons.join(' | '));
  assert.ok(reasons.some((r) => /^Unordered Onion/.test(r)), reasons.join(' | '));
  assert.ok(!reasons.some((r) => /green_chilli|onion\b/.test(r)), 'no raw ids');
  const notes = serveNotes(dish, order, { waiting: 100, build: 100, prep: 100, finish: grade.score }, 1, grade.penalties, 0);
  assert.ok(notes.every((n) => !/\(−0\)/.test(n)), notes.join(' | '));
});

test('automatic ticket follows never steer the next dish onto a ticket that already has one', () => {
  let s = advanceUntil(game(42), atCounter);
  s = cmd(s, { type: 'takeOrder' });
  s = advanceUntil(s, atCounter);
  s = cmd(s, { type: 'takeOrder' });
  const [t1, t2] = s.tickets;
  s = cmd(s, { type: 'selectTicket', ticketId: t1.id });
  const r = buildPerfect(s, t1);
  s = cmd(r.s, { type: 'startPrep', dishId: r.dishId, slot: 0 });
  s = advanceGame(s, 6_000);
  s = cmd(s, { type: 'finishPrep', slot: 0 });
  s = cmd(s, { type: 'selectStation', station: 'finish' }); // follows #1's dish
  assert.equal(s.selected.ticketId, t1.id);
  s = cmd(s, { type: 'selectStation', station: 'build' });
  assert.equal(s.selected.ticketId, t2.id, 'Build shows the ticket the next dish is for');
  s = cmd(s, { type: 'startDish', size: t2.order.size });
  assert.equal(s.dishes.at(-1).forTicketId, t2.id);
});

test('a click-only pour stops exactly at its line; changing dish ends a drizzle on the old one', () => {
  let { s } = withTicket();
  s = cmd(s, { type: 'startDish', size: 'medium' });
  const dishId = s.dishes.at(-1).id;
  s = cmd(s, { type: 'beginPour', dishId, component: 'main', foodId: s.tickets[0].order.mainId, stopAtMg: 176_000 });
  s = advanceGame(s, 5_000);
  assert.equal(s.held, undefined, 'the pour ended by itself');
  assert.equal(s.dishes.at(-1).build.main.mg, 176_000);
  const f = finishing(42, 2);
  let t = cmd(f.s, { type: 'beginDrizzle', dishId: f.dishId, drizzleId: 'curd_swirl', x: 0, y: 0 });
  t = advanceGame(t, 300);
  t = cmd(t, { type: 'selectDish' }); // the player picks another dish (here: none)
  assert.equal(t.held, undefined);
  assert.equal(t.dishes.find((d) => d.id === f.dishId).finish.drizzles.curd_swirl.insideMg, 300 * 12, 'what was poured landed');
});

// --- Seventh audit, 2026-11-11 -----------------------------------------------------------------
test('a stop-at-line pour already at its line is refused, never left running', () => {
  let { s } = withTicket();
  s = cmd(s, { type: 'startDish', size: 'medium' });
  const dishId = s.dishes.at(-1).id;
  const foodId = s.tickets[0].order.baseId;
  s = cmd(s, { type: 'beginPour', dishId, component: 'base', foodId, stopAtMg: 50_000 });
  s = advanceGame(s, 2_000);
  assert.equal(s.dishes.at(-1).build.base.mg, 50_000);
  assert.match(reject(s, { type: 'beginPour', dishId, component: 'base', foodId, stopAtMg: 50_000 }), /Already at the line/);
});

test('a rail pick of the ticket being built is used up when that dish goes to prep', () => {
  let s = advanceUntil(game(42), atCounter);
  s = cmd(s, { type: 'takeOrder' });
  s = advanceUntil(s, atCounter);
  s = cmd(s, { type: 'takeOrder' });
  const [t1, t2] = s.tickets;
  s = cmd(s, { type: 'selectTicket', ticketId: t1.id });
  s = cmd(s, { type: 'startDish', size: t1.order.size });
  s = cmd(s, { type: 'selectTicket', ticketId: t1.id }); // tapping the ticket already being built
  s = cmd(s, { type: 'finishBuild', dishId: s.dishes.at(-1).id });
  assert.equal(s.selected.pickedTicketId, undefined);
  s = cmd(s, { type: 'startDish', size: t2.order.size });
  assert.equal(s.dishes.at(-1).forTicketId, t2.id, 'the next dish goes to the ticket without one');
});

// --- Eighth audit, 2026-11-11 ------------------------------------------------------------------
test('a stop-at-line pour stopped early never goes past its line through the minimum pour', () => {
  let { s } = withTicket();
  s = cmd(s, { type: 'startDish', size: 'medium' });
  const dishId = s.dishes.at(-1).id;
  const foodId = s.tickets[0].order.mainId;
  s = cmd(s, { type: 'beginPour', dishId, component: 'main', foodId, stopAtMg: 4_000 }); // line 4 g, under one press (9 g)
  s = cmd(s, { type: 'endPour' });
  assert.equal(s.dishes.at(-1).build.main.mg, 4_000);
});

// --- Ninth audit, 2026-11-11 -------------------------------------------------------------------
import { arrivalGapRange, DAY_V2 } from '../src/features/nutriserve/simulation/params.ts';
import { upgradeEffects, UPGRADES, gradeWaitingV1 } from '../src/features/nutriserve/simulation/index.ts';

test('later days get busier: arrival gaps shrink to a floor (day-v2)', () => {
  assert.deepEqual(arrivalGapRange(1), [22_000, 38_000]);
  assert.deepEqual(arrivalGapRange(5), [18_000, 30_000]);
  assert.deepEqual(arrivalGapRange(30), [12_000, 20_000]);
  const day9 = createGame({ seed: 3, day: 9 });
  const gaps = day9.day.customers.slice(1).map((c, i) => c.arrivalMs - day9.day.customers[i].arrivalMs);
  const [lo, hi] = arrivalGapRange(9);
  assert.ok(gaps.every((g) => g >= lo && g <= hi), gaps.join(','));
  assert.equal(createGame({ seed: 3, day: 15 }).day.customers.length, DAY_V2.maxCustomers);
});

test('rank 5-8 upgrades help where busy days cost points (progression-v3)', () => {
  for (const id of ['insulated_handis', 'chai_stall', 'tiffin_rack', 'pressure_lid']) assert.ok(UPGRADES[id].unlockRank >= 5, id);
  assert.equal(UPGRADES.serving_trolley, undefined);
  assert.equal(UPGRADES.head_chef_whites, undefined);
  const e = upgradeEffects(['insulated_handis', 'chai_stall', 'tiffin_rack', 'pressure_lid']);
  assert.equal(e.heatRisePerMs, 3);
  assert.equal(e.boostMultiplier, 3);
  assert.equal(e.lobbyGraceMs, 12_000);
  assert.equal(e.ticketGraceMs, 15_000);
  assert.equal(upgradeEffects([]).boostMultiplier, undefined, 'without lids the prep-v2 boost rate applies');
  const profile = (upgrades) => ({ ...newProfile(), rank: 8, points: 720, upgrades });
  // Insulated handis: boosting from cold overheats after 3333 ms instead of 2000 ms.
  let p = advanceUntil(game(11, { profile: profile(['insulated_handis']) }), atCounter);
  p = cmd(p, { type: 'takeOrder' });
  const { s: b, dishId } = buildPerfect(p, p.tickets[0]);
  p = cmd(b, { type: 'startPrep', dishId, slot: 0 });
  p = cmd(p, { type: 'setBoost', slot: 0, held: true });
  p = advanceGame(p, 2_500);
  assert.equal(p.prepSlots[0].overheated, false);
  p = advanceGame(p, 1_000);
  assert.equal(p.prepSlots[0].overheated, true);
  // Pressure lids: a boosted millisecond cooks 450 milli-units instead of 375.
  let q = advanceUntil(game(11, { profile: profile(['pressure_lid']) }), atCounter);
  q = cmd(q, { type: 'takeOrder' });
  const r = buildPerfect(q, q.tickets[0]);
  q = cmd(r.s, { type: 'startPrep', dishId: r.dishId, slot: 0 });
  q = cmd(q, { type: 'setBoost', slot: 0, held: true });
  q = advanceGame(q, 1_000);
  assert.equal(q.dishes.find((d) => d.id === r.dishId).prep.milliUnits, 450_000);
});

test('the tiffin rack adds 15 s of ticket grace, and only ticket grace (progression-v3)', () => {
  const ticket = { takenAtMs: 10_000, atCounterMs: 10_000, order: { prepLevel: 'regular' } };
  const rack = upgradeEffects(['tiffin_rack']);
  const lateBy15 = 10_000 + 45_000 + 12_000 + 15_000;
  assert.ok(gradeWaitingV1(ticket, lateBy15) < 100);
  assert.equal(gradeWaitingV1(ticket, lateBy15, rack), 100);
  assert.ok(gradeWaitingV1(ticket, lateBy15 + 5_000, rack) < 100);
  // The lobby wait is not covered by it.
  const slowToOrder = { ...ticket, atCounterMs: 0, takenAtMs: 40_000 };
  assert.equal(gradeWaitingV1(slowToOrder, 41_000, rack), gradeWaitingV1(slowToOrder, 41_000));
});

// --- Tenth audit, 2026-11-11 -------------------------------------------------------------------
test('notes never name a portion or finish error that owned upgrades made free', () => {
  const { s, dishId, ticket } = finishing(42, 4);
  const order = ticket.order;
  // Portions: find a base error the rice scoop forgives but the bare reference meter does not.
  const scoop = upgradeEffects(['rice_scoop']);
  const at = (g) => {
    const d = structuredClone(s.dishes.find((x) => x.id === dishId));
    d.build.base.mg = Math.round((order.idealG.base + g) * 1000);
    return d;
  };
  const perfect = gradeBuild(at(0), order, scoop).score;
  const g = [2, 4, 6, 8, 10, 12, 14, 16].find((e) => gradeBuild(at(e), order, scoop).score === perfect && gradeBuild(at(e), order).score < gradeBuild(at(0), order).score);
  assert.ok(g, 'some base error is free only with the rice scoop');
  const scores = (d, effects) => ({ waiting: 100, build: gradeBuild(d, order, effects).score, prep: 100, finish: 100 });
  const base = (notes) => notes.filter((n) => /^Base [+−]/.test(n));
  assert.deepEqual(base(serveNotes(at(g), order, scores(at(g), scoop), 1, [], 0, scoop)), []);
  assert.equal(base(serveNotes(at(g), order, scores(at(g)), 1, [], 0)).length, 1);
  // Finish: a small garnish slip the garnish tray's bonus covers is not named.
  const tray = upgradeEffects(['garnish_tray']);
  const d = structuredClone(s.dishes.find((x) => x.id === dishId));
  const finishOrder = { ...order, finish: [{ kind: 'garnish', id: 'coriander', count: 3 }] };
  // Three coriander, the last one turned a little off the even spread: a small balance penalty.
  const place = (deg) => {
    const r = (Math.PI / 180) * deg;
    d.finish.garnishes = [0, 120, deg].map((t, i) => ({ id: 'coriander', x: 0.5 * Math.cos(i < 2 ? (Math.PI / 180) * t : r), y: 0.5 * Math.sin(i < 2 ? (Math.PI / 180) * t : r), fell: false }));
  };
  const turn = [235, 230, 225, 220, 215, 210, 205, 200].find((deg) => {
    place(deg);
    const b = gradeFinishV1(d, finishOrder).score;
    return b < 100 && gradeFinishV1(d, finishOrder, tray).score === 100;
  });
  assert.ok(turn, 'some off-balance spread is free only with the garnish tray');
  place(turn);
  const withTray = gradeFinishV1(d, finishOrder, tray);
  const bare = gradeFinishV1(d, finishOrder);
  assert.ok(bare.score < 100 && withTray.score === 100, `bare ${bare.score}, with tray ${withTray.score}`);
  const fin = (grade) => serveNotes(d, finishOrder, { waiting: 100, build: 100, prep: 100, finish: grade.score }, 1, grade.penalties, 0).filter((n) => /\(−\d+\)$/.test(n));
  assert.deepEqual(fin(withTray), []);
  assert.ok(fin(bare).length >= 1);
});

// --- Eleventh audit, 2026-11-12 ------------------------------------------------------------------
import { PREP_V1, prepTargetUnits, prepBandUnits, gradePrep } from '../src/features/nutriserve/simulation/index.ts';

test('pressure lids let go of a latched boost at the start of the perfect window (progression-v4)', () => {
  const profile = (upgrades) => ({ ...newProfile(), rank: 8, points: 720, upgrades });
  const run = (upgrades) => {
    let q = advanceUntil(game(11, { profile: profile(upgrades) }), atCounter);
    q = cmd(q, { type: 'takeOrder' });
    const ticket = q.tickets[0];
    const r = buildPerfect(q, ticket);
    q = cmd(r.s, { type: 'startPrep', dishId: r.dishId, slot: 0 });
    q = cmd(q, { type: 'setBoost', slot: 0, held: true }); // latched and left alone
    // Cool the handi between bursts so the boost never overheats: a held boost re-pressed as
    // soon as it was let go would otherwise mask the whistle.
    const target = prepTargetUnits(ticket.order.prepLevel);
    const band = prepBandUnits(upgradeEffects(upgrades));
    let released;
    for (let t = 0; t < 40_000 && released === undefined; t += 1) {
      q = advanceGame(q, 1);
      const units = q.dishes.find((d) => d.id === r.dishId).prep.milliUnits;
      if (!q.prepSlots[0].boostHeld) released = units;
    }
    return { q, ticket, dishId: r.dishId, released, target, band };
  };
  const lid = run(['pressure_lid', 'insulated_handis']);
  // The boost lets go on the millisecond the dish reaches mark - band (450 milli-units a ms).
  const at = (lid.target - lid.band) * 1000;
  assert.ok(lid.released >= at && lid.released < at + 450, `${lid.released} vs ${at}`);
  assert.equal(lid.q.prepSlots[0].overheated, false, 'the whistle, not overheating, let go');
  // Left on the flame at the base rate from there, the dish stays perfect for 1.6 s.
  let after = advanceGame(lid.q, 1_500);
  after = cmd(after, { type: 'finishPrep', slot: 0 });
  assert.equal(gradePrep(after.dishes.find((d) => d.id === lid.dishId), lid.ticket.order, upgradeEffects(['pressure_lid'])), 100);
  // Boosting again past the whistle is the player's choice: it is not let go a second time.
  let again = cmd(lid.q, { type: 'setBoost', slot: 0, held: true });
  again = advanceGame(again, 200);
  assert.equal(again.prepSlots[0].boostHeld, true);
  // Without lids a latched boost keeps going until the handi overheats.
  const plain = run(['insulated_handis']);
  assert.ok(plain.released > (plain.target + plain.band) * 1000 || plain.q.prepSlots[0].overheated, `released at ${plain.released}`);
  assert.equal(plain.q.prepSlots[0].overheated, true);
});

test('the whistle needs a guiding ticket, and replays the same in any chunking', () => {
  const profile = { ...newProfile(), rank: 8, points: 720, upgrades: ['pressure_lid'] };
  let q = advanceUntil(game(12, { profile }), atCounter);
  q = cmd(q, { type: 'takeOrder' });
  const r = buildPerfect(q, q.tickets[0]);
  q = cmd(r.s, { type: 'startPrep', dishId: r.dishId, slot: 0 });
  q = cmd(q, { type: 'setBoost', slot: 0, held: true });
  const whole = advanceGame(q, 4_000);
  let parts = q;
  for (const dt of [1, 333, 7, 1_200, 59, 2_400]) parts = advanceGame(parts, dt);
  assert.deepEqual(parts, whole);
  assert.equal(PREP_V1.version, 'prep-v3-provisional');
});
