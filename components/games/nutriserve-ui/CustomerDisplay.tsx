// components/games/nutriserve-ui/CustomerDisplay.tsx
import React from 'react';
import type { NutriServeCustomerWithTargets } from '../NutriServeTypes';

interface CustomerDisplayProps {
  customer: NutriServeCustomerWithTargets;
  children?: React.ReactNode;
}

const CustomerDisplay: React.FC<CustomerDisplayProps> = ({ customer, children }) => {
  const CharacterVisual = customer.visuals.default;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <div className="flex items-start gap-4">
        <div className="w-24 h-24 flex-shrink-0 bg-slate-100 rounded-full overflow-hidden border-4 border-white shadow-md">
          <CharacterVisual />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-800">{customer.name}</h3>
          <p className="text-slate-600 italic bg-slate-50 p-3 rounded-lg mt-1">"{customer.order.description}"</p>
        </div>
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};

export default CustomerDisplay;
