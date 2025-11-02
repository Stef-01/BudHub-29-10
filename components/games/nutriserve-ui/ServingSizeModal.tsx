// components/games/nutriserve-ui/ServingSizeModal.tsx
import React, { useState, useMemo } from 'react';
import type { FoodItem, PlateItem } from '../NutriServeTypes';
import { IconXMark } from './Icons';

interface ServingSizeModalProps {
  foodItem: FoodItem;
  onAdd: (plateItem: PlateItem) => void;
  onClose: () => void;
}

const ServingSizeModal: React.FC<ServingSizeModalProps> = ({ foodItem, onAdd, onClose }) => {
  const isVolumeBased = !!foodItem.volume_options_ml;
  const isPortionBased = !!foodItem.portion_g;

  const [grams, setGrams] = useState<number>(() => {
    if(isPortionBased && foodItem.portion_g) return foodItem.portion_g[1] || foodItem.portion_g[0];
    if(isVolumeBased && foodItem.volume_options_ml && foodItem.density_g_per_ml) {
        const midVol = foodItem.volume_options_ml[1] || foodItem.volume_options_ml[0];
        return midVol * foodItem.density_g_per_ml;
    }
    return 100;
  });

  const handleAdd = () => {
    if (grams > 0) {
      onAdd({
        instanceId: `${foodItem.id}-${Date.now()}`,
        foodItem,
        grams,
      });
    }
    onClose();
  };

  const options = useMemo(() => {
    if (isVolumeBased && foodItem.volume_options_ml && foodItem.density_g_per_ml && foodItem.volume_labels) {
        return foodItem.volume_labels.map((label, i) => ({
            label,
            grams: foodItem.volume_options_ml![i] * foodItem.density_g_per_ml!
        }));
    }
    if (isPortionBased && foodItem.portion_g && foodItem.portion_labels) {
        return foodItem.portion_labels.map((label, i) => ({
            label,
            grams: foodItem.portion_g![i]
        }));
    }
    return [];
  }, [foodItem, isVolumeBased, isPortionBased]);
  
  const minGrams = Math.min(...options.map(o => o.grams), 10);
  const maxGrams = Math.max(...options.map(o => o.grams), 500);

  const nutrientsAtAmount = useMemo(() => {
    const multiplier = grams / 100;
    const nutrients = foodItem.nutrients_per_100g;
    return {
        calories: (nutrients.calories_kcal * multiplier).toFixed(0),
        protein: (nutrients.protein_g * multiplier).toFixed(0),
        carbs: (nutrients.carbs_g * multiplier).toFixed(0),
        fat: (nutrients.fat_g * multiplier).toFixed(0),
    }
  }, [grams, foodItem.nutrients_per_100g]);


  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-jump-in flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0">
            <div className="w-32 h-32 mx-auto">
              <foodItem.visual grams={grams}/>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mt-2 text-center">{foodItem.label}</h2>
        </div>

        <div className="flex-grow mt-6">
            <div className="flex flex-wrap items-center justify-center gap-2">
                {options.map(opt => (
                    <button
                        key={opt.label}
                        onClick={() => setGrams(opt.grams)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                            Math.abs(grams - opt.grams) < 1 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        {opt.label} ({opt.grams.toFixed(0)}g)
                    </button>
                ))}
            </div>
            
            <div className="mt-6">
                <label htmlFor="grams-slider" className="text-sm font-medium text-slate-600 text-center block">Serving Size (grams)</label>
                <div className="flex items-center gap-4 mt-2">
                    <input
                        id="grams-slider"
                        type="range"
                        min={minGrams}
                        max={maxGrams}
                        step="1"
                        value={grams}
                        onChange={(e) => setGrams(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <input
                        type="number"
                        value={grams.toFixed(0)}
                        onChange={(e) => setGrams(Number(e.target.value))}
                        className="w-20 p-2 text-center border border-slate-300 rounded-lg"
                    />
                </div>
            </div>

            <div className="mt-6 bg-slate-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div><span className="font-semibold">Calories:</span> {nutrientsAtAmount.calories} kcal</div>
                    <div><span className="font-semibold">Protein:</span> {nutrientsAtAmount.protein} g</div>
                    <div><span className="font-semibold">Carbs:</span> {nutrientsAtAmount.carbs} g</div>
                    <div><span className="font-semibold">Fat:</span> {nutrientsAtAmount.fat} g</div>
                </div>
            </div>
        </div>

        <button
          onClick={handleAdd}
          className="w-full mt-6 px-4 py-3 bg-emerald-600 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-700 transition-colors flex-shrink-0"
        >
          Add to Plate
        </button>
      </div>
    </div>
  );
};

export default ServingSizeModal;
