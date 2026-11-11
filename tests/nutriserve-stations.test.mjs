// C02 Build, C03 Prep, C04 Finish station mechanics and grading.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceGame, gradeFinishV1, gradeIndianBuildV1, gradeIndianPrepV1, meterFraction, prepTargetUnits, BUILD_V1, PREP_V1 } from '../src/features/nutriserve/simulation/index.ts';
import { gradeReferenceBuild, gradeReferenceMix } from '../src/features/nutriserve/domain/referenceScoring.ts';
import { game, cmd, reject, advanceUntil, atCounter, pour, buildPerfect } from './nutriserve-helpers.mjs';

function withTicket(seed = 42) {
  let s = advanceUntil(game(seed), atCounter);
  s = cmd(s, { type: 'takeOrder' });
  return { s, ticket: s.tickets[0] };
}

// --- C02 Build ---------------------------------------------------------------
test('holding a dispenser pours at a fixed rate; grams come from simulation time', () => {
  let { s } = withTicket();
  s = cmd(s, { type: 'startDish', size: 'medium' });
  const dishId = s.dishes[0].id;
  s = pour(s, dishId, 'base', 'rice_white', 1_500);
  assert.equal(s.dishes[0].build.base.mg, 1_500 * BUILD_V1.pourRateMgPerMs.base);
  s = pour(s, dishId, 'base', 'rice_white', 250); // topping up the same food adds
  assert.equal(s.dishes[0].build.base.mg, 1_750 * 80);
});

test('a press with no time poured still pours the minimum (build-v3)', () => {
  let { s } = withTicket();
  s = cmd(s, { type: 'startDish', size: 'small' });
  s = cmd(s, { type: 'beginPour', dishId: s.dishes[0].id, component: 'main', foodId: 'palak_dal' });
  s = cmd(s, { type: 'endPour' });
  assert.equal(s.dishes[0].build.main.mg, 90 * 100);
});

test('perfect build scores 100 through the unchanged reference scorer', () => {
  const { s, ticket } = withTicket();
  const { s: b, dishId } = buildPerfect(s, ticket);
  const dish = b.dishes.find((d) => d.id === dishId);
  const grade = gradeIndianBuildV1(dish, ticket.order);
  assert.equal(grade.score, 100);
  for (const c of ['base', 'main', 'side']) assert.ok(Math.abs(grade.signedErrorG[c]) < 0.5, `${c} near ideal`);
});

test('underfill and overfill are distinguished by sign and both cost points', () => {
  const { s, ticket } = withTicket();
  const make = (factor) => {
    let x = cmd(s, { type: 'startDish', size: ticket.order.size });
    const id = x.dishes.at(-1).id;
    x = pour(x, id, 'base', ticket.order.baseId, Math.round((ticket.order.idealG.base * 1000) / 80));
    x = pour(x, id, 'main', ticket.order.mainId, Math.round((ticket.order.idealG.main * factor * 1000) / 90));
    x = pour(x, id, 'side', ticket.order.sideId, Math.round((ticket.order.idealG.side * 1000) / 50));
    return gradeIndianBuildV1(x.dishes.at(-1), ticket.order);
  };
  const under = make(0.6), over = make(1.4);
  assert.ok(under.signedErrorG.main < 0 && over.signedErrorG.main > 0, 'opposite signs');
  assert.ok(Math.abs(under.signedErrorG.main + over.signedErrorG.main) < 1, 'same magnitude');
  assert.ok(under.score < 100 && over.score < 100);
  assert.equal(under.score, over.score, 'symmetric meter around the ideal');
});

test('wrong main loses its fixed reference share and skips its meter penalty', () => {
  const { s, ticket } = withTicket();
  let x = cmd(s, { type: 'startDish', size: ticket.order.size });
  const id = x.dishes.at(-1).id;
  x = pour(x, id, 'base', ticket.order.baseId, Math.round((ticket.order.idealG.base * 1000) / 80));
  const wrongMain = ticket.order.mainId === 'rajma_masala' ? 'chana_masala' : 'rajma_masala';
  x = pour(x, id, 'main', wrongMain, 10_000); // wildly overfilled, but wrong food: no meter penalty
  x = pour(x, id, 'side', ticket.order.sideId, Math.round((ticket.order.idealG.side * 1000) / 50));
  const grade = gradeIndianBuildV1(x.dishes.at(-1), ticket.order);
  assert.equal(grade.score, 67);
  assert.equal(grade.signedErrorG.main, null);
  assert.equal(grade.correct.main, false);
});

test('a wrong base food is an adapter penalty layered on the reference, not inside it', () => {
  const { s, ticket } = withTicket();
  const otherBase = ticket.order.baseId === 'rice_white' ? 'rice_brown' : 'rice_white';
  let x = cmd(s, { type: 'startDish', size: ticket.order.size });
  const id = x.dishes.at(-1).id;
  x = pour(x, id, 'base', otherBase, Math.round((ticket.order.idealG.base * 1000) / 80));
  x = pour(x, id, 'main', ticket.order.mainId, Math.round((ticket.order.idealG.main * 1000) / 90));
  x = pour(x, id, 'side', ticket.order.sideId, Math.round((ticket.order.idealG.side * 1000) / 50));
  const grade = gradeIndianBuildV1(x.dishes.at(-1), ticket.order);
  assert.equal(grade.score, 100 - BUILD_V1.baseMismatchPenalty);
  // The reference function itself has no base category: the same inputs score 100 there.
  assert.equal(gradeReferenceBuild({ cup: { correct: true, actualFill: 1, idealFill: 1 }, mixable: { correct: true, meterFraction: 0.5 }, syrup: { correct: true, meterFraction: 0.5 } }), 100);
});

test('wrong vessel size costs the reference cup share', () => {
  const { s, ticket } = withTicket();
  const size = ticket.order.size === 'small' ? 'large' : 'small';
  const { s: b, dishId } = buildPerfect(s, ticket, size);
  assert.equal(gradeIndianBuildV1(b.dishes.find((d) => d.id === dishId), ticket.order).score, 66);
});

test('meter fraction is 0.5 at the ideal and saturates at the full multiple', () => {
  assert.equal(meterFraction(100, 100), 0.5);
  assert.equal(meterFraction(0, 100), 0);
  assert.equal(meterFraction(500, 100), 1);
});

// --- C03 Prep (provisional parameters) ---------------------------------------
function inPrep(seed = 42, slot = 0) {
  const { s, ticket } = withTicket(seed);
  const { s: b, dishId } = buildPerfect(s, ticket);
  return { s: cmd(b, { type: 'startPrep', dishId, slot }), dishId, ticket };
}
const units = (s, dishId) => Math.floor(s.dishes.find((d) => d.id === dishId).prep.milliUnits / 1000);

test('prep accrues provisional units at the base rate and faster with boost', () => {
  let { s, dishId } = inPrep();
  s = advanceGame(s, 2_000);
  assert.equal(units(s, dishId), 2 * PREP_V1.unitsPerSecond);
  s = cmd(s, { type: 'setBoost', slot: 0, held: true });
  s = advanceGame(s, 1_000);
  assert.equal(units(s, dishId), 300 + 375);
});

test('holding boost overheats the slot, locks boost, then unlocks after cooling', () => {
  let { s, dishId } = inPrep();
  s = cmd(s, { type: 'setBoost', slot: 0, held: true });
  s = advanceGame(s, 2_000); // 2000 ms x 5 heat = 10000 = max
  assert.equal(s.prepSlots[0].overheated, true);
  assert.equal(s.prepSlots[0].boostHeld, false, 'overheating lets go of the boost (prep-v2)');
  const before = units(s, dishId);
  s = advanceGame(s, 1_000); // off the flame: nothing cooks while it cools
  assert.equal(units(s, dishId) - before, 0);
  assert.equal(s.prepSlots[0].heat, 10_000 - 2_000);
  s = advanceGame(s, 2_500); // cools to 3000 -> unlocked, cooking resumes at the base rate
  assert.equal(s.prepSlots[0].overheated, false);
  const resumed = units(s, dishId);
  s = advanceGame(s, 1_000);
  assert.equal(units(s, dishId) - resumed, 150);
});

test('four slots run independently with different targets, even offscreen', () => {
  let s = advanceUntil(game(9), atCounter);
  s = cmd(s, { type: 'takeOrder' });
  const ids = [];
  for (let slot = 0; slot < 4; slot++) {
    s = cmd(s, { type: 'startDish', size: 'small' });
    const dishId = s.dishes.at(-1).id;
    s = pour(s, dishId, 'base', 'rice_white', 100); // quick builds keep the slots close in time
    s = cmd(s, { type: 'finishBuild', dishId });
    s = cmd(s, { type: 'startPrep', dishId, slot });
    ids.push(dishId);
  }
  assert.match(reject(s, { type: 'startPrep', dishId: ids[0], slot: 0 }), /busy|Only a finished/);
  s = cmd(s, { type: 'selectStation', station: 'order' }); // everything below happens offscreen
  s = cmd(s, { type: 'setBoost', slot: 3, held: true });
  s = advanceGame(s, 1_500);
  s = cmd(s, { type: 'setBoost', slot: 3, held: false });
  s = advanceGame(s, 2_000);
  s = cmd(s, { type: 'finishPrep', slot: 0 });
  s = advanceGame(s, 4_000);
  s = cmd(s, { type: 'finishPrep', slot: 1 });
  s = cmd(s, { type: 'finishPrep', slot: 2 });
  s = cmd(s, { type: 'finishPrep', slot: 3 });
  const dishes = ids.map((id) => s.dishes.find((d) => d.id === id));
  // Unboosted slots: units are exactly elapsed time x base rate, each on its own clock.
  for (const d of dishes.slice(0, 3)) {
    assert.equal(Math.floor(d.prep.milliUnits / 1000), Math.floor(((d.prep.finishedAtMs - d.prep.startedAtMs) * 150) / 1000));
  }
  assert.ok(units(s, ids[1]) > units(s, ids[0]), 'slot 1 cooked longer than slot 0');
  const boosted = dishes[3], plain = dishes[2];
  const extra = Math.floor(boosted.prep.milliUnits / 1000) - Math.floor(((boosted.prep.finishedAtMs - boosted.prep.startedAtMs) * 150) / 1000);
  assert.equal(extra, Math.floor((1_500 * (375 - 150)) / 1000), 'boost added exactly its extra rate for 1.5 s');
  assert.ok(units(s, ids[3]) > units(s, ids[2]));
  void plain;
  assert.ok(s.prepSlots.every((slot) => slot.dishId === undefined));
});

test('prep grade uses the unchanged reference mix score via the level mapping', () => {
  let { s, dishId, ticket } = inPrep();
  const target = prepTargetUnits(ticket.order.prepLevel);
  s = advanceGame(s, Math.round((target / 150) * 1000));
  s = cmd(s, { type: 'finishPrep', slot: 0 });
  const dish = s.dishes.find((d) => d.id === dishId);
  assert.equal(gradeIndianPrepV1(dish, ticket.order), 100);
  assert.equal(gradeIndianPrepV1(dish, { ...ticket.order, prepLevel: ticket.order.prepLevel === 'quick' ? 'slow' : 'quick' }), gradeReferenceMix(units(s, dishId), ticket.order.prepLevel === 'quick' ? 'smooth' : 'chunky'));
});

test('overcooking keeps running to the provisional cap and floors at the reference minimum', () => {
  let { s, dishId, ticket } = inPrep();
  s = advanceGame(s, 60_000);
  assert.equal(units(s, dishId), PREP_V1.maxUnits);
  s = cmd(s, { type: 'finishPrep', slot: 0 });
  const quick = { ...ticket.order, prepLevel: 'quick' };
  assert.equal(gradeIndianPrepV1(s.dishes.find((d) => d.id === dishId), quick), 17);
});

// --- C04 Finish (provisional rules) -------------------------------------------
function atFinish(seed = 42) {
  const { s: p, dishId, ticket } = inPrep(seed);
  let s = advanceGame(p, 12_000);
  s = cmd(s, { type: 'finishPrep', slot: 0 });
  return { s, dishId, ticket };
}
const finishOrder = (ticket, finish) => ({ ...ticket.order, finish });

test('held drizzle deposits in local coordinates; outside the rim is spilled', () => {
  let { s, dishId } = atFinish();
  s = cmd(s, { type: 'beginDrizzle', dishId, drizzleId: 'curd_swirl', x: 0, y: 0 });
  s = advanceGame(s, 500); // a whole number of flush periods (100 ms), so nothing is pending
  s = cmd(s, { type: 'moveDrizzle', x: 1.3, y: 0 });
  s = advanceGame(s, 200);
  s = cmd(s, { type: 'endDrizzle' });
  const d = s.dishes.find((x) => x.id === dishId).finish.drizzles.curd_swirl;
  assert.equal(d.insideMg, 500 * 12);
  assert.equal(d.spilledMg, 200 * 12);
  assert.equal(d.cellsMg.reduce((a, b) => a + b, 0), d.insideMg);
});

test('an even drizzle of the right amount beats a blob, a spill or none', () => {
  const base = atFinish();
  const order = finishOrder(base.ticket, [{ kind: 'drizzle', id: 'curd_swirl' }]);
  const target = 20; // medium (default ticket size may differ; compute below)
  const targetG = { small: 15, medium: 20, large: 25 }[base.ticket.order.size];
  void target;
  const runDrizzle = (points) => {
    let s = cmd(base.s, { type: 'beginDrizzle', dishId: base.dishId, drizzleId: 'curd_swirl', ...points[0] });
    const per = Math.round((targetG * 1000) / 12 / points.length);
    for (const p of points) {
      s = cmd(s, { type: 'moveDrizzle', ...p });
      s = advanceGame(s, per);
    }
    s = cmd(s, { type: 'endDrizzle' });
    return gradeFinishV1(s.dishes.find((x) => x.id === base.dishId), order).score;
  };
  const ring = [];
  for (let r of [0.15, 0.5, 0.8]) for (let a = 0; a < 12; a++) ring.push({ x: r * Math.cos((a / 12) * 2 * Math.PI), y: r * Math.sin((a / 12) * 2 * Math.PI) });
  const even = runDrizzle(ring);
  const blob = runDrizzle([{ x: 0, y: 0 }]);
  const spill = runDrizzle([{ x: 1.4, y: 0 }]);
  const none = gradeFinishV1(base.s.dishes.find((x) => x.id === base.dishId), order).score;
  assert.ok(even > blob, `even ${even} > blob ${blob}`);
  assert.ok(blob > spill, `blob ${blob} > spill ${spill}`);
  assert.ok(none < even);
  assert.ok(even >= 90, `even drizzle scores high (${even})`);
});

test('garnish counts, wrong types, fallen pieces, balance and step order all count', () => {
  const base = atFinish();
  const order = finishOrder(base.ticket, [{ kind: 'drizzle', id: 'curd_swirl' }, { kind: 'garnish', id: 'coriander', count: 3 }]);
  const place = (s, id, x, y) => cmd(s, { type: 'placeGarnish', dishId: base.dishId, garnishId: id, x, y });
  const drizzle = (s) => {
    s = cmd(s, { type: 'beginDrizzle', dishId: base.dishId, drizzleId: 'curd_swirl', x: 0, y: 0 });
    for (const [x, y] of [[0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5], [0.3, 0.3], [-0.3, -0.3]]) {
      s = cmd(s, { type: 'moveDrizzle', x, y });
      s = advanceGame(s, 280);
    }
    return cmd(s, { type: 'endDrizzle' });
  };
  const grade = (s) => gradeFinishV1(s.dishes.find((x) => x.id === base.dishId), order);
  let good = drizzle(base.s);
  for (const [x, y] of [[0.5, 0.3], [-0.5, 0.3], [0, -0.55]]) good = place(good, 'coriander', x, y);
  const g = grade(good);
  let missing = drizzle(base.s);
  missing = place(missing, 'coriander', 0.3, 0);
  let wrong = place(good, 'onion', 0, 0);
  let fell = place(good, 'coriander', 1.2, 0);
  let lopsided = drizzle(base.s);
  for (let i = 0; i < 3; i++) lopsided = place(lopsided, 'coriander', 0.8, 0);
  let reversed = place(base.s, 'coriander', 0.5, 0.3);
  reversed = place(reversed, 'coriander', -0.5, 0.3);
  reversed = place(reversed, 'coriander', 0, -0.55);
  reversed = drizzle(reversed);
  assert.ok(g.score > grade(missing).score, 'missing pieces cost');
  assert.ok(g.score > grade(wrong).score, 'unordered garnish costs');
  assert.ok(grade(fell).penalties.some((p) => /fell/.test(p.reason)), 'fallen piece recorded');
  assert.ok(g.score > grade(lopsided).score, 'lopsided placement costs');
  assert.ok(grade(reversed).penalties.some((p) => /order/.test(p.reason)), 'out-of-order steps cost');
  assert.equal(grade(reversed).score, g.score - 8, 'only the order penalty differs');
});

test('finish commands need a prepped dish and keyboard/pointer share the same commands', () => {
  const { s, ticket } = withTicket();
  const { s: b, dishId } = buildPerfect(s, ticket);
  reject(b, { type: 'beginDrizzle', dishId, drizzleId: 'curd_swirl', x: 0, y: 0 });
  reject(b, { type: 'placeGarnish', dishId, garnishId: 'coriander', x: 0, y: 0 });
  const f = atFinish();
  reject(f.s, { type: 'beginDrizzle', dishId: f.dishId, drizzleId: 'nope', x: 0, y: 0 });
  reject(f.s, { type: 'placeGarnish', dishId: f.dishId, garnishId: 'coriander', x: NaN, y: 0 });
  const done = cmd(f.s, { type: 'finishDish', dishId: f.dishId });
  assert.equal(done.dishes.find((d) => d.id === f.dishId).stage, 'ready');
});
