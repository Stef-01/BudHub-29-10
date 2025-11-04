// components/games/nutriserve-ui/FoodLibrary.tsx
import React, { useState } from 'react';
import type { FoodGroup, FoodItem } from '../NutriServeTypes';
// FIX: Corrected import casing for 'nutriserveFoodData' to match the actual filename and resolve module resolution errors.
import { FOOD_LIBRARY } from '../../../services/nutriServeFoodData';
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
      className="p-2 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col items-center text-center cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <div className="w-14 h-14 mb-1">
        <FoodVisual />
      </div>
      <p className="text-[10px] font-semibold text-slate-700 leading-tight">{item.label}</p>
    </div>
  );
};

const FoodLibrary: React.FC = () => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set([FOOD_LIBRARY[0].name])
  );

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  return (
    <div className="bg-white p-3 rounded-xl shadow-lg h-full flex flex-col">
      <h2 className="text-base font-bold text-slate-800 mb-2">Food Library</h2>

      {/* Vertical Categories with Collapsible Sections */}
      <div className="flex-grow overflow-y-auto space-y-2">
        {FOOD_LIBRARY.map((group) => {
          const isExpanded = expandedCategories.has(group.name);
          return (
            <div key={group.name} className="border border-slate-200 rounded-lg">
              <button
                onClick={() => toggleCategory(group.name)}
                className="w-full flex items-center justify-between p-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <span className="text-xs font-semibold text-slate-700">{group.name}</span>
                <IconChevronDown
                  className={`w-4 h-4 text-slate-500 transition-transform ${
                    isExpanded ? 'transform rotate-180' : ''
                  }`}
                />
              </button>
              {isExpanded && (
                <div className="p-2 grid grid-cols-2 gap-2">
                  {group.items.map(item => <FoodItemCard key={item.id} item={item} />)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex-shrink-0">
        <DidYouKnowCard />
      </div>

    </div>
  );
};

export default FoodLibrary;