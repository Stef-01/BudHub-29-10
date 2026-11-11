// Public surface of the NutriServe remaster simulation (pure TypeScript, no React).
export * from './types.ts';
export * from './params.ts';
export { advanceGame, applyCommand, createGame, newProfile, PARAM_VERSIONS, PILOT_CUSTOMER_POOL, PREP_SLOT_COUNT } from './game.ts';
export { deserializeGame, SaveError, serializeGame, SAVE_FORMAT } from './save.ts';
export {
  aggregateV1,
  dishMatchesOrder,
  gradeFinishV1,
  gradeIndianBuildV1,
  gradeIndianPrepV1,
  gradeWaitingV1,
  meterFraction,
  prepTargetUnits,
  prepUnits,
  rewardsV1,
} from './scoring.ts';
export { rankForPoints, RANK_THRESHOLDS, upgradeEffects, UPGRADES } from './progression.ts';
export { generateOrder, wantsLowSodium } from './orders.ts';
export { createRng, seedFrom } from './rng.ts';
export { getCatalogCustomer, getFood, servingGrams } from './catalog.ts';
