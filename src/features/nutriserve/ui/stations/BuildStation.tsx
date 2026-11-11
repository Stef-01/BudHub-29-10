// Build station: pick a vessel size, then hold dispensers to portion base, main and side.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CATALOG_FOODS } from '../../data/catalog.generated.ts';
import {
  BUILD_V1,
  meterFraction,
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

function Gauge({ label, actualG, idealG, kind }: { label: string; actualG: number; idealG?: number; kind: 'fill' | 'meter' }) {
  // fill: ratio 0..2 with the ideal at the middle; meter: the reference meter fraction (ideal at 0.5).
  const position = idealG ? (kind === 'fill' ? Math.min(2, actualG / idealG) / 2 : meterFraction(actualG, idealG)) : 0;
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
        <span className="ns-gauge-target" />
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
    () => (dish ? COMPONENTS.map((c) => ({ ...c, foods: dispenserFoods(c, open, dish.id) })) : []),
    // Recompute when the dish or the set of open tickets changes, not every frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dish?.id, open.map((t) => t.id).join(',')],
  );

  // Click-only (latched) pours are announced: started, at the line, past it. A sighted player
  // watches the gauge; a screen-reader user hears when to click again.
  const latch = useRef<{ component: BuildComponent; said: 'start' | 'near' | 'line' | 'over' } | null>(null);
  const pressOnLatched = useRef(false);
  const [live, setLive] = useState('');
  const latchedPour = state.held?.kind === 'pour' ? state.held : undefined;
  const latchedG = dish && latchedPour ? (dish.build[latchedPour.component]?.mg ?? 0) / 1000 : 0;
  const latchedIdeal = ticket && dish && latchedPour && ticket.order.size === dish.size ? ticket.order.idealG[latchedPour.component] : undefined;
  useEffect(() => {
    const l = latch.current;
    if (!l || !latchedPour || latchedPour.component !== l.component || !latchedIdeal) return;
    const label = foodLabel(latchedPour.foodId);
    // A cue at three quarters leaves time to react (pouring runs at 50-90 g a second).
    if (l.said === 'start' && latchedG >= latchedIdeal * 0.75 && latchedG < latchedIdeal) {
      l.said = 'near';
      setLive(`${label} nearly at the line, ${Math.round(latchedG)} of ${latchedIdeal} grams.`);
    } else if ((l.said === 'start' || l.said === 'near') && latchedG >= latchedIdeal) {
      l.said = 'line';
      setLive(`${label} at the line, ${Math.round(latchedG)} grams. Click again to stop.`);
    } else if (l.said === 'line' && latchedG >= latchedIdeal * 1.25) {
      l.said = 'over';
      setLive(`${label} over the line, ${Math.round(latchedG)} grams.`);
    }
  }, [latchedG, latchedIdeal, latchedPour]);

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
  const ideal = ticket?.order.size === dish.size ? ticket.order.idealG : undefined;
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

      <Dockable slot="main" region={box(10, 200, 218, 146)} className="ns-gauges">
        <p className="ns-caption">
          {dish.size} vessel{ticket ? ` for #${ticket.number} ${customerName(ticket)}` : ''}
        </p>
        {COMPONENTS.map((c) => (
          <React.Fragment key={c.id}>
            <Gauge label={c.label} actualG={grams(c.id)} idealG={ideal?.[c.id]} kind={c.id === 'base' ? 'fill' : 'meter'} />
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
                      latch.current = null;
                      dispatch({ type: 'endPour' }, { silent: true });
                    }}
                    onCancel={() => {
                      latch.current = null;
                      if (pressOnLatched.current) {
                        // The press only meant to stop a latched pour: keep what was poured.
                        dispatch({ type: 'endPour' }, { silent: true });
                        return;
                      }
                      dispatch({ type: 'cancelPour' }, { silent: true });
                      setLive(`Pour cancelled: that looked like a scroll.`);
                    }}
                    // A locked dispenser says why (the simulation's own reason, in the status line).
                    onBlocked={() => dispatch({ type: 'beginPour', dishId: dish.id, component: c.id, foodId })}
                    // Click-only input: the first click starts pouring, the next one stops it.
                    onTap={() => {
                      if (held?.component === c.id && held.foodId === foodId) {
                        latch.current = null;
                        dispatch({ type: 'endPour' });
                      } else if (dispatch({ type: 'beginPour', dishId: dish.id, component: c.id, foodId }).ok) {
                        latch.current = { component: c.id, said: 'start' };
                        setLive(
                          ideal
                            ? `Pouring ${foodLabel(foodId)}, line at ${ideal[c.id]} grams. Click again to stop.`
                            : `Pouring ${foodLabel(foodId)}. No fill line: this vessel size isn't the ticket's. Click again to stop.`,
                        );
                      }
                    }}
                  >
                    <i style={{ background: foodColor(foodId) }} aria-hidden="true" />
                    <span className="ns-dispenser-name">{foodLabel(foodId)}</span>
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
        Press and hold to pour; a quick tap adds a little. Clicking once starts pouring and clicking again stops.
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
