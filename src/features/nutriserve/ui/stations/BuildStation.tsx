// Build station: pick a vessel size, then hold dispensers to portion base, main and side.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CATALOG_FOODS } from '../../data/catalog.generated.ts';
import {
  BUILD_V1,
  exactBand,
  meterFraction,
  upgradeEffects,
  seedFrom,
  createRng,
  ticketForNewDish,
  type BuildComponent,
  type DishSize,
  type GameState,
  type Ticket,
} from '../../simulation/index.ts';
import { HoldButton } from '../HoldButton.tsx';
import { foodColor, VesselSide } from '../LayoutStudy.tsx';
import { box } from '../stage.ts';
import { Dockable } from '../Dockable.tsx';
import { customerName, dishTicket, foodLabel } from '../TicketRail.tsx';
import type { Dispatch } from '../useNutriServeGame.ts';

const COMPONENTS: Array<{ id: BuildComponent; label: string; categories: string[] }> = [
  { id: 'base', label: 'Base', categories: ['Grains', 'Breads & Breakfast'] },
  { id: 'main', label: 'Main', categories: ['Lentils & Curries', 'Vegetable Dishes', 'Soups, Salads & Sides'] },
  { id: 'side', label: 'Side', categories: ['Soups, Salads & Sides'] },
];
const SIZES: DishSize[] = ['small', 'medium', 'large'];
const DISPENSERS_PER_ROW = 4;

/**
 * Dispenser options: every food an open ticket needs for this component, then same-category
 * distractors chosen deterministically from the dish id, so the choice still takes reading.
 */
function dispenserFoods(component: (typeof COMPONENTS)[number], tickets: Ticket[], dishId: string): string[] {
  const key = `${component.id}Id` as 'baseId' | 'mainId' | 'sideId';
  const needed = [...new Set(tickets.map((t) => t.order[key]))];
  const pool = CATALOG_FOODS.filter((f) => component.categories.includes(f.category) && !f.isTreat && !needed.includes(f.id)).map((f) => f.id);
  const rng = createRng(seedFrom(`${dishId}:${component.id}`));
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const options = [...needed, ...shuffled].slice(0, Math.max(DISPENSERS_PER_ROW, needed.length));
  return [...options].sort((a, b) => foodLabel(a).localeCompare(foodLabel(b)));
}

/**
 * Each dish keeps the dispenser rows it started with, so nothing moves under the player's finger
 * when a ticket arrives or is served, or when they leave the station and come back. Foods a new
 * ticket needs are added at the end of their row; nothing is removed. Keyed by game and dish
 * (dish ids repeat between days and games); only the latest few dishes are kept.
 */
const frozenRows = new Map<string, Record<BuildComponent, string[]>>();
const FROZEN_ROWS_KEPT = 12;

function dishRows(state: GameState, dish: GameState['dishes'][number], open: Ticket[]): Record<BuildComponent, string[]> {
  const key = `${state.runId}:${state.seed}:${state.day.number}:${dish.id}`;
  let rows = frozenRows.get(key);
  if (!rows) {
    rows = Object.fromEntries(COMPONENTS.map((c) => [c.id, dispenserFoods(c, open, dish.id)])) as Record<BuildComponent, string[]>;
    frozenRows.set(key, rows);
    while (frozenRows.size > FROZEN_ROWS_KEPT) frozenRows.delete(frozenRows.keys().next().value as string);
  }
  for (const c of COMPONENTS) {
    const field = `${c.id}Id` as 'baseId' | 'mainId' | 'sideId';
    // The dish's own food stays offered too (a restored save may have started it with other tickets open).
    const wanted = [dish.build[c.id]?.foodId, ...open.map((t) => t.order[field])];
    for (const id of wanted) if (id && !rows[c.id].includes(id)) rows[c.id] = [...rows[c.id], id];
  }
  return rows;
}

function Gauge({ label, food, actualG, idealG, band }: { label: string; food?: string; actualG: number; idealG?: number; band: number }) {
  // The line sits at 1 / meterFullMultiple of the track; the shaded zone around it is the exact band.
  const position = idealG ? meterFraction(actualG, idealG) : 0;
  const line = 1 / BUILD_V1.meterFullMultiple;
  const error = idealG ? actualG - idealG : undefined;
  return (
    <div className="ns-gauge">
      <span className="ns-gauge-label">
        {label} <b>{Math.round(actualG)} g</b>
        {idealG !== undefined && <small> / {idealG} g</small>}
        {error !== undefined && Math.abs(error) >= 1 && (
          <small className={error > 0 ? 'ns-over' : 'ns-under'}>
            {' '}
            {error > 0 ? '+' : ''}
            {Math.round(error)}
          </small>
        )}
        {/* On a phone: the food the ticket wants, so the gauges read on their own when the ticket is
            scrolled away (last, so a long name is the part that gets cut short). */}
        {food && <span className="ns-gauge-food"> · {food}</span>}
      </span>
      <span
        className="ns-gauge-track"
        role="meter"
        aria-label={`${label} portion`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position * 100)}
        aria-valuetext={idealG ? `${Math.round(actualG)} of ${idealG} grams` : `${Math.round(actualG)} grams`}
      >
        {idealG !== undefined && (
          <span className="ns-gauge-band" style={{ left: `${(1 - band) * line * 100}%`, width: `${2 * band * line * 100}%` }} />
        )}
        {idealG !== undefined && <span className="ns-gauge-target" style={{ left: `${line * 100}%` }} />}
        <span className="ns-gauge-needle" style={{ left: `${position * 100}%` }} />
      </span>
    </div>
  );
}

export function BuildStation({ state, dispatch }: { state: GameState; dispatch: Dispatch }) {
  const dish = state.dishes.find((d) => d.stage === 'building');
  const open = state.tickets.filter((t) => t.servedAtMs === undefined);
  // The dish on the counter is guided by the ticket it was started for; before that, by the
  // selected (or oldest) open ticket, which is the one startDish will record.
  const ticket = dish ? dishTicket(state, dish) : ticketForNewDish(state);
  const options = useMemo(
    () => {
      if (!dish) return [];
      const rows = dishRows(state, dish, open);
      return COMPONENTS.map((c) => ({ ...c, foods: rows[c.id] }));
    },
    // Recompute when the dish, its foods or the set of open tickets changes, not every frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dish?.id, state.runId, state.seed, state.day.number, open.map((t) => t.id).join(','), COMPONENTS.map((c) => dish?.build[c.id]?.foodId).join(',')],
  );

  // Click-only (latched) pours are announced: started, at the line, past it. A sighted player
  // watches the gauge; a screen-reader user hears when to click again.
  // Click-only (latched) pours with a fill line stop at it by themselves (stopAtMg): a spoken cue
  // can't arrive in time at 50-90 g a second. They are announced when they start and stop; without a
  // line (the vessel size isn't the ticket's) they run until clicked again.
  const latch = useRef<{ component: BuildComponent; foodId: string } | null>(null);
  const pressOnLatched = useRef(false);
  const [live, setLive] = useState('');
  const latchedPour = state.held?.kind === 'pour' ? state.held : undefined;
  useEffect(() => {
    const l = latch.current;
    if (!l || latchedPour || !dish) return;
    // The latched pour has ended (at its line, or by a click).
    latch.current = null;
    setLive(`${foodLabel(l.foodId)}: ${Math.round((dish.build[l.component]?.mg ?? 0) / 1000)} grams.`);
  }, [latchedPour, dish]);
  // A locked dispenser's reason, shown beside the dispensers for a few seconds.
  const [blocked, setBlocked] = useState<{ component: BuildComponent; text: string } | null>(null);
  useEffect(() => {
    if (!blocked) return;
    const id = window.setTimeout(() => setBlocked(null), 3_500);
    return () => window.clearTimeout(id);
  }, [blocked]);

  if (!dish) {
    return (
      <Dockable slot="main" as="section" region={box(90, 90, 330, 220)} className="ns-panel" aria-label="Start a dish">
        <h2>Start a dish</h2>
        <p className="ns-muted">{ticket ? `Ticket #${ticket.number} wants a ${ticket.order.size} vessel.` : 'Take an order first, or build ahead.'}</p>
        <div className="ns-row">
          {SIZES.map((size) => (
            <button
              key={size}
              type="button"
              className={`ns-btn ns-size ns-size-${size}${ticket?.order.size === size ? ' ns-btn-suggested' : ''}`}
              onClick={() => dispatch({ type: 'startDish', size })}
            >
              {size[0].toUpperCase() + size.slice(1)}
            </button>
          ))}
        </div>
      </Dockable>
    );
  }

  const held = state.held?.kind === 'pour' ? state.held : undefined;
  const grams = (c: BuildComponent) => (dish.build[c]?.mg ?? 0) / 1000;
  /** A component holding no more than one minimum press can still be switched (build-v4). */
  const locked = (c: BuildComponent) => (dish.build[c]?.mg ?? 0) > BUILD_V1.pourRateMgPerMs[c] * BUILD_V1.minPressMs;
  // The ticket's lines, even in the wrong vessel size: grading measures against them either way
  // (the wrong size costs points of its own), so portioning is never blind.
  const ideal = ticket?.order.idealG;
  const wrongSize = !!ticket && ticket.order.size !== dish.size;
  const effects = upgradeEffects(state.profile.upgrades);
  const capacity = ideal ? (ideal.base + ideal.main + ideal.side) * 1.5 : 600;

  return (
    <>
      <div className="ns-vessel-side" style={box(16, 44, 196, 150)}>
        <VesselSide
          label={`${dish.size} vessel: ${COMPONENTS.map((c) => `${c.label} ${Math.round(grams(c.id))} grams`).join(', ')}`}
          layers={COMPONENTS.map((c) => ({ color: foodColor(dish.build[c.id]?.foodId), fraction: grams(c.id) / capacity }))}
          fillLine={ideal ? ideal.base / capacity : undefined}
        />
      </div>

      <Dockable slot="aside" region={box(10, 200, 218, 146)} className="ns-gauges">
        <p className="ns-caption">
          {dish.size[0].toUpperCase() + dish.size.slice(1)} vessel{ticket ? ` for #${ticket.number} ${customerName(ticket)}` : ''}
          {wrongSize && ticket && <b className="ns-size-warning"> · ticket wants {ticket.order.size} (−{BUILD_V1.wrongVesselPenalty})</b>}
        </p>
        {COMPONENTS.map((c) => (
          <React.Fragment key={c.id}>
            <Gauge
              label={c.label}
              food={ticket ? foodLabel(c.id === 'base' ? ticket.order.baseId : c.id === 'main' ? ticket.order.mainId : ticket.order.sideId) : undefined}
              actualG={grams(c.id)}
              idealG={ideal?.[c.id]}
              band={exactBand(c.id, effects, ideal?.[c.id])}
            />
          </React.Fragment>
        ))}
        {!ideal && ticket && <p className="ns-muted">Size differs from ticket #{ticket.number}</p>}
        {!ticket && <p className="ns-muted">Built ahead: serve it to any ticket</p>}
      </Dockable>

      <Dockable slot="main" region={box(234, 40, 246, 312)} className="ns-dispensers">
        {options.map((c) => {
          const chosen = dish.build[c.id]?.foodId;
          return (
            <fieldset key={c.id} className="ns-dispenser-row">
              {blocked?.component === c.id && (
                <p className="ns-blocked-msg">
                  {blocked.text}
                </p>
              )}
              <legend>
                {c.label}{' '}
                <small>
                  hold to {c.id === 'base' ? 'fill' : 'ladle'} · {BUILD_V1.pourRateMgPerMs[c.id]} g/s · tap{' '}
                  {(BUILD_V1.pourRateMgPerMs[c.id] * BUILD_V1.minPressMs) / 1000} g
                </small>
              </legend>
              {c.foods.map((foodId) => (
                <React.Fragment key={foodId}>
                  <HoldButton
                    title={foodLabel(foodId)}
                    className="ns-dispenser"
                    disabled={(!!chosen && chosen !== foodId && locked(c.id)) || (!!held && !(held.component === c.id && held.foodId === foodId))}
                    active={held?.component === c.id && held.foodId === foodId}
                    aria-label={`Hold to add ${foodLabel(foodId)} as ${c.label.toLowerCase()}`}
                    aria-describedby="ns-hold-hint"
                    onStart={() => {
                      // Pressing a dispenser that is already pouring (latched by a click) just stops it on release.
                      pressOnLatched.current = held?.component === c.id && held.foodId === foodId;
                      if (pressOnLatched.current) return;
                      dispatch({ type: 'beginPour', dishId: dish.id, component: c.id, foodId });
                    }}
                    // Silent: leaving the station mid-hold already released the pour.
                    onEnd={() => {
                      // A press that stopped a latched pour keeps the latch, so the grams are announced.
                      if (!pressOnLatched.current) latch.current = null;
                      dispatch({ type: 'endPour' }, { silent: true });
                    }}
                    onCancel={() => {
                      if (pressOnLatched.current) {
                        // The press only meant to stop a latched pour: keep what was poured (announced).
                        dispatch({ type: 'endPour' }, { silent: true });
                        return;
                      }
                      latch.current = null;
                      dispatch({ type: 'cancelPour' }, { silent: true });
                      setLive(`Pour cancelled: that looked like a scroll.`);
                    }}
                    // A locked dispenser says why, beside the dispensers.
                    // Says why this dispenser is locked; works the reason out without touching the game.
                    onBlocked={() => {
                      let text: string | undefined;
                      // Key words first: the notice is one line and its end may be cut off on a phone.
                      if (held && !(held.component === c.id && held.foodId === foodId)) text = `Stop ${foodLabel(held.foodId)} first: still pouring`;
                      else if (chosen && chosen !== foodId && locked(c.id)) text = `Locked to ${foodLabel(chosen)}: trash the dish to change ${c.label.toLowerCase()}`;
                      if (!text) return;
                      setBlocked({ component: c.id, text });
                      setLive(text);
                    }}
                    // Click-only input: the first click starts pouring, the next one stops it.
                    onTap={() => {
                      if (held?.component === c.id && held.foodId === foodId) {
                        // Stopping by click: the effect above announces the grams once it has stopped.
                        dispatch({ type: 'endPour' });
                        return;
                      }
                      const haveG = (dish.build[c.id]?.foodId === foodId ? (dish.build[c.id]?.mg ?? 0) : 0) / 1000;
                      if (ideal && haveG >= ideal[c.id]) {
                        const text = `At the line: ${Math.round(haveG)} of ${ideal[c.id]} g ${foodLabel(foodId)}`;
                        setLive(`${text}.`);
                        setBlocked({ component: c.id, text }); // visible too, for sighted switch and voice users
                        return;
                      }
                      if (
                        dispatch({
                          type: 'beginPour',
                          dishId: dish.id,
                          component: c.id,
                          foodId,
                          ...(ideal ? { stopAtMg: Math.round(ideal[c.id] * 1000) } : {}),
                        }).ok
                      ) {
                        latch.current = { component: c.id, foodId };
                        setLive(
                          ideal
                            ? `Pouring ${foodLabel(foodId)} to the line at ${ideal[c.id]} grams; it stops by itself.`
                            : `Pouring ${foodLabel(foodId)}. No fill line: no ticket for this dish. Click again to stop.`,
                        );
                      }
                    }}
                  >
                    <i style={{ background: foodColor(foodId) }} aria-hidden="true" />
                    <span className="ns-dispenser-name">{foodLabel(foodId)}</span>
                    {/* The live portion on the dispenser being poured, so it is in view wherever the gauges are. */}
                    {held?.component === c.id && held.foodId === foodId && (
                      <span className="ns-dispenser-live" aria-hidden="true">
                        {Math.round(grams(c.id))}
                        {ideal ? `/${ideal[c.id]}` : ''} g
                      </span>
                    )}
                  </HoldButton>
                </React.Fragment>
              ))}
            </fieldset>
          );
        })}
      </Dockable>

      <span className="sr-only" role="status" aria-live="polite">
        {live}
      </span>
      <span id="ns-hold-hint" className="sr-only">
        Press and hold to pour; a quick tap adds a little. With switch, voice or screen-reader activation, one activation pours to the fill line and stops by
        itself (activate again to stop sooner).
      </span>
      <Dockable slot="main" region={box(12, 362, 468, 48)} className="ns-row ns-actions">
        <button type="button" className="ns-btn ns-btn-primary" disabled={!!held} onClick={() => dispatch({ type: 'finishBuild', dishId: dish.id })}>
          Send to prep →
        </button>
        <button type="button" className="ns-btn ns-btn-quiet" disabled={!!held} onClick={() => dispatch({ type: 'trash', dishId: dish.id })}>
          Trash
        </button>
      </Dockable>
    </>
  );
}
