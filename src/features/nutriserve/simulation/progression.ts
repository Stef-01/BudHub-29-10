// PROGRESSION_V1 (ADAPTATION): ranks from points, and upgrades bought with coins.
// Upgrade effects either switch on the reference's "furniture" bonuses (which the recovered
// Build/Mix functions already support) or adjust provisional rules, and say which.

export const PROGRESSION_VERSION = 'progression-v1';

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
    | { kind: 'finishBonus'; points: number };
}

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
};

export interface UpgradeEffects {
  buildFurniture: { cup: boolean; mixable: boolean; syrup: boolean };
  prepFurniture: boolean;
  waitingGraceMs: number;
  finishBonus: number;
}

export function upgradeEffects(owned: readonly string[]): UpgradeEffects {
  const effects: UpgradeEffects = {
    buildFurniture: { cup: false, mixable: false, syrup: false },
    prepFurniture: false,
    waitingGraceMs: 0,
    finishBonus: 0,
  };
  for (const id of owned) {
    const effect = Object.hasOwn(UPGRADES, id) ? UPGRADES[id].effect : undefined;
    if (!effect) continue;
    if (effect.kind === 'buildFurniture') effect.categories.forEach((c) => (effects.buildFurniture[c] = true));
    else if (effect.kind === 'prepFurniture') effects.prepFurniture = true;
    else if (effect.kind === 'waitingGraceMs') effects.waitingGraceMs += effect.ms;
    else if (effect.kind === 'finishBonus') effects.finishBonus += effect.points;
  }
  return effects;
}
