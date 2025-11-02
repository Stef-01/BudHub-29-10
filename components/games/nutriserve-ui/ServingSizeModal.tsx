// components/games/nutriserve-ui/ServingSizeModal.tsx
import React, { useState, useMemo } from 'react';
import type { FoodItem, PlateItem, Nutrients } from '../NutriServeTypes';
import { IconTrash } from './Icons';

interface ServingSizeModalProps {
  foodItem: FoodItem;
  currentItem?: PlateItem;
  onUpdate: (foodItem: FoodItem, grams: number, instanceId?: string) => void;
  onRemove: (instanceId: string) => void;
  onClose: () => void;
}

const ServingSizeModal: React.FC<ServingSizeModalProps> = ({ foodItem, currentItem, onUpdate, onRemove, onClose }) => {
  const [grams, setGrams] = useState(currentItem?.grams || (foodItem.portion_g?.[0] || 100));
  
  const nutrients = useMemo((): Partial<Nutrients> => {
    const multiplier = grams / 100;
    const result: Partial<Nutrients> = {};
    for (const key in foodItem.nutrients_per_100g) {
        const nutrient = key as keyof Nutrients;
        result[nutrient] = (foodItem.nutrients_per_100g[nutrient] || 0) * multiplier;
    }
    return result;
  }, [grams, foodItem.nutrients_per_100g]);
  
  const handleGramsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      setGrams(isNaN(value) ? 0 : value);
  };
  
  const handleSave = () => {
    if (grams > 0) {
      onUpdate(foodItem, grams, currentItem?.instanceId);
    } else if (currentItem) {
      onRemove(currentItem.instanceId);
    }
    onClose();
  };
  
  const handleRemove = () => {
      if (currentItem) {
          onRemove(currentItem.instanceId);
      }
      onClose();
  }

  const portionOptions = useMemo(() => {
    if (foodItem.portion_g && foodItem.portion_labels) {
        return foodItem.portion_labels.map((label, i) => ({ label, grams: foodItem.portion_g![i] }));
    }
    if (foodItem.volume_options_ml && foodItem.volume_labels && foodItem.density_g_per_ml) {
        return foodItem.volume_labels.map((label, i) => ({ label, grams: Math.round(foodItem.volume_options_ml![i] * foodItem.density_g_per_ml!) }));
    }
    return [];
  }, [foodItem]);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-jump-in" onClick={e => e.stopPropagation()}>
        <div className="text-center w-40 h-40 mx-auto">
          <foodItem.visual grams={grams} />
          <h3 className="text-2xl font-bold text-slate-800 mt-2">{foodItem.label}</h3>
        </div>

        {portionOptions.length > 0 && (
            <div className="my-4">
                <p className="text-sm font-semibold text-slate-600 mb-2 text-center">Quick Portions:</p>
                <div className="flex flex-wrap justify-center gap-2">
                    {portionOptions.map(opt => (
                        <button key={opt.label} onClick={() => setGrams(opt.grams)} className={`px-3 py-1.5 text-sm font-semibold rounded-full ${grams === opt.grams ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                            {opt.label} ({opt.grams}g)
                        </button>
                    ))}
                </div>
            </div>
        )}

        <div className="my-6">
            <label htmlFor="grams-input" className="block text-sm font-medium text-gray-700 text-center">Serving Size (grams)</label>
            <div className="mt-1 relative rounded-md shadow-sm">
                <input
                    type="range"
                    min="0"
                    max={foodItem.portion_g ? Math.max(...foodItem.portion_g) * 2 : 500}
                    step="5"
                    value={grams}
                    onChange={handleGramsChange}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <input
                    type="number"
                    id="grams-input"
                    value={grams}
                    onChange={handleGramsChange}
                    className="w-24 p-2 text-center font-bold text-lg border-2 border-slate-300 rounded-lg mx-auto mt-2 block"
                />
            </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600 grid grid-cols-2 gap-1">
            <span>Calories: <b>{Math.round(nutrients.calories_kcal || 0)} kcal</b></span>
            <span>Protein: <b>{Math.round(nutrients.protein_g || 0)} g</b></span>
            <span>Carbs: <b>{Math.round(nutrients.carbs_g || 0)} g</b></span>
            <span>Fat: <b>{Math.round(nutrients.fat_g || 0)} g</b></span>
        </div>
        
        <div className="flex gap-3 mt-6">
            {currentItem && (
                <button onClick={handleRemove} className="w-1/4 flex-shrink-0 px-4 py-3 bg-rose-100 text-rose-700 font-semibold rounded-lg hover:bg-rose-200" aria-label="Remove item">
                    <IconTrash className="h-6 w-6 mx-auto" />
                </button>
            )}
            <button onClick={handleSave} className="flex-grow px-4 py-3 bg-emerald-600 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-700">
              {currentItem ? 'Update Item' : 'Add to Plate'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ServingSizeModal;
