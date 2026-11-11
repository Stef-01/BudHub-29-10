// NutriServe Kitchen (remaster preview): the four-station game on a 640x480 stage.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CustomerSprite } from '../assets/CustomerSprite.tsx';
import { dishNutrition, nutritionFeedback } from '../nutrition/nutrition.ts';
import {
  createGame,
  getCatalogCustomer,
  RANK_THRESHOLDS,
  seedFrom,
  UPGRADES,
  type Command,
  type CommandResult,
  type GameState,
  type ServeResult,
} from '../simulation/index.ts';
import { StationBackdrop } from './LayoutStudy.tsx';
import { STATIONS, StationTabs } from './StationTabs.tsx';
import { TicketRail } from './TicketRail.tsx';
import { BuildStation } from './stations/BuildStation.tsx';
import { FinishStation } from './stations/FinishStation.tsx';
import { OrderStation } from './stations/OrderStation.tsx';
import { PrepStation } from './stations/PrepStation.tsx';
import { clearSave, loadSavedGame, recordDayReported, useNutriServeGame, wasDayReported, writeSave } from './useNutriServeGame.ts';
import { boxAuto } from './stage.ts';
import { Dockable, LayoutContext, type DockSlot } from './Dockable.tsx';

/** Below this root width the stage keeps the scene and controls move to the dock. */
const COMPACT_BELOW_PX = 600;
import './remaster.css';

export interface NutriServeRemasterProps {
  userId: string;
  onExit: () => void;
  /** Called once per completed day (guarded by the save's reportedDays). */
  onDayComplete?: (report: { day: number; averageScore: number; coins: number; served: number }) => void;
}

const SCORE_LABELS: Array<[keyof ServeResult['scores'], string]> = [
  ['waiting', 'Waiting'],
  ['build', 'Build'],
  ['prep', 'Prep'],
  ['finish', 'Finish'],
];

const name = (catalogId: string) => getCatalogCustomer(catalogId)?.name ?? catalogId;
const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

/** Start screen: continue a saved day or start a new game. */
export default function NutriServeRemaster(props: NutriServeRemasterProps) {
  const [game, setGame] = useState<GameState | null>(null);
  const saved = useMemo(() => loadSavedGame(props.userId), [props.userId]);

  if (!game) {
    return (
      <div className="ns-root ns-start">
        <div className="ns-start-card">
          <p className="ns-eyebrow">NUTRISERVE KITCHEN · PREVIEW</p>
          <h1>Run the four-station kitchen</h1>
          <p>
            Take orders, build each katori, simmer it in one of four handis, finish it with a drizzle and garnish, then
            serve it to the right ticket. Each station is scored on its own; the nutrition report is separate.
          </p>
          <ul className="ns-start-notes">
            <li>Six-customer pilot cast. Food, stations and reactions use plain layout studies until final art arrives.</li>
            <li>Prep timing and finish grading are provisional house rules and may change.</li>
          </ul>
          <div className="ns-row">
            {saved && (
              <button type="button" className="ns-btn ns-btn-primary" onClick={() => setGame(saved)}>
                Continue day {saved.day.number}
              </button>
            )}
            <button
              type="button"
              className={`ns-btn ${saved ? '' : 'ns-btn-primary'}`}
              onClick={() => {
                if (saved && !window.confirm('Start a new game? Your saved kitchen will be replaced.')) return;
                clearSave(props.userId);
                const now = Date.now();
                setGame(createGame({ seed: seedFrom(`${props.userId}:${now}`), runId: `run-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}` }));
              }}
            >
              New game
            </button>
            <button type="button" className="ns-btn ns-btn-quiet" onClick={props.onExit}>
              Back to games
            </button>
          </div>
        </div>
      </div>
    );
  }
  return <Kitchen {...props} initial={game} />;
}

function Kitchen({ initial, userId, onExit, onDayComplete }: NutriServeRemasterProps & { initial: GameState }) {
  const { state, dispatch, lastError } = useNutriServeGame(initial, userId);
  const [announcement, setAnnouncement] = useState('');
  const previous = useRef(state);

  // Compact layout for narrow screens (see Dockable.tsx).
  const rootRef = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setCompact(entry.contentRect.width < COMPACT_BELOW_PX));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const [slots, setSlots] = useState<Partial<Record<DockSlot, HTMLElement | null>>>({});
  const slotRefs = useMemo(() => {
    const make = (name: DockSlot) => (el: HTMLElement | null) => setSlots((prev) => (prev[name] === el ? prev : { ...prev, [name]: el }));
    return { top: make('top'), toast: make('toast'), main: make('main'), tabs: make('tabs') };
  }, []);
  const layout = useMemo(() => ({ compact, slots }), [compact, slots]);

  // Announce arrivals, overheating, and results for screen-reader users.
  useEffect(() => {
    const prev = previous.current;
    previous.current = state;
    const messages: string[] = [];
    for (const c of state.day.customers) {
      const before = prev.day.customers.find((p) => p.id === c.id);
      if (c.phase === 'at_counter' && before?.phase !== 'at_counter') messages.push(`${name(c.catalogId)} is at the counter.`);
    }
    state.prepSlots.forEach((slot, i) => {
      if (slot.overheated && !prev.prepSlots[i]?.overheated) messages.push(`Prep slot ${i + 1} overheated.`);
    });
    if (state.day.results.length > prev.day.results.length) {
      const r = state.day.results[state.day.results.length - 1];
      messages.push(`Served ${name(r.catalogCustomerId)}: ${r.scores.total} out of 100, ${r.tip} coins tip.`);
    }
    if (messages.length) setAnnouncement(messages.join(' '));
  }, [state]);

  // Report a finished day to the wider app once. The outside ledger (keyed by run id) is the guard;
  // the save's reportedDays mirrors it.
  useEffect(() => {
    const day = state.day.number;
    if (!state.day.completed || !state.profile.creditedDays.includes(day) || state.profile.reportedDays.includes(day)) return;
    if (wasDayReported(userId, state.runId, day)) {
      dispatch({ type: 'markDayReported', day }, { silent: true });
      return;
    }
    recordDayReported(userId, state.runId, day);
    const results = state.day.results;
    onDayComplete?.({
      day,
      averageScore: results.length ? Math.round(results.reduce((a, r) => a + r.scores.total, 0) / results.length) : 0,
      coins: results.reduce((a, r) => a + r.tip, 0),
      served: results.length,
    });
    dispatch({ type: 'markDayReported', day }, { silent: true });
  }, [state, onDayComplete, dispatch, userId]);

  // Keyboard: 1-4 switch stations, P pauses/resumes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, select, [role="application"]') || e.metaKey || e.ctrlKey || e.altKey) return;
      const index = ['1', '2', '3', '4'].indexOf(e.key);
      if (index >= 0) {
        dispatch({ type: 'selectStation', station: STATIONS[index] });
      } else if (e.key === 'p' || e.key === 'P') {
        dispatch({ type: state.paused ? 'resume' : 'pause' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch, state.paused]);

  const station = state.selected.station;
  const openTickets = state.tickets.filter((t) => t.servedAtMs === undefined).length;
  const latest = state.day.results[state.day.results.length - 1];
  const showToast = latest && state.nowMs - latest.servedAtMs < 6_000;
  const nextRank = RANK_THRESHOLDS[state.profile.rank];

  const exit = () => {
    writeSave(userId, state);
    onExit();
  };

  return (
    <LayoutContext.Provider value={layout}>
    <div className={`ns-root${compact ? ' ns-compact' : ''}`} ref={rootRef}>
      <header className="ns-hud">
        <span>
          <b>Day {state.day.number}</b> · {Math.floor(state.nowMs / 60_000)}:{String(Math.floor((state.nowMs % 60_000) / 1000)).padStart(2, '0')}
        </span>
        <span>
          Rank {state.profile.rank}
          {nextRank !== undefined && <small> ({state.profile.points}/{nextRank})</small>}
        </span>
        <span>{state.profile.coins} coins</span>
        <span>{openTickets} open ticket{openTickets === 1 ? '' : 's'}</span>
        <span className="ns-hud-actions">
          <button type="button" className="ns-btn ns-btn-small" onClick={() => dispatch({ type: state.paused ? 'resume' : 'pause' })} aria-keyshortcuts="P">
            {state.paused ? 'Resume' : 'Pause'}
          </button>
          <button type="button" className="ns-btn ns-btn-small ns-btn-quiet" onClick={exit}>
            Save &amp; exit
          </button>
        </span>
      </header>

      <div
        className={`ns-stage ns-station-${station}${compact && (station === 'prep' || station === 'finish') ? ' ns-scene-empty' : ''}`}
        aria-label={`${station} station`}
      >
        <StationBackdrop station={station} />
        <TicketRail state={state} dispatch={dispatch} />
        {station === 'order' && <OrderStation state={state} dispatch={dispatch} />}
        {station === 'build' && <BuildStation state={state} dispatch={dispatch} />}
        {station === 'prep' && <PrepStation state={state} dispatch={dispatch} />}
        {station === 'finish' && <FinishStation state={state} dispatch={dispatch} />}
        <StationTabs state={state} dispatch={dispatch} />
        {showToast && <ServeToast result={latest} />}
        {state.paused && !state.day.completed && <PauseOverlay dispatch={dispatch} onExit={exit} />}
        {state.day.completed && <DaySummary state={state} dispatch={dispatch} onExit={exit} />}
      </div>

      {compact && (
        <div className="ns-dock">
          <div ref={slotRefs.tabs} />
          <div ref={slotRefs.toast} />
          <div ref={slotRefs.top} className="ns-dock-top" />
          <div ref={slotRefs.main} className="ns-dock-main" />
        </div>
      )}

      <p className="ns-status" role="status" aria-live="polite">
        {lastError ?? announcement}
      </p>
      <details className="ns-help">
        <summary>Controls</summary>
        <p>
          <kbd>1</kbd>–<kbd>4</kbd> switch stations · <kbd>P</kbd> pause · hold a dispenser or <kbd>Space</kbd> on it to
          pour · on the finish vessel, arrows move the cursor, hold <kbd>Space</kbd> to drizzle, <kbd>Enter</kbd> places a
          garnish. Everything works by touch too.
        </p>
      </details>
    </div>
    </LayoutContext.Provider>
  );
}

function ServeToast({ result }: { result: ServeResult }) {
  return (
    <Dockable slot="toast" region={boxAuto(110, 54, 370)} className="ns-toast" role="group" aria-label="Last serve">
      <p>
        <b>{name(result.catalogCustomerId)}</b> <span aria-label={`${result.stars} of 5 stars`}>{stars(result.stars)}</span>
      </p>
      <ul>
        {SCORE_LABELS.map(([key, label]) => (
          <li key={key}>
            <small>{label}</small>
            <b>{result.scores[key]}</b>
          </li>
        ))}
      </ul>
      <p>
        Total <b>{result.scores.total}</b> · tip {result.tip} coins
        {result.mismatchedOrder && <em> · not what this ticket ordered</em>}
      </p>
    </Dockable>
  );
}

function PauseOverlay({ dispatch, onExit }: { dispatch: (c: Command) => CommandResult; onExit: () => void }) {
  return (
    <div className="ns-overlay" role="dialog" aria-modal="true" aria-label="Paused">
      <div className="ns-overlay-card">
        <h2>Paused</h2>
        <p className="ns-muted">The kitchen clock is stopped. Nothing cooks while paused.</p>
        <div className="ns-row">
          <button type="button" className="ns-btn ns-btn-primary" autoFocus onClick={() => dispatch({ type: 'resume' })}>
            Resume
          </button>
          <button type="button" className="ns-btn ns-btn-quiet" onClick={onExit}>
            Save &amp; exit
          </button>
        </div>
      </div>
    </div>
  );
}

function DaySummary({ state, dispatch, onExit }: { state: GameState; dispatch: (c: Command) => CommandResult; onExit: () => void }) {
  // Focus the dialog itself (not its last button) so it opens scrolled to the top.
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => cardRef.current?.focus(), []);
  const results = state.day.results;
  const average = results.length ? Math.round(results.reduce((a, r) => a + r.scores.total, 0) / results.length) : 0;
  const tips = results.reduce((a, r) => a + r.tip, 0);
  return (
    <div className="ns-overlay" role="dialog" aria-modal="true" aria-label={`Day ${state.day.number} summary`}>
      <div className="ns-overlay-card ns-summary" ref={cardRef} tabIndex={-1}>
        <h2>Day {state.day.number} done</h2>
        <p>
          Average {average} · {tips} coins in tips · rank {state.profile.rank} ({state.profile.points} points)
        </p>
        <table>
          <thead>
            <tr>
              <th scope="col">Customer</th>
              {SCORE_LABELS.map(([, label]) => (
                <th key={label} scope="col">
                  {label}
                </th>
              ))}
              <th scope="col">Total</th>
              <th scope="col">Tip</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.ticketId}>
                <th scope="row">
                  <span className="ns-thumb">
                    <CustomerSprite customerId={r.catalogCustomerId} className="ns-sprite-img" decorative />
                  </span>
                  {name(r.catalogCustomerId)}
                  {r.mismatchedOrder && <small> (wrong order)</small>}
                </th>
                {SCORE_LABELS.map(([key]) => (
                  <td key={key}>{r.scores[key]}</td>
                ))}
                <td>
                  <b>{r.scores.total}</b>
                </td>
                <td>{r.tip}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <details>
          <summary>Nutrition report (separate from service scores)</summary>
          {results.map((r) => {
            const dish = state.dishes.find((d) => d.id === r.dishId);
            const order = getCatalogCustomer(r.catalogCustomerId)?.order;
            if (!dish || !order) return null;
            const n = dishNutrition(dish);
            const fb = nutritionFeedback(n.totals, order);
            return (
              <section key={r.ticketId} className="ns-nutrition">
                <h3>{name(r.catalogCustomerId)}</h3>
                <p>
                  {Math.round(n.totals.calories_kcal)} kcal · protein {Math.round(n.totals.protein_g)} g · carbs {Math.round(n.totals.carbs_g)} g · fiber{' '}
                  {Math.round(n.totals.fiber_g)} g · fat {Math.round(n.totals.fat_g)} g · sodium {Math.round(n.totals.sodium_mg)} mg
                </p>
                <ul>
                  {fb.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
                {(n.notEaten.spilledDrizzleG > 0 || n.notEaten.fallenGarnishPieces > 0) && (
                  <p className="ns-muted">
                    Not counted: {n.notEaten.spilledDrizzleG.toFixed(1)} g spilled drizzle, {n.notEaten.fallenGarnishPieces} fallen garnish
                  </p>
                )}
              </section>
            );
          })}
          <p className="ns-muted">Game guidance from general meal goals, not medical advice.</p>
        </details>

        <h3>Upgrades</h3>
        <ul className="ns-upgrades">
          {Object.values(UPGRADES).map((u) => {
            const owned = state.profile.upgrades.includes(u.id);
            const locked = state.profile.rank < u.unlockRank;
            return (
              <li key={u.id}>
                <span>
                  <b>{u.label}</b> <small lang="hi">{u.hi}</small>
                  <br />
                  <small>{u.description}</small>
                </span>
                <button
                  type="button"
                  className="ns-btn ns-btn-small"
                  disabled={owned || locked || state.profile.coins < u.cost}
                  onClick={() => dispatch({ type: 'buyUpgrade', upgradeId: u.id })}
                >
                  {owned ? 'Owned' : locked ? `Rank ${u.unlockRank}` : `${u.cost} coins`}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="ns-row">
          <button type="button" className="ns-btn ns-btn-primary" onClick={() => dispatch({ type: 'nextDay' })}>
            Start day {state.day.number + 1}
          </button>
          <button type="button" className="ns-btn ns-btn-quiet" onClick={onExit}>
            Save &amp; exit
          </button>
        </div>
      </div>
    </div>
  );
}
