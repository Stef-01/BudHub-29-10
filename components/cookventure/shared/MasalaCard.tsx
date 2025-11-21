// components/cookventure/shared/MasalaCard.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Masala } from '../../../types/cookventure';

interface MasalaCardProps {
  masala: Masala & { id: string };
  isSelected: boolean;
  onToggle: () => void;
}

const MasalaCard: React.FC<MasalaCardProps> = ({ masala, isSelected, onToggle }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <motion.button
        onClick={onToggle}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
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

      {/* Tooltip on Hover */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg pointer-events-none"
          >
            <h4 className="font-semibold mb-1">
              {masala.name} {masala.name_hi && `(${masala.name_hi})`}
            </h4>
            <p className="mb-2 text-gray-200">{masala.description}</p>
            <p className="text-[10px] text-gray-300">
              <strong>Key spices:</strong> {masala.spices.slice(0, 4).join(', ')}
              {masala.spices.length > 4 && '...'}
            </p>
            {masala.refs.length > 0 && (
              <a
                href={masala.refs[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-300 hover:text-orange-200 text-[10px] underline mt-1 inline-block"
                onClick={(e) => e.stopPropagation()}
              >
                Learn more →
              </a>
            )}

            {/* Tooltip Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div className="border-8 border-transparent border-t-gray-800"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MasalaCard;
