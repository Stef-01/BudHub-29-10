// components/games/nutriserve-ui/FoodLibrary.tsx
import React, { useState } from 'react';
import type { FoodItem, FoodGroup } from '../NutriServeTypes';
// FIX: Correct casing for nutriServeFoodData import to resolve module conflicts.
import { FOOD_GROUPS } from '../../../services/nutriServeFoodData';
import { IconChevronDown } from './Icons';

interface FoodLibraryProps {
  onSelectItem: (foodItem: FoodItem) => void;
}

const AccordionSection: React.FC<{ group: FoodGroup; onSelectItem: (foodItem: FoodItem) => void; isOpen: boolean; onToggle: () => void; }> = ({ group, onSelectItem, isOpen, onToggle }) => {

    const handleDragStart = (e: React.DragEvent, foodItemId: string) => {
        e.dataTransfer.setData('foodItemId', foodItemId);
    };

    return (
        <div>
            <button onClick={onToggle} className="w-full flex justify-between items-center p-4 bg-slate-100 hover:bg-slate-200 rounded-lg text-left">
                <h3 className="text-lg font-semibold text-slate-700">{group.name}</h3>
                <IconChevronDown className={`w-6 h-6 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="grid grid-cols-3 gap-2 p-2">
                    {group.items.map(item => (
                        <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item.id)}
                            onClick={() => onSelectItem(item)}
                            className="flex flex-col items-center text-center p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-grab active:cursor-grabbing"
                        >
                            <div className="w-20 h-20 p-2 border border-transparent rounded-lg group-hover:border-slate-200">
                                <item.visual />
                            </div>
                            <p className="text-xs font-medium text-slate-700 mt-1 h-8 flex items-center">{item.label}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


const FoodLibrary: React.FC<FoodLibraryProps> = ({ onSelectItem }) => {
  const [openSection, setOpenSection] = useState<string>('Lentils & Curries');

  const handleToggle = (sectionName: string) => {
    setOpenSection(prev => (prev === sectionName ? '' : sectionName));
  };

  return (
    <div className="bg-white p-4 rounded-2xl shadow-lg h-full flex flex-col">
      <h2 className="text-xl font-bold text-slate-800 mb-4 flex-shrink-0 px-2">Food Library</h2>
      
      <div className="overflow-y-auto -mr-2 pr-2 space-y-2">
        {FOOD_GROUPS.map(group => (
          <AccordionSection
            key={group.name}
            group={group}
            onSelectItem={onSelectItem}
            isOpen={openSection === group.name}
            onToggle={() => handleToggle(group.name)}
          />
        ))}
      </div>
    </div>
  );
};

export default FoodLibrary;
