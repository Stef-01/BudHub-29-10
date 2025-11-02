// components/games/nutriserve-ui/FoodLibrary.tsx
import React, { useState } from 'react';
import type { FoodGroup, FoodItem } from '../NutriServeTypes';
// FIX: Corrected casing of import to match filename 'nutriserveFoodData.ts'.
import { FOOD_LIBRARY } from '../../../services/nutriserveFoodData';
import { IconChevronDown } from './Icons';
import DidYouKnowCard from './DidYouKnowCard';

interface FoodItemCardProps {
  item: FoodItem;
}

const FoodItemCard: React.FC<FoodItemCardProps> = ({ item }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('foodItemId', item.id);
    e.dataTransfer.effectAllowed = "copy";
  };
  
  const FoodVisual = item.visual;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="p-3 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col items-center text-center cursor-grab active:cursor-grabbing"
    >
      <div className="w-20 h-20 mb-2">
        <FoodVisual />
      </div>
      <p className="text-sm font-semibold text-slate-700">{item.label}</p>
    </div>
  );
};

const FoodLibrary: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>(FOOD_LIBRARY[0].name);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg h-full flex flex-col">
      <h2 className="text-xl font-bold text-slate-800 mb-4">Food Library</h2>
      
      {/* Category Tabs */}
      <div className="mb-4 border-b border-slate-200 -mx-4 sm:-mx-6 px-4 sm:px-6">
        <div className="flex space-x-4 overflow-x-auto">
          {FOOD_LIBRARY.map((group) => (
            <button
              key={group.name}
              onClick={() => setActiveCategory(group.name)}
              className={`pb-2 px-1 border-b-2 text-sm font-semibold whitespace-nowrap ${
                activeCategory === group.name
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {group.name}
            </button>
          ))}
        </div>
      </div>

      {/* Food Items Grid */}
      <div className="flex-grow overflow-y-auto pr-2 -mr-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {FOOD_LIBRARY
            .find(group => group.name === activeCategory)?.items
            .map(item => <FoodItemCard key={item.id} item={item} />)
          }
        </div>
      </div>

      <div className="mt-4 flex-shrink-0">
        <DidYouKnowCard />
      </div>

    </div>
  );
};

export default FoodLibrary;