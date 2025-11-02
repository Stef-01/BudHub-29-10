// components/games/nutriserve-ui/DidYouKnowCard.tsx
import React from 'react';
import { IconInfoCircle } from './Icons';

interface DidYouKnowCardProps {
  tip: string;
}

const DidYouKnowCard: React.FC<DidYouKnowCardProps> = ({ tip }) => {
  return (
    <div className="bg-sky-50 p-4 rounded-lg border border-sky-200">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <IconInfoCircle className="w-5 h-5 text-sky-600" />
        </div>
        <div>
          <h4 className="font-semibold text-sky-800">Did you know?</h4>
          <p className="text-sm text-sky-700 mt-1">{tip}</p>
        </div>
      </div>
    </div>
  );
};

export default DidYouKnowCard;
