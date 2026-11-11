// services/cookventure/experiments.ts
// A/B test of scoring weights. Assignment is deterministic per person (their ?user= id, or a
// per-device id for guests), so the same person always sees the same ranking.
import type { ScoringWeights } from '../../types/cookventure';
import { DEFAULT_SCORING_WEIGHTS } from '../../types/cookventure';
import { getUserId } from '../../hooks/useUserId';

export interface WeightVariant {
  id: string;
  label: string;
  description: string;
  weights: ScoringWeights;
  /** Share of people assigned to this variant, 0-100; shares must add up to 100 */
  share: number;
}

export const SCORING_EXPERIMENT = {
  id: 'cv_weights_2026_11',
  variants: [
    {
      id: 'control',
      label: 'Pantry first',
      description: 'The plan\'s weights: pantry 45, region 15, masala 15, tadka 10, flavor 10',
      weights: DEFAULT_SCORING_WEIGHTS,
      share: 50,
    },
    {
      id: 'flavor_forward',
      label: 'Flavor forward',
      description: 'Shifts 10 points from pantry to flavor: pantry 35, flavor 20',
      weights: { ...DEFAULT_SCORING_WEIGHTS, pantry: 35, flavor_axes: 20 },
      share: 50,
    },
  ] as WeightVariant[],
};

const DEVICE_KEY = 'cookventure.deviceId.v1';

/** Stable id for this browser, used when the visitor has no ?user= id */
export function getDeviceId(): string {
  try {
    const existing = window.localStorage.getItem(DEVICE_KEY);
    if (existing) return existing;
    const id = `dev_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
    window.localStorage.setItem(DEVICE_KEY, id);
    return id;
  } catch {
    return 'dev_unavailable';
  }
}

/** Who the experiment assigns: the named user, or this device for guests */
export function getExperimentSubject(): string {
  const userId = getUserId();
  return userId && userId !== 'guest' ? userId : getDeviceId();
}

/** FNV-1a 32-bit hash, deterministic across browsers */
function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Pick the variant for a subject; a valid ?cv_variant= in the URL overrides it (for QA) */
export function assignVariant(subject: string = getExperimentSubject(), search: string = typeof window !== 'undefined' ? window.location.search : ''): WeightVariant {
  const override = new URLSearchParams(search).get('cv_variant');
  const forced = SCORING_EXPERIMENT.variants.find((v) => v.id === override);
  if (forced) return forced;

  const bucket = hash(`${SCORING_EXPERIMENT.id}:${subject}`) % 100;
  let cumulative = 0;
  for (const variant of SCORING_EXPERIMENT.variants) {
    cumulative += variant.share;
    if (bucket < cumulative) return variant;
  }
  return SCORING_EXPERIMENT.variants[0];
}
