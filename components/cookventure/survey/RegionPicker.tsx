// components/cookventure/survey/RegionPicker.tsx
import React from 'react';
import { motion } from 'framer-motion';
import type { Region } from '../../../types/cookventure';

interface RegionPickerProps {
  regions: Record<string, Region>;
  selectedRegions: string[];
  onToggleRegion: (regionId: string) => void;
}

const RegionPicker: React.FC<RegionPickerProps> = ({
  regions,
  selectedRegions,
  onToggleRegion,
}) => {
  const regionIds = Object.keys(regions);

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Pick your regions
        </h2>
        <p className="text-xs text-gray-500">
          Hover for details • Select multiple
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {regionIds.map((regionId) => {
          const region = regions[regionId];
          const isSelected = selectedRegions.includes(regionId);

          return (
            <motion.button
              key={regionId}
              onClick={() => onToggleRegion(regionId)}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              className={`group relative p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-green-500 bg-green-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-green-300'
              }`}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}

              {/* Region Emoji */}
              <div className="text-4xl mb-2 text-center">{region.emoji}</div>

              {/* Region Name */}
              <h3 className="font-bold text-sm text-gray-800 text-center">
                {region.name}
              </h3>

              {/* Hover Tooltip */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/90 via-black/80 to-transparent rounded-xl p-3 flex flex-col justify-end pointer-events-none">
                <p className="text-xs text-white leading-tight mb-2">
                  {region.notes}
                </p>
                <p className="text-[10px] text-gray-300">
                  {region.states.slice(0, 2).join(', ')}
                  {region.states.length > 2 && '...'}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Selection Summary */}
      {selectedRegions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center p-3 bg-green-50 rounded-lg border border-green-200"
        >
          <p className="text-xs text-green-800 font-medium">
            ✓ {selectedRegions.length} selected
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default RegionPicker;
