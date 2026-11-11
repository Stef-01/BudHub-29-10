// C08 release gate (simulation level): one complete day with two concurrent orders, a save taken
// mid-prep and restored, a dish served to the wrong ticket, and rewards credited exactly once.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceGame, deserializeGame, serializeGame, prepTargetUnits } from '../src/features/nutriserve/simulation/index.ts';
import { game, cmd, advanceUntil, atCounter, buildPerfect } from './nutriserve-helpers.mjs';

const prepMs = (ticket) => Math.round((prepTargetUnits(ticket.order.prepLevel) / 150) * 1000);
const roundTrip = (s) => deserializeGame(serializeGame(s));

function finishAndReady(s, dishId) {
  s = cmd(s, { type: 'placeGarnish', dishId, garnishId: 'coriander', x: 0.2, y: 0.1 });
  return cmd(s, { type: 'finishDish', dishId });
}

test('release gate: concurrent orders, mid-prep save/restore, wrong ticket, one credit', () => {
  let s = advanceUntil(game(2026), atCounter);
  s = cmd(s, { type: 'takeOrder' });
  const t1 = s.tickets[0];
  let a = buildPerfect(s, t1);
  s = cmd(a.s, { type: 'startPrep', dishId: a.dishId, slot: 0 });

  // Second customer arrives while dish A cooks offscreen; take their order too.
  s = cmd(s, { type: 'selectStation', station: 'order' });
  s = advanceUntil(s, atCounter);
  s = cmd(s, { type: 'takeOrder' });
  const t2 = s.tickets[1];
  assert.equal(s.tickets.filter((t) => t.servedAtMs === undefined).length, 2, 'two concurrent open tickets');
  let b = buildPerfect(s, t2);
  s = cmd(b.s, { type: 'startPrep', dishId: b.dishId, slot: 1 });
  assert.equal(s.prepSlots.filter((x) => x.dishId).length, 2, 'two slots cooking at once');

  // Save mid-prep, "reload", and continue from the restored game.
  const before = s.dishes.find((d) => d.id === b.dishId).prep.milliUnits;
  s = roundTrip(s);
  assert.equal(s.dishes.find((d) => d.id === b.dishId).prep.milliUnits, before, 'progress survives the reload');
  s = advanceGame(s, 1_000);
  assert.ok(s.dishes.find((d) => d.id === b.dishId).prep.milliUnits > before, 'and keeps cooking after it');

  // Finish both preps (whatever time is left), finish both dishes.
  const elapsedA = s.nowMs - s.dishes.find((d) => d.id === a.dishId).prep.startedAtMs;
  s = advanceGame(s, Math.max(0, prepMs(t1) - elapsedA));
  s = cmd(s, { type: 'finishPrep', slot: 0 });
  const elapsedB = s.nowMs - s.dishes.find((d) => d.id === b.dishId).prep.startedAtMs;
  s = advanceGame(s, Math.max(0, prepMs(t2) - elapsedB));
  s = cmd(s, { type: 'finishPrep', slot: 1 });
  s = finishAndReady(s, a.dishId);
  s = finishAndReady(s, b.dishId);

  // Serve B to ticket 1 (wrong), then A... A was built for t1, so it goes to t2 (also wrong) unless
  // the orders happen to match; then serve correctly-built dishes to the rest of the day.
  s = cmd(s, { type: 'serve', dishId: b.dishId, ticketId: t1.id });
  const wrong = s.day.results.at(-1);
  assert.equal(wrong.ticketId, t1.id);
  const sameOrder = JSON.stringify({ ...t1.order, finish: [] }) === JSON.stringify({ ...t2.order, finish: [] });
  if (!sameOrder) {
    assert.equal(wrong.mismatchedOrder, true, 'wrong ticket is flagged');
    assert.ok(wrong.scores.build < 100, 'and graded against the ticket it went to');
  }
  // A fresh, correct dish for ticket 2.
  let c = buildPerfect(s, t2);
  s = cmd(c.s, { type: 'startPrep', dishId: c.dishId, slot: 2 });
  s = advanceGame(s, prepMs(t2));
  s = cmd(s, { type: 'finishPrep', slot: 2 });
  s = finishAndReady(s, c.dishId);
  s = cmd(s, { type: 'serve', dishId: c.dishId, ticketId: t2.id });
  s = cmd(s, { type: 'trash', dishId: a.dishId }); // leftover dish A is discarded, never served twice

  // Everyone else today.
  while (!s.day.completed) {
    s = advanceUntil(s, (x) => atCounter(x) || x.day.completed);
    if (s.day.completed) break;
    s = cmd(s, { type: 'takeOrder' });
    const t = s.tickets.at(-1);
    const d = buildPerfect(s, t);
    s = cmd(d.s, { type: 'startPrep', dishId: d.dishId, slot: 3 });
    s = advanceGame(s, prepMs(t));
    s = cmd(s, { type: 'finishPrep', slot: 3 });
    s = finishAndReady(s, d.dishId);
    s = cmd(s, { type: 'serve', dishId: d.dishId, ticketId: t.id });
    s = advanceGame(s, 5_000);
  }

  assert.equal(s.day.completed, true);
  assert.equal(s.day.results.length, s.day.customers.length, 'every customer served exactly once');
  assert.equal(new Set(s.day.results.map((r) => r.ticketId)).size, s.day.results.length);
  const tips = s.day.results.reduce((sum, r) => sum + r.tip, 0);
  assert.equal(s.profile.coins, tips, 'tips credited once');
  // Reload the finished day and advance: still credited once.
  const again = advanceGame(roundTrip(s), 60_000);
  assert.equal(again.profile.coins, tips);
  assert.deepEqual(again.profile.creditedDays, [1]);
});
