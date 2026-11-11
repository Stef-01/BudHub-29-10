// components/cookventure/survey/RegionalStarterKits.tsx
// One-tap presets: a classic dish's pantry, masalas, tadka and taste, straight to results.
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { RegionsMap } from '../../../types/cookventure';
import {
  getRegionalStarterKits,
  getSubregionKit,
  getSubregions,
  type RegionalPreset,
} from '../../../services/cookventure/regionalPresets';
import { getSubregionName, TASTE_AXES } from '../../../services/cookventure/labels';
import CvAsset from '../shared/CvAsset';

interface RegionalStarterKitsProps {
  regions: RegionsMap;
  selectedRegions: string[];
  selectedSubregions?: string[];
  onApplyKit: (preset: RegionalPreset) => void;
}

const RegionalStarterKits: React.FC<RegionalStarterKitsProps> = ({
  regions,
  selectedRegions,
  selectedSubregions = [],
  onApplyKit,
}) => {
  // Every region's classic when nothing is picked; otherwise the picked regions' classics plus
  // their sub-regional kits, with the kitchens you narrowed down to first
  const kits = useMemo(() => {
    if (selectedRegions.length === 0) return Object.keys(regions).flatMap((id) => getRegionalStarterKits(id));
    const subKits = selectedRegions
      .flatMap((id) => getSubregions(id))
      .map((sub) => getSubregionKit(sub.id)!);
    const picked = subKits.filter((k) => selectedSubregions.includes(k.subregionId!));
    const rest = subKits.filter((k) => !selectedSubregions.includes(k.subregionId!));
    return [...picked, ...selectedRegions.flatMap((id) => getRegionalStarterKits(id)), ...rest];
  }, [regions, selectedRegions, selectedSubregions]);

  if (kits.length === 0) return null;

  return (
    <div className="mt-8 pt-6 border-t border-gray-100">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <h3 className="text-lg font-bold text-gray-800">
          Quick start <span className="text-sm font-normal text-gray-500">झटपट शुरुआत</span>
        </h3>
        <p className="text-xs text-gray-500">
          {selectedRegions.length > 0 ? 'Classics from your regions' : 'Pick a classic to skip ahead'} · sets pantry,
          masala, tadka & taste
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {kits.map((kit, idx) => {
          const region = regions[kit.regionId];
          return (
            <motion.button
              key={kit.id}
              type="button"
              onClick={() => onApplyKit(kit)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              className="group text-left p-4 rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white to-orange-50 hover:border-orange-400 hover:shadow-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl leading-none flex-shrink-0">
                  <CvAsset category="kits" id={kit.id} fallback={kit.emoji} className="w-12 h-12 rounded-lg" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-gray-900">{kit.title}</p>
                  <p className="text-xs text-gray-600">{kit.description}</p>
                  {region && (
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {region.emoji} {kit.subregionId ? `${getSubregionName(kit.subregionId)} · ` : ''}
                      {region.name}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3" aria-label="Taste">
                {TASTE_AXES.filter((axis) => kit.taste[axis.key] > 0).map((axis) => (
                  <span
                    key={axis.key}
                    className="px-2 py-0.5 rounded-full bg-white border border-gray-200 text-[10px] font-medium text-gray-700"
                  >
                    {axis.emoji} {axis.roman} {kit.taste[axis.key]}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs font-semibold text-orange-700 group-hover:text-orange-800">
                Cook this style →
              </p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default RegionalStarterKits;
