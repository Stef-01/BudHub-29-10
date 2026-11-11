// React binding for the simulation: a requestAnimationFrame clock, command dispatch, autosave.
//
// Background-tab policy (documented per the build track): frame deltas are capped at FRAME_CAP_MS so
// a stalled frame can't jump the kitchen forward, and the game pauses itself when the page is hidden.
// The simulation never reads the clock; this hook is the only place real time enters.
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  advanceGame,
  applyCommand,
  deserializeGame,
  serializeGame,
  type Command,
  type CommandResult,
  type GameState,
} from '../simulation/index.ts';

export const FRAME_CAP_MS = 250;
const AUTOSAVE_MS = 4_000;

export const saveKey = (userId: string) => `nutriserve.remaster.save.v1:${userId}`;

export function loadSavedGame(userId: string): GameState | null {
  try {
    const raw = window.localStorage.getItem(saveKey(userId));
    return raw ? deserializeGame(raw) : null;
  } catch {
    return null;
  }
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

export interface NutriServeGame {
  state: GameState;
  /** silent: don't surface a rejection in the status line (internal bookkeeping commands). */
  dispatch: (command: Command, options?: { silent?: boolean }) => CommandResult;
  /** Last rejected command's reason, for the status line. */
  lastError: string | null;
}

export function useNutriServeGame(initial: GameState, userId: string): NutriServeGame {
  const ref = useRef(initial);
  const [state, setState] = useState(initial);
  const [lastError, setLastError] = useState<string | null>(null);
  const carry = useRef(0);

  const commit = useCallback((next: GameState) => {
    if (next === ref.current) return;
    ref.current = next;
    setState(next);
  }, []);

  const dispatch = useCallback(
    (command: Command, options?: { silent?: boolean }): CommandResult => {
      const { state: next, result } = applyCommand(ref.current, command);
      commit(next);
      if (!options?.silent) setLastError('error' in result ? result.error : null);
      return result;
    },
    [commit]
  );

  // Clock
  useEffect(() => {
    let frameId = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const elapsed = Math.min(FRAME_CAP_MS, Math.max(0, now - last)) + carry.current;
      last = now;
      const dt = Math.floor(elapsed);
      carry.current = elapsed - dt;
      if (dt > 0) commit(advanceGame(ref.current, dt));
      frameId = requestAnimationFrame(frame);
    };
    frameId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(frameId);
  }, [commit]);

  // Pause when hidden
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && !ref.current.paused && !ref.current.day.completed) dispatch({ type: 'pause' });
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [dispatch]);

  // Autosave
  useEffect(() => {
    const save = () => writeSave(userId, ref.current);
    const id = window.setInterval(save, AUTOSAVE_MS);
    window.addEventListener('pagehide', save);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('pagehide', save);
      save();
    };
  }, [userId]);

  return { state, dispatch, lastError };
}
