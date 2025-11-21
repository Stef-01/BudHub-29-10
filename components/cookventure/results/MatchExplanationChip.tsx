// components/cookventure/results/MatchExplanationChip.tsx
import React from 'react';

interface MatchExplanationChipProps {
  explanations: string[];
}

const MatchExplanationChip: React.FC<MatchExplanationChipProps> = ({ explanations }) => {
  if (explanations.length === 0) return null;

  return (
    <div className="mt-3 space-y-1">
      <p className="text-xs font-semibold text-gray-700 mb-1">Matched because:</p>
      <div className="space-y-1">
        {explanations.map((explanation, idx) => (
          <div
            key={idx}
            className="flex items-start gap-1 text-xs text-gray-600 bg-green-50 rounded px-2 py-1"
          >
            <span className="text-green-600 font-bold flex-shrink-0">✓</span>
            <span className="leading-tight">{explanation.replace('✓ ', '')}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatchExplanationChip;
