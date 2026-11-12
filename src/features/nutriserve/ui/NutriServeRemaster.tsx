// NutriServe Kitchen (remaster preview): the four-station game on a 640x480 stage.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CustomerSprite } from '../assets/CustomerSprite.tsx';
import { serviceNutritionReport } from '../nutrition/nutrition.ts';
import {
  AGGREGATION_V2,
  createGame,
  getCatalogCustomer,
  RANK_THRESHOLDS,
  RULE_CHANGES,
  seedFrom,
  UPGRADES,
  type GameState,
  type Profile,
  type ServeResult,
} from '../simulation/index.ts';
import { StationBackdrop } from './LayoutStudy.tsx';
import { revealPrepDone, slotsAtMark, STATIONS, StationTabs } from './StationTabs.tsx';
import { TicketRail } from './TicketRail.tsx';
import { BuildStation } from './stations/BuildStation.tsx';
import { FinishStation } from './stations/FinishStation.tsx';
import { OrderStation } from './stations/OrderStation.tsx';
import { PrepStation } from './stations/PrepStation.tsx';
import {
  clearSave,
  readSavedGame,
  recordDayReported,
  requestHandoff,
  saveKey,
  storageWorks,
  useNutriServeGame,
  wasDayReported,
  type Dispatch,
} from './useNutriServeGame.ts';
import { LayoutContext, type DockSlot } from './Dockable.tsx';

/**
 * Compact layout: the stage keeps the scene and controls move to a full-size dock. Used when:
 * - the kitchen is narrower than 700 px (below that, stage text drops under about 9 px and
 *   dispensers under 24 px tall);
 * - the window is shorter than 640 px (the 720 px minimum stage plus the bars no longer fits, so
 *   the station tabs would be below the fold);
 * - a touch-first screen's window is narrower than 1100 px (stage targets there are about 26 px).
 * Leaving needs 720 px wide, 680 px tall and 1120 px for touch, so a scrollbar or toolbar
 * appearing near an edge can't flip it back and forth.
 */
const COMPACT_ENTER = { width: 700, height: 640 };
const COMPACT_LEAVE = { width: 720, height: 680 };
const COMPACT_TOUCH = { enter: 1100, leave: 1120 };
function nextCompact(was: boolean, kitchenWidth: number, windowWidth: number, windowHeight: number, coarse: boolean): boolean {
  if (was) {
    return !(kitchenWidth >= COMPACT_LEAVE.width && windowHeight >= COMPACT_LEAVE.height && (!coarse || windowWidth >= COMPACT_TOUCH.leave));
  }
  return kitchenWidth < COMPACT_ENTER.width || windowHeight < COMPACT_ENTER.height || (coarse && windowWidth < COMPACT_TOUCH.enter);
}
/** A landscape window this wide (phones held sideways, tablets, short desktops) in the compact layout puts the scene and the controls side by side. */
const SIDE_DOCK_MIN_WIDTH = 560;
/** How long a status message stays in the live line. */
const STATUS_MS = 6_000;
/** Recent messages kept in the status region (all but the newest are visually hidden). */
const STATUS_KEPT = 3;
/** How long after the kitchen opens its prep cue may first speak (see cueReady). */
const CUE_READY_MS = 600;
import './remaster.css';

export interface NutriServeRemasterProps {
  userId: string;
  onExit: () => void;
  /** Called once per completed day (guarded by the save's reportedDays). */
  onDayComplete?: (report: { day: number; averageScore: number; coins: number; served: number; xpTier: 'Low' | 'Medium' | 'High' | null }) => void;
}

const SCORE_LABELS: Array<[keyof ServeResult['scores'], string]> = [
  ['waiting', 'Waiting'],
  ['build', 'Build'],
  ['prep', 'Prep'],
  ['finish', 'Finish'],
];

const name = (catalogId: string) => getCatalogCustomer(catalogId)?.name ?? catalogId;
const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

const newRunId = () => `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** Plain-language reason for a save that could not be restored (the technical reason goes in a disclosure). */
function describeSaveProblem(reason: string): string {
  if (/paramVersions/.test(reason)) return 'The kitchen rules were updated since this day was saved, so the day itself cannot continue.';
  if (/version/i.test(reason)) return 'This save was made by a different version of the game.';
  return 'The saved day could not be restored. It may be damaged, or from a different version of the game.';
}

/**
 * XP for the wider app scales with how well the day went; a day of empty katoris earns none.
 * (BudHub XP tiers are task priorities.)
 */
export function xpTierForDay(averageScore: number): 'Low' | 'Medium' | 'High' | null {
  if (averageScore >= 75) return 'High';
  if (averageScore >= 50) return 'Medium';
  if (averageScore >= 25) return 'Low';
  return null;
}

/** Start screen: continue a saved day or start a new game. */
export default function NutriServeRemaster(props: NutriServeRemasterProps) {
  const [game, setGame] = useState<GameState | null>(null);
  // Bumped on every new game so the kitchen remounts with fresh state.
  const [session, setSession] = useState(0);
  // Re-read when another tab changes the save, so the start screen never offers a stale day.
  const [storageSeq, setStorageSeq] = useState(0);
  const stored = useMemo(() => readSavedGame(props.userId), [props.userId, session, storageSeq]);
  const saved = stored.state;
  const problem = stored.problem;
  const canSave = useMemo(() => storageWorks(), [session, storageSeq]);
  // While another open tab hands the save over (at most a moment), the buttons wait. Each button
  // then acts on the save as it is AFTER the handover (`latest`), never on what this screen showed
  // before it: the other tab may have played on, bought something or finished the day meanwhile.
  const [handing, setHanding] = useState(false);
  const afterHandoff = (then: (latest: ReturnType<typeof readSavedGame>) => void) => {
    if (handing) return;
    setHanding(true);
    requestHandoff(props.userId).then((handed) => {
      setHanding(false);
      then(readSavedGame(props.userId, handed));
    });
  };
  /** Show the start screen again for the save as it now is (it changed during the handover). */
  const refresh = () => setStorageSeq((n) => n + 1);
  useEffect(() => {
    if (game) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === saveKey(props.userId)) setStorageSeq((n) => n + 1);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [game, props.userId]);

  const begin = useCallback(
    (profile?: Profile, runId?: string) => {
      const now = Date.now();
      setGame(createGame({ seed: seedFrom(`${props.userId}:${now}`), profile, runId: runId ?? newRunId() }));
      setSession((n) => n + 1);
    },
    [props.userId],
  );

  if (game) {
    return (
      <React.Fragment key={session}>
        <Kitchen {...props} initial={game} onRestart={(profile, runId) => begin(profile, runId)} />
      </React.Fragment>
    );
  }
  return (
    <div className="ns-root ns-start">
      <div className="ns-start-card">
        <p className="ns-eyebrow">NUTRISERVE KITCHEN · PREVIEW</p>
        <h1>Run the four-station kitchen</h1>
        <p>
          Take orders, build each katori, simmer it in one of four handis, finish it with a drizzle and garnish, then serve it to the right ticket. Each station
          is scored on its own; the nutrition report is separate.
        </p>
        <ul className="ns-start-notes">
          <li>Six-customer pilot cast. Food, stations and reactions use plain layout studies until final art arrives.</li>
          <li>Waiting, prep timing, finish grading and how the four scores add up are provisional house rules and may change.</li>
        </ul>
        {!canSave && (
          <p className="ns-save-problem" role="alert">
            <b>This browser isn't letting the game save</b> (site storage is blocked or full). You can still play, but nothing is kept once you leave.
          </p>
        )}
        {problem && (
          <div className="ns-save-problem" role="alert">
            <p>
              <b>{describeSaveProblem(problem.reason)}</b>
            </p>
            <details>
              <summary>Technical details</summary>
              <p>
                <small>{problem.reason}</small>
              </p>
            </details>
            {/paramVersions/.test(problem.reason) && (
              <>
                <p>What changed:</p>
                <ul className="ns-rule-changes">
                  {RULE_CHANGES.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </>
            )}
            {problem.droppedUpgrades?.length ? (
              <p>
                Retired upgrades not carried over: {problem.droppedUpgrades.join(', ')}.
                {problem.refundedCoins ? ` Their ${problem.refundedCoins} coins are refunded.` : ''}
              </p>
            ) : null}
            {problem.profile ? (
              <p>
                Your progress is safe: rank {problem.profile.rank}, {problem.profile.coins} coins
                {problem.profile.upgrades.length ? `, ${problem.profile.upgrades.length} upgrade${problem.profile.upgrades.length === 1 ? '' : 's'}` : ''}.
                Start a fresh day with it below.
              </p>
            ) : (
              <p>No progress could be read from it.</p>
            )}
          </div>
        )}
        {saved && stored.notes.length > 0 && (
          <ul className="ns-save-notes">
            {stored.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}
        <div className="ns-row">
          {saved && (
            // The save is read after any other open tab has handed over its latest state.
            <button
              type="button"
              className="ns-btn ns-btn-primary"
              disabled={handing}
              onClick={() =>
                afterHandoff((latest) => {
                  if (latest.state) setGame(latest.state);
                  else refresh();
                })
              }
            >
              Continue day {saved.day.number}
            </button>
          )}
          {problem?.profile && (
            <button
              type="button"
              className="ns-btn ns-btn-primary"
              disabled={handing}
              onClick={() =>
                afterHandoff((latest) => {
                  if (latest.problem?.profile) begin(latest.problem.profile, latest.problem.runId);
                  else refresh();
                })
              }
            >
              Start a new day with your progress
            </button>
          )}
          <button
            type="button"
            className={`ns-btn ${saved || problem?.profile ? '' : 'ns-btn-primary'}`}
            disabled={handing}
            onClick={() => {
              if (stored.exists && !window.confirm('Start a new game from rank 1? Your saved kitchen, coins and upgrades will be replaced.')) return;
              afterHandoff(() => {
                clearSave(props.userId);
                begin();
              });
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

function Kitchen({
  initial,
  userId,
  onExit,
  onDayComplete,
  onRestart,
}: NutriServeRemasterProps & { initial: GameState; onRestart: (profile: Profile, runId: string) => void }) {
  const { state, dispatch, lastError, fatal, superseded, takeOver, saveNow, saveFailed } = useNutriServeGame(initial, userId);
  // One live status line showing the latest announcement or rejected command, cleared STATUS_MS
  // after the last one. Each message is its own node and the last few stay (visually hidden), so a
  // screen reader reads every message once even when the next arrives before it has finished, and
  // an identical repeat (a second overheat) is a new node that is read again.
  const [status, setStatus] = useState<{ messages: Array<{ text: string; id: number }>; seq: number }>({ messages: [], seq: 0 });
  const say = useCallback(
    (text: string) => setStatus((s) => ({ messages: [...s.messages, { text, id: s.seq + 1 }].slice(-STATUS_KEPT), seq: s.seq + 1 })),
    []
  );
  useEffect(() => {
    if (!status.messages.length) return;
    const id = window.setTimeout(() => setStatus((s) => (s.seq === status.seq ? { ...s, messages: [] } : s)), STATUS_MS);
    return () => window.clearTimeout(id);
  }, [status]);
  // Prep cues have a region of their own: a handi at its mark overcooks in seconds, so its cue must
  // never be replaced by an arrival or a serve before it is read. It names every handi at its mark.
  const [cue, setCue] = useState<{ text: string; id: number }>({ text: '', id: 0 });
  // The cue's live region is in the page from the start, but its first words wait CUE_READY_MS:
  // text that lands a few milliseconds after a live region appears is often not read (a restored
  // game's handis already at their mark). A restored game arrives paused, so nothing overcooks meanwhile.
  const [cueReady, setCueReady] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setCueReady(true), CUE_READY_MS);
    return () => window.clearTimeout(id);
  }, []);
  useEffect(() => {
    // Every rejection since the last render (two in one event are both announced).
    if (lastError) for (const message of lastError.messages.length ? lastError.messages : [lastError.message]) say(message);
  }, [lastError, say]);
  const previous = useRef(state);
  // The at-mark slots the cue last described ('' = none yet, so handis already at their mark in a
  // restored game are announced too).
  const cueKey = useRef('');

  // Compact layout for narrow screens (see Dockable.tsx).
  const rootRef = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);
  const [sideDock, setSideDock] = useState(false);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let width = el.clientWidth;
    const coarse = () => window.matchMedia?.('(pointer: coarse)').matches ?? false;
    const update = () => {
      // The current content width (as the ResizeObserver reports it), not a cached value: diagonal
      // resizes flapped. clientWidth includes the root's padding, so take it off.
      const cs = getComputedStyle(el);
      width = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      setCompact((was) => nextCompact(was, width, window.innerWidth, window.innerHeight, coarse()));
      setSideDock(window.innerWidth >= SIDE_DOCK_MIN_WIDTH && window.innerWidth > window.innerHeight);
    };
    const observer = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width;
      update();
    });
    observer.observe(el);
    window.addEventListener('resize', update);
    // A 2-in-1 that switches between touch and mouse without resizing.
    const pointerQuery = window.matchMedia?.('(pointer: coarse)');
    pointerQuery?.addEventListener?.('change', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
      pointerQuery?.removeEventListener?.('change', update);
    };
  }, []);
  // Switching layout remounts every control (portal vs stage), which kills pointer capture without
  // a release event. Let go of anything held so nothing keeps pouring with nobody pressing.
  const layoutMounted = useRef(false);
  useEffect(() => {
    if (!layoutMounted.current) {
      layoutMounted.current = true;
      return;
    }
    dispatch({ type: 'releaseHolds' }, { silent: true });
  }, [compact, dispatch]);
  const [slots, setSlots] = useState<Partial<Record<DockSlot, HTMLElement | null>>>({});
  const slotRefs = useMemo(() => {
    const make = (name: DockSlot) => (el: HTMLElement | null) => setSlots((prev) => (prev[name] === el ? prev : { ...prev, [name]: el }));
    return { top: make('top'), aside: make('aside'), main: make('main'), tabs: make('tabs') };
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
    // Handis at their mark are announced wherever the player is (they overcook fast after). The cue
    // always describes the current set: it changes when a handi reaches its mark or is taken out,
    // and a restored game's handis already at their mark are announced on arrival.
    const nowAtMark = slotsAtMark(state);
    const key = nowAtMark.join(',');
    if (key !== cueKey.current) {
      const before = new Set(cueKey.current ? cueKey.current.split(',').map(Number) : []);
      cueKey.current = key;
      if (nowAtMark.length === 0) setCue((c) => ({ text: '', id: c.id }));
      else {
        // Newest first, then any still waiting.
        const order = [...nowAtMark.filter((i) => !before.has(i)), ...nowAtMark.filter((i) => before.has(i))].map((i) => i + 1);
        const text =
          order.length === 1
            ? `Prep slot ${order[0]} is at its mark: take it out.`
            : `Prep slots ${order.slice(0, -1).join(', ')} and ${order.at(-1)} are at their mark: take them out.`;
        setCue((c) => ({ text, id: c.id + 1 }));
      }
    }
    if (state.day.results.length > prev.day.results.length) {
      const r = state.day.results[state.day.results.length - 1];
      messages.push(`Served ${name(r.catalogCustomerId)}: ${r.scores.total} out of 100, ${r.tip} coins tip.`);
    }
    if (messages.length) say(messages.join(' '));
  }, [state, say]);

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
    const averageScore = results.length ? Math.round(results.reduce((a, r) => a + r.scores.total, 0) / results.length) : 0;
    onDayComplete?.({
      day,
      averageScore,
      coins: results.reduce((a, r) => a + r.tip, 0),
      served: results.length,
      xpTier: xpTierForDay(averageScore),
    });
    dispatch({ type: 'markDayReported', day }, { silent: true });
  }, [state, onDayComplete, dispatch, userId]);

  // A dialog (pause, day summary, error) is open: everything behind it is inert.
  const pausedDialog = state.paused && !state.day.completed && !superseded;
  const modalOpen = pausedDialog || state.day.completed || !!fatal || superseded;

  const latestState = useRef(state);
  latestState.current = state;

  // Keyboard: 1-4 switch stations, P pauses/resumes, Escape resumes from the pause dialog.
  // Shortcuts never act behind an open dialog, and holding a key never repeats them.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const isP = e.key === 'p' || e.key === 'P';
      if (modalOpen) {
        if (pausedDialog && !fatal && (isP || e.key === 'Escape')) {
          e.preventDefault();
          dispatch({ type: 'resume' });
        }
        return;
      }
      const target = e.target as HTMLElement;
      // The finish vessel (role=application) uses arrows, Space and Enter only, so P and 1-4 work there too.
      if (target.closest('input, textarea, select')) return;
      const index = ['1', '2', '3', '4'].indexOf(e.key);
      if (index >= 0) {
        // Only coming to Prep from another station scrolls (not pressing 3 again while there).
        const from = latestState.current.selected.station;
        dispatch({ type: 'selectStation', station: STATIONS[index] });
        if (STATIONS[index] === 'prep' && from !== 'prep') revealPrepDone(latestState.current);
      }
      else if (isP) dispatch({ type: 'pause' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch, modalOpen, pausedDialog, fatal]);

  // Focus: remember the last control used outside a dialog and go back to it when the dialog
  // closes (or to the Pause button if that control is gone).
  const lastFocus = useRef<HTMLElement | null>(null);
  const pauseButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    // Every kitchen control, docked or on the stage, is inside the root.
    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      // Focus placed by recovery isn't the player's choice: closing a dialog returns to their control.
      if (!target.closest('.ns-overlay') && !recovering.current) lastFocus.current = target;
    };
    el.addEventListener('focusin', onFocusIn);
    return () => el.removeEventListener('focusin', onFocusIn);
  }, []);
  // When the focused control goes away (Take order, Send to prep, Done, Serve all remove their
  // button), focus moves to the next sensible control instead of dropping to the page.
  const modalRef = useRef(modalOpen);
  modalRef.current = modalOpen;
  // Keyboard (and screen-reader) users only; moving focus after a tap would scroll the page.
  // - Holding Enter or Space never repeats a button's action (browsers click again on each repeat).
  // - When the focused control goes away (Take order, Send to prep, a prep slot's Done, Serve),
  //   focus moves to a neutral control: the suggested vessel size, else the current station tab.
  //   Never to Done or Serve, which would then act on a different dish.
  const keyboardUser = useRef(false);
  const recovering = useRef(false);
  // Set during the render in which a dialog closes, cleared once its focus restore has run.
  const closingModal = useRef(false);
  const modalBefore = useRef(modalOpen);
  if (modalBefore.current && !modalOpen) closingModal.current = true;
  modalBefore.current = modalOpen;
  const recoverFocus = useCallback(() => {
    const el = rootRef.current;
    // While a dialog is open, or just closed (its own restore puts focus back), stay out of the way.
    if (!el || !keyboardUser.current || modalRef.current || closingModal.current) return;
    const active = document.activeElement as HTMLElement | null;
    if (active && active !== document.body && active.isConnected) return; // focus is somewhere real
    const usable = (q: string) =>
      [...el.querySelectorAll<HTMLElement>(q)].find((b) => !b.closest('[inert]') && b.getClientRects().length > 0 && !(b as HTMLButtonElement).disabled);
    const next = usable('.ns-btn-suggested') ?? usable('.ns-tab[aria-pressed="true"]');
    recovering.current = true;
    next?.focus({ preventScroll: true }); // never scroll the page from under the player
    recovering.current = false;
  }, []);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      keyboardUser.current = true;
      const target = e.target as HTMLElement;
      if (e.repeat && (e.key === 'Enter' || e.key === ' ') && target.tagName === 'BUTTON' && el.contains(target)) e.preventDefault();
    };
    const onPointer = () => (keyboardUser.current = false);
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('pointerdown', onPointer, true);
    // Chromium fires focusout when the focused element is removed; Firefox does not, so the check
    // also runs after every render (below).
    const onFocusOut = () => requestAnimationFrame(recoverFocus);
    el.addEventListener('focusout', onFocusOut);
    return () => {
      el.removeEventListener('focusout', onFocusOut);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('pointerdown', onPointer, true);
    };
  }, [recoverFocus]);
  useEffect(() => {
    if (keyboardUser.current && document.activeElement === document.body) recoverFocus();
  });
  const wasModal = useRef(modalOpen);
  useEffect(() => {
    if (wasModal.current && !modalOpen) {
      const back = lastFocus.current;
      const usable = back && back.isConnected && !(back as HTMLButtonElement).disabled && !back.closest('[inert]');
      (usable ? back : pauseButton.current)?.focus();
    }
    wasModal.current = modalOpen;
    closingModal.current = false;
  }, [modalOpen]);

  const station = state.selected.station;
  const openTickets = state.tickets.filter((t) => t.servedAtMs === undefined).length;
  const latest = state.day.results[state.day.results.length - 1];
  const nextRank = RANK_THRESHOLDS[state.profile.rank];

  const exit = () => {
    if (
      !saveNow() &&
      !window.confirm("This browser isn't letting the game save (site storage is blocked or full), so this day won't be here when you come back. Leave anyway?")
    )
      return;
    onExit();
  };

  return (
    <LayoutContext.Provider value={layout}>
      <div className={`ns-root${compact ? ' ns-compact' : ''}${compact && sideDock ? ' ns-side-dock' : ''}`} ref={rootRef}>
        <header className="ns-hud" inert={modalOpen}>
          <span>
            <b>Day {state.day.number}</b> · {Math.floor(state.nowMs / 60_000)}:{String(Math.floor((state.nowMs % 60_000) / 1000)).padStart(2, '0')}
          </span>
          <span>
            Rank {state.profile.rank}
            {nextRank !== undefined && (
              <small>
                {' '}
                ({state.profile.points}/{nextRank})
              </small>
            )}
          </span>
          <span>{state.profile.coins} coins</span>
          <span>
            {openTickets} open ticket{openTickets === 1 ? '' : 's'}
          </span>
          <span className="ns-hud-actions">
            <button
              ref={pauseButton}
              type="button"
              className="ns-btn ns-btn-small"
              onClick={() => dispatch({ type: state.paused ? 'resume' : 'pause' })}
              aria-keyshortcuts="P"
            >
              {state.paused ? 'Resume' : 'Pause'}
            </button>
            <button type="button" className="ns-btn ns-btn-small ns-btn-quiet" onClick={exit}>
              Save &amp; exit
            </button>
          </span>
          {saveFailed && !superseded && !fatal && (
            <span className="ns-save-warning" role="alert">
              Can't save: this browser's site storage is blocked or full. Progress since the last save will be lost if you leave or reload.
            </span>
          )}
        </header>

        {/* The wrapper is the size container the stage's cqw text is measured against (an element
            can't be measured against itself; cqw would fall back to the window). */}
        <div className="ns-stage-wrap">
          {!compact && <LastServe result={latest} inert={modalOpen} modal={modalOpen} />}
          <div
            // Prep and Finish have no scene of their own in the dock layout, and Build's scene (the
            // vessel from the side) gives way to its gauges, which say the same: on a phone held
            // sideways they take its place in the left column, so the dispensers and Send fit beside them.
            className={`ns-stage ns-station-${station}${compact && (station === 'prep' || station === 'finish' || station === 'build') ? ' ns-scene-empty' : ''}`}
            aria-label={`${station} station`}
          >
            <div className="ns-stage-content" inert={modalOpen}>
              <StationBackdrop station={station} />
              <TicketRail state={state} dispatch={dispatch} />
              {station === 'order' && <OrderStation state={state} dispatch={dispatch} />}
              {station === 'build' && <BuildStation state={state} dispatch={dispatch} />}
              {station === 'prep' && <PrepStation state={state} dispatch={dispatch} />}
              {station === 'finish' && <FinishStation state={state} dispatch={dispatch} />}
              <StationTabs state={state} dispatch={dispatch} />
            </div>
            {fatal ? (
              <FatalOverlay message={fatal} onExit={onExit} onRestart={() => onRestart(state.profile, state.runId)} />
            ) : superseded ? (
              <OtherTabOverlay
                onContinue={() =>
                  takeOver().then((ok) => {
                    // The other tab's save can't be read here (e.g. it runs a newer version): reload.
                    if (!ok) window.location.reload();
                  })
                }
                onExit={onExit}
              />
            ) : state.day.completed ? (
              <DaySummary state={state} dispatch={dispatch} onExit={exit} />
            ) : state.paused ? (
              <PauseOverlay dispatch={dispatch} onExit={exit} />
            ) : null}
          </div>
        </div>

        {compact && (
          // The station's controls come straight after the tabs and tickets; the last result follows
          // them (it is also announced, and summed up in the status line).
          <div className="ns-dock" inert={modalOpen}>
            <div ref={slotRefs.tabs} className="ns-dock-tabs" />
            <div ref={slotRefs.top} className="ns-dock-top" />
            <div ref={slotRefs.aside} className="ns-dock-aside" />
            <div ref={slotRefs.main} className="ns-dock-main" />
            <LastServe result={latest} modal={modalOpen} />
          </div>
        )}

        <p className="sr-only" aria-live="polite" data-ns-cue>
          {cueReady && cue.text && <span key={cue.id}>{cue.text}</span>}
        </p>
        <p className="ns-status" role="status" aria-live="polite">
          {/* Older messages stay in the region (so one already being read isn't cut off) but are
              hidden from browse mode, which reads only the latest. */}
          {status.messages.map((m, i) =>
            i === status.messages.length - 1 ? (
              <span key={m.id}>{m.text} </span>
            ) : (
              <span key={m.id} className="sr-only" aria-hidden="true">
                {m.text}{' '}
              </span>
            )
          )}
        </p>
        <details className="ns-help" inert={modalOpen}>
          <summary>Controls</summary>
          <p>
            <kbd>1</kbd>–<kbd>4</kbd> switch stations · <kbd>P</kbd> pause · hold a dispenser or <kbd>Space</kbd> on it to pour (a quick tap adds a little) · on
            the finish vessel, pick a tool, then drag (or hold <kbd>Space</kbd> and use the arrows) to drizzle, and click (or press <kbd>Enter</kbd>) to place a
            garnish. With switch, voice or screen-reader activation: one activation on a dispenser pours to the fill line and stops by itself, and one on the
            vessel places a garnish or drizzles the ordered amount. On a touch screen, press and keep still for a moment before dragging to drizzle or pour; a
            finger that moves straight away scrolls the page.
          </p>
        </details>
      </div>
    </LayoutContext.Provider>
  );
}

/**
 * The last serve's result, always in the same place with a fixed height (above the stage, or at the
 * top of the dock on a phone), so it never covers a control and nothing moves when it changes.
 * The full breakdown is in the day summary.
 */
function LastServe({ result, inert, modal }: { result: ServeResult | undefined; inert?: boolean; modal?: boolean }) {
  // "Why?" opens every reason in a panel over the stage: the bar's fixed height (so nothing moves)
  // can't show them all, and the day summary comes too late to learn from.
  const [open, setOpen] = useState(false);
  const whyRef = useRef<HTMLButtonElement>(null);
  useEffect(() => setOpen(false), [result?.ticketId]);
  // A dialog (pause, day summary) closes the panel; it must never sit over one.
  useEffect(() => {
    if (modal) setOpen(false);
  }, [modal]);
  if (!result) {
    return (
      <div className="ns-lastserve-wrap">
        <section className="ns-lastserve ns-lastserve-empty" aria-label="Last serve" inert={inert}>
          <p>Serve results appear here: each station's score and what cost points.</p>
        </section>
      </div>
    );
  }
  const flags = [
    result.mismatchedOrder ? 'not what this ticket ordered' : '',
    result.contentShare < AGGREGATION_V2.fullCreditShare ? `only ${Math.round(result.contentShare * 100)}% of the order in the katori` : '',
    !result.complete && !result.mismatchedOrder ? 'order incomplete (no five stars or bonus)' : '',
  ].filter(Boolean);
  // The content note repeats the flag on the first line; the panel and summary keep it.
  const barNotes = result.notes.filter((n) => !/^Only \d+% of the ordered food/.test(n));
  const close = () => {
    setOpen(false);
    whyRef.current?.focus();
  };
  return (
    <div
      className="ns-lastserve-wrap"
      inert={inert}
      // Escape closes the panel from the Why? button or from inside the panel.
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation();
          close();
        }
      }}
    >
      <section className="ns-lastserve" aria-label="Last serve">
        <p>
          <b>{name(result.catalogCustomerId)}</b> <span aria-label={`${result.stars} of 5 stars`}>{stars(result.stars)}</span> · total{' '}
          <b>{result.scores.total}</b> · tip {result.tip} coins{flags.length ? <em> · {flags.join(' · ')}</em> : null}
        </p>
        <p>
          {(result.notes.length > 0 || flags.length > 0) && (
            <button ref={whyRef} type="button" className="ns-why" aria-expanded={open} aria-controls="ns-why-panel" onClick={() => setOpen((o) => !o)}>
              Why?
            </button>
          )}
          {SCORE_LABELS.map(([key, label], i) => (
            <React.Fragment key={key}>
              {i > 0 && ' · '}
              {label} <b>{result.scores[key]}</b>
            </React.Fragment>
          ))}
        </p>
        <p className="ns-lastserve-notes">{barNotes.length ? barNotes.join(' · ') : result.notes.length ? '' : 'No points lost.'}</p>
      </section>
      {/* Never rendered under a dialog, not even for the frame before the effect above closes it. */}
      {open && !modal && (
        <div id="ns-why-panel" className="ns-why-panel" role="region" aria-label={`Why ${name(result.catalogCustomerId)}'s scores`}>
          <ul>
            {/* The content flag is already a note ("Only N% of the ordered food…"). */}
            {flags
              .filter((f) => !/^only \d+% of the order/.test(f))
              .map((f) => (
                <li key={f}>{f[0].toUpperCase() + f.slice(1)}</li>
              ))}
            {result.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
            {result.notes.length === 0 && <li>No points lost.</li>}
          </ul>
          <button type="button" className="ns-btn ns-btn-small" onClick={close}>
            Close
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * A modal dialog over the stage. The kitchen behind it is inert; Tab and Shift+Tab cycle inside it,
 * and Escape is handled by the kitchen's key handler (it resumes from pause).
 */
function Modal({
  label,
  className = '',
  cardRef,
  children,
  alert,
}: {
  label: string;
  className?: string;
  cardRef?: React.Ref<HTMLDivElement>;
  children: React.ReactNode;
  alert?: boolean;
}) {
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;
    const focusable = [...e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), summary, [href], [tabindex]:not([tabindex="-1"])')];
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !focusable.includes(active as HTMLElement))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };
  return (
    <div className="ns-overlay" role={alert ? 'alertdialog' : 'dialog'} aria-modal="true" aria-label={label} onKeyDown={onKeyDown}>
      <div className={`ns-overlay-card ${className}`} ref={cardRef} tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}

function FatalOverlay({ message, onExit, onRestart }: { message: string; onExit: () => void; onRestart: () => void }) {
  return (
    <Modal label="The kitchen stopped" alert>
      <h2>The kitchen stopped</h2>
      <p>Something went wrong and the clock was stopped so nothing changes unseen. Your rank, coins and upgrades are kept; this day can't continue.</p>
      <p className="ns-muted">
        <small>Error: {message}</small>
      </p>
      <div className="ns-row">
        <button type="button" className="ns-btn ns-btn-primary" autoFocus onClick={onRestart}>
          Start a new day with your progress
        </button>
        <button type="button" className="ns-btn ns-btn-quiet" onClick={onExit}>
          Exit
        </button>
      </div>
    </Modal>
  );
}

function OtherTabOverlay({ onContinue, onExit }: { onContinue: () => void; onExit: () => void }) {
  return (
    <Modal label="Open in another tab" alert>
      <h2>Open in another tab</h2>
      <p>
        This kitchen was opened in another tab or window, which now holds your latest progress. This tab has stopped saving so the two never overwrite each
        other.
      </p>
      <div className="ns-row">
        <button type="button" className="ns-btn ns-btn-primary" autoFocus onClick={onContinue}>
          Continue here
        </button>
        <button type="button" className="ns-btn ns-btn-quiet" onClick={onExit}>
          Exit
        </button>
      </div>
      <p className="ns-muted">
        <small>Continue here picks up from the latest save, and the other tab stops instead.</small>
      </p>
    </Modal>
  );
}

function PauseOverlay({ dispatch, onExit }: { dispatch: Dispatch; onExit: () => void }) {
  return (
    <Modal label="Paused">
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
      <p className="ns-muted">
        <small>
          <kbd>P</kbd> or <kbd>Esc</kbd> resumes.
        </small>
      </p>
    </Modal>
  );
}

function DaySummary({ state, dispatch, onExit }: { state: GameState; dispatch: Dispatch; onExit: () => void }) {
  // Focus the dialog itself (not its last button) so it opens scrolled to the top.
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => cardRef.current?.focus(), []);
  const results = state.day.results;
  const average = results.length ? Math.round(results.reduce((a, r) => a + r.scores.total, 0) / results.length) : 0;
  const tips = results.reduce((a, r) => a + r.tip, 0);
  return (
    <Modal label={`Day ${state.day.number} summary`} className="ns-summary" cardRef={cardRef}>
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
                {r.notes.length > 0 && <small className="ns-summary-notes">{r.notes.join(' · ')}</small>}
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
          const ticket = state.tickets.find((t) => t.id === r.ticketId);
          const goals = getCatalogCustomer(r.catalogCustomerId)?.order;
          if (!dish || !ticket || !goals) return null;
          const report = serviceNutritionReport(dish, ticket.order, goals);
          const t = report.served.totals;
          const who = name(r.catalogCustomerId);
          return (
            <section key={r.ticketId} className="ns-nutrition">
              <h3>{who}</h3>
              <p>
                Ate {Math.round(t.calories_kcal)} kcal · protein {Math.round(t.protein_g)} g · carbs {Math.round(t.carbs_g)} g · fiber {Math.round(t.fiber_g)} g
                · fat {Math.round(t.fat_g)} g · sodium {Math.round(t.sodium_mg)} mg
              </p>
              <p className="ns-nutrition-head">Your service</p>
              {report.changes.length === 0 ? (
                <p>Served exactly as ordered.</p>
              ) : (
                <ul>
                  {report.changes.map((change) => (
                    <li key={change}>{change}</li>
                  ))}
                </ul>
              )}
              <p className="ns-nutrition-head">{who}'s order and their meal goal</p>
              <ul>
                {report.orderFit.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </section>
          );
        })}
        <p className="ns-muted">
          The customer chooses the order; your service only changes how close the katori comes to it. Meal goals are general game guidance for a whole plate,
          not medical advice.
        </p>
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
                // aria-disabled, not disabled: buying keeps focus on the button (now "Owned").
                aria-disabled={owned || locked || state.profile.coins < u.cost || undefined}
                onClick={() => {
                  if (!owned && !locked && state.profile.coins >= u.cost) dispatch({ type: 'buyUpgrade', upgradeId: u.id });
                }}
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
    </Modal>
  );
}
