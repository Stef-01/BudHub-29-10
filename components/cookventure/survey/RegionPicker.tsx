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
          Which region's flavors do you love?
        </h2>
        <p className="text-sm text-gray-600">
          Select one or more regions (you can choose multiple!)
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {regionIds.map((regionId) => {
          const region = regions[regionId];
          const isSelected = selectedRegions.includes(regionId);

          return (
            <motion.button
              key={regionId}
              onClick={() => onToggleRegion(regionId)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`
                relative p-5 rounded-xl border-2 text-left transition-all
                ${
                  isSelected
                    ? 'border-green-500 bg-green-50 shadow-lg ring-2 ring-green-400'
                    : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md'
                }
              `}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}

              {/* Region Emoji */}
              <div className="text-5xl mb-3 text-center">{region.emoji}</div>

              {/* Region Name */}
              <h3 className="font-bold text-lg text-gray-800 mb-1 text-center">
                {region.name}
              </h3>

              {/* Region Notes */}
              <p className="text-xs text-gray-600 text-center leading-relaxed">
                {region.notes}
              </p>

              {/* States */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-[10px] text-gray-500 text-center">
                  {region.states.slice(0, 3).join(', ')}
                  {region.states.length > 3 && ` +${region.states.length - 3} more`}
                </p>
              </div>

              {/* Staple Ingredients Preview (shown when selected) */}
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 pt-3 border-t border-green-200"
                >
                  <p className="text-[10px] font-semibold text-green-700 mb-1">
                    Staple ingredients:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {region.staple_packs.slice(0, 5).map((staple) => (
                      <span
                        key={staple}
                        className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded text-[9px] font-medium"
                      >
                        {staple.replace('_', ' ')}
                      </span>
                    ))}
                    {region.staple_packs.length > 5 && (
                      <span className="text-[9px] text-green-600">
                        +{region.staple_packs.length - 5} more
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selection Summary */}
      {selectedRegions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200"
        >
          <p className="text-sm text-green-800 font-medium">
            ✓ Selected {selectedRegions.length} region{selectedRegions.length > 1 ? 's' : ''}:{' '}
            {selectedRegions.map((id) => regions[id].name).join(', ')}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default RegionPicker;
