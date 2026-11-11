// Finish station: drizzle (hold on the vessel) and garnish (tap to place), then serve.
// Pointer, touch and keyboard all drive the same simulation commands:
//   mouse:    press + drag on the vessel to drizzle; click to place the selected garnish
//   touch/pen: press, keep still for a moment, then drag to drizzle (a finger that moves at once
//             scrolls the page instead); tap to place a garnish (placed on release, and only if the
//             finger barely moved). Only the first finger counts.
//   keyboard: arrows move the cursor (one step per press, then a steady glide while held, the same
//             on every computer whatever its key-repeat settings); hold Space to drizzle; Enter
//             places a garnish.
//   click-only (switch access, a screen reader's default action, voice "click"): a click with no
//             press behind it places the selected garnish at the next evenly spaced spot, or runs
//             an automatic swirl that pours the ordered amount of the selected drizzle (another
//             click stops it early).
// No tool is picked until the player picks one, so a stray touch never drizzles.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DRIZZLES, GARNISHES } from '../../data/finishItems.ts';
import { dishMatchesOrder, drizzleTargetG, FINISH_V1, type Dish, type GameState } from '../../simulation/index.ts';
import { DRIZZLE_COLORS, foodColor, GarnishGlyph, VesselTop } from '../LayoutStudy.tsx';
import { box, clientToLocal } from '../stage.ts';
import { Dockable } from '../Dockable.tsx';
import { HOLD_DELAY_MS, TOUCH_SLOP_PX } from '../HoldButton.tsx';
import { customerName, dishLabel, dishTicket } from '../TicketRail.tsx';
import type { Dispatch } from '../useNutriServeGame.ts';

type Tool = { kind: 'drizzle'; id: string } | { kind: 'garnish'; id: string };

/** Keyboard cursor: one step per key press, then a steady glide after GLIDE_DELAY_MS. */
const KEY_STEP = 0.1;
const KEY_STEP_FAST = 0.25;
const GLIDE_DELAY_MS = 200;
/** Glide speed in local units (vessel radii) per second; Shift doubles it. */
const GLIDE_SPEED = 2.5;
const ARROWS: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
const clampCursor = (v: number) => Math.max(-1.2, Math.min(1.2, v));
/** Click-only garnish spots when no count is known: opposite pairs, each pair turned from the last. */
const PAIR_ANGLES_DEG = [0, 180, 90, 270, 45, 225, 135, 315, 22.5, 202.5, 112.5, 292.5];

interface Press {
  id: number;
  x: number;
  y: number;
  kind: Tool['kind'];
  moved: boolean;
  /** Drizzle: whether the drizzle has begun (touch waits HOLD_DELAY_MS first). */
  started: boolean;
  timer?: number;
  /** The dish on the vessel when the press began; a delayed drizzle only starts on that dish. */
  dishId: string;
}

export function FinishStation({ state, dispatch }: { state: GameState; dispatch: Dispatch }) {
  const working = state.dishes.filter((d) => d.stage === 'prepped' || d.stage === 'finishing');
  const ready = state.dishes.filter((d) => d.stage === 'ready');
  const open = state.tickets.filter((t) => t.servedAtMs === undefined);
  const selectedId = state.selected.dishId;
  const dish = working.find((d) => d.id === selectedId) ?? working[0];
  const readySelected = ready.find((d) => d.id === selectedId) ?? ready[0];
  const rank = state.profile.rank;
  const drizzles = Object.values(DRIZZLES).filter((d) => d.unlockRank <= rank);
  const garnishes = Object.values(GARNISHES).filter((g) => g.unlockRank <= rank);
  const [tool, setTool] = useState<Tool | null>(null);
  const [cursor, setCursorState] = useState({ x: 0, y: 0 });
  const cursorRef = useRef(cursor);
  const setCursor = (p: { x: number; y: number }) => {
    cursorRef.current = p;
    setCursorState(p);
  };
  const vesselEl = useRef<HTMLElement | null>(null);
  const drizzling = state.held?.kind === 'drizzle';
  const lastPressAt = useRef(-Infinity);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [live, setLive] = useState('');
  const auto = useRef<{ frame: number } | null>(null);
  const drizzlingRef = useRef(drizzling);
  drizzlingRef.current = drizzling;
  const press = useRef<Press | null>(null);
  const shownDishId = useRef<string | undefined>(undefined);
  shownDishId.current = dish?.id;
  const forTicket = dishTicket(state, dish);
  const name = (d: Dish) => dishLabel(state, d);

  const local = (e: { clientX: number; clientY: number }) => clientToLocal(vesselEl.current!.getBoundingClientRect(), e.clientX, e.clientY);

  const beginAt = (p: { x: number; y: number }) => {
    if (!dish || !tool) return;
    if (tool.kind === 'drizzle') dispatch({ type: 'beginDrizzle', dishId: dish.id, drizzleId: tool.id, x: p.x, y: p.y });
    else dispatch({ type: 'placeGarnish', dishId: dish.id, garnishId: tool.id, x: p.x, y: p.y });
  };
  // Silent: the hold may already have been released by a station change or layout switch.
  const stop = useCallback(() => dispatch({ type: 'endDrizzle' }, { silent: true }), [dispatch]);
  const clearPress = () => {
    if (press.current?.timer) window.clearTimeout(press.current.timer);
    press.current = null;
  };

  // The vessel element is replaced when the layout switches, so (re)attach the native touch
  // listener through a callback ref. Non-passive, so a started drizzle can keep the page still.
  const blockScroll = useRef((e: TouchEvent) => {
    if (press.current?.started && e.cancelable) e.preventDefault();
  });
  const vesselRef = useCallback((el: HTMLElement | null) => {
    vesselEl.current?.removeEventListener('touchmove', blockScroll.current);
    vesselEl.current = el;
    el?.addEventListener('touchmove', blockScroll.current, { passive: false });
  }, []);

  // Backstop: if the vessel element is replaced mid-hold (layout switch), its pointer capture dies
  // without a lostpointercapture event; a release of the drizzling pointer anywhere still ends it.
  useEffect(() => {
    if (!drizzling) return;
    const end = (e: PointerEvent) => {
      if (!press.current || press.current.id === e.pointerId) {
        clearPress();
        stop();
      }
    };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return () => {
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
  }, [drizzling, stop]);
  // Leaving the station or unmounting never leaves a drizzle running.
  useEffect(
    () => () => {
      clearPress();
      stop();
    },
    [stop],
  );

  // Keyboard glide: held arrow keys move the cursor at a fixed speed, independent of key repeat.
  const held = useRef(new Map<string, number>());
  const fast = useRef(false);
  const glideFrame = useRef(0);
  const glide = useCallback(() => {
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(100, now - last) / 1000;
      last = now;
      let dx = 0;
      let dy = 0;
      for (const [key, since] of held.current) {
        if (now - since < GLIDE_DELAY_MS) continue;
        dx += ARROWS[key][0];
        dy += ARROWS[key][1];
      }
      if (dx || dy) {
        const speed = GLIDE_SPEED * (fast.current ? 2 : 1) * dt;
        const len = Math.hypot(dx, dy);
        const next = { x: clampCursor(cursorRef.current.x + (dx / len) * speed), y: clampCursor(cursorRef.current.y + (dy / len) * speed) };
        setCursor(next);
        if (drizzlingRef.current) dispatch({ type: 'moveDrizzle', x: next.x, y: next.y }, { silent: true });
      }
      glideFrame.current = held.current.size && vesselEl.current?.isConnected ? requestAnimationFrame(frame) : 0;
    };
    if (!glideFrame.current) glideFrame.current = requestAnimationFrame(frame);
  }, [dispatch]);
  // Arrow keys released anywhere (focus moved, Safari clicks that don't move focus) or the window
  // losing focus end the glide; so does the vessel going away (layout switch, Done, station change).
  useEffect(() => {
    const up = (e: KeyboardEvent) => held.current.delete(e.key);
    const lost = () => held.current.clear();
    window.addEventListener('keyup', up);
    window.addEventListener('blur', lost);
    return () => {
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', lost);
      held.current.clear();
      cancelAnimationFrame(glideFrame.current);
      glideFrame.current = 0;
    };
  }, []);
  useEffect(() => {
    if (!dish) held.current.clear();
  }, [dish]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (ARROWS[e.key]) {
      e.preventDefault();
      fast.current = e.shiftKey;
      if (e.repeat) return;
      const step = e.shiftKey ? KEY_STEP_FAST : KEY_STEP;
      const next = { x: clampCursor(cursorRef.current.x + ARROWS[e.key][0] * step), y: clampCursor(cursorRef.current.y + ARROWS[e.key][1] * step) };
      setCursor(next);
      if (drizzling) dispatch({ type: 'moveDrizzle', x: next.x, y: next.y }, { silent: true });
      held.current.set(e.key, performance.now());
      glide();
    } else if (e.key === ' ') {
      e.preventDefault(); // every Space, repeats included, so a held Space never scrolls the page
      if (!e.repeat && tool?.kind === 'drizzle') beginAt(cursorRef.current);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (!e.repeat && tool?.kind === 'garnish') beginAt(cursorRef.current);
    }
  };
  const onKeyUp = (e: React.KeyboardEvent) => {
    if (ARROWS[e.key]) held.current.delete(e.key);
    if (e.key === ' ') {
      e.preventDefault();
      if (drizzling) stop();
    }
  };

  const hint = !tool ? 'Pick a drizzle or garnish below' : undefined;

  // --- Click-only input -------------------------------------------------------------------
  const stopAuto = useCallback(() => {
    if (!auto.current) return;
    cancelAnimationFrame(auto.current.frame);
    auto.current = null;
    stop();
  }, [stop]);
  useEffect(() => stopAuto, [stopAuto]);
  const autoSwirl = (drizzleId: string) => {
    if (!dish) return;
    const label = DRIZZLES[drizzleId]?.label ?? drizzleId;
    const targetG = drizzleTargetG(drizzleId, dish.size) ?? 0;
    const rate = FINISH_V1.drizzleRateMgPerMs[drizzleId] ?? 1;
    // Pour only what is still missing: a second click tops up instead of doubling the drizzle.
    const haveMg = dish.finish.drizzles[drizzleId]?.insideMg ?? 0;
    const missingMg = targetG * 1000 - haveMg;
    if (missingMg < 500) {
      setLive(`${label} is already at its ${targetG} grams.`);
      return;
    }
    const duration = missingMg / rate;
    // Six passes across the vessel (scores 98-100 on spread; five passes left gaps).
    const rows = [-0.75, -0.45, -0.15, 0.15, 0.45, 0.75];
    const points: Array<[number, number]> = [];
    rows.forEach((y, i) => {
      const w = Math.sqrt(1 - y * y) * 0.85;
      points.push(i % 2 ? [w, y] : [-w, y], i % 2 ? [-w, y] : [w, y]);
    });
    const lengths = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
    const total = lengths.reduce((a, b) => a + b, 0);
    const at = (f: number): [number, number] => {
      let d = f * total;
      for (let i = 0; i < lengths.length; i++) {
        if (d <= lengths[i]) {
          const t = d / lengths[i];
          return [points[i][0] + (points[i + 1][0] - points[i][0]) * t, points[i][1] + (points[i + 1][1] - points[i][1]) * t];
        }
        d -= lengths[i];
      }
      return points[points.length - 1];
    };
    const [x0, y0] = at(0);
    const swirlDish = dish.id;
    if (!dispatch({ type: 'beginDrizzle', dishId: swirlDish, drizzleId, x: x0, y: y0 }).ok) return;
    setLive(`Drizzling ${label}. Click again to stop.`);
    const t0 = performance.now();
    const landedG = () => Math.round((stateRef.current.dishes.find((d) => d.id === swirlDish)?.finish.drizzles[drizzleId]?.insideMg ?? 0) / 1000);
    const frame = (now: number) => {
      if (!auto.current) return;
      const f = (now - t0) / duration;
      // Paused, left the station or picked another dish: the drizzle was let go from outside.
      if (!drizzlingRef.current || shownDishId.current !== swirlDish) {
        auto.current = null;
        stop();
        setLive(`${label} stopped at ${landedG()} of ${targetG} grams.`);
        return;
      }
      if (f >= 1) {
        auto.current = null;
        stop();
        setLive(`${label} done: ${landedG()} of ${targetG} grams.`);
        return;
      }
      const [x, y] = at(f);
      setCursor({ x, y });
      dispatch({ type: 'moveDrizzle', x, y }, { silent: true });
      auto.current.frame = requestAnimationFrame(frame);
    };
    auto.current = { frame: requestAnimationFrame(frame) };
  };
  const onClickOnly = (e: React.MouseEvent) => {
    // Mouse, touch and pen clicks follow a press (handled above); only a bare activation counts.
    if (performance.now() - lastPressAt.current < 600) return;
    if (auto.current) {
      stopAuto();
      setLive('Drizzle stopped.');
      return;
    }
    if (!dish || !tool) {
      setLive('Pick a drizzle or garnish first.');
      return;
    }
    if (tool.kind === 'drizzle') {
      autoSwirl(tool.id);
      return;
    }
    // Garnish: the next of the ordered number of evenly spaced spots on a ring, so the pieces end up
    // balanced. The order comes from the dish's ticket, else an open ticket this dish matches; with
    // no order, pieces alternate between opposite spots so the dish stays balanced after every pair.
    // Each garnish type has its own starting angle and ring, so two types never share a spot.
    const placed = dish.finish.garnishes.filter((g) => g.id === tool.id).length;
    const ticketFor = forTicket ?? state.tickets.find((t) => t.servedAtMs === undefined && dishMatchesOrder(dish, t.order));
    const ordered = ticketFor?.order.finish.find((f) => f.kind === 'garnish' && f.id === tool.id);
    const typeIndex = Math.max(0, Object.keys(GARNISHES).indexOf(tool.id));
    const start = -Math.PI / 2 + typeIndex * (Math.PI / 5);
    const radius = typeIndex % 2 ? 0.62 : 0.45;
    let angle: number;
    if (ordered && ordered.kind === 'garnish' && ordered.count > 1) {
      const spots = ordered.count;
      angle = start + (placed % spots) * ((2 * Math.PI) / spots) + Math.floor(placed / spots) * (Math.PI / spots);
    } else {
      // Opposite pairs, each pair turned from the last, so every pair is balanced.
      angle = start + (PAIR_ANGLES_DEG[placed % PAIR_ANGLES_DEG.length] * Math.PI) / 180;
    }
    const p = { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
    const spots = ordered && ordered.kind === 'garnish' ? ordered.count : 0;
    setCursor(p);
    if (dispatch({ type: 'placeGarnish', dishId: dish.id, garnishId: tool.id, x: p.x, y: p.y }).ok) {
      const label = GARNISHES[tool.id]?.label ?? tool.id;
      setLive(`${label} placed: ${placed + 1}${spots ? ` of ${spots}` : ''}.`);
    }
  };

  return (
    <>
      <span className="sr-only" role="status" aria-live="polite">
        {live}
      </span>
      <Dockable slot="main" as="aside" region={box(8, 40, 148, 384)} className="ns-tray ns-tray-column" aria-label="Dishes at the finish counter">
        <span className="ns-tray-label">To finish</span>
        {working.length === 0 && <span className="ns-muted">Prep a dish first</span>}
        {working.map((d) => (
          <button key={d.id} type="button" className="ns-btn" aria-pressed={d.id === dish?.id} onClick={() => dispatch({ type: 'selectDish', dishId: d.id })}>
            {name(d)}
          </button>
        ))}
        <span className="ns-tray-label">Ready</span>
        {ready.length === 0 && <span className="ns-muted">none</span>}
        {ready.map((d) => (
          <button
            key={d.id}
            type="button"
            className="ns-btn"
            aria-pressed={d.id === readySelected?.id}
            onClick={() => dispatch({ type: 'selectDish', dishId: d.id })}
          >
            {name(d)}
          </button>
        ))}
        {readySelected && (
          <div className="ns-serve">
            <span className="ns-tray-label">Serve {name(readySelected)} to</span>
            {open.length === 0 && <span className="ns-muted">no open tickets</span>}
            {open.map((t) => {
              const matches = dishMatchesOrder(readySelected, t.order);
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`ns-btn ${matches ? 'ns-btn-primary' : 'ns-btn-warn'}`}
                  onClick={() => dispatch({ type: 'serve', dishId: readySelected.id, ticketId: t.id })}
                >
                  #{t.number} {customerName(t)}
                  {!matches && <small> (doesn't match)</small>}
                </button>
              );
            })}
          </div>
        )}
      </Dockable>

      {dish ? (
        <>
          <Dockable
            slot="main"
            region={box(164, 44, 268, 268)}
            ref={vesselRef}
            className={`ns-vessel-top${tool ? ` ns-tool-${tool.kind}` : ' ns-tool-none'}`}
            tabIndex={0}
            role="application"
            aria-label={`Finish ${name(dish)}${forTicket ? ` for ${customerName(forTicket)}` : ''}. ${
              hint ? `${hint}. ` : ''
            }Arrow keys move the cursor; hold Space to drizzle, Enter to place a garnish.`}
            onClick={onClickOnly}
            onPointerDown={(e) => {
              lastPressAt.current = performance.now();
              if (e.button !== 0 || !e.isPrimary || press.current || !tool) return;
              const p = local(e);
              setCursor(p);
              const pr: Press = { id: e.pointerId, x: e.clientX, y: e.clientY, kind: tool.kind, moved: false, started: false, dishId: dish.id };
              press.current = pr;
              if (tool.kind !== 'drizzle') return;
              if (e.pointerType === 'mouse') {
                e.currentTarget.setPointerCapture(e.pointerId);
                pr.started = true;
                beginAt(p);
              } else {
                pr.timer = window.setTimeout(() => {
                  if (press.current !== pr) return;
                  if (shownDishId.current !== pr.dishId) {
                    press.current = null; // the dish changed under the finger: do nothing
                    return;
                  }
                  pr.started = true;
                  beginAt(local({ clientX: pr.x, clientY: pr.y }));
                }, HOLD_DELAY_MS);
              }
            }}
            onPointerMove={(e) => {
              const pr = press.current;
              if (!pr || pr.id !== e.pointerId) return;
              if (!pr.started) {
                if (Math.hypot(e.clientX - pr.x, e.clientY - pr.y) > TOUCH_SLOP_PX) {
                  pr.moved = true;
                  // A touch that moves before the drizzle began is a scroll.
                  if (pr.kind === 'drizzle') clearPress();
                }
                return;
              }
              const p = local(e);
              setCursor(p);
              dispatch({ type: 'moveDrizzle', x: p.x, y: p.y }, { silent: true });
            }}
            onPointerUp={(e) => {
              const pr = press.current;
              if (!pr || pr.id !== e.pointerId) return;
              clearPress();
              if (pr.kind === 'garnish' && !pr.moved) beginAt(local({ clientX: pr.x, clientY: pr.y }));
              if (pr.started) stop();
            }}
            onPointerCancel={(e) => {
              const pr = press.current;
              if (!pr || pr.id !== e.pointerId) return;
              clearPress();
              if (pr.started) stop();
            }}
            onLostPointerCapture={(e) => {
              const pr = press.current;
              if (pr && pr.id === e.pointerId && pr.started) {
                clearPress();
                stop();
              }
            }}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            onBlur={() => {
              held.current.clear();
              if (drizzling) stop();
            }}
          >
            <VesselTop
              label="Vessel seen from above"
              baseColor={foodColor(dish.build.base?.foodId)}
              mainColor={foodColor(dish.build.main?.foodId)}
              drizzles={Object.entries(dish.finish.drizzles).map(([id, d]) => ({ color: DRIZZLE_COLORS[id] ?? '#fff', cellsMg: d.cellsMg }))}
              garnishes={dish.finish.garnishes}
              cursor={cursor}
            />
            {hint && (
              <span className="ns-vessel-hint" aria-hidden="true">
                {hint}
              </span>
            )}
          </Dockable>
          <Dockable slot="main" region={box(164, 318, 316, 70)} className="ns-tools" role="toolbar" aria-label="Finish tools">
            {drizzles.map((d) => (
              <button
                key={d.id}
                type="button"
                className="ns-tool"
                aria-pressed={tool?.kind === 'drizzle' && tool.id === d.id}
                onClick={() => setTool({ kind: 'drizzle', id: d.id })}
              >
                <i style={{ background: DRIZZLE_COLORS[d.id] }} aria-hidden="true" />
                {d.label}
              </button>
            ))}
            {garnishes.map((g) => (
              <button
                key={g.id}
                type="button"
                className="ns-tool"
                aria-pressed={tool?.kind === 'garnish' && tool.id === g.id}
                onClick={() => setTool({ kind: 'garnish', id: g.id })}
              >
                <svg viewBox="-12 -12 24 24" aria-hidden="true">
                  <GarnishGlyph id={g.id} />
                </svg>
                {g.label}
              </button>
            ))}
          </Dockable>
          <Dockable slot="main" region={box(164, 392, 316, 40)} className="ns-row ns-actions">
            <button
              type="button"
              className="ns-btn ns-btn-primary"
              disabled={drizzling}
              onClick={(e) => {
                const keyboard = e.detail === 0;
                dispatch({ type: 'finishDish', dishId: dish.id });
                // From the keyboard, Done would now apply to the next dish: move focus off it.
                if (keyboard) (document.querySelector('.ns-tab[aria-pressed="true"]') as HTMLElement | null)?.focus();
              }}
            >
              Done
            </button>
            <button type="button" className="ns-btn ns-btn-quiet" disabled={drizzling} onClick={() => dispatch({ type: 'trash', dishId: dish.id })}>
              Trash
            </button>
            <span className="ns-provisional" title={`Finish grading uses provisional rules (${FINISH_V1.version}) that may change`}>
              provisional grading
            </span>
          </Dockable>
        </>
      ) : (
        <Dockable slot="main" as="p" region={box(164, 160, 316, 60)} className="ns-muted ns-center ns-plate">
          {ready.length > 0 ? 'Serve a ready dish from the list.' : 'Nothing to finish yet.'}
        </Dockable>
      )}
    </>
  );
}
