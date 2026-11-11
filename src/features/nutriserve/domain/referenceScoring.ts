/**
 * Static transcription contract, NOT runtime-verified parity.
 * Classic inner SWF SHA-256: 143df3e9a57e038711b3442e252d14bb03946e31ad1dd7ac27a0889dca5f26de
 * AVM2 methods 141 (build), 139 (mix); see docs/nutriserve/REA_FINDINGS.md.
 * Mix quantities are original internal units. Their producer/time conversion is unresolved.
 * Nutrition, waiting, topping, progression and Indian-food mapping are deliberately separate.
 */
export const REFERENCE_PREP_SLOT_COUNT = 4;
export const MIX_TARGETS = { chunky: 900, regular: 1800, smooth: 2700 } as const;
export type Blend = keyof typeof MIX_TARGETS;

type BuildCategory = { correct: boolean; furnitureBonus?: boolean };
export type BuildInput = {
  cup: BuildCategory & { actualFill: number; idealFill: number };
  mixable: BuildCategory & { meterFraction: number };
  syrup: BuildCategory & { meterFraction: number };
};

function finiteNonnegative(value: number, name: string) {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be finite and nonnegative`);
}
function meterPenalty(fraction: number, target: number) {
  return Math.max(0, Math.abs(Math.round(fraction * 100) - target) - 4) * 0.3;
}

export function gradeReferenceBuild(input: BuildInput): number {
  finiteNonnegative(input.cup.actualFill, 'actualFill');
  if (!Number.isFinite(input.cup.idealFill) || input.cup.idealFill <= 0) throw new RangeError('idealFill must be positive');
  for (const field of [input.mixable, input.syrup]) {
    if (!Number.isFinite(field.meterFraction) || field.meterFraction < 0 || field.meterFraction > 1) {
      throw new RangeError('meterFraction must be between zero and one');
    }
  }
  let score = 100;
  score -= input.cup.correct ? meterPenalty(input.cup.actualFill / input.cup.idealFill, 100) : 34;
  score -= input.mixable.correct ? meterPenalty(input.mixable.meterFraction, 50) : 33;
  score -= input.syrup.correct ? meterPenalty(input.syrup.meterFraction, 50) : 33;
  // Original adds category furniture bonuses only when that category matches.
  for (const field of [input.cup, input.mixable, input.syrup]) {
    if (field.correct && field.furnitureBonus) score = Math.min(100, score + 1);
  }
  return Math.max(0, Math.round(score));
}

export function gradeReferenceMix(actualUnits: number, blend: Blend, furnitureBonus = false): number {
  finiteNonnegative(actualUnits, 'actualUnits');
  if (!Object.hasOwn(MIX_TARGETS, blend)) throw new RangeError('Unknown blend');
  const error = Math.min(Math.abs(actualUnits - MIX_TARGETS[blend]), 900);
  const score = Math.max(0, Math.round(100 - 100 * Math.max(0, error - 150) / 900));
  return Math.min(100, score + (furnitureBonus ? 3 : 0));
}
