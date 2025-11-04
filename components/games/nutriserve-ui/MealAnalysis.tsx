// components/games/nutriserve-ui/MealAnalysis.tsx
import React from 'react';
import type { Nutrients, MealGoals } from '../NutriServeTypes';
import MacroMeter from './MacroMeter';
import GlycemicForecastGraph from './GlycemicForecastGraph';

interface MealAnalysisProps {
  totals: Nutrients;
  targets: MealGoals;
}

const MealAnalysis: React.FC<MealAnalysisProps> = ({ totals, targets }) => {
  return (
    <div className="bg-white p-2 rounded-xl shadow-lg h-full flex flex-col">
       <div className="mb-1.5">
          <h2 className="text-sm font-bold text-slate-800">
              Nutrition Analysis
          </h2>
       </div>

       {/* Macro Meters - Compact Grid */}
       <div className="grid grid-cols-2 gap-1 mb-2">
           <MacroMeter name="Cal" value={totals.calories_kcal} unit="kcal" target={targets.calories_kcal} mode="band" />
           <MacroMeter name="Prot" value={totals.protein_g} unit="g" target={targets.protein_g} mode="min" />
           <MacroMeter name="Carbs" value={totals.carbs_g} unit="g" target={targets.carbs_g} mode="max" />
           <MacroMeter name="Fat" value={totals.fat_g} unit="g" target={targets.fat_g} mode="max" />
           <MacroMeter name="Fiber" value={totals.fiber_g} unit="g" target={targets.fiber_g} mode="min" />
           <MacroMeter name="Sodium" value={totals.sodium_mg} unit="mg" target={targets.sodium_mg} mode="max" />
       </div>

       {/* Glycemic Forecast Below */}
       <div className="flex-1 border-t border-slate-200 pt-2">
         <h3 className="text-xs font-semibold text-slate-700 mb-1">Glycemic Response</h3>
         <GlycemicForecastGraph totalNutrients={totals} />
       </div>
    </div>
  );
};

export default MealAnalysis;