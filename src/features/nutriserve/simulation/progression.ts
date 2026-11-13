// PROGRESSION (ADAPTATION): ranks from points, and upgrades bought with coins. Each upgrade adjusts
// one of NutriServe's own rules (./params.ts) and says how in its description.

// v2: four upgrades at ranks 5-8 with effects a strong player still feels (in v1 everything was
// bought by about day 6 and ranks 5-10 unlocked nothing).
// v3: the rank 5-8 upgrades help where busy days actually cost points (waiting for food, and
// cooking time). v2's serving trolley (coins, which pile up unused by then) and head chef's
// whites (rank points, when ranks unlock nothing more) are retired, and the chai stall is cheaper.
// v4: the serving tools widen the exact band of build-v5 instead of adding a point, copper handis
// widen prep-v3's perfect window instead of adding three, and pressure lids also let go of the boost
// when a dish reaches its mark (in v3 a late release under lids overcooked more than without them).
// v5: the garnish tray catches pieces dropped outside the katori instead of adding points to the
// finish score, and the serving tools and copper handis are described for build-v6 and prep-v4.
// v6: the garnish tray also halves what an off-centre garnish costs (catching dropped pieces alone
// was worth well under a point a serve) and costs 30 instead of 35; the base scoop is described for
// every base (it always covered idli and the rest, not only rice and roti); copper handis are
// described for prep-v5.
// v7: copper handis are described for prep-v6 (1.8 s instead of 1.2); no rule changed.
// v8: copper handis are described for prep-v7 to prep-v9 (1.9 s instead of 1.3); no rule changed.
export const PROGRESSION_VERSION = 'progression-v8';

/** Cumulative points needed for each rank (index 0 = rank 1). */
export const RANK_THRESHOLDS = [0, 40, 100, 180, 280, 400, 550, 720, 920, 1150];

export function rankForPoints(points: number): number {
  let rank = 1;
  RANK_THRESHOLDS.forEach((threshold, i) => {
    if (points >= threshold) rank = i + 1;
  });
  return rank;
}

export interface UpgradeDef {
  id: string;
  label: string;
  hi: string;
  description: string;
  cost: number;
  unlockRank: number;
  effect:
    | { kind: 'portionBand'; components: Array<'base' | 'main' | 'side'> }
    | { kind: 'prepBand' }
    | { kind: 'waitingGraceMs'; ms: number }
    | { kind: 'catchFallen' }
    | { kind: 'heatRisePerMs'; heat: number }
    | { kind: 'lobbyGraceMs'; ms: number }
    | { kind: 'ticketGraceMs'; ms: number }
    | { kind: 'boostMultiplier'; times: number; whistle: boolean };
}

/**
 * Upgrades that earlier rules sold and this version retired, with what they cost. A save that owned
 * one gets those coins back instead of losing them.
 */
export const RETIRED_UPGRADES: Record<string, { label: string; cost: number }> = {
  serving_trolley: { label: 'Serving trolley', cost: 90 }, // progression-v2
  head_chef_whites: { label: "Head chef's whites", cost: 140 }, // progression-v2
};

export const UPGRADES: Record<string, UpgradeDef> = {
  rice_scoop: {
    id: 'rice_scoop',
    label: 'Brass rice scoop',
    hi: 'पीतल का चम्मच',
    description: 'Every base (rice, roti, idli and the rest) counts as exact within 15% of the line (7% without).',
    cost: 20,
    unlockRank: 1,
    effect: { kind: 'portionBand', components: ['base'] },
  },
  brass_bell: {
    id: 'brass_bell',
    label: 'Brass counter bell',
    hi: 'घंटी',
    description: 'Customers stay patient 8 seconds longer at the counter, and again while waiting for food.',
    cost: 25,
    unlockRank: 1,
    effect: { kind: 'waitingGraceMs', ms: 8_000 },
  },
  steel_ladles: {
    id: 'steel_ladles',
    label: 'Steel ladle set',
    hi: 'करछी',
    description: 'Mains and sides count as exact within 15% of the line (7% without).',
    cost: 40,
    unlockRank: 2,
    effect: { kind: 'portionBand', components: ['main', 'side'] },
  },
  copper_handis: {
    id: 'copper_handis',
    label: 'Copper handi set',
    hi: 'तांबे की हांडी',
    description: 'A wider perfect window at each mark: 1.9 seconds on the flame either side instead of 1.3.',
    cost: 55,
    unlockRank: 3,
    effect: { kind: 'prepBand' },
  },
  garnish_tray: {
    id: 'garnish_tray',
    label: 'Garnish tray',
    hi: 'सजावट की थाली',
    description:
      'A garnish piece dropped outside the katori lands back on the tray instead of falling off, and an off-centre garnish costs half as much.',
    cost: 30,
    unlockRank: 2,
    effect: { kind: 'catchFallen' },
  },
  insulated_handis: {
    id: 'insulated_handis',
    label: 'Insulated handis',
    hi: 'मोटी तली की हांडी',
    description: 'Handis heat up 40% more slowly while boosting, so a boost lasts longer before they overheat.',
    cost: 70,
    unlockRank: 5,
    effect: { kind: 'heatRisePerMs', heat: 3 },
  },
  chai_stall: {
    id: 'chai_stall',
    label: 'Chai stall by the queue',
    hi: 'चाय की दुकान',
    description: 'Customers queuing at the counter stay patient 12 seconds longer.',
    cost: 50,
    unlockRank: 6,
    effect: { kind: 'lobbyGraceMs', ms: 12_000 },
  },
  tiffin_rack: {
    id: 'tiffin_rack',
    label: 'Tiffin rack',
    hi: 'टिफ़िन रैक',
    description: 'Customers waiting for their food stay patient 15 seconds longer.',
    cost: 90,
    unlockRank: 7,
    effect: { kind: 'ticketGraceMs', ms: 15_000 },
  },
  pressure_lid: {
    id: 'pressure_lid',
    label: 'Pressure lids',
    hi: 'प्रेशर ढक्कन',
    description:
      'Boost cooks three times as fast instead of two and a half, and the whistle lets go of the boost as a dish enters its perfect window.',
    cost: 120,
    unlockRank: 8,
    effect: { kind: 'boostMultiplier', times: 3, whistle: true },
  },
};

/** The garnish tray's share of the garnish balance penalty. */
export const GARNISH_TRAY_BALANCE_SCALE = 0.5;

export interface UpgradeEffects {
  /** Components whose exact band is widened (BUILD_V1.toolExactBand). */
  portionBand: { base: boolean; main: boolean; side: boolean };
  /** Whether the prep perfect window is widened (PREP_V1.wideBandUnits). */
  prepBand: boolean;
  waitingGraceMs: number;
  /** Garnish pieces dropped outside the katori are caught instead of falling off. */
  catchFallen: boolean;
  /** Share of the garnish balance penalty charged (the garnish tray halves it). */
  garnishBalanceScale: number;
  /** Heat added per boosting millisecond, if an upgrade lowers it (else PREP_V1.heatRisePerMs). */
  heatRisePerMs?: number;
  lobbyGraceMs: number;
  ticketGraceMs: number;
  /** Boost speed, if an upgrade raises it (else PREP_V1.boostMultiplier). */
  boostMultiplier?: number;
  /** A boost lets go by itself when its dish reaches the start of its perfect window. */
  whistle: boolean;
}

export function upgradeEffects(owned: readonly string[]): UpgradeEffects {
  const effects: UpgradeEffects = {
    portionBand: { base: false, main: false, side: false },
    prepBand: false,
    waitingGraceMs: 0,
    catchFallen: false,
    garnishBalanceScale: 1,
    lobbyGraceMs: 0,
    ticketGraceMs: 0,
    whistle: false,
  };
  for (const id of owned) {
    const effect = Object.hasOwn(UPGRADES, id) ? UPGRADES[id].effect : undefined;
    if (!effect) continue;
    if (effect.kind === 'portionBand') effect.components.forEach((c) => (effects.portionBand[c] = true));
    else if (effect.kind === 'prepBand') effects.prepBand = true;
    else if (effect.kind === 'waitingGraceMs') effects.waitingGraceMs += effect.ms;
    else if (effect.kind === 'catchFallen') {
      effects.catchFallen = true;
      effects.garnishBalanceScale = Math.min(effects.garnishBalanceScale, GARNISH_TRAY_BALANCE_SCALE);
    }
    else if (effect.kind === 'heatRisePerMs') effects.heatRisePerMs = Math.min(effects.heatRisePerMs ?? Infinity, effect.heat);
    else if (effect.kind === 'lobbyGraceMs') effects.lobbyGraceMs += effect.ms;
    else if (effect.kind === 'ticketGraceMs') effects.ticketGraceMs += effect.ms;
    else if (effect.kind === 'boostMultiplier') {
      effects.boostMultiplier = Math.max(effects.boostMultiplier ?? 0, effect.times);
      effects.whistle ||= effect.whistle;
    }
  }
  return effects;
}
