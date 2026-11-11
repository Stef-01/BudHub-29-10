// Shared helpers for NutriServe simulation tests.
import { advanceGame, applyCommand, createGame } from '../src/features/nutriserve/simulation/index.ts';

export function game(seed = 42, opts = {}) {
  return createGame({ seed, ...opts });
}

/** Apply a command and assert it succeeded. */
export function cmd(state, command) {
  const { state: next, result } = applyCommand(state, command);
  if (!result.ok) throw new Error(`${command.type} failed: ${result.error}`);
  return next;
}

/** Apply a command expecting failure; returns the error text. */
export function reject(state, command) {
  const { state: next, result } = applyCommand(state, command);
  if (result.ok) throw new Error(`${command.type} unexpectedly succeeded`);
  if (next !== state) throw new Error('rejected command changed state');
  return result.error;
}

export const advance = advanceGame;

/** Advance until a predicate holds (or fail after maxMs). */
export function advanceUntil(state, predicate, maxMs = 600_000, step = 100) {
  let s = state;
  for (let t = 0; t <= maxMs; t += step) {
    if (predicate(s)) return s;
    s = advanceGame(s, step);
  }
  throw new Error('advanceUntil: condition never met');
}

export const atCounter = (s) => s.day.customers.some((c) => c.phase === 'at_counter');

/** Hold a pour for exactly `ms` simulated milliseconds. */
export function pour(s, dishId, component, foodId, ms) {
  s = cmd(s, { type: 'beginPour', dishId, component, foodId });
  s = advanceGame(s, ms);
  return cmd(s, { type: 'endPour' });
}

/** Pour each component to its ideal for a ticket (rates: base 80, main 90, side 50 g/s). */
export function buildPerfect(s, ticket, size = ticket.order.size) {
  s = cmd(s, { type: 'startDish', size });
  const dishId = s.dishes[s.dishes.length - 1].id;
  const rates = { base: 80, main: 90, side: 50 };
  for (const [component, foodId] of [['base', ticket.order.baseId], ['main', ticket.order.mainId], ['side', ticket.order.sideId]]) {
    s = pour(s, dishId, component, foodId, Math.round((ticket.order.idealG[component] * 1000) / rates[component]));
  }
  s = cmd(s, { type: 'finishBuild', dishId });
  return { s, dishId };
}
