// React binding for the simulation: a requestAnimationFrame clock, command dispatch, autosave.
//
// Background-tab policy (documented per the build track): frame deltas are capped at FRAME_CAP_MS so
// a stalled frame can't jump the kitchen forward, and the game pauses itself when the page is hidden.
// The simulation never reads the clock; this hook is the only place real time enters.
//
// The simulation advances every animation frame, but React re-renders at most every RENDER_MS
// (commands still render at once): the scene changes slowly and re-rendering the whole kitchen at
// 60 Hz cost far more than the simulation itself.
//
// One writer per save: a kitchen claims the save when it opens (writerKey). A kitchen in another tab
// that sees the claim (a storage event, or the claim found at its next autosave) stops saving,
// pauses, and offers to continue from the latest save instead, so two tabs never overwrite each
// other's progress.
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  advanceGame,
  applyCommand,
  deserializeGameWithNotes,
  salvageSave,
  SaveError,
  serializeGame,
  type Command,
  type CommandResult,
  type GameState,
  type SaveSalvage,
} from '../simulation/index.ts';

export const FRAME_CAP_MS = 250;
export const RENDER_MS = 33;
const AUTOSAVE_MS = 4_000;

export const saveKey = (userId: string) => `nutriserve.remaster.save.v1:${userId}`;
/** Which open kitchen (tab) may write the save: the one that opened most recently. */
export const writerKey = (userId: string) => `nutriserve.remaster.writer.v1:${userId}`;

function newTabId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
}

/** The tab id holding the save, or null when none is recorded (or storage is unavailable). */
function readWriter(userId: string): string | null {
  try {
    const value = JSON.parse(window.localStorage.getItem(writerKey(userId)) ?? 'null');
    return typeof value?.tab === 'string' ? value.tab : null;
  } catch {
    return null;
  }
}

function claimWriter(userId: string, tab: string): void {
  try {
    window.localStorage.setItem(writerKey(userId), JSON.stringify({ tab, at: Date.now() }));
  } catch {
    // Storage blocked: nothing is saved anyway.
  }
}

export interface StoredGame {
  /** The restored game, when the save could be read. */
  state: GameState | null;
  /** Set when a save exists but could not be restored; carries any progress that can be kept. */
  problem: SaveSalvage | null;
  /** True when anything is stored under the save key (so a new game would replace it). */
  exists: boolean;
  /** Adjustments made while restoring (e.g. a retired upgrade removed), to show the player. */
  notes: string[];
}

export function readSavedGame(userId: string): StoredGame {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(saveKey(userId));
  } catch {
    return { state: null, problem: null, exists: false, notes: [] };
  }
  if (!raw) return { state: null, problem: null, exists: false, notes: [] };
  try {
    const { state, notes } = deserializeGameWithNotes(raw);
    return { state, problem: null, exists: true, notes };
  } catch (error) {
    const reason = error instanceof SaveError ? error.message : `Save could not be read (${(error as Error).message})`;
    return { state: null, problem: salvageSave(raw, reason), exists: true, notes: [] };
  }
}

export function loadSavedGame(userId: string): GameState | null {
  return readSavedGame(userId).state;
}

export function writeSave(userId: string, state: GameState): void {
  try {
    window.localStorage.setItem(saveKey(userId), serializeGame(state));
  } catch {
    // Storage blocked or full: the game keeps running, it just can't resume later.
  }
}

/**
 * Days already reported to the wider app, kept OUTSIDE the save and keyed by run id, so restoring
 * an older autosave can never report the same day twice.
 */
const reportKey = (userId: string) => `nutriserve.remaster.reported.v1:${userId}`;

export function wasDayReported(userId: string, runId: string, day: number): boolean {
  try {
    const list: string[] = JSON.parse(window.localStorage.getItem(reportKey(userId)) ?? '[]');
    return list.includes(`${runId}:${day}`);
  } catch {
    return false;
  }
}

export function recordDayReported(userId: string, runId: string, day: number): void {
  try {
    const list: string[] = JSON.parse(window.localStorage.getItem(reportKey(userId)) ?? '[]');
    if (!list.includes(`${runId}:${day}`)) list.push(`${runId}:${day}`);
    window.localStorage.setItem(reportKey(userId), JSON.stringify(list.slice(-200)));
  } catch {
    // ignore
  }
}

export function clearSave(userId: string): void {
  try {
    window.localStorage.removeItem(saveKey(userId));
  } catch {
    // ignore
  }
}

export type Dispatch = (command: Command, options?: { silent?: boolean }) => CommandResult;

export interface NutriServeGame {
  state: GameState;
  /** silent: don't surface a rejection in the status line (internal bookkeeping commands). */
  dispatch: Dispatch;
  /** Last rejected command's reason, for the status line; seq changes on every rejection. */
  lastError: { message: string; seq: number } | null;
  /** Set when the simulation threw: the clock has stopped and autosave is off. */
  fatal: string | null;
  /** The save is now held by a kitchen in another tab: this one has stopped saving and paused. */
  superseded: boolean;
  /** Load the latest save and hold it from this tab again (false: it couldn't be read here). */
  takeOver: () => boolean;
  /** Save now, if this tab still holds the save (Save & exit). */
  saveNow: () => void;
}

export function useNutriServeGame(initial: GameState, userId: string): NutriServeGame {
  const ref = useRef(initial);
  const [state, setState] = useState(initial);
  const [lastError, setLastError] = useState<{ message: string; seq: number } | null>(null);
  const errorSeq = useRef(0);
  const [fatal, setFatal] = useState<string | null>(null);
  const fatalRef = useRef(false);
  const carry = useRef(0);
  const lastRender = useRef(0);
  const tabId = useRef<string>('');
  if (!tabId.current) tabId.current = newTabId();
  const supersededRef = useRef(false);
  const [superseded, setSuperseded] = useState(false);

  const fail = useCallback((error: unknown) => {
    fatalRef.current = true;
    setFatal((error as Error)?.message ?? String(error));
  }, []);

  const render = useCallback((next: GameState) => {
    lastRender.current = performance.now();
    setState(next);
  }, []);

  const dispatch = useCallback<Dispatch>(
    (command, options) => {
      if (fatalRef.current) return { ok: false, error: 'The kitchen has stopped' } as CommandResult;
      if (supersededRef.current && command.type !== 'pause') return { ok: false, error: 'This kitchen is open in another tab' } as CommandResult;
      let outcome: ReturnType<typeof applyCommand>;
      try {
        outcome = applyCommand(ref.current, command);
      } catch (error) {
        fail(error);
        return { ok: false, error: 'The kitchen has stopped' } as CommandResult;
      }
      const { state: next, result } = outcome;
      if (next !== ref.current) {
        ref.current = next;
        render(next);
      }
      if (!options?.silent && 'error' in result) setLastError({ message: result.error, seq: ++errorSeq.current });
      return result;
    },
    [fail, render]
  );

  // Clock
  useEffect(() => {
    let frameId = 0;
    let last = performance.now();
    const frame = (now: number) => {
      if (fatalRef.current) return; // a failed command stops the clock too
      const elapsed = Math.min(FRAME_CAP_MS, Math.max(0, now - last)) + carry.current;
      last = now;
      const dt = Math.floor(elapsed);
      carry.current = elapsed - dt;
      if (dt > 0) {
        try {
          ref.current = advanceGame(ref.current, dt);
        } catch (error) {
          // Stop the clock rather than spin on an exception every frame; the UI shows the error.
          fail(error);
          return;
        }
      }
      if (now - lastRender.current >= RENDER_MS) render(ref.current);
      frameId = requestAnimationFrame(frame);
    };
    frameId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(frameId);
  }, [fail, render]);

  const supersede = useCallback(() => {
    if (supersededRef.current) return;
    if (!ref.current.paused && !ref.current.day.completed) dispatch({ type: 'pause' }, { silent: true });
    supersededRef.current = true;
    setSuperseded(true);
  }, [dispatch]);

  /** Does this tab hold the save? (No record, e.g. storage blocked, counts as yes.) */
  const owns = useCallback(() => {
    const writer = readWriter(userId);
    return writer === null || writer === tabId.current;
  }, [userId]);

  // Autosave (off once the simulation has failed, so a bad state never replaces the last good save,
  // and off once another tab holds the save, so this one never overwrites it).
  const save = useCallback(() => {
    if (fatalRef.current || supersededRef.current) return;
    if (!owns()) {
      supersede();
      return;
    }
    writeSave(userId, ref.current);
  }, [owns, supersede, userId]);

  const takeOver = useCallback(() => {
    const latest = readSavedGame(userId);
    if (!latest.state) return false;
    // Picked up paused, so the clock waits for the player to resume here.
    const s = latest.state;
    ref.current = s.paused || s.day.completed ? s : applyCommand(s, { type: 'pause' }).state;
    claimWriter(userId, tabId.current);
    supersededRef.current = false;
    setSuperseded(false);
    render(ref.current);
    return true;
  }, [render, userId]);

  // Pause (and save) when hidden, so another tab opened meanwhile starts from the latest state.
  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden) return;
      if (!ref.current.paused && !ref.current.day.completed) dispatch({ type: 'pause' });
      save();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [dispatch, save]);

  useEffect(() => {
    // This kitchen holds the save from now on; another tab's kitchen stops writing when it sees this.
    claimWriter(userId, tabId.current);
    writeSave(userId, ref.current);
    const onStorage = (e: StorageEvent) => {
      if ((e.key === writerKey(userId) || e.key === saveKey(userId)) && !owns()) supersede();
    };
    const id = window.setInterval(save, AUTOSAVE_MS);
    window.addEventListener('pagehide', save);
    window.addEventListener('storage', onStorage);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('pagehide', save);
      window.removeEventListener('storage', onStorage);
      save();
    };
  }, [owns, save, supersede, userId]);

  return { state, dispatch, lastError, fatal, superseded, takeOver, saveNow: save };
}
