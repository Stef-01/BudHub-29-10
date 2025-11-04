// components/games/nutriserve-ui/MacroMeter.tsx
import React from 'react';
import type { MealGoals } from '../NutriServeTypes';
// FIX: Corrected import path
import { getNutrientStatus, type NutrientStatus } from '../../../services/nutriserveUtils';

type NutrientKey = keyof MealGoals;
type Target = MealGoals[NutrientKey];

interface MacroMeterProps {
  name: string;
  value: number;
  unit: string;
  target: Target;
  mode: 'band' | 'min' | 'max';
}

// FIX: Changed to React.FC to correctly handle reserved props like 'key'.
const MacroMeter: React.FC<MacroMeterProps> = ({ name, value, unit, target, mode }) => {
  const status = getNutrientStatus(value, target);
  
  const statusColors = {
    low: 'bg-sky-500',
    good: 'bg-emerald-500',
    high: 'bg-rose-500',
    ok: 'bg-slate-400'
  };

  const statusBorder = {
    low: 'border-sky-200',
    good: 'border-emerald-200',
    high: 'border-rose-200',
    ok: 'border-slate-200'
  };
  
  const statusText = {
    low: 'text-sky-800',
    good: 'text-emerald-800',
    high: 'text-rose-800',
    ok: 'text-slate-800'
  };

  let progress = 0;
  let targetText = '';

  if (mode === 'band' && 'min' in target && 'max' in target) {
    progress = Math.min(100, (value / target.max) * 100);
    targetText = `Target: ${target.min.toFixed(0)}-${target.max.toFixed(0)}${unit}`;
  } else if (mode === 'min' && 'min' in target) {
    progress = Math.min(100, (value / target.min) * 100);
    targetText = `Goal: >${target.min.toFixed(0)}${unit}`;
  } else if (mode === 'max' && 'max' in target) {
    progress = Math.min(100, (value / target.max) * 100);
    targetText = `Limit: <${target.max.toFixed(0)}${unit}`;
  }

  return (
    <div className={`px-2 py-1 rounded bg-slate-50 border ${statusBorder[status]}`}>
      <div className="flex items-center justify-between">
        <p className={`text-[11px] font-semibold ${statusText[status]}`}>{name}</p>
        <p className="text-sm font-bold text-slate-800">
          {value.toFixed(0)}
          <span className="text-[11px] font-normal text-slate-500 ml-0.5">{unit}</span>
        </p>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-1 my-0.5">
        <div
          className={`h-1 rounded-full ${statusColors[status]} transition-all duration-500 ease-out`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default MacroMeter;