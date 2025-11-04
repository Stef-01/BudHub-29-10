// components/games/nutriserve-ui/MealAnalysis.tsx
import React, { useState, useRef, useEffect } from 'react';
import type { Nutrients, MealGoals } from '../NutriServeTypes';
import MacroMeter from './MacroMeter';
import GlycemicForecastGraph from './GlycemicForecastGraph';

interface MealAnalysisProps {
  totals: Nutrients;
  targets: MealGoals;
}

const MealAnalysis: React.FC<MealAnalysisProps> = ({ totals, targets }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTooltip]);
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

       {/* Blood Sugar Levels Graph Below */}
       <div className="flex-1 border-t border-slate-200 pt-2">
         <div className="flex items-center gap-1 mb-1">
           <h3 className="text-xs font-semibold text-slate-700">Blood Sugar Levels Over Time</h3>
           <div ref={tooltipRef} className="relative">
             <button
               onClick={() => setShowTooltip(!showTooltip)}
               className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-slate-500 hover:text-emerald-600 border border-slate-300 rounded-full hover:border-emerald-500 transition-colors"
               title="Click to learn about blood sugar response"
             >
               ?
             </button>
             {showTooltip && (
               <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-slate-800 text-white text-[10px] rounded-lg shadow-lg z-50 animate-fade-in">
                 <p className="font-semibold mb-1">Blood Sugar Response:</p>
                 <p className="mb-1"><strong>High GI foods</strong> (white rice, sugar) cause rapid blood sugar spikes.</p>
                 <p className="mb-1"><strong>Low GI foods</strong> (whole grains, fiber-rich) cause gradual rises.</p>
                 <p><strong>Why it matters:</strong> Frequent spikes increase diabetes risk, cause energy crashes, and stress your body.</p>
               </div>
             )}
           </div>
         </div>
         <GlycemicForecastGraph totalNutrients={totals} />
       </div>
    </div>
  );
};

export default MealAnalysis;