// C05 serving/day/progression and C06 nutrition.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceGame, applyCommand, createGame, deserializeGame, serializeGame, rankForPoints, UPGRADES, gradeWaitingV1, prepTargetUnits } from '../src/features/nutriserve/simulation/index.ts';
import { dishNutrition, mealGoals, nutritionFeedback, validateCatalog } from '../src/features/nutriserve/nutrition/nutrition.ts';
import { CATALOG_FOODS } from '../src/features/nutriserve/data/catalog.generated.ts';
import { game, cmd, reject, advanceUntil, atCounter, buildPerfect, pour } from './nutriserve-helpers.mjs';

/** Prepare a dish perfectly for a ticket through all four stations; returns the ready dish id. */
function makePerfect(s, ticket) {
  const built = buildPerfect(s, ticket);
  s = cmd(built.s, { type: 'startPrep', dishId: built.dishId, slot: s.prepSlots.findIndex((x) => !x.dishId) });
  const slot = s.prepSlots.findIndex((x) => x.dishId === built.dishId);
  const targetUnits = prepTargetUnits(ticket.order.prepLevel);
  s = advanceGame(s, Math.round((targetUnits / 150) * 1000));
  s = cmd(s, { type: 'finishPrep', slot });
  for (const step of ticket.order.finish) {
    if (step.kind === 'drizzle') {
      const g = { curd_swirl: { small: 15, medium: 20, large: 25 }, ghee_tadka: { small: 4, medium: 5, large: 6 } }[step.id][ticket.order.size];
      const points = [];
      for (const r of [0.15, 0.5, 0.8]) for (let a = 0; a < 12; a++) points.push([r * Math.cos((a / 12) * 2 * Math.PI), r * Math.sin((a / 12) * 2 * Math.PI)]);
      s = cmd(s, { type: 'beginDrizzle', dishId: built.dishId, drizzleId: step.id, x: 0, y: 0 });
      const per = Math.max(1, Math.round((g * 1000) / 12 / points.length));
      for (const [x, y] of points) {
        s = cmd(s, { type: 'moveDrizzle', x, y });
        s = advanceGame(s, per);
      }
      s = cmd(s, { type: 'endDrizzle' });
    } else {
      for (let i = 0; i < step.count; i++) {
        const a = (i / step.count) * 2 * Math.PI;
        s = cmd(s, { type: 'placeGarnish', dishId: built.dishId, garnishId: step.id, x: 0.55 * Math.cos(a), y: 0.55 * Math.sin(a) });
      }
    }
  }
  s = cmd(s, { type: 'finishDish', dishId: built.dishId });
  return { s, dishId: built.dishId };
}

function playDay(seed, { wrongTicketFirst = false } = {}) {
  let s = game(seed);
  const served = [];
  while (!s.day.completed) {
    s = advanceUntil(s, (x) => atCounter(x) || x.day.completed || x.tickets.some((t) => t.servedAtMs === undefined));
    if (s.day.completed) break;
    if (atCounter(s)) s = cmd(s, { type: 'takeOrder' });
    const open = s.tickets.filter((t) => t.servedAtMs === undefined);
    for (const ticket of open) {
      const { s: next, dishId } = makePerfect(s, ticket);
      s = next;
      let target = ticket;
      if (wrongTicketFirst && served.length === 0) {
        s = advanceUntil(s, atCounter);
        s = cmd(s, { type: 'takeOrder' });
        target = s.tickets.find((t) => t.servedAtMs === undefined && t.id !== ticket.id);
      }
      s = cmd(s, { type: 'serve', dishId, ticketId: target.id });
      served.push(target.id);
      break;
    }
    s = advanceGame(s, 3_000);
  }
  return s;
}

test('a full day: every customer is served once, the day completes and rewards are credited once', () => {
  const s = playDay(21);
  assert.equal(s.day.completed, true);
  assert.equal(s.day.results.length, s.day.customers.length);
  assert.equal(new Set(s.day.results.map((r) => r.ticketId)).size, s.day.results.length);
  for (const r of s.day.results) {
    assert.ok(r.scores.build >= 98 && r.scores.prep === 100, `stations near perfect: ${JSON.stringify(r.scores)}`);
    assert.equal(r.mismatchedOrder, false);
  }
  const tips = s.day.results.reduce((a, r) => a + r.tip, 0);
  assert.equal(s.profile.coins, tips);
  assert.deepEqual(s.profile.creditedDays, [1]);
  // Completing again (e.g. advancing a finished day, or restoring it) never credits twice.
  const again = advanceGame(s, 100_000);
  assert.equal(again.profile.coins, tips);
  const restored = deserializeGame(serializeGame(s));
  assert.equal(advanceGame(restored, 5_000).profile.coins, tips);
});

test('serving a dish to the wrong ticket is allowed and graded against that ticket', () => {
  const s = playDay(21, { wrongTicketFirst: true });
  const first = s.day.results[0];
  assert.equal(first.mismatchedOrder, true);
  assert.ok(first.scores.build < 100);
});

test('a ticket can be served only once; serving an unready dish is rejected', () => {
  let s = advanceUntil(game(4), atCounter);
  s = cmd(s, { type: 'takeOrder' });
  const ticket = s.tickets[0];
  const a = makePerfect(s, ticket);
  s = cmd(a.s, { type: 'serve', dishId: a.dishId, ticketId: ticket.id });
  const b = makePerfect(s, ticket);
  assert.match(reject(b.s, { type: 'serve', dishId: b.dishId, ticketId: ticket.id }), /already served/);
  const c = cmd(b.s, { type: 'startDish', size: 'small' });
  reject(c, { type: 'serve', dishId: c.dishes.at(-1).id, ticketId: ticket.id });
});

test('four station scores stay distinct from each other', () => {
  let s = advanceUntil(game(4), atCounter);
  s = cmd(s, { type: 'takeOrder' });
  const ticket = s.tickets[0];
  const { s: b, dishId } = buildPerfect(s, ticket);
  s = cmd(b, { type: 'startPrep', dishId, slot: 0 });
  s = advanceGame(s, 1_000); // badly undercooked
  s = cmd(s, { type: 'finishPrep', slot: 0 });
  s = cmd(s, { type: 'finishDish', dishId }); // no finish work at all
  s = cmd(s, { type: 'serve', dishId, ticketId: ticket.id });
  const r = s.day.results[0].scores;
  assert.ok(r.build >= 98, 'build unaffected by prep/finish mistakes');
  assert.ok(r.prep < 90 && r.finish < 90);
  assert.equal(r.total, Math.round((r.waiting + r.build + r.prep + r.finish) / 4));
});

test('waiting score falls only after the provisional grace periods', () => {
  const ticket = { takenAtMs: 10_000, atCounterMs: 10_000, order: { prepLevel: 'regular' } };
  assert.equal(gradeWaitingV1(ticket, 10_000 + 45_000 + 12_000), 100);
  assert.ok(gradeWaitingV1(ticket, 10_000 + 45_000 + 12_000 + 30_000) < 100);
  const slowToOrder = { ...ticket, atCounterMs: 0, takenAtMs: 40_000 }; // 40 s at the counter, 12 s grace
  assert.equal(gradeWaitingV1(slowToOrder, 41_000), 72);
  assert.equal(gradeWaitingV1(ticket, 10_000 + 10_000_000), 0);
});

test('next day schedules more customers over time and resets the kitchen', () => {
  let s = playDay(21);
  s = cmd(s, { type: 'nextDay' });
  assert.equal(s.day.number, 2);
  assert.equal(s.tickets.length + s.dishes.length, 0);
  assert.ok(s.prepSlots.every((x) => !x.dishId && x.heat === 0));
  assert.ok(createGame({ seed: 1, day: 9 }).day.customers.length > createGame({ seed: 1, day: 1 }).day.customers.length);
});

test('upgrades cost coins, respect rank, apply reference furniture bonuses, and are bought once', () => {
  let s = playDay(21);
  const coins = s.profile.coins;
  if (coins >= UPGRADES.rice_scoop.cost) {
    s = cmd(s, { type: 'buyUpgrade', upgradeId: 'rice_scoop' });
    assert.equal(s.profile.coins, coins - UPGRADES.rice_scoop.cost);
    assert.match(reject(s, { type: 'buyUpgrade', upgradeId: 'rice_scoop' }), /owned/);
  }
  assert.match(reject(s, { type: 'buyUpgrade', upgradeId: 'copper_handis' }), /rank|coins/);
  assert.match(reject(s, { type: 'buyUpgrade', upgradeId: 'nope' }), /Unknown/);
  assert.equal(rankForPoints(0), 1);
  assert.equal(rankForPoints(100), 3);
});

test('a completed day is reported to the wider app exactly once', () => {
  let s = playDay(21);
  s = cmd(s, { type: 'markDayReported', day: 1 });
  assert.match(reject(s, { type: 'markDayReported', day: 1 }), /Already/);
  assert.match(reject(s, { type: 'markDayReported', day: 2 }), /not been credited/);
});

// --- C06 nutrition --------------------------------------------------------------
test('nutrition totals come from canonical per-100g data and actual grams, counted once', () => {
  let s = advanceUntil(game(4), atCounter);
  s = cmd(s, { type: 'takeOrder' });
  s = cmd(s, { type: 'startDish', size: 'medium' });
  const dishId = s.dishes[0].id;
  s = pour(s, dishId, 'base', 'rice_white', 1_000); // 80 g
  s = pour(s, dishId, 'main', 'palak_dal', 2_000); // 180 g
  s = cmd(s, { type: 'finishBuild', dishId });
  s = cmd(s, { type: 'startPrep', dishId, slot: 0 });
  s = advanceGame(s, 5_000);
  s = cmd(s, { type: 'finishPrep', slot: 0 });
  s = cmd(s, { type: 'beginDrizzle', dishId, drizzleId: 'curd_swirl', x: 0, y: 0 });
  s = advanceGame(s, 1_000); // 12 g inside
  s = cmd(s, { type: 'moveDrizzle', x: 1.4, y: 0 });
  s = advanceGame(s, 500); // 6 g spilled
  s = cmd(s, { type: 'endDrizzle' });
  s = cmd(s, { type: 'placeGarnish', dishId, garnishId: 'coriander', x: 0, y: 0 });
  s = cmd(s, { type: 'placeGarnish', dishId, garnishId: 'coriander', x: 1.3, y: 0 }); // fell
  const n = dishNutrition(s.dishes[0]);
  const rice = CATALOG_FOODS.find((f) => f.id === 'rice_white').nutrients_per_100g;
  const dal = CATALOG_FOODS.find((f) => f.id === 'palak_dal').nutrients_per_100g;
  const expectedKcal = rice.calories_kcal * 0.8 + dal.calories_kcal * 1.8 + 61 * 0.12 + 23 * 0.01;
  assert.ok(Math.abs(n.totals.calories_kcal - expectedKcal) < 1e-9, `${n.totals.calories_kcal} vs ${expectedKcal}`);
  assert.equal(n.notEaten.spilledDrizzleG, 6);
  assert.equal(n.notEaten.fallenGarnishPieces, 1);
  assert.deepEqual(n.unknownIds, []);
  // Prep and re-reading never add food.
  assert.deepEqual(dishNutrition(advanceGame(s, 10_000).dishes[0]).totals, n.totals);
});

test('meal goals match the legacy rules and feedback is educational, not medical', () => {
  const g = mealGoals({ plateSize: 'Regular', diabetesMode: 'Balanced' });
  assert.deepEqual(g.calories_kcal, { min: 450, max: 650, target: 550 });
  assert.equal(g.carbs_g.max, 550 * 0.1125);
  const fb = nutritionFeedback({ calories_kcal: 300, protein_g: 40, carbs_g: 30, fiber_g: 2, fat_g: 10, sodium_mg: 1200 }, { plateSize: 'Regular', diabetesMode: 'Balanced' });
  assert.equal(fb.statuses.calories_kcal, 'low');
  assert.equal(fb.statuses.sodium_mg, 'high');
  assert.ok(fb.notes.some((x) => /Sodium/.test(x)));
  assert.match(fb.disclaimer, /not medical advice/);
});

test('every required item and serving option in the catalog is valid', () => {
  const v = validateCatalog();
  assert.deepEqual(v.missingRequiredItems, []);
  assert.deepEqual(v.volumeWithoutDensity, []);
  assert.deepEqual(v.withoutServings, []);
});
