// components/games/nutriserve-ui/FoodLibrary.tsx
import React, { useState } from 'react';
import type { FoodItem } from '../NutriServeTypes';
import { FOOD_GROUPS } from '../../../services/nutriserveFoodData';
import { IconChevronDown } from './Icons';

interface FoodLibraryProps {
  onSelectFood: (foodItem: FoodItem) => void;
}

const FoodLibrary: React.FC<FoodLibraryProps> = ({ onSelectFood }) => {
  const [openCategory, setOpenCategory] = useState<string | null>(FOOD_GROUPS[0]?.name || null);

  const toggleCategory = (categoryName: string) => {
    setOpenCategory(prev => (prev === categoryName ? null : categoryName));
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg h-full overflow-y-auto">
      <h3 className="text-xl font-bold text-slate-800 mb-4">Food Library</h3>
      <div className="space-y-2">
        {FOOD_GROUPS.map(group => (
          <div key={group.name} className="border-b border-slate-200 last:border-b-0">
            <button
              onClick={() => toggleCategory(group.name)}
              className="w-full flex justify-between items-center p-3 text-left font-semibold text-slate-700 hover:bg-slate-50"
            >
              <span>{group.name}</span>
              <IconChevronDown
                className={`h-5 w-5 transition-transform ${openCategory === group.name ? 'rotate-180' : ''}`}
              />
            </button>
            {openCategory === group.name && (
              <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {group.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => onSelectFood(item)}
                    className="flex flex-col items-center p-2 rounded-lg hover:bg-emerald-50 text-center"
                    title={`Add ${item.label}`}
                  >
                    <div className="w-16 h-16">
                      <item.visual />
                    </div>
                    <p className="text-xs font-medium text-slate-600 mt-1">{item.label}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FoodLibrary;
