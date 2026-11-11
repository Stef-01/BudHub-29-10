// services/cookventure/analytics.ts
// Cookventure event tracking: Vercel custom events, a best-effort Supabase log, and a local
// event log that powers preference insights, the plan's success metrics, and per-variant outcomes.
import { track } from '@vercel/analytics';
import { supabase } from '../../lib/supabase';
import { getUserId } from '../../hooks/useUserId';
import type { UserPreferences } from '../../types/cookventure';

export type CookventureEvent =
  | 'survey_started'
  | 'step_completed'
  | 'kit_applied'
  | 'survey_completed'
  | 'results_shown'
  | 'playlist_selected'
  | 'details_opened'
  | 'tadka_swapped'
  | 'masala_swapped'
  | 'lower_sugar'
  | 'make_this'
  | 'recipe_rated'
  | 'recipe_saved';

type PropValue = string | number | boolean | null | undefined | string[];
export type EventProps = Record<string, PropValue>;

export interface LoggedEvent {
  event: CookventureEvent;
  at: number;
  userId: string;
  sessionId: string;
  variant?: string;
  props: EventProps;
}

const LOG_KEY = 'cookventure.events.v1';
const LAST_PREFS_KEY = 'cookventure.lastPrefs.v1';
const MAX_LOG = 600;

let sessionId = newSessionId();
let currentVariant: string | undefined;

function newSessionId(): string {
  return `cv_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** Start a new survey session (new id), e.g. on "Start over" */
export function startNewSession(): string {
  sessionId = newSessionId();
  return sessionId;
}

/** Scoring-weight variant to attach to every event from now on */
export function setAnalyticsVariant(variant: string): void {
  currentVariant = variant;
}

function readLog(): LoggedEvent[] {
  try {
    const raw = window.localStorage.getItem(LOG_KEY);
    return raw ? (JSON.parse(raw) as LoggedEvent[]) : [];
  } catch {
    return [];
  }
}

function writeLog(events: LoggedEvent[]): void {
  try {
    window.localStorage.setItem(LOG_KEY, JSON.stringify(events.slice(-MAX_LOG)));
  } catch {
    // Storage full or blocked: analytics are best-effort
  }
}

/** Vercel custom events only take flat primitive values */
function flatten(props: EventProps): Record<string, string | number | boolean | null> {
  const flat: Record<string, string | number | boolean | null> = {};
  Object.entries(props).forEach(([key, value]) => {
    if (value === undefined) return;
    flat[key] = Array.isArray(value) ? value.join(',') : value;
  });
  return flat;
}

/**
 * Record a Cookventure event. Never throws; each sink is best-effort.
 */
export function trackCookventure(event: CookventureEvent, props: EventProps = {}): void {
  const entry: LoggedEvent = {
    event,
    at: Date.now(),
    userId: getUserId(),
    sessionId,
    variant: currentVariant,
    props,
  };

  writeLog([...readLog(), entry]);

  try {
    track(`cookventure_${event}`, { ...flatten(props), variant: currentVariant ?? null, userId: entry.userId });
  } catch {
    // Vercel analytics unavailable (e.g. local dev)
  }

  supabase
    .from('cookventure_events')
    .insert([{ user_id: entry.userId, session_id: sessionId, event, variant: currentVariant ?? null, props }])
    .then(({ error }) => {
      if (error && import.meta.env?.DEV) console.debug('[cookventure] event not stored remotely:', error.message);
    }, () => {});
}

/** The local event log (this browser only), oldest first */
export function getLocalEvents(): LoggedEvent[] {
  return readLog();
}

export function clearLocalEvents(): void {
  try {
    window.localStorage.removeItem(LOG_KEY);
  } catch {
    // ignore
  }
}

// --- Remembered answers (repeat visits) ----------------------------------------

export function saveLastPreferences(prefs: UserPreferences): void {
  try {
    window.localStorage.setItem(LAST_PREFS_KEY, JSON.stringify({ savedAt: Date.now(), prefs }));
  } catch {
    // ignore
  }
}

export function loadLastPreferences(): { savedAt: number; prefs: UserPreferences } | null {
  try {
    const raw = window.localStorage.getItem(LAST_PREFS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// --- Insights & metrics -------------------------------------------------------

const countItems = (lists: string[][]) => {
  const counts: Record<string, number> = {};
  lists.flat().forEach((item) => {
    counts[item] = (counts[item] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([id, count]) => ({ id, count }));
};

const asList = (value: PropValue): string[] => (Array.isArray(value) ? value : []);

/** Which regions, masalas and tadkas people pick, most popular first */
export function getPreferenceInsights(events: LoggedEvent[] = readLog()) {
  const completed = events.filter((e) => e.event === 'survey_completed');
  return {
    surveys: completed.length,
    regions: countItems(completed.map((e) => asList(e.props.regions))),
    subregions: countItems(completed.map((e) => asList(e.props.subregions))),
    masalas: countItems(completed.map((e) => asList(e.props.masalas))),
    tadkas: countItems(completed.map((e) => asList(e.props.tadkas))),
    topMatchRegions: countItems(
      events.filter((e) => e.event === 'results_shown').map((e) => asList(e.props.topRegions))
    ),
  };
}

const ratio = (numerator: number, denominator: number) => (denominator > 0 ? numerator / denominator : null);

/**
 * The plan's success metrics (section 10), computed from an event log.
 * Ratios are 0-1, or null when there isn't enough data yet.
 */
export function computeSuccessMetrics(events: LoggedEvent[] = readLog()) {
  const bySession = new Map<string, LoggedEvent[]>();
  events.forEach((e) => bySession.set(e.sessionId, [...(bySession.get(e.sessionId) || []), e]));
  const sessions = [...bySession.values()];
  const has = (session: LoggedEvent[], ...names: CookventureEvent[]) => session.some((e) => names.includes(e.event));

  const started = sessions.filter((s) => has(s, 'survey_started'));
  const withResults = sessions.filter((s) => has(s, 'results_shown'));

  const timesToMatch = started
    .map((s) => {
      const start = s.find((e) => e.event === 'survey_started')!.at;
      const firstResults = s.find((e) => e.event === 'results_shown')?.at;
      return firstResults ? firstResults - start : undefined;
    })
    .filter((t): t is number => t !== undefined);

  const topThreeRatings = events
    .filter((e) => e.event === 'recipe_rated' && Number(e.props.rank) <= 3)
    .map((e) => Number(e.props.stars));

  const completedSurveys = events.filter((e) => e.event === 'survey_completed');

  // Repeat usage: people with activity on two different days at most 7 days apart
  const daysByUser = new Map<string, number[]>();
  events.forEach((e) => {
    const day = Math.floor(e.at / 86_400_000);
    const days = daysByUser.get(e.userId) || [];
    if (!days.includes(day)) days.push(day);
    daysByUser.set(e.userId, days);
  });
  const users = [...daysByUser.values()];
  const returned = users.filter((days) => {
    const sorted = [...days].sort((a, b) => a - b);
    return sorted.some((day, i) => i > 0 && day - sorted[i - 1] <= 7);
  });

  return {
    sessions: sessions.length,
    surveyCompletionRate: ratio(started.filter((s) => has(s, 'survey_completed')).length, started.length),
    medianSecondsToFirstMatch:
      timesToMatch.length > 0 ? Math.round(median(timesToMatch) / 1000) : null,
    swapExplorationRate: ratio(
      withResults.filter((s) => has(s, 'tadka_swapped', 'masala_swapped', 'lower_sugar')).length,
      withResults.length
    ),
    topThreeAverageRating:
      topThreeRatings.length > 0 ? topThreeRatings.reduce((a, b) => a + b, 0) / topThreeRatings.length : null,
    makeThisRate: ratio(withResults.filter((s) => has(s, 'make_this')).length, withResults.length),
    repeatUsageRate: ratio(returned.length, users.length),
    multiRegionRate: ratio(
      completedSurveys.filter((e) => asList(e.props.regions).length >= 2).length,
      completedSurveys.length
    ),
  };
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Outcomes per scoring-weight variant: how often results lead to opening, cooking and rating a
 * recipe, and how high up the list opened recipes were (mean reciprocal rank: 1 = always the top).
 */
export function computeVariantOutcomes(events: LoggedEvent[] = readLog()) {
  const variants = [...new Set(events.map((e) => e.variant).filter(Boolean))] as string[];
  return variants.map((variant) => {
    const ev = events.filter((e) => e.variant === variant);
    const sessions = new Set(ev.filter((e) => e.event === 'results_shown').map((e) => e.sessionId));
    const opened = ev.filter((e) => e.event === 'details_opened');
    const cookedSessions = new Set(ev.filter((e) => e.event === 'make_this').map((e) => e.sessionId));
    const ratings = ev.filter((e) => e.event === 'recipe_rated').map((e) => Number(e.props.stars));
    const ranks = opened.map((e) => Number(e.props.rank)).filter((r) => r > 0);
    return {
      variant,
      resultSessions: sessions.size,
      detailsOpened: opened.length,
      makeThisRate: ratio(cookedSessions.size, sessions.size),
      averageRating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
      meanReciprocalRank: ranks.length > 0 ? ranks.reduce((sum, r) => sum + 1 / r, 0) / ranks.length : null,
    };
  });
}

/** Aggregate counts across all users (Supabase), or null when unavailable */
export async function fetchRemoteInsights(days = 30): Promise<Record<string, unknown> | null> {
  try {
    const since = new Date(Date.now() - days * 86_400_000).toISOString();
    const { data, error } = await supabase.rpc('cookventure_insights', { since });
    return error ? null : (data as Record<string, unknown>);
  } catch {
    return null;
  }
}
