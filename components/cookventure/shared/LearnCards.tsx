// components/cookventure/shared/LearnCards.tsx
// "Learn" content for masalas and tadkas, plus a chip row that reveals it on hover, focus or tap.
import React, { useEffect, useId, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Masala, Tadka } from '../../../types/cookventure';
import { humanizeId } from '../../../services/cookventure/labels';

export const MasalaLearnCard: React.FC<{ masala: Masala }> = ({ masala }) => (
  <div>
    <h4 className="font-semibold text-sm mb-1">
      {masala.name} {masala.name_hi && <span className="font-normal text-gray-300">({masala.name_hi})</span>}
    </h4>
    <p className="mb-2 text-gray-200">{masala.description}</p>
    <p className="text-[11px] text-gray-300">
      <strong className="text-gray-100">Key spices:</strong> {masala.spices.map(humanizeId).join(', ')}
    </p>
    {masala.use_in && masala.use_in.length > 0 && (
      <p className="text-[11px] text-gray-300 mt-1">
        <strong className="text-gray-100">Use in:</strong> {masala.use_in.join(', ')}
      </p>
    )}
    {masala.refs.length > 0 && (
      <a
        href={masala.refs[0]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-orange-300 hover:text-orange-200 text-[11px] underline mt-2 inline-block"
        onClick={(e) => e.stopPropagation()}
      >
        Learn more →
      </a>
    )}
  </div>
);

export const TadkaLearnCard: React.FC<{ tadka: Tadka }> = ({ tadka }) => {
  const parts = [...tadka.seeds.map((s) => `${humanizeId(s)} seeds`), ...tadka.aromatics.map(humanizeId)];
  return (
    <div>
      <h4 className="font-semibold text-sm mb-1">
        {tadka.emoji} {tadka.name}{' '}
        {tadka.name_hi && <span className="font-normal text-gray-300">({tadka.name_hi})</span>}
      </h4>
      <p className="mb-2 text-gray-200 italic">{tadka.aroma}</p>
      {parts.length > 0 && (
        <p className="text-[11px] text-gray-300">
          <strong className="text-gray-100">Into the oil:</strong> {parts.join(', ')}
        </p>
      )}
      {tadka.method && (
        <p className="text-[11px] text-gray-300 mt-1">
          <strong className="text-gray-100">How:</strong> {tadka.method}
        </p>
      )}
    </div>
  );
};

interface SpiceLearnRowProps {
  masalas: Array<Masala & { id: string }>;
  tadkas: Array<Tadka & { id: string }>;
}

type SpiceKey = `masala:${string}` | `tadka:${string}`;

/**
 * Masala and tadka chips; hovering, focusing or tapping a chip shows its learn card
 * in a panel below the row (inline, so it never gets clipped by a scrolling container).
 */
export const SpiceLearnRow: React.FC<SpiceLearnRowProps> = ({ masalas, tadkas }) => {
  const [pinned, setPinned] = useState<SpiceKey | null>(null);
  const [previewing, setPreviewing] = useState<SpiceKey | null>(null);
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const active = previewing ?? pinned;

  // A tapped card can open below the fold of a scrolling dialog: bring it into view
  useEffect(() => {
    if (pinned) panelRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [pinned]);

  if (masalas.length === 0 && tadkas.length === 0) return null;

  const chip = (key: SpiceKey, label: React.ReactNode, ariaLabel: string, tone: string) => (
    <button
      key={key}
      type="button"
      aria-expanded={active === key}
      aria-controls={panelId}
      aria-label={ariaLabel}
      onClick={() => setPinned((p) => (p === key ? null : key))}
      onMouseEnter={() => setPreviewing(key)}
      onMouseLeave={() => setPreviewing(null)}
      onFocus={() => setPreviewing(key)}
      onBlur={() => setPreviewing(null)}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
        active === key ? 'bg-gray-800 text-white border-gray-800' : tone
      }`}
    >
      {label}
      <span aria-hidden="true" className="text-[10px] opacity-60">ⓘ</span>
    </button>
  );

  const activeMasala = active?.startsWith('masala:') ? masalas.find((m) => `masala:${m.id}` === active) : undefined;
  const activeTadka = active?.startsWith('tadka:') ? tadkas.find((t) => `tadka:${t.id}` === active) : undefined;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {masalas.map((m) =>
          chip(
            `masala:${m.id}`,
            <>🫙 {m.name}</>,
            `Learn about ${m.name}`,
            'bg-orange-50 text-orange-900 border-orange-200 hover:border-orange-400'
          )
        )}
        {tadkas.map((t) =>
          chip(
            `tadka:${t.id}`,
            <>
              {t.emoji} {t.name}
            </>,
            `Learn about the ${t.name} tadka`,
            'bg-amber-50 text-amber-900 border-amber-200 hover:border-amber-400'
          )
        )}
      </div>
      <div id={panelId} ref={panelRef} aria-live="polite" className="scroll-mb-4">
        <AnimatePresence mode="wait">
          {(activeMasala || activeTadka) && (
            <motion.div
              key={active}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="mt-3 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg leading-relaxed"
            >
              {activeMasala ? <MasalaLearnCard masala={activeMasala} /> : <TadkaLearnCard tadka={activeTadka!} />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {!active && <p className="mt-2 text-[11px] text-gray-500">Hover or tap a spice to learn about it</p>}
    </div>
  );
};
