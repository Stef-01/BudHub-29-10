// components/cookventure/results/MatchExplanationChip.tsx
import React from 'react';
import type { MatchReason, MatchReasonKind } from '../../../types/cookventure';

/** Icon + tint for each kind of match reason; the icon keeps meaning from relying on color alone */
export const REASON_STYLE: Record<MatchReasonKind, { icon: string; tint: string; name: string }> = {
  pantry: { icon: '🧺', tint: 'bg-green-50 border-green-200', name: 'Pantry' },
  region: { icon: '📍', tint: 'bg-sky-50 border-sky-200', name: 'Region' },
  masala: { icon: '🫙', tint: 'bg-orange-50 border-orange-200', name: 'Masala' },
  tadka: { icon: '🔥', tint: 'bg-amber-50 border-amber-200', name: 'Tadka' },
  flavor: { icon: '🎯', tint: 'bg-rose-50 border-rose-200', name: 'Flavor' },
  health: { icon: '💚', tint: 'bg-emerald-50 border-emerald-200', name: 'Health' },
  diet: { icon: '🥗', tint: 'bg-lime-50 border-lime-200', name: 'Diet' },
  quick: { icon: '⏱️', tint: 'bg-violet-50 border-violet-200', name: 'Quick' },
  course: { icon: '🍽️', tint: 'bg-gray-50 border-gray-200', name: 'Course' },
};

interface MatchExplanationChipProps {
  reasons: MatchReason[];
  /** Show at most this many chips, with a "+N more" chip for the rest */
  limit?: number;
  size?: 'sm' | 'md';
}

const MatchExplanationChip: React.FC<MatchExplanationChipProps> = ({ reasons, limit, size = 'md' }) => {
  if (reasons.length === 0) return null;

  const shown = limit ? reasons.slice(0, limit) : reasons;
  const hidden = reasons.length - shown.length;
  const sizing = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Matched because">
      {shown.map((reason, idx) => {
        const style = REASON_STYLE[reason.kind];
        return (
          <li
            key={`${reason.kind}-${idx}`}
            className={`inline-flex items-center gap-1 rounded-full border text-gray-800 font-medium ${style.tint} ${sizing}`}
          >
            <span aria-hidden="true">{style.icon}</span>
            <span className="sr-only">{style.name}: </span>
            {reason.label}
          </li>
        );
      })}
      {hidden > 0 && (
        <li className={`inline-flex items-center rounded-full border border-gray-200 bg-white text-gray-600 ${sizing}`}>
          +{hidden} more
        </li>
      )}
    </ul>
  );
};

export default MatchExplanationChip;
