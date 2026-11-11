import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gradeReferenceBuild, gradeReferenceMix, REFERENCE_PREP_SLOT_COUNT } from '../src/features/nutriserve/domain/referenceScoring.ts';

const perfect = () => ({ cup: { correct: true, actualFill: 100, idealFill: 100 }, mixable: { correct: true, meterFraction: 0.5 }, syrup: { correct: true, meterFraction: 0.5 } });
test('four prep slots match official screenshot 05', () => assert.equal(REFERENCE_PREP_SLOT_COUNT, 4));
test('perfect build and four-point tolerance', () => {
  const p = perfect(); assert.equal(gradeReferenceBuild(p), 100);
  p.cup.actualFill = 104; p.mixable.meterFraction = 0.46; p.syrup.meterFraction = 0.54;
  assert.equal(gradeReferenceBuild(p), 100);
});
test('wrong category loses its fixed share and skips its meter penalty', () => {
  const p = perfect(); p.cup.correct = false; p.cup.actualFill = 1000;
  assert.equal(gradeReferenceBuild(p), 66);
  p.mixable.correct = false; p.mixable.meterFraction = 0;
  assert.equal(gradeReferenceBuild(p), 33);
  p.syrup.correct = false; p.syrup.meterFraction = 1;
  assert.equal(gradeReferenceBuild(p), 0);
});
test('meter errors accumulate before final rounding', () => {
  const p = perfect(); p.cup.actualFill = 80; p.mixable.meterFraction = 0.75; p.syrup.meterFraction = 0.1;
  // 100 - (20-4)*.3 - (25-4)*.3 - (40-4)*.3 = 78.1
  assert.equal(gradeReferenceBuild(p), 78);
  for (const f of [p.cup, p.mixable, p.syrup]) f.furnitureBonus = true;
  assert.equal(gradeReferenceBuild(p), 81);
});
test('furniture never rewards a wrong category or exceeds 100', () => {
  const p = perfect(); p.cup.correct = false; p.cup.furnitureBonus = true;
  assert.equal(gradeReferenceBuild(p), 66);
  p.cup.correct = true; assert.equal(gradeReferenceBuild(p), 100);
});
test('all blend targets and tolerance edges are expressed in internal units', () => {
  for (const [blend, target] of [['chunky', 900], ['regular', 1800], ['smooth', 2700]]) {
    for (const delta of [-150, 0, 150]) assert.equal(gradeReferenceMix(target + delta, blend), 100);
    assert.equal(gradeReferenceMix(target + 300, blend), 83);
    assert.equal(gradeReferenceMix(target - 300, blend), 83);
    assert.equal(gradeReferenceMix(target + 900, blend), 17);
    assert.equal(gradeReferenceMix(target + 100000, blend), 17);
    assert.equal(gradeReferenceMix(target + 300, blend, true), 86);
    assert.equal(gradeReferenceMix(target, blend, true), 100);
  }
});
test('invalid public inputs cannot silently earn rewards', () => {
  for (const bad of [NaN, Infinity, -1]) assert.throws(() => gradeReferenceMix(bad, 'regular'), RangeError);
  assert.throws(() => gradeReferenceMix(100, 'unknown'), RangeError);
  const p = perfect(); p.cup.idealFill = 0;
  assert.throws(() => gradeReferenceBuild(p), RangeError);
});
