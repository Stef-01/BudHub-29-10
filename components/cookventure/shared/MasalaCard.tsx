// components/cookventure/shared/MasalaCard.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Masala } from '../../../types/cookventure';
import { MasalaLearnCard } from './LearnCards';

interface MasalaCardProps {
  masala: Masala & { id: string };
  isSelected: boolean;
  onToggle: () => void;
}

const MasalaCard: React.FC<MasalaCardProps> = ({ masala, isSelected, onToggle }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    // Hover is tracked on the wrapper so moving the pointer into the learn card keeps it open
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <motion.button
        onClick={onToggle}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        aria-pressed={isSelected}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className={`
          relative w-full p-4 rounded-lg border-2 text-left transition-all
          ${
            isSelected
              ? 'border-orange-500 bg-orange-50 shadow-md ring-2 ring-orange-400'
              : 'border-gray-200 bg-white hover:border-orange-300'
          }
        `}
      >
        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}

        {/* Masala Name */}
        <h4 className="font-bold text-sm text-gray-800 mb-1">
          {masala.name}
        </h4>
        {masala.name_hi && (
          <p className="text-xs text-gray-500 mb-2">{masala.name_hi}</p>
        )}

        {/* Description */}
        <p className="text-xs text-gray-600 leading-relaxed">
          {masala.description}
        </p>

        {/* Aroma Tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {masala.aroma.slice(0, 2).map((aroma) => (
            <span
              key={aroma}
              className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                isSelected
                  ? 'bg-orange-200 text-orange-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {aroma}
            </span>
          ))}
        </div>
      </motion.button>

      {/* Learn card on hover / keyboard focus */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            // x is set here, not via a Tailwind translate class: framer-motion owns the transform
            initial={{ opacity: 0, x: '-50%', y: 10 }}
            animate={{ opacity: 1, x: '-50%', y: 0 }}
            exit={{ opacity: 0, x: '-50%', y: 10 }}
            // pb-2 is a transparent bridge between the card and the tooltip, so "Learn more" stays reachable
            className="absolute z-50 bottom-full left-1/2 pb-2 w-64"
            role="tooltip"
          >
            <div className="relative p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg">
              <MasalaLearnCard masala={masala} />
              {/* Tooltip Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2">
                <div className="border-8 border-transparent border-t-gray-800"></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MasalaCard;
