// components/cookventure/shared/TadkaCard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import type { Tadka } from '../../../types/cookventure';

interface TadkaCardProps {
  tadka: Tadka & { id: string };
  isSelected: boolean;
  onToggle: () => void;
}

const TadkaCard: React.FC<TadkaCardProps> = ({ tadka, isSelected, onToggle }) => {
  return (
    <motion.button
      onClick={onToggle}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={`
        relative w-full p-4 rounded-lg border-2 text-left transition-all
        ${
          isSelected
            ? 'border-amber-500 bg-amber-50 shadow-md ring-2 ring-amber-400'
            : 'border-gray-200 bg-white hover:border-amber-300'
        }
      `}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}

      {/* Tadka Emoji & Name */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{tadka.emoji}</span>
        <div>
          <h4 className="font-bold text-sm text-gray-800">
            {tadka.name}
          </h4>
          {tadka.name_hi && (
            <p className="text-xs text-gray-500">{tadka.name_hi}</p>
          )}
        </div>
      </div>

      {/* Aroma Description */}
      <p className="text-xs text-gray-600 mb-2 italic">
        {tadka.aroma}
      </p>

      {/* Ingredients */}
      <div className="space-y-1">
        {tadka.seeds.length > 0 && (
          <div className="flex items-start gap-1">
            <span className="text-[10px] text-gray-500 font-medium min-w-[45px]">Seeds:</span>
            <span className="text-[10px] text-gray-700">
              {tadka.seeds.map(s => s.replace('_', ' ')).join(', ')}
            </span>
          </div>
        )}
        {tadka.aromatics.length > 0 && (
          <div className="flex items-start gap-1">
            <span className="text-[10px] text-gray-500 font-medium min-w-[45px]">Aromatics:</span>
            <span className="text-[10px] text-gray-700">
              {tadka.aromatics.map(a => a.replace('_', ' ')).join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Heat Indicator */}
      <div className="mt-2 flex items-center gap-1">
        <span className="text-[10px] text-gray-500 font-medium">Heat:</span>
        <div className="flex gap-0.5">
          {[1, 2, 3].map((level) => (
            <div
              key={level}
              className={`w-3 h-3 rounded-sm ${
                level <= tadka.heat
                  ? 'bg-red-500'
                  : 'bg-gray-200'
              }`}
            ></div>
          ))}
        </div>
      </div>

      {/* Region Fit */}
      <div className="mt-2 flex flex-wrap gap-1">
        {tadka.region_fit.map((region) => (
          <span
            key={region}
            className={`inline-block px-2 py-0.5 rounded text-[9px] font-medium ${
              isSelected
                ? 'bg-amber-200 text-amber-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {region}
          </span>
        ))}
      </div>
    </motion.button>
  );
};

export default TadkaCard;
