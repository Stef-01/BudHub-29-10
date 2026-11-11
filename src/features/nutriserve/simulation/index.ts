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
  gradeFinishV1,
  gradeIndianBuildV1,
  gradeIndianPrepV1,
  gradeWaitingV1,
  meterFraction,
  prepTargetUnits,
  prepUnits,
  orderComplete,
  rewardsV1,
  rewardsV2,
  serveNotes,
} from './scoring.ts';
export { rankForPoints, RANK_THRESHOLDS, upgradeEffects, UPGRADES } from './progression.ts';
export { generateOrder, wantsLowSodium } from './orders.ts';
export { createRng, seedFrom } from './rng.ts';
export { getCatalogCustomer, getFood, servingGrams } from './catalog.ts';
