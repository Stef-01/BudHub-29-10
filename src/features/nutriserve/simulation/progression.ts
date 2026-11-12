// PROGRESSION_V1 (ADAPTATION): ranks from points, and upgrades bought with coins.
// Upgrade effects either switch on the reference's "furniture" bonuses (which the recovered
// Build/Mix functions already support) or adjust provisional rules, and say which.

// v2: four upgrades at ranks 5-8 with effects a strong player still feels (in v1 everything was
// bought by about day 6 and ranks 5-10 unlocked nothing).
// v3: the rank 5-8 upgrades help where busy days actually cost points (waiting for food, and
// cooking time). v2's serving trolley (coins, which pile up unused by then) and head chef's
// whites (rank points, when ranks unlock nothing more) are retired, and the chai stall is cheaper.
export const PROGRESSION_VERSION = 'progression-v3';

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
    | { kind: 'buildFurniture'; categories: Array<'cup' | 'mixable' | 'syrup'> }
    | { kind: 'prepFurniture' }
    | { kind: 'waitingGraceMs'; ms: number }
    | { kind: 'finishBonus'; points: number }
    | { kind: 'heatRisePerMs'; heat: number }
    | { kind: 'lobbyGraceMs'; ms: number }
    | { kind: 'ticketGraceMs'; ms: number }
    | { kind: 'boostMultiplier'; times: number };
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
    description: 'Build score +1 when both the vessel and the base food are right.',
    cost: 20,
    unlockRank: 1,
    effect: { kind: 'buildFurniture', categories: ['cup'] },
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
    description: 'Build score +1 each for the right main and the right side.',
    cost: 40,
    unlockRank: 2,
    effect: { kind: 'buildFurniture', categories: ['mixable', 'syrup'] },
  },
  copper_handis: {
    id: 'copper_handis',
    label: 'Copper handi set',
    hi: 'तांबे की हांडी',
    description: 'Prep score +3, capped at 100.',
    cost: 55,
    unlockRank: 3,
    effect: { kind: 'prepFurniture' },
  },
  garnish_tray: {
    id: 'garnish_tray',
    label: 'Garnish tray',
    hi: 'सजावट की थाली',
    description: 'Finish score +3, capped at 100.',
    cost: 35,
    unlockRank: 2,
    effect: { kind: 'finishBonus', points: 3 },
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
    description: 'Boost cooks three times as fast instead of two and a half.',
    cost: 120,
    unlockRank: 8,
    effect: { kind: 'boostMultiplier', times: 3 },
  },
};

export interface UpgradeEffects {
  buildFurniture: { cup: boolean; mixable: boolean; syrup: boolean };
  prepFurniture: boolean;
  waitingGraceMs: number;
  finishBonus: number;
  /** Heat added per boosting millisecond, if an upgrade lowers it (else PREP_V1.heatRisePerMs). */
  heatRisePerMs?: number;
  lobbyGraceMs: number;
  ticketGraceMs: number;
  /** Boost speed, if an upgrade raises it (else PREP_V1.boostMultiplier). */
  boostMultiplier?: number;
}

export function upgradeEffects(owned: readonly string[]): UpgradeEffects {
  const effects: UpgradeEffects = {
    buildFurniture: { cup: false, mixable: false, syrup: false },
    prepFurniture: false,
    waitingGraceMs: 0,
    finishBonus: 0,
    lobbyGraceMs: 0,
    ticketGraceMs: 0,
  };
  for (const id of owned) {
    const effect = Object.hasOwn(UPGRADES, id) ? UPGRADES[id].effect : undefined;
    if (!effect) continue;
    if (effect.kind === 'buildFurniture') effect.categories.forEach((c) => (effects.buildFurniture[c] = true));
    else if (effect.kind === 'prepFurniture') effects.prepFurniture = true;
    else if (effect.kind === 'waitingGraceMs') effects.waitingGraceMs += effect.ms;
    else if (effect.kind === 'finishBonus') effects.finishBonus += effect.points;
    else if (effect.kind === 'heatRisePerMs') effects.heatRisePerMs = Math.min(effects.heatRisePerMs ?? Infinity, effect.heat);
    else if (effect.kind === 'lobbyGraceMs') effects.lobbyGraceMs += effect.ms;
    else if (effect.kind === 'ticketGraceMs') effects.ticketGraceMs += effect.ms;
    else if (effect.kind === 'boostMultiplier') effects.boostMultiplier = Math.max(effects.boostMultiplier ?? 0, effect.times);
  }
  return effects;
}
