// components/games/nutriserve-ui/FoodLibrary.tsx
import React, { useState } from 'react';
import type { FoodItem, FoodGroup } from '../NutriServeTypes';
import { FOOD_GROUPS } from '../../../services/nutriserveFoodData';
import { IconChevronDown } from './Icons';

interface FoodItemCardProps {
    item: FoodItem;
}

const FoodItemCard: React.FC<FoodItemCardProps> = ({ item }) => {
    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('foodItemId', item.id);
        e.dataTransfer.effectAllowed = 'copy';
    };

    const FoodVisual = item.visual;

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            className="p-2 bg-slate-50 rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:bg-emerald-50 hover:shadow-md transition-all"
        >
            <div className="w-20 h-20 mx-auto">
                <FoodVisual />
            </div>
            <p className="text-center text-xs font-semibold text-slate-700 mt-2 truncate">{item.label}</p>
        </div>
    );
};

const FoodCategorySection: React.FC<{ group: FoodGroup }> = ({ group }) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
        <div>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-3 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
                <h3 className="font-bold text-slate-800">{group.name}</h3>
                <IconChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
            </button>
            {isOpen && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3">
                    {group.items.map(item => (
                        <FoodItemCard key={item.id} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
};


const FoodLibrary: React.FC = () => {
    return (
        <div className="bg-white p-4 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold text-slate-800 mb-4 px-2">Food Library</h2>
            <div className="space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2">
                {FOOD_GROUPS.map(group => (
                    <FoodCategorySection key={group.name} group={group} />
                ))}
            </div>
        </div>
    );
};

export default FoodLibrary;
