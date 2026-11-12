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
//
// Handing over: before a tab reads the save to open it (Continue, a new day, Continue here), it asks
// the tab holding the save to hand it over (handoffKey, and the tabs' BroadcastChannel). The holder
// pauses, saves its latest state, sends that state to the asking tab directly (so it arrives even
// when storage is full), records the asking tab as the writer and stops; the asking tab waits for
// that (at most HANDOFF_MS, for a holder that is closed or frozen) and only then opens the save, so
// nothing done in the other window since its last autosave is lost. When two tabs ask at once, the
// one that asks last ends up with the save (the most recently opened kitchen holds it).
//
// A stale tab never writes: each kitchen remembers the save as it last wrote (or found) it, and
// before every write checks that storage still holds exactly that. A tab restored from the
// back/forward cache, or woken from a freeze, finds another tab's newer save there and stops instead
// of overwriting it. It checks again as soon as it is shown, so it says so at once.
//
// A late handover is taken, not fought: a holder that was busy past HANDOFF_MS hands over after the
// asking tab has already opened the older save. While that tab hasn't played yet (it arrives paused,
// and nothing but selections has happened), it adopts the newer state instead of stopping.
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
/** How long a tab waits for the holder of the save to hand it over. */
const HANDOFF_MS = 800;
/** A handover request older than this is stale (e.g. seen by a tab waking from a freeze). */
const HANDOFF_FRESH_MS = 2_000;

export const saveKey = (userId: string) => `nutriserve.remaster.save.v1:${userId}`;
/** Which open kitchen (tab) may write the save: the one that opened most recently. */
export const writerKey = (userId: string) => `nutriserve.remaster.writer.v1:${userId}`;
/** A tab asking the holder of the save to hand it over: { from: tab id, at }. */
export const handoffKey = (userId: string) => `nutriserve.remaster.handoff.v1:${userId}`;
/** The open tabs' message channel (where BroadcastChannel exists). */
const channelName = (userId: string) => `nutriserve.remaster.tabs.v1:${userId}`;
/** With a channel, how long to wait for the holder's message after its writer record changes. */
const HANDOFF_GRACE_MS = 150;

type TabMessage =
  | { kind: 'ask'; from: string; at: number }
  | { kind: 'ceded'; from: string; to: string; raw: string | null };

function openChannel(userId: string): BroadcastChannel | null {
  try {
    return typeof BroadcastChannel === 'function' ? new BroadcastChannel(channelName(userId)) : null;
  } catch {
    return null;
  }
}

/** The stored save as text: null when there is none, undefined when storage can't be read. */
function readRaw(userId: string): string | null | undefined {
  try {
    return window.localStorage.getItem(saveKey(userId));
  } catch {
    return undefined;
  }
}

function newTabId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
}

/** This page's id: the start screen and the kitchen in one tab are one writer. */
const TAB_ID = newTabId();

/** The tab id holding the save, or null when none is recorded (or storage is unavailable). */
function readWriter(userId: string): string | null {
  try {
    const value = JSON.parse(window.localStorage.getItem(writerKey(userId)) ?? 'null');
    return typeof value?.tab === 'string' ? value.tab : null;
  } catch {
    return null;
  }
}

/**
 * Record `tab` as the writer. When the write fails (storage full), the old record is removed
 * instead, so a record left by a closed tab can't make this one stop saving: with no record, the
 * open kitchen holds the save.
 */
function claimWriter(userId: string, tab: string): void {
  const value = JSON.stringify({ tab, at: Date.now() });
  try {
    window.localStorage.setItem(writerKey(userId), value);
    return;
  } catch {
    // fall through
  }
  try {
    window.localStorage.removeItem(writerKey(userId));
    window.localStorage.setItem(writerKey(userId), value);
  } catch {
    // Storage blocked or still full: with the record gone (or unreadable), this tab holds the save.
  }
}

/**
 * Ask the tab holding the save to hand it over, and resolve once it has (it saved its latest
 * state and recorded this tab as the writer) or after HANDOFF_MS (it is closed or frozen). Resolves
 * with the save the holder sent directly, which is its newest state even when storage couldn't
 * keep it (null: read the save from storage). Resolves at once when no other tab holds the save.
 */
export function requestHandoff(userId: string): Promise<string | null> {
  const holder = readWriter(userId);
  if (holder === null || holder === TAB_ID) return Promise.resolve(null);
  return new Promise((resolve) => {
    let done = false;
    const channel = openChannel(userId);
    let grace = 0;
    const finish = (raw: string | null) => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      window.clearTimeout(grace);
      window.removeEventListener('storage', onStorage);
      channel?.close();
      resolve(raw);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key !== writerKey(userId) || readWriter(userId) !== TAB_ID) return;
      // The holder has let go. Its message (with its state) may still be on its way.
      if (!channel) finish(null);
      else if (!grace) grace = window.setTimeout(() => finish(null), HANDOFF_GRACE_MS);
    };
    if (channel) {
      channel.onmessage = (e: MessageEvent<TabMessage>) => {
        const m = e.data;
        if (m?.kind === 'ceded' && m.to === TAB_ID) finish(typeof m.raw === 'string' ? m.raw : null);
      };
    }
    const timer = window.setTimeout(() => finish(null), HANDOFF_MS);
    window.addEventListener('storage', onStorage);
    const request = { from: TAB_ID, at: Date.now() };
    let asked = false;
    try {
      channel?.postMessage({ kind: 'ask', ...request } satisfies TabMessage);
      asked = !!channel;
    } catch {
      // fall back to storage
    }
    try {
      window.localStorage.setItem(handoffKey(userId), JSON.stringify(request));
      asked = true;
    } catch {
      // storage blocked or full
    }
    if (!asked) finish(null); // nobody can be asked
  });
}

/** Bytes the start screen test-writes: roughly a mid-day save, so a nearly full store is caught. */
const PROBE_CHARS = 8_192;

/** Can a save be stored here? (False in some private modes, with site data blocked, or storage nearly full.) */
export function storageWorks(): boolean {
  const key = 'nutriserve.remaster.probe.v1';
  try {
    window.localStorage.setItem(key, 'x'.repeat(PROBE_CHARS));
    window.localStorage.removeItem(key);
    return true;
  } catch {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
    return false;
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

/** Read the save; `handed` (a save another tab sent directly, see requestHandoff) is read instead when given. */
export function readSavedGame(userId: string, handed?: string | null): StoredGame {
  let raw: string | null = null;
  if (typeof handed === 'string') raw = handed;
  else {
    try {
      raw = window.localStorage.getItem(saveKey(userId));
    } catch {
      return { state: null, problem: null, exists: false, notes: [] };
    }
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

/** Write the save; false when storage is blocked or full (the game keeps running, unsaved). */
export function writeSave(userId: string, state: GameState): boolean {
  try {
    window.localStorage.setItem(saveKey(userId), serializeGame(state));
    return true;
  } catch {
    return false;
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
  /**
   * Rejected commands' reasons, for the status line: `messages` holds every rejection since the
   * last render (so two in one event are both announced), `message` the latest; seq changes on
   * every rejection.
   */
  lastError: { message: string; messages: string[]; seq: number } | null;
  /** Set when the simulation threw: the clock has stopped and autosave is off. */
  fatal: string | null;
  /** The save is now held by a kitchen in another tab: this one has stopped saving and paused. */
  superseded: boolean;
  /** Ask for the save back, load it and hold it from this tab again (false: it couldn't be read here). */
  takeOver: () => Promise<boolean>;
  /** Save now, if this tab still holds the save (Save & exit). False only when a save was due and failed. */
  saveNow: () => boolean;
  /** The last save failed (storage blocked or full): progress since the last good save would be lost. */
  saveFailed: boolean;
}

export function useNutriServeGame(initial: GameState, userId: string): NutriServeGame {
  const ref = useRef(initial);
  const [state, setState] = useState(initial);
  const [lastError, setLastError] = useState<NutriServeGame['lastError']>(null);
  const errorSeq = useRef(0);
  const pendingErrors = useRef<string[]>([]);
  const [fatal, setFatal] = useState<string | null>(null);
  const fatalRef = useRef(false);
  const carry = useRef(0);
  const lastRender = useRef(0);
  const tabId = useRef<string>(TAB_ID);
  const supersededRef = useRef(false);
  const [superseded, setSuperseded] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  // Nothing has been played since this tab took the save (see adoptLate), and the game time then.
  const untouched = useRef(true);
  const heldAtMs = useRef<number | null>(null);

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
        // Anything but pausing or selecting counts as playing (see adoptLate).
        if (!/^(pause|select|releaseHolds)/.test(command.type)) untouched.current = false;
        ref.current = next;
        render(next);
      }
      if (!options?.silent && 'error' in result) {
        if (pendingErrors.current[pendingErrors.current.length - 1] !== result.error) pendingErrors.current.push(result.error);
        setLastError({ message: result.error, messages: [...pendingErrors.current], seq: ++errorSeq.current });
      }
      return result;
    },
    [fail, render]
  );
  // Rejections are collected until they have been rendered.
  useEffect(() => {
    pendingErrors.current = [];
  }, [lastError]);

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

  // The save as this kitchen last wrote it, or found it when it took the save (undefined: unknown).
  const lastRaw = useRef<string | null | undefined>(undefined);
  /** Has another tab written the save since this one last wrote it (or took it)? */
  const changedElsewhere = useCallback(() => {
    if (lastRaw.current === undefined) return false;
    const now = readRaw(userId);
    return now !== undefined && now !== lastRaw.current;
  }, [userId]);

  /** Write the current state; remembers what was written. */
  const write = useCallback((): boolean => {
    let raw: string;
    try {
      raw = serializeGame(ref.current);
    } catch {
      setSaveFailed(true);
      return false;
    }
    let ok = true;
    try {
      window.localStorage.setItem(saveKey(userId), raw);
      lastRaw.current = raw;
    } catch {
      ok = false;
    }
    setSaveFailed(!ok);
    return ok;
  }, [userId]);

  /** Hold the save from this tab: record it as the writer and remember the save as found, then write. */
  const hold = useCallback(() => {
    claimWriter(userId, tabId.current);
    lastRaw.current = readRaw(userId);
    untouched.current = true;
    heldAtMs.current = ref.current.nowMs;
    write();
  }, [userId, write]);

  /**
   * A holder that was busy past HANDOFF_MS handed its newer state over after this tab had already
   * opened the older save. If nothing has been played here since (no time has passed and nothing but
   * selections was done), take that state instead of stopping. True when adopted.
   */
  const adoptLate = useCallback(
    (raw: string | null | undefined): boolean => {
      if (fatalRef.current || supersededRef.current || typeof raw !== 'string' || raw === lastRaw.current) return false;
      if (!untouched.current || ref.current.nowMs !== heldAtMs.current || readWriter(userId) !== tabId.current) return false;
      const latest = readSavedGame(userId, raw);
      if (!latest.state) return false;
      const s = latest.state;
      ref.current = s.paused || s.day.completed ? s : applyCommand(s, { type: 'pause' }).state;
      hold();
      render(ref.current);
      return true;
    },
    [hold, render, userId]
  );

  /** Stop if another tab holds the save or has written it since this one did. */
  const stillHolds = useCallback((): boolean => {
    if (fatalRef.current || supersededRef.current) return false;
    if (!owns() || changedElsewhere()) {
      supersede();
      return false;
    }
    return true;
  }, [changedElsewhere, owns, supersede]);

  // Autosave (off once the simulation has failed, so a bad state never replaces the last good save,
  // and off once another tab holds or has written the save, so this one never overwrites it).
  const save = useCallback((): boolean => {
    if (fatalRef.current || supersededRef.current) return true;
    if (!stillHolds()) return true;
    return write();
  }, [stillHolds, write]);

  const channel = useRef<BroadcastChannel | null>(null);

  /**
   * Hand the save to the tab that asked for it: pause, save the latest state, send it to that tab,
   * record it as the writer, stop. A stale tab (another one wrote the save since) sends nothing.
   */
  const cede = useCallback(
    (to: string) => {
      if (!stillHolds()) return;
      if (!ref.current.paused && !ref.current.day.completed) dispatch({ type: 'pause' }, { silent: true });
      write();
      let raw: string | null = null;
      try {
        raw = serializeGame(ref.current);
      } catch {
        raw = null;
      }
      try {
        channel.current?.postMessage({ kind: 'ceded', from: tabId.current, to, raw } satisfies TabMessage);
      } catch {
        // the asking tab reads storage instead
      }
      claimWriter(userId, to);
      supersede();
    },
    [dispatch, stillHolds, supersede, userId, write]
  );

  const takeOver = useCallback(async () => {
    const handed = await requestHandoff(userId);
    const latest = readSavedGame(userId, handed);
    if (!latest.state) return false;
    // Picked up paused, so the clock waits for the player to resume here.
    const s = latest.state;
    ref.current = s.paused || s.day.completed ? s : applyCommand(s, { type: 'pause' }).state;
    supersededRef.current = false;
    setSuperseded(false);
    hold();
    render(ref.current);
    return true;
  }, [hold, render, userId]);

  // Pause (and save) when hidden, so another tab opened meanwhile starts from the latest state.
  // When shown again (or restored from the back/forward cache, or resumed after a freeze), check
  // at once that no other tab has taken or written the save meanwhile.
  useEffect(() => {
    const onReturn = () => {
      if (!stillHolds()) return;
      if (readWriter(userId) === null) claimWriter(userId, tabId.current);
    };
    const onVisibility = () => {
      if (!document.hidden) {
        onReturn();
        return;
      }
      if (!ref.current.paused && !ref.current.day.completed) dispatch({ type: 'pause' });
      save();
    };
    const onFreeze = () => save();
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('freeze', onFreeze);
    document.addEventListener('resume', onReturn);
    window.addEventListener('pageshow', onReturn);
    window.addEventListener('focus', onReturn);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('freeze', onFreeze);
      document.removeEventListener('resume', onReturn);
      window.removeEventListener('pageshow', onReturn);
      window.removeEventListener('focus', onReturn);
    };
  }, [dispatch, save, stillHolds, userId]);

  useEffect(() => {
    // This kitchen holds the save from now on; another tab's kitchen stops writing when it sees this.
    hold();
    const onAsk = (from: unknown, at: unknown) => {
      const fresh = typeof at === 'number' && Math.abs(Date.now() - at) < HANDOFF_FRESH_MS;
      if (fresh && typeof from === 'string' && from !== tabId.current) cede(from);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === handoffKey(userId)) {
        let request: { from?: unknown; at?: unknown } | null = null;
        try {
          request = JSON.parse(e.newValue ?? 'null');
        } catch {
          request = null;
        }
        onAsk(request?.from, request?.at);
        return;
      }
      if (e.key === saveKey(userId) && adoptLate(e.newValue)) return;
      if (e.key === writerKey(userId) || e.key === saveKey(userId)) stillHolds();
    };
    channel.current = openChannel(userId);
    if (channel.current) {
      channel.current.onmessage = (e: MessageEvent<TabMessage>) => {
        if (e.data?.kind === 'ask') onAsk(e.data.from, e.data.at);
        // A handover that arrives after this tab stopped waiting for it.
        else if (e.data?.kind === 'ceded' && e.data.to === tabId.current) adoptLate(e.data.raw);
      };
    }
    /** Leaving the page or the kitchen lets go of the save, so a tab that asks next doesn't wait for an answer that will never come. */
    const letGo = () => {
      if (readWriter(userId) !== tabId.current) return;
      try {
        window.localStorage.removeItem(writerKey(userId));
      } catch {
        // ignore
      }
    };
    // A page put in the back/forward cache lets go too; restored, it takes the save back only if
    // nobody wrote it meanwhile (see onReturn above).
    const onPageHide = () => {
      save();
      letGo();
    };
    const id = window.setInterval(save, AUTOSAVE_MS);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('storage', onStorage);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('storage', onStorage);
      channel.current?.close();
      channel.current = null;
      save();
      letGo();
    };
  }, [adoptLate, cede, hold, save, stillHolds, userId]);

  return { state, dispatch, lastError, fatal, superseded, takeOver, saveNow: save, saveFailed };
}
