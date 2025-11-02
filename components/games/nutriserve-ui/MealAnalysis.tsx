// components/games/nutriserve-ui/MealAnalysis.tsx
import React, { useState } from 'react';
import type { Nutrients, MealGoals } from '../NutriServeTypes';
import MacroMeter from './MacroMeter';
import GlycemicForecastGraph from './GlycemicForecastGraph';
import { IconArrowLeftCircle, IconArrowRightCircle } from './Icons';

interface MealAnalysisProps {
  totals: Nutrients;
  targets: MealGoals;
}

const MealAnalysis: React.FC<MealAnalysisProps> = ({ totals, targets }) => {
  const [analysisView, setAnalysisView] = useState<'meters' | 'forecast'>('meters');

  const toggleView = () => {
    setAnalysisView(prev => prev === 'meters' ? 'forecast' : 'meters');
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
       <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800">
              {analysisView === 'meters' ? 'Meal Analysis' : 'Glycemic Forecast'}
          </h2>
          <div className="flex items-center space-x-2">
              <button onClick={toggleView} className="p-1 text-slate-400 hover:text-emerald-600 transition-colors rounded-full"><IconArrowLeftCircle className="w-5 h-5"/></button>
              <div className="flex space-x-1.5">
                  <div className={`w-2 h-2 rounded-full transition-colors ${analysisView === 'meters' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                  <div className={`w-2 h-2 rounded-full transition-colors ${analysisView === 'forecast' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
              </div>
              <button onClick={toggleView} className="p-1 text-slate-400 hover:text-emerald-600 transition-colors rounded-full"><IconArrowRightCircle className="w-5 h-5"/></button>
          </div>
       </div>
       {analysisView === 'meters' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
              <MacroMeter name="Calories" value={totals.calories_kcal} unit="kcal" target={targets.calories_kcal} mode="band" />
              <MacroMeter name="Protein" value={totals.protein_g} unit="g" target={targets.protein_g} mode="min" />
              <MacroMeter name="Carbs" value={totals.carbs_g} unit="g" target={targets.carbs_g} mode="max" />
              <MacroMeter name="Fat" value={totals.fat_g} unit="g" target={targets.fat_g} mode="max" />
              <MacroMeter name="Fiber" value={totals.fiber_g} unit="g" target={targets.fiber_g} mode="min" />
              <MacroMeter name="Sodium" value={totals.sodium_mg} unit="mg" target={targets.sodium_mg} mode="max" />
          </div>
       ) : (
          <GlycemicForecastGraph totalNutrients={totals} />
       )}
    </div>
  );
};

export default MealAnalysis;