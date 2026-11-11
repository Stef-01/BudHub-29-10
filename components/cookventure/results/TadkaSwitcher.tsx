// components/cookventure/results/TadkaSwitcher.tsx
// Swap the tempering on a matched recipe, with a little sizzle when the new tadka hits the oil.
import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { TadkaMap } from '../../../types/cookventure';
import tadkaData from '../../../data/cookventure/tadka.json';
import { TASTE_LEVEL_LABELS } from '../../../services/cookventure/labels';
import CvAsset from '../shared/CvAsset';

const TADKAS = tadkaData as TadkaMap;

// Particles thrown out of the pan: [x offset px, peak height px, size px]
const SPLUTTER: Array<[number, number, number]> = [
  [-34, -38, 5],
  [-22, -52, 4],
  [-10, -44, 6],
  [4, -58, 4],
  [16, -46, 5],
  [28, -54, 4],
  [38, -36, 5],
  [-4, -30, 3],
];

interface TadkaSwitcherProps {
  options: string[];
  /** Tadka the recipe originally uses */
  originalTadka?: string;
  /** Tadka the recipe uses right now (after any swap) */
  currentTadka?: string;
  onSwitch: (tadkaId: string) => void;
  /** Heat before and after the swap, when the recipe has a taste profile */
  heatChange?: { from: number; to: number };
  scoreDelta?: number;
}

const TadkaSwitcher: React.FC<TadkaSwitcherProps> = ({
  options,
  originalTadka,
  currentTadka,
  onSwitch,
  heatChange,
  scoreDelta,
}) => {
  const reduceMotion = useReducedMotion();
  const [sizzleKey, setSizzleKey] = useState(0);
  const current = currentTadka ? TADKAS[currentTadka] : undefined;
  const isSwapped = !!currentTadka && currentTadka !== originalTadka;

  const handleSwitch = (tadkaId: string) => {
    if (tadkaId === currentTadka) return;
    setSizzleKey((k) => k + 1);
    onSwitch(tadkaId);
  };

  return (
    <div>
      {/* The pan */}
      <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
        <div className="relative flex-shrink-0 w-16 h-16" aria-hidden="true">
          <motion.div
            key={`pan-${sizzleKey}`}
            className="w-16 h-16 rounded-full bg-gray-800 shadow-inner flex items-center justify-center text-2xl ring-4 ring-gray-700"
            initial={reduceMotion || sizzleKey === 0 ? false : { rotate: -6 }}
            animate={{ rotate: 0 }}
            transition={{ type: 'spring', stiffness: 600, damping: 8 }}
          >
            {current && currentTadka ? (
              <CvAsset category="tadkas" id={currentTadka} fallback={current.emoji} className="w-11 h-11" />
            ) : (
              '🍳'
            )}
          </motion.div>
          <AnimatePresence>
            {!reduceMotion && sizzleKey > 0 && (
              <motion.div key={`splutter-${sizzleKey}`} className="absolute inset-0 pointer-events-none">
                {SPLUTTER.map(([x, peak, size], idx) => (
                  <motion.span
                    key={idx}
                    className="absolute left-1/2 top-1/2 rounded-full bg-amber-400"
                    style={{ width: size, height: size }}
                    initial={{ x: 0, y: 0, opacity: 1 }}
                    animate={{ x, y: [0, peak, peak + 18], opacity: [1, 1, 0] }}
                    transition={{ duration: 0.7, delay: idx * 0.025, ease: 'easeOut' }}
                  />
                ))}
                <motion.span
                  className="absolute -top-5 left-1/2 text-[11px] font-black italic text-orange-600 whitespace-nowrap"
                  initial={{ opacity: 0, scale: 0.6, x: '-50%' }}
                  animate={{ opacity: [0, 1, 0], scale: [0.6, 1.1, 1], x: '-50%' }}
                  transition={{ duration: 0.9 }}
                >
                  chhhh!
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="min-w-0 flex-1" aria-live="polite">
          {current ? (
            <>
              <p className="text-sm font-bold text-gray-900">
                {current.name} <span className="font-normal text-gray-500 text-xs">{current.name_hi}</span>
              </p>
              <p className="text-xs italic text-gray-600 mb-1">{current.aroma}</p>
              {current.method && <p className="text-xs text-gray-700 leading-relaxed">{current.method}</p>}
              {isSwapped && (
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-700">
                  {heatChange && heatChange.from !== heatChange.to && (
                    <span>
                      🌶️ Heat {TASTE_LEVEL_LABELS[heatChange.from]} → {TASTE_LEVEL_LABELS[heatChange.to]}
                    </span>
                  )}
                  {typeof scoreDelta === 'number' && Math.abs(scoreDelta) >= 0.5 && (
                    <span className="font-semibold">
                      {scoreDelta > 0 ? '▲' : '▼'} {Math.round(Math.abs(scoreDelta))} match points
                    </span>
                  )}
                  <span className="text-gray-500">Use this in place of the recipe's tempering step.</span>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-gray-600">Pick a tadka to temper this dish.</p>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Choose a tadka">
        {options.map((id) => {
          const tadka = TADKAS[id];
          if (!tadka) return null;
          const selected = id === currentTadka;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={selected}
              onClick={() => handleSwitch(id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                selected
                  ? 'bg-amber-500 border-amber-500 text-white shadow'
                  : 'bg-white border-gray-200 text-gray-800 hover:border-amber-400'
              }`}
            >
              <CvAsset category="tadkas" id={id} fallback={tadka.emoji} className="w-4 h-4" />
              {tadka.name}
              {id === originalTadka && (
                <span className={`text-[10px] ${selected ? 'text-amber-100' : 'text-gray-500'}`}>(original)</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TadkaSwitcher;
