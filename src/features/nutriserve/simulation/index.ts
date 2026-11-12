// Public surface of the NutriServe remaster simulation (pure TypeScript, no React).
export * from './types.ts';
export * from './params.ts';
export { advanceGame, applyCommand, createGame, newProfile, PARAM_VERSIONS, PILOT_CUSTOMER_POOL, PREP_SLOT_COUNT, ticketForNewDish } from './game.ts';
export { deserializeGame, deserializeGameWithNotes, salvageSave, SaveError, serializeGame, SAVE_FORMAT, type SaveSalvage } from './save.ts';
export {
  aggregateV2,
  contentShare,
  dishMatchesOrder,
  drizzleTargetG,
  exactBand,
  gradeFinishV1,
  gradeBuild,
  gradePrep,
  gradeWaitingV1,
  meterFraction,
  portionCredit,
  prepBandUnits,
  prepTargetUnits,
  prepUnits,
  orderComplete,
  rewardsV1,
  rewardsV2,
  serveNotes,
} from './scoring.ts';
export { rankForPoints, RANK_THRESHOLDS, upgradeEffects, UPGRADES, RETIRED_UPGRADES } from './progression.ts';
export { generateOrder, wantsLowSodium } from './orders.ts';
export { createRng, seedFrom } from './rng.ts';
export { getCatalogCustomer, getFood, servingGrams } from './catalog.ts';
