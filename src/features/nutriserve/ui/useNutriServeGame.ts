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
// A stale tab doesn't write: each kitchen remembers the save as it last wrote (or found) it, and
// before every write checks that storage still holds exactly that. A tab restored from the
// back/forward cache, or woken from a freeze, finds another tab's newer save there and stops instead
// of overwriting it. It checks again as soon as it is shown, so it says so at once.
//
// A page that was busy (no frame for STALL_MS) may see storage as it was before: other tabs'
// changes reach it as queued events, and a click or a timer can run before them. So it waits a
// moment (SETTLE_MS) before it saves or claims the save, Save & exit included, and those events run
// first. Should a busy tab still write over the save (a page closed the moment its long task ends
// can't wait), the tab holding it puts its own game back (or takes the other copy, when nothing has
// been played there and it is a later copy of the same day), and records itself again when that
// tab let go of the save on its way out, so the game being played is never replaced by an older
// one and the next tab still asks it to hand over.
//
// A late handover is taken, not fought: a holder that was busy past HANDOFF_MS answers after the
// asking tab has stopped waiting and opened (or is opening) the older save. It only sends its state
// over the channel and never writes, so it can't overwrite what that tab does; a holder that first
// notices the other tab has taken the save sends it the same way. While that tab hasn't played yet (it
// arrives paused, and nothing but selections has happened), it adopts that state when it was played
// on from exactly the copy that tab opened, instead of stopping: every copy sent says which copies
// its kitchen opened, wrote or sent (its line, see copyKey), and a tab that opened another copy
// (another tab played on the save meanwhile) keeps its own, so a fork never replaces the game being
// played. Once the player has played on there, it keeps its own game and only the late tab stops.
//
// A holder that was busy decides once, after the messages and storage changes queued meanwhile have
// all arrived (DRAIN_MS; see decide), not on each as it comes: by then the tab that asked may have
// handed the save on, or closed. The kitchen that took the save says so by its record, or, when
// storage is full, over the channel ('took'; 'left' once it stops holding it, closing, handing it
// on or going into the back/forward cache). If one of them still holds the save, the busy holder
// sends it its newer play and stops; if none does, it goes on playing and holds the save again
// (unless the save now holds another tab's play), so the next tab that asks gets that play.
//
// That includes a handover landing while the asking tab's kitchen is still opening: the kitchen
// compares the save with what the start screen read, and the start screen's request keeps
// listening for the holder's message (LATE_LISTEN_MS) until the kitchen's own channel is open.
//
// A handover nobody received isn't lost: a tab remembers the state it last handed over, and while
// nobody has written the save since (the asking tab left before opening it, and storage was full
// so the state only went over the channel), it opens that state itself on Continue here.
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  advanceGame,
  applyCommand,
  countsAsPlay,
  deserializeGameWithNotes,
  laterCopy,
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
/** A handover request older than this is stale (e.g. seen by a tab waking from a freeze), unless the asking tab has taken the save since (see cede). */
const HANDOFF_FRESH_MS = 2_000;
/** A visible page that ran no frame for this long was busy (or frozen): its view of storage may be behind. */
const STALL_MS = 500;
/** How long a page that was busy waits for other tabs' storage changes to reach it before it saves. */
const SETTLE_MS = 250;
/** At most this many waits in a row (a visible page whose frames never run still saves). */
const SETTLE_TRIES = 8;

export const saveKey = (userId: string) => `nutriserve.remaster.save.v1:${userId}`;
/** Which open kitchen (tab) may write the save: the one that opened most recently. */
export const writerKey = (userId: string) => `nutriserve.remaster.writer.v1:${userId}`;
/** A tab asking the holder of the save to hand it over: { from: tab id, at }. */
export const handoffKey = (userId: string) => `nutriserve.remaster.handoff.v1:${userId}`;
/** The open tabs' message channel (where BroadcastChannel exists). */
const channelName = (userId: string) => `nutriserve.remaster.tabs.v1:${userId}`;
/** With a channel, how long to wait for the holder's message after its writer record changes. */
const HANDOFF_GRACE_MS = 150;
/** After waiting in vain, how long to keep listening for a late handover (see takeLateHandover). */
const LATE_LISTEN_MS = 5_000;
/**
 * How long a holder that was busy (or that answers an ask late, or hears another kitchen took the
 * save) waits for the rest of the messages and storage changes queued meanwhile before it decides
 * (see decide).
 */
const DRAIN_MS = 200;
/** At most this many copies in a kitchen's line (see copyKey). */
const LINE_MAX = 32;

type TabMessage =
  | { kind: 'ask'; from: string; at: number }
  // anyHolder: a late handover, for whichever tab holds the save now (`to` is the sender's guess,
  // and its own record of the writer may be out of date). line: the copies the sender's kitchen
  // opened, wrote or sent (see copyKey), so the receiving tab can tell play on its own copy from a fork.
  | { kind: 'ceded'; from: string; to: string; raw: string | null; anyHolder?: boolean; line?: string[] }
  // A kitchen took the save (at: when; seq: which of its page's holds) but couldn't record itself
  // as the writer (storage full or blocked): the tab holding it until then stops, as it would on
  // seeing the record (see decide).
  | { kind: 'took'; from: string; at: number; seq: number }
  // That hold has ended (the kitchen closed, handed the save on, stopped or went into the
  // back/forward cache), so it no longer holds the save.
  | { kind: 'left'; from: string; seq: number };

function openChannel(userId: string): BroadcastChannel | null {
  try {
    return typeof BroadcastChannel === 'function' ? new BroadcastChannel(channelName(userId)) : null;
  } catch {
    return null;
  }
}

/** The stored save as text: null when there is none, undefined when storage can't be read. */
export function readRaw(userId: string): string | null | undefined {
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
/** Kitchens opened in this page so far (the newest one is the open one). */
let kitchenSeq = 0;

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

/** Has a tab other than `self` asked for the save (handoffKey) at or after `since`? */
function askedSince(userId: string, self: string, since: number): boolean {
  try {
    const request = JSON.parse(window.localStorage.getItem(handoffKey(userId)) ?? 'null');
    return typeof request?.from === 'string' && request.from !== self && typeof request.at === 'number' && request.at >= since;
  } catch {
    return false;
  }
}

export interface Handoff {
  /** The save the holder sent directly: its newest state even when storage couldn't keep it (null: read storage). */
  raw: string | null;
  /** Another tab held the save but didn't answer in time (closed, frozen or busy): it may still hand over late. */
  unanswered: boolean;
}

/**
 * The state this page last handed to another tab, and the save as stored right after: while
 * storage still holds exactly that, nobody has written since, so that state is the newest there is
 * (see "A handover nobody received" above). Cleared when this page holds the save again.
 */
let handedOver: { userId: string; raw: string; stored: string | null | undefined } | null = null;

/** The state this page handed over, when nobody has written the save since (else null). */
function ownHandover(userId: string): string | null {
  if (!handedOver || handedOver.userId !== userId) return null;
  const now = readRaw(userId);
  return now !== undefined && now === handedOver.stored ? handedOver.raw : null;
}

/**
 * The copy this page last saved after playing on it: its game, day, game time, rev and counts,
 * kept in sessionStorage (it survives a reload of this tab, and no other tab reads it) and here. A
 * kitchen opened from exactly that copy has been played on in this page, so it doesn't take a copy
 * of the day that another tab wrote over the save over it (see adoptLate), even though nothing has
 * been played since it opened: such a write says nothing of where it came from, and may be a fork.
 * (A copy sent over the channel says so: see copyKey.) Forgotten once another tab has held the save
 * (see requestHandoff): what it stored from then on carries its own play.
 */
const playKey = (userId: string) => `nutriserve.remaster.played.v1:${userId}`;
let ownPlay: { userId: string; mark: string } | null = null;
const playMark = (s: GameState) => `${s.runId}|${s.day.number}|${s.nowMs}|${s.rev ?? 0}|${s.tickets.length}|${s.day.results.length}`;

function rememberPlay(userId: string, s: GameState): void {
  const mark = playMark(s);
  ownPlay = { userId, mark };
  try {
    window.sessionStorage.setItem(playKey(userId), mark);
  } catch {
    // this page's own memory still holds it
  }
}

function forgetPlay(userId: string): void {
  if (ownPlay?.userId === userId) ownPlay = null;
  try {
    window.sessionStorage.removeItem(playKey(userId));
  } catch {
    // ignore
  }
}

/**
 * A short fingerprint of a copy of the game (its serialized form, as if paused): two tabs that
 * opened the same save get the same one, whether or not opening it paused it. Null when the state
 * can't be serialized.
 *
 * Each kitchen keeps the fingerprints of the copies it opened, wrote or sent (its line; a copy
 * handed over carries the line of the kitchen that sent it, so the next one carries that on). A
 * copy another tab opened while this kitchen held the save is one of those unless a third tab
 * played on the save meanwhile: then this kitchen's copy is a fork of that tab's, not a later one.
 */
export function copyKey(s: GameState): string | null {
  let text: string;
  try {
    text = serializeGame(s.paused || s.day.completed ? s : applyCommand(s, { type: 'pause' }).state);
  } catch {
    return null;
  }
  return textKey(text);
}

/** The fingerprint of a copy already serialized as if paused (a handover's state, see cede). */
export function textKey(text: string): string {
  // cyrb53: a 53-bit string hash, plenty to tell copies of one game apart.
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${text.length}:${(4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)}`;
}

/** Was `s` saved by this page after playing on it (and no other tab has held the save since)? */
function playedHere(userId: string, s: GameState): boolean {
  const mark = playMark(s);
  if (ownPlay?.userId === userId && ownPlay.mark === mark) return true;
  try {
    return window.sessionStorage.getItem(playKey(userId)) === mark;
  } catch {
    return false;
  }
}

/** A message's line (see copyKey): its strings, or none when it has no line. */
function lineOf(m: { line?: unknown }): string[] {
  return Array.isArray(m.line) ? m.line.filter((k): k is string => typeof k === 'string') : [];
}

// A late handover that arrives after requestHandoff stopped waiting, before a kitchen is open to
// take it (the start screen's Continue opens one a moment later). Kept until a kitchen opens: it
// takes it only if it was played on from the copy that kitchen opened (see adoptLate).
let lateHandover: { userId: string; raw: string; line: string[] } | null = null;
/** The open kitchen's adoptLate, which takes a late handover the moment it arrives. */
let lateSink: { userId: string; take: (raw: string, line: string[]) => void } | null = null;
let lateChannel: BroadcastChannel | null = null;
let lateTimer = 0;
/** The copy last handed to this page and its sender's line: a kitchen opening that copy carries the line on (see handedLineFor). */
let handedLine: { userId: string; raw: string; line: string[]; key?: string | null } | null = null;

/** The line handed with the copy whose fingerprint is `key`, if that is the copy last handed to this page. */
function handedLineFor(userId: string, key: string | null): string[] | null {
  if (!handedLine || handedLine.userId !== userId || key === null) return null;
  if (handedLine.key === undefined) {
    const s = readSavedGame(userId, handedLine.raw).state;
    handedLine.key = s ? copyKey(s) : null;
  }
  return handedLine.key === key ? handedLine.line : null;
}
/** This page's holds of the save, counted (see the 'took' message). */
let holdSeq = 0;

function stopListening(): void {
  window.clearTimeout(lateTimer);
  lateChannel?.close();
  lateChannel = null;
}

function keepListening(userId: string, channel: BroadcastChannel): void {
  stopListening();
  lateChannel = channel;
  channel.onmessage = (e: MessageEvent<TabMessage>) => {
    const m = e.data;
    // anyHolder: for whichever tab holds the save, which is this one if the record says so, or if
    // there is no record (storage full: then the kitchen opened here decides, see adoptLate).
    const writer = readWriter(userId);
    if (m?.kind !== 'ceded' || typeof m.raw !== 'string' || !(m.to === TAB_ID || (m.anyHolder && (writer === null || writer === TAB_ID)))) return;
    if (lateSink?.userId === userId) lateSink.take(m.raw, lineOf(m));
    else lateHandover = { userId, raw: m.raw, line: lineOf(m) };
  };
  lateTimer = window.setTimeout(stopListening, LATE_LISTEN_MS);
}

/**
 * The state a late handover brought while no kitchen was open, and its sender's line (once; null
 * when none). The listener stays until LATE_LISTEN_MS has passed, handing later arrivals to the
 * open kitchen: a message on its way to it would be lost if it closed now.
 */
function takeLateHandover(userId: string): { raw: string; line: string[] } | null {
  const late = lateHandover?.userId === userId ? { raw: lateHandover.raw, line: lateHandover.line } : null;
  lateHandover = null;
  return late;
}

/**
 * Ask the tab holding the save to hand it over, and resolve once it has (it saved its latest
 * state and recorded this tab as the writer) or after HANDOFF_MS (it is closed, frozen or busy).
 * Resolves at once when no other tab holds the save. With no record of a writer and storage full
 * (an open kitchen couldn't record itself), it asks anyway: a kitchen holding the save without a
 * record answers too. With another tab holding the save, this page's memory of its own play is
 * forgotten (see playedHere).
 */
export function requestHandoff(userId: string): Promise<Handoff> {
  const holder = readWriter(userId);
  if (holder !== null && holder !== TAB_ID) forgetPlay(userId);
  if (holder === TAB_ID || (holder === null && storageWorks())) return Promise.resolve({ raw: ownHandover(userId), unanswered: false });
  // A late handover kept from an earlier request stays: when nobody answers this one (its sender
  // has stopped since), it may be the newest play there is, and the kitchen takes it only if it
  // follows from the copy it opens.
  stopListening();
  return new Promise((resolve) => {
    let done = false;
    const channel = openChannel(userId);
    let grace = 0;
    const finish = (raw: string | null, unanswered = false) => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      window.clearTimeout(grace);
      window.removeEventListener('storage', onStorage);
      // Unanswered, the holder may still hand over in a moment: keep listening for it.
      if (unanswered && channel) keepListening(userId, channel);
      else channel?.close();
      resolve({ raw: raw ?? ownHandover(userId), unanswered });
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
        if (m?.kind !== 'ceded' || m.to !== TAB_ID) return;
        if (typeof m.raw === 'string') handedLine = { userId, raw: m.raw, line: lineOf(m) };
        finish(typeof m.raw === 'string' ? m.raw : null);
      };
    }
    const timer = window.setTimeout(() => finish(null, true), HANDOFF_MS);
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
  /** Ask for the save back, load it (paused) and hold it from this tab again (false: it couldn't be read here). */
  takeOver: () => Promise<boolean>;
  /** Save now, if this tab still holds the save. False only when a save was due and failed. */
  saveNow: () => boolean;
  /**
   * Save & exit: like saveNow, but on a page that was just busy only once other tabs' storage
   * changes have reached it (see settled); then `then` with saveNow's result.
   */
  saveSettled: (then: (saved: boolean) => void) => void;
  /** The last save failed (storage blocked or full): progress since the last good save would be lost. */
  saveFailed: boolean;
  /** Has another tab taken the save, or written it, since this one last wrote it? (Then this tab's state is out of date.) */
  heldElsewhere: () => boolean;
}

/**
 * `openedFrom`: for a kitchen opened from the save (Continue), the save as stored when the start
 * screen read it: a holder that hands over late may write it while this kitchen is opening.
 */
export function useNutriServeGame(initial: GameState, userId: string, openedFrom?: { stored: string | null | undefined }): NutriServeGame {
  const ref = useRef(initial);
  const opened = useRef(openedFrom);
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
  // Nothing has been played since this tab took the save (see adoptLate), the game time then, and
  // when it took it (Date.now(), see stillHolds and decide).
  const untouched = useRef(true);
  const heldAtMs = useRef<number | null>(null);
  const heldSince = useRef(0);
  // The copy this kitchen opened (copyKey), whether this page had played on it (playedHere), and
  // the copies this kitchen opened, wrote or sent (its line, see copyKey).
  const heldKey = useRef<string | null>(null);
  const heldPlayed = useRef(false);
  const line = useRef<string[]>([]);
  // The hold this kitchen said it took over the channel (see announce), until it says it left.
  const announced = useRef<number | null>(null);
  // This page let go of the save (leaving, or into the back/forward cache) and hasn't taken it back.
  const released = useRef(false);
  // The late handover last adopted (the same one can arrive by more than one route).
  const adopted = useRef<string | null>(null);
  // When the last frame ran (see STALL_MS), when the last stall ended, and the state this kitchen last wrote.
  const lastFrame = useRef(performance.now());
  const stallEnd = useRef(-Infinity);
  const lastWritten = useRef<GameState | null>(null);
  // This kitchen's end of the tabs' channel (see TabMessage).
  const channel = useRef<BroadcastChannel | null>(null);
  // What decide waits to weigh: the latest ask it put off, the kitchens that said they took the
  // save (and each page's ended holds), whether another kitchen has taken it, and its timer.
  const askPending = useRef<{ from: string; at: number } | null>(null);
  const takers = useRef(new Map<string, { at: number; seq: number }>());
  const ended = useRef(new Map<string, number>());
  const contested = useRef(false);
  const deciding = useRef(0);

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
        // Anything but pausing, selecting or recording a report counts as playing (see adoptLate).
        if (countsAsPlay(command)) untouched.current = false;
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
      const t = performance.now();
      if (t - lastFrame.current > STALL_MS) stallEnd.current = t;
      lastFrame.current = t;
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

  /**
   * Say over the channel that this kitchen holds the save from heldSince, when it couldn't record
   * itself (storage full or blocked): the tab holding it until then can't see that any other way.
   */
  const announce = useCallback(() => {
    const seq = ++holdSeq;
    announced.current = seq;
    try {
      channel.current?.postMessage({ kind: 'took', from: tabId.current, at: heldSince.current, seq } satisfies TabMessage);
    } catch {
      // no channel: nothing else can tell the other tab
    }
  }, []);

  /** A kitchen that said it took the save says when it stops holding it, so a holder that was busy doesn't stop for it. */
  const sayLeft = useCallback(() => {
    const seq = announced.current;
    if (seq === null) return;
    announced.current = null;
    try {
      channel.current?.postMessage({ kind: 'left', from: tabId.current, seq } satisfies TabMessage);
    } catch {
      // nothing else can tell the other tab
    }
  }, []);

  const supersede = useCallback(() => {
    if (supersededRef.current) return;
    if (!ref.current.paused && !ref.current.day.completed) dispatch({ type: 'pause' }, { silent: true });
    supersededRef.current = true;
    setSuperseded(true);
    sayLeft();
  }, [dispatch, sayLeft]);

  /** Was this (visible) page just busy, so other tabs' messages and storage changes may still be arriving? */
  const justBusy = useCallback(() => {
    if (document.hidden) return false;
    const t = performance.now();
    return t - lastFrame.current > STALL_MS || t - stallEnd.current < DRAIN_MS;
  }, []);

  // decide, once everything queued meanwhile has arrived (see reconsider).
  const decideRef = useRef<() => void>(() => {});
  /** Decide what to do DRAIN_MS from now (see decide), once for everything that arrives until then. */
  const reconsider = useCallback(() => {
    if (!deciding.current) deciding.current = window.setTimeout(() => decideRef.current(), DRAIN_MS);
  }, []);

  /** Add a copy to this kitchen's line (see copyKey). */
  const addLine = useCallback((key: string | null) => {
    if (key === null || line.current[line.current.length - 1] === key) return;
    line.current = [...line.current.filter((k) => k !== key), key].slice(-LINE_MAX);
  }, []);

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
      lastWritten.current = ref.current;
      if (!untouched.current || heldPlayed.current) rememberPlay(userId, ref.current);
      addLine(ref.current.paused || ref.current.day.completed ? textKey(raw) : copyKey(ref.current));
    } catch {
      ok = false;
    }
    setSaveFailed(!ok);
    return ok;
  }, [addLine, userId]);

  /**
   * Hold the save from this tab: record it as the writer and remember the save as found, then write.
   * A copy this page saved after playing on it counts as played (see playedHere). The line starts
   * with the line handed over with this copy (`from`: a late handover's; else the one handed to
   * this page with it, see requestHandoff), then this copy. When the record can't be written
   * (storage full or blocked), say so over the channel instead (announce).
   */
  const hold = useCallback(
    (from?: string[]) => {
      claimWriter(userId, tabId.current);
      handedOver = null;
      lastRaw.current = readRaw(userId);
      untouched.current = true;
      heldPlayed.current = playedHere(userId, ref.current);
      heldKey.current = copyKey(ref.current);
      line.current = (from ?? handedLineFor(userId, heldKey.current) ?? []).slice(-LINE_MAX);
      addLine(heldKey.current);
      heldAtMs.current = ref.current.nowMs;
      heldSince.current = Date.now();
      released.current = false;
      write();
      if (readWriter(userId) !== tabId.current) announce();
    },
    [addLine, announce, userId, write]
  );

  /**
   * Hold the save again from now (see decide, and a page restored from the back/forward cache): a
   * tab that took it meanwhile has let go, so record this one, or, when that can't be written, say
   * so over the channel.
   */
  const retake = useCallback(() => {
    heldSince.current = Date.now();
    released.current = false;
    claimWriter(userId, tabId.current);
    if (readWriter(userId) !== tabId.current) announce();
  }, [announce, userId]);

  /**
   * A holder that was busy past HANDOFF_MS handed its newer state over after this tab had already
   * opened the older save. If nothing has been played here since (no time has passed and nothing but
   * selections was done), take that state instead of stopping. True when adopted. A copy sent over
   * the channel (`from`: its sender's line) is taken only when it was played on from exactly the
   * copy this kitchen opened (that copy is in its line, see copyKey); any other is a fork. A copy
   * another tab wrote over the save (no line) isn't taken over a copy this page had played on
   * (playedHere): nothing says where it came from.
   */
  const adoptLate = useCallback(
    (raw: string | null | undefined, from?: string[]): boolean => {
      if (fatalRef.current || supersededRef.current || typeof raw !== 'string' || raw === lastRaw.current || raw === adopted.current) return false;
      if (!untouched.current || ref.current.nowMs !== heldAtMs.current || !owns()) return false;
      if (from ? heldKey.current === null || !from.includes(heldKey.current) : heldPlayed.current) return false;
      const latest = readSavedGame(userId, raw);
      // Only a later copy of the same day of the same game (never over a new game or a new day,
      // nor an older copy, e.g. from a tab that was asleep and missed the newer saves, or one from
      // before a purchase on the day summary).
      const s = latest.state;
      if (!s || !laterCopy(s, ref.current)) return false;
      ref.current = s.paused || s.day.completed ? s : applyCommand(s, { type: 'pause' }).state;
      adopted.current = raw;
      hold(from);
      render(ref.current);
      return true;
    },
    [hold, owns, render, userId]
  );

  const heldElsewhere = useCallback(() => !owns() || changedElsewhere(), [changedElsewhere, owns]);

  /**
   * Send this tab's state to the tab that has taken the save (`to`, or whichever tab holds it by
   * the time it arrives: this tab's own record of the writer may be out of date), when it is a later
   * copy of the same day than the save stored there (laterCopy) (a tab that slept through newer saves has
   * nothing to give). That tab takes it if nothing has been played there yet and it opened a copy in
   * this kitchen's line (see adoptLate). Never writes.
   */
  const handLate = useCallback(
    (to: string | null) => {
      if (fatalRef.current || !to || to === tabId.current) return;
      const held = readSavedGame(userId).state;
      const cur = ref.current;
      if (held && !laterCopy(cur, held)) return;
      let raw: string;
      try {
        raw = serializeGame(cur);
      } catch {
        return;
      }
      handedOver = { userId, raw, stored: readRaw(userId) };
      addLine(copyKey(cur));
      try {
        channel.current?.postMessage({ kind: 'ceded', from: tabId.current, to, raw, anyHolder: true, line: [...line.current] } satisfies TabMessage);
      } catch {
        // nothing more can be done from here
      }
    },
    [addLine, userId]
  );

  /**
   * Stop if another tab holds the save or has written it since this one did. A tab that took the
   * save while this one still had newer play (it answered a handover late, or not at all) is sent
   * that play first (handLate).
   *
   * While this tab is the recorded writer, a write by another tab comes from one that doesn't hold
   * the save (it was busy and saw storage as it was before this tab took it over): this tab takes
   * that copy if it is a later copy of this day and nothing has been played here (adoptLate), and
   * otherwise puts its own game back. A tab taking the save over records itself as the writer
   * before it writes, so its write never looks like this. Clearing the save (New game) is not put back.
   *
   * No record while this tab holds the save: a tab that didn't hold it let go of it on its way out
   * (it was busy and saw the record as it was before this tab took the save), so this tab records
   * itself again, putting its game back if that tab wrote too. Unless another tab has asked for
   * the save since this one took it: that tab is taking it over and couldn't record itself
   * (storage full), so this one stops as before. Nor when this page let go of the save itself (a
   * page going into the back/forward cache is frozen after that): it takes the save back only when
   * shown again (onReturn).
   */
  const stillHolds = useCallback((): boolean => {
    if (fatalRef.current || supersededRef.current) return false;
    const writer = readWriter(userId);
    const changed = changedElsewhere();
    const lost = writer === null && !released.current && !askedSince(userId, tabId.current, heldSince.current);
    if (writer === tabId.current || lost) {
      const now = readRaw(userId);
      if (!changed || typeof now === 'string') {
        if (changed && !adoptLate(now)) write();
        if (lost) claimWriter(userId, tabId.current);
        return true;
      }
    }
    if ((writer !== null && writer !== tabId.current) || changed) {
      handLate(writer);
      supersede();
      return false;
    }
    return true;
  }, [adoptLate, changedElsewhere, handLate, supersede, userId, write]);

  // Autosave (off once the simulation has failed, so a bad state never replaces the last good save,
  // and off once another tab holds or has written the save, so this one never overwrites it).
  const save = useCallback((): boolean => {
    if (fatalRef.current || supersededRef.current) return true;
    if (!stillHolds()) return true;
    // Nothing new since the last write (e.g. paused in a hidden tab): writing it again could only
    // put an out-of-date copy over another tab's save.
    if (ref.current === lastWritten.current) return true;
    return write();
  }, [stillHolds, write]);

  /**
   * Run `then` now, or, when the page was just busy (no frame for STALL_MS, or the first frame
   * after such a stall ran less than SETTLE_MS ago), a moment later: other tabs' storage changes
   * queued meanwhile reach this page first, so `then` sees storage as it is. A hidden page (no
   * frames) waits once.
   */
  const settled = useCallback((then: () => void, tries = 0) => {
    // Also just after a stall ended (a frame may run before the tasks queued meanwhile), and while
    // a decision on other tabs' messages is due (see decide): it may stop this kitchen.
    const t = performance.now();
    const busy = (t - lastFrame.current > STALL_MS && (tries === 0 || !document.hidden)) || (!document.hidden && t - stallEnd.current < SETTLE_MS) || deciding.current !== 0;
    if (busy && tries < SETTLE_TRIES) {
      window.setTimeout(() => settled(then, tries + 1), SETTLE_MS);
      return;
    }
    then();
  }, []);

  const saveSettled = useCallback((then: (saved: boolean) => void) => settled(() => then(save())), [save, settled]);

  /**
   * Hand the save to the tab that asked for it (`at`: when it asked): pause, save the latest state,
   * send it to that tab, record it as the writer, stop. A stale tab (another one wrote the save
   * since) sends nothing. Answering late, after the asking tab stopped waiting (it opens the save as
   * stored, or already holds it), or right after this page was busy (what it sees of the other tabs
   * may be out of date), it decides once everything queued meanwhile has arrived (see decide;
   * `now`: that decision, which answers at once).
   */
  const cede = useCallback(
    (to: string, at?: number, now = false) => {
      if (fatalRef.current || supersededRef.current) return;
      const late = readWriter(userId) === to || (typeof at === 'number' && Date.now() - at >= HANDOFF_MS);
      if (late || (!now && (justBusy() || deciding.current !== 0))) {
        const ask = askPending.current;
        if (typeof at === 'number' && (!ask || at >= ask.at)) askPending.current = { from: to, at };
        if (late) contested.current = true;
        reconsider();
        return;
      }
      if (!stillHolds()) return;
      if (!ref.current.paused && !ref.current.day.completed) dispatch({ type: 'pause' }, { silent: true });
      write();
      let raw: string | null = null;
      try {
        raw = serializeGame(ref.current);
      } catch {
        raw = null;
      }
      if (raw !== null) {
        handedOver = { userId, raw, stored: readRaw(userId) };
        addLine(textKey(raw));
      }
      try {
        channel.current?.postMessage({ kind: 'ceded', from: tabId.current, to, raw, line: [...line.current] } satisfies TabMessage);
      } catch {
        // the asking tab reads storage instead
      }
      claimWriter(userId, to);
      supersede();
    },
    [addLine, dispatch, justBusy, reconsider, stillHolds, supersede, userId, write]
  );

  /** Is `raw` (the save as stored) a copy in this kitchen's line (see copyKey)? */
  const ownCopy = useCallback(
    (raw: string | null) => {
      if (raw === null) return false;
      const s = readSavedGame(userId, raw).state;
      const key = s ? copyKey(s) : null;
      return key !== null && line.current.includes(key);
    },
    [userId]
  );

  /**
   * Once everything queued while this page was busy (or while it answered an ask late, or since
   * another kitchen said it took the save) has arrived, decide from all of it at once:
   * - a kitchen elsewhere holds the save now (its record, or the latest 'took' after this kitchen's
   *   that hasn't been followed by its 'left'): send it this kitchen's newer play, and stop;
   * - else a tab that asked is still waiting: hand the save over as usual (cede);
   * - else every kitchen that took the save meanwhile has let go of it: go on playing and hold it
   *   again (retake), saving this kitchen's play, so the next tab to ask gets it; unless the save
   *   now holds another tab's play (it played on and left): this kitchen's game is a fork of that,
   *   so it stops.
   */
  const decide = useCallback(() => {
    deciding.current = 0;
    const ask = askPending.current;
    askPending.current = null;
    const wasContested = contested.current;
    contested.current = false;
    const since = heldSince.current;
    const live = [...takers.current].filter(([from, t]) => t.at > since || (t.at === since && from > tabId.current));
    takers.current.clear();
    if (fatalRef.current || supersededRef.current) return;
    live.sort((a, b) => b[1].at - a[1].at || (a[0] < b[0] ? 1 : -1));
    const writer = readWriter(userId);
    const other = writer !== null && writer !== tabId.current ? writer : live.length ? live[0][0] : null;
    if (other !== null) {
      handLate(other);
      supersede();
      return;
    }
    if (ask && Date.now() - ask.at < HANDOFF_MS) {
      cede(ask.from, ask.at, true);
      return;
    }
    if (!wasContested && !ask) {
      stillHolds();
      return;
    }
    const stored = readRaw(userId);
    if (stored !== undefined && stored !== lastRaw.current && !ownCopy(stored)) {
      supersede();
      return;
    }
    retake();
    save();
  }, [cede, handLate, ownCopy, retake, save, stillHolds, supersede, userId]);
  decideRef.current = decide;

  const takeOver = useCallback(async () => {
    const handed = await requestHandoff(userId);
    // This kitchen's own channel takes any late handover from here; one kept from before is taken
    // if it follows from the copy opened now (see adoptLate).
    const late = takeLateHandover(userId);
    const latest = readSavedGame(userId, handed.raw);
    if (!latest.state) return false;
    // Picked up paused, so the clock waits for the player to resume here.
    const s = latest.state;
    ref.current = s.paused || s.day.completed ? s : applyCommand(s, { type: 'pause' }).state;
    supersededRef.current = false;
    setSuperseded(false);
    hold();
    render(ref.current);
    if (late) adoptLate(late.raw, late.line);
    return true;
  }, [adoptLate, hold, render, userId]);

  // Pause (and save) when hidden, so another tab opened meanwhile starts from the latest state.
  // When shown again (or restored from the back/forward cache, or resumed after a freeze), check
  // at once that no other tab has taken or written the save meanwhile.
  useEffect(() => {
    // A page restored from the back/forward cache said it left (see sayLeft): it holds the save
    // again from now, and says so (retake).
    const onReturn = () =>
      settled(() => {
        if (!stillHolds()) return;
        const back = released.current;
        released.current = false;
        if (readWriter(userId) !== null) return;
        if (back) retake();
        else claimWriter(userId, tabId.current);
      });
    const onVisibility = () => {
      if (!document.hidden) {
        onReturn();
        return;
      }
      if (!ref.current.paused && !ref.current.day.completed) dispatch({ type: 'pause' });
      settled(save);
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
  }, [dispatch, retake, save, settled, stillHolds, userId]);

  useEffect(() => {
    const onAsk = (from: unknown, at: unknown) => {
      if (typeof from !== 'string' || from === tabId.current) return;
      const fresh = typeof at === 'number' && Math.abs(Date.now() - at) < HANDOFF_FRESH_MS;
      // An older ask still counts when the asking tab has since taken the save: this tab was busy,
      // and only sends what it has (see cede).
      if (fresh || readWriter(userId) === from) cede(from, typeof at === 'number' ? at : undefined);
    };
    // Another kitchen took the save but couldn't record itself (see announce), so an ask from it
    // that this tab saw too late to answer (it was busy) doesn't show that it took the save. Of two
    // kitchens the later keeps it (the larger tab id on a tie): this one decides once the messages
    // queued meanwhile have all arrived (see decide), since that kitchen may have handed the save
    // on (that one's 'took' comes later too) or let go of it ('left').
    const onTook = (from: unknown, at: unknown, seq: unknown) => {
      if (typeof from !== 'string' || from === tabId.current || typeof at !== 'number' || typeof seq !== 'number') return;
      if (seq <= (ended.current.get(from) ?? 0) || fatalRef.current || supersededRef.current) return;
      if (!(at > heldSince.current || (at === heldSince.current && from > tabId.current))) return;
      const t = takers.current.get(from);
      if (!t || at > t.at || (at === t.at && seq > t.seq)) takers.current.set(from, { at, seq });
      contested.current = true;
      reconsider();
    };
    // A page's holds are counted, so a 'left' that arrives after that page's next 'took' (a kitchen
    // remounting sends both at once, over two channels) doesn't end the newer hold.
    const onLeft = (from: unknown, seq: unknown) => {
      if (typeof from !== 'string' || typeof seq !== 'number') return;
      ended.current.set(from, Math.max(seq, ended.current.get(from) ?? 0));
      const t = takers.current.get(from);
      if (t && t.seq <= seq) takers.current.delete(from);
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
      if (e.key !== writerKey(userId) && e.key !== saveKey(userId)) return;
      // Right after this page was busy, the change may be one of several queued meanwhile (the tab
      // that took the save may have handed it on, or left): decide once they have all arrived.
      if (justBusy() || deciding.current !== 0) {
        contested.current = true;
        reconsider();
        return;
      }
      stillHolds();
    };
    channel.current = openChannel(userId);
    if (channel.current) {
      channel.current.onmessage = (e: MessageEvent<TabMessage>) => {
        if (e.data?.kind === 'ask') onAsk(e.data.from, e.data.at);
        else if (e.data?.kind === 'took') onTook(e.data.from, e.data.at, e.data.seq);
        else if (e.data?.kind === 'left') onLeft(e.data.from, e.data.seq);
        // A handover that arrives after this tab stopped waiting for it: for this tab, or for
        // whichever holds the save (this one, if it does by its record or there is none; see owns).
        else if (e.data?.kind === 'ceded' && (e.data.to === tabId.current || (e.data.anyHolder && owns()))) adoptLate(e.data.raw, lineOf(e.data));
      };
    }
    // The channel is open before this kitchen takes the save, so a holder that answers the moment
    // it sees that (handLate) reaches it; until LATE_LISTEN_MS the start screen's listener hands
    // anything still on its way here too.
    const sink = { userId, take: (raw: string, from: string[]) => void adoptLate(raw, from) };
    lateSink = sink;
    // This kitchen holds the save from now on; another tab's kitchen stops writing when it sees this.
    const mine = ++kitchenSeq;
    const found = readRaw(userId);
    hold();
    // A late handover written while this kitchen was opening (the save changed after the start
    // screen read it): take it rather than keep the older copy (adoptLate decides).
    const read = opened.current;
    if (read && typeof found === 'string' && found !== read.stored) adoptLate(found);
    // One that came over the channel before this kitchen was open.
    const late = takeLateHandover(userId);
    if (late) adoptLate(late.raw, late.line);
    /** Leaving the page or the kitchen lets go of the save, so a tab that asks next doesn't wait for an answer that will never come. */
    const letGo = () => {
      released.current = true;
      if (readWriter(userId) !== tabId.current) return;
      try {
        window.localStorage.removeItem(writerKey(userId));
      } catch {
        // ignore
      }
    };
    // A page put in the back/forward cache lets go too (and says so, see sayLeft); restored, it
    // takes the save back only if nobody took or wrote it meanwhile (see onReturn above).
    const onPageHide = () => {
      save();
      sayLeft();
      letGo();
    };
    const id = window.setInterval(() => settled(save), AUTOSAVE_MS);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('storage', onStorage);
    return () => {
      if (lateSink === sink) lateSink = null;
      window.clearInterval(id);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('storage', onStorage);
      window.clearTimeout(deciding.current);
      deciding.current = 0;
      takers.current.clear();
      sayLeft();
      channel.current?.close();
      channel.current = null;
      // Right after a long task, once other tabs' storage changes have reached this page (as in
      // settled), unless another kitchen has opened in this page meanwhile.
      if (performance.now() - lastFrame.current > STALL_MS) {
        window.setTimeout(() => {
          if (kitchenSeq !== mine) return;
          save();
          letGo();
        }, SETTLE_MS);
        return;
      }
      save();
      letGo();
    };
  }, [adoptLate, cede, hold, justBusy, reconsider, save, sayLeft, settled, stillHolds, userId]);

  return { state, dispatch, lastError, fatal, superseded, takeOver, saveNow: save, saveSettled, saveFailed, heldElsewhere };
}
