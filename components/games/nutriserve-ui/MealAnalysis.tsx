// components/games/nutriserve-ui/MealAnalysis.tsx
import React, { useMemo, useState } from 'react';
import type { PlateItem, NutriServeCustomerWithTargets, Nutrients } from '../NutriServeTypes';
import { calculateTotalNutrients, getNutrientStatus } from '../../../services/nutriserveUtils';
import MacroMeter from './MacroMeter';
import DidYouKnowCard from './DidYouKnowCard';
import { IconArrowLeftCircle, IconArrowRightCircle } from './Icons';

interface MealAnalysisProps {
  plate: PlateItem[];
  customer: NutriServeCustomerWithTargets;
}

const nutrientPages = [
    ['calories_kcal', 'protein_g'],
    ['carbs_g', 'fat_g'],
    ['fiber_g', 'sodium_mg'],
];

const nutrientMeta: Record<keyof Nutrients, { name: string, unit: string, mode: 'band' | 'min' | 'max' }> = {
    calories_kcal: { name: 'Calories', unit: 'kcal', mode: 'band' },
    protein_g: { name: 'Protein', unit: 'g', mode: 'min' },
    carbs_g: { name: 'Carbs', unit: 'g', mode: 'max' },
    fat_g: { name: 'Fat', unit: 'g', mode: 'max' },
    fiber_g: { name: 'Fiber', unit: 'g', mode: 'min' },
    sodium_mg: { name: 'Sodium', unit: 'mg', mode: 'max' },
};


const MealAnalysis: React.FC<MealAnalysisProps> = ({ plate, customer }) => {
  const totalNutrients = useMemo(() => calculateTotalNutrients(plate), [plate]);
  const [page, setPage] = useState(0);

  const handleNextPage = () => setPage(p => (p + 1) % nutrientPages.length);
  const handlePrevPage = () => setPage(p => (p - 1 + nutrientPages.length) % nutrientPages.length);

  const currentPageNutrients = nutrientPages[page];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-slate-800">Meal Analysis</h3>
            <div className="flex items-center gap-2">
                <button onClick={handlePrevPage} className="text-slate-400 hover:text-slate-600"><IconArrowLeftCircle className="h-6 w-6" /></button>
                <div className="flex gap-1.5">
                    {nutrientPages.map((_, i) => (
                        <div key={i} className={`h-2 w-2 rounded-full ${i === page ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                    ))}
                </div>
                <button onClick={handleNextPage} className="text-slate-400 hover:text-slate-600"><IconArrowRightCircle className="h-6 w-6" /></button>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            {currentPageNutrients.map(nutrientKey => {
                // FIX: Cast string key to keyof Nutrients for type safety.
                const key = nutrientKey as keyof Nutrients;
                const meta = nutrientMeta[key];
                const target = customer.targets[key];
                if (!meta || !target) return null;
                
                return (
                    <MacroMeter 
                        key={key}
                        name={meta.name} 
                        value={totalNutrients[key]} 
                        unit={meta.unit}
                        target={target}
                        mode={meta.mode}
                    />
                )
            })}
        </div>
        
        <div className="mt-auto pt-6">
            <DidYouKnowCard />
        </div>
    </div>
  );
};

export default MealAnalysis;
