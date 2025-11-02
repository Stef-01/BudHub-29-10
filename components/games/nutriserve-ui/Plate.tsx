// components/games/nutriserve-ui/Plate.tsx
import React from 'react';
import type { PlateItem } from '../NutriServeTypes';

interface PlateProps {
  items: PlateItem[];
  onSelectItem: (item: PlateItem) => void;
  isServing?: boolean;
}

const Plate: React.FC<PlateProps> = ({ items, onSelectItem, isServing }) => {
  return (
    <div className="relative aspect-square w-full max-w-lg mx-auto">
      <div
        className={`absolute inset-0 rounded-full bg-slate-50 border-4 border-slate-200 shadow-inner transition-colors ${
          isServing ? 'bg-emerald-50 border-emerald-200' : ''
        }`}
      ></div>
      
      {/* This is a simple circular layout. A real game might use more complex physics-based positioning. */}
      {items.map((item, index) => {
        const angle = (index / items.length) * 2 * Math.PI;
        // Adjust distance from center based on number of items to avoid overlap
        const radius = items.length > 4 ? 35 : items.length * 8;
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);
        // Scale items down as more are added
        const scale = items.length > 5 ? 0.6 : 0.8;

        return (
          <div
            key={item.instanceId}
            className="absolute w-1/4 h-1/4 -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: `translate(-50%, -50%) scale(${scale})`,
            }}
          >
            <button
              onClick={() => onSelectItem(item)}
              className="w-full h-full rounded-full hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-emerald-400"
              title={`Edit ${item.foodItem.label}`}
            >
              <item.foodItem.visual grams={item.grams} />
            </button>
          </div>
        );
      })}

      {items.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-slate-400 text-lg font-semibold">Add food from the library</p>
        </div>
      )}
    </div>
  );
};

export default Plate;
