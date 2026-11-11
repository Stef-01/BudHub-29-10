// components/cookventure/results/MasalaSwapper.tsx
// Swap a recipe's spice blend for another (garam masala -> goda masala, sambar -> rasam powder).
import React from 'react';
import type { TasteAxes } from '../../../types/cookventure';
import { getMasalaOptions, masalaName } from '../../../services/cookventure/swaps';
import { TASTE_AXES } from '../../../services/cookventure/labels';

interface MasalaSwapperProps {
  /** Masalas the recipe uses as originally matched */
  originalMasalas: string[];
  /** Current swap, if any */
  swap?: { from: string; to: string };
  onSwap: (swap: { from: string; to: string } | undefined) => void;
  tasteBefore?: TasteAxes;
  tasteAfter?: TasteAxes;
  scoreDelta?: number;
}

const MasalaSwapper: React.FC<MasalaSwapperProps> = ({
  originalMasalas,
  swap,
  onSwap,
  tasteBefore,
  tasteAfter,
  scoreDelta,
}) => {
  const changes =
    swap && tasteBefore && tasteAfter
      ? TASTE_AXES.filter((axis) => tasteBefore[axis.key] !== tasteAfter[axis.key]).map(
          (axis) => `${axis.emoji} ${axis.roman} ${tasteBefore[axis.key]} → ${tasteAfter[axis.key]}`
        )
      : [];

  return (
    <div className="space-y-4">
      {originalMasalas.map((fromId) => {
        const activeTo = swap?.from === fromId ? swap.to : undefined;
        const options = getMasalaOptions(fromId);
        return (
          <div key={fromId}>
            <p className="text-xs text-gray-700 mb-2">
              Instead of <strong className="text-gray-900">{masalaName(fromId)}</strong>, use:
            </p>
            <div className="flex flex-wrap gap-2" role="group" aria-label={`Swap ${masalaName(fromId)}`}>
              <button
                type="button"
                aria-pressed={!activeTo}
                onClick={() => onSwap(undefined)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
                  !activeTo ? 'bg-orange-500 border-orange-500 text-white shadow' : 'bg-white border-gray-200 text-gray-800 hover:border-orange-400'
                }`}
              >
                🫙 {masalaName(fromId)} <span className={!activeTo ? 'text-orange-100' : 'text-gray-500'}>(original)</span>
              </button>
              {options.map(({ id, classic }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={activeTo === id}
                  onClick={() => onSwap({ from: fromId, to: id })}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
                    activeTo === id
                      ? 'bg-orange-500 border-orange-500 text-white shadow'
                      : 'bg-white border-gray-200 text-gray-800 hover:border-orange-400'
                  }`}
                >
                  {masalaName(id)}
                  {classic && (
                    <span className={`ml-1 text-[10px] ${activeTo === id ? 'text-orange-100' : 'text-orange-700'}`}>★ classic swap</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      })}
      {swap && (
        <p className="text-[11px] text-gray-700" aria-live="polite">
          {changes.length > 0 ? changes.join(' · ') : 'Flavor profile stays about the same.'}
          {typeof scoreDelta === 'number' && Math.abs(scoreDelta) >= 0.5 && (
            <span className="ml-2 font-semibold">
              {scoreDelta > 0 ? '▲' : '▼'} {Math.round(Math.abs(scoreDelta))} match points
            </span>
          )}
        </p>
      )}
    </div>
  );
};

export default MasalaSwapper;
