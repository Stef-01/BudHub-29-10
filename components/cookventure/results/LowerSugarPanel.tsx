// components/cookventure/results/LowerSugarPanel.tsx
// Toggle the lower-sugar version of a recipe and show exactly what changes.
import React from 'react';

interface LowerSugarPanelProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  swaps?: Array<{ from: string; to: string }>;
  tip?: string;
}

const LowerSugarPanel: React.FC<LowerSugarPanelProps> = ({ enabled, onToggle, swaps = [], tip }) => (
  <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => onToggle(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-sky-300 text-sky-600 focus:ring-sky-400"
      />
      <span>
        <span className="block text-sm font-semibold text-gray-900">🩺 Make a lower-sugar version</span>
        <span className="block text-xs text-gray-600">Swaps the sweeteners for gentler options and shows each change</span>
      </span>
    </label>

    {enabled && swaps.length > 0 && (
      <div className="mt-3 space-y-2" aria-live="polite">
        <ul className="space-y-1.5">
          {swaps.map((swap, idx) => (
            <li key={idx} className="text-xs text-gray-800 bg-white rounded-lg px-3 py-2 border border-sky-100">
              <span className="text-gray-500 line-through">{swap.from}</span>
              <span className="mx-1.5 text-gray-400" aria-hidden="true">
                →
              </span>
              <span className="font-medium">{swap.to}</span>
            </li>
          ))}
        </ul>
        {tip && <p className="text-[11px] text-gray-600">{tip}</p>}
        <p className="text-[11px] text-gray-500">
          A lower-sugar version isn't automatically diabetes-friendly. If you manage diabetes, check portions with your
          care team.
        </p>
      </div>
    )}
  </div>
);

export default LowerSugarPanel;
