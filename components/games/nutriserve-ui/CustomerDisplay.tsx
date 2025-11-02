// components/games/nutriserve-ui/CustomerDisplay.tsx
import React from 'react';
import type { NutriServeCustomerWithTargets } from '../NutriServeTypes';

interface CustomerDisplayProps {
  customer: NutriServeCustomerWithTargets;
  onServe: () => void;
  isPlateEmpty: boolean;
}

const CustomerDisplay: React.FC<CustomerDisplayProps> = ({ customer, onServe, isPlateEmpty }) => {
  const CharacterVisual = customer.visuals.default;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 border-4 border-white ring-2 ring-slate-200">
                <CharacterVisual />
            </div>
            <div className="flex-grow">
                <h3 className="text-xl font-bold text-slate-800">{customer.name}</h3>
                <div className="relative mt-2 bg-slate-100 p-4 rounded-lg">
                    <p className="text-slate-700 italic">"{customer.order.description}"</p>
                    {/* Speech bubble pointer */}
                    <div className="absolute top-4 -left-2 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[8px] border-r-slate-100"></div>
                </div>
            </div>
        </div>
        <button
            onClick={onServe}
            disabled={isPlateEmpty}
            className="w-full mt-2 px-4 py-3 bg-slate-500 text-white font-bold text-lg rounded-lg shadow-md hover:bg-slate-600 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
            Serve Plate
        </button>
    </div>
  );
};

export default CustomerDisplay;
