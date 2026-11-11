// components/cookventure/survey/SubregionPicker.tsx
// Optional narrowing under each picked region: Kerala, Chettinad, Andhra, Udupi, ...
import React from 'react';
import { motion } from 'framer-motion';
import type { RegionsMap } from '../../../types/cookventure';
import { getSubregions } from '../../../services/cookventure/regionalPresets';
import CvAsset from '../shared/CvAsset';

interface SubregionPickerProps {
  regions: RegionsMap;
  selectedRegions: string[];
  selectedSubregions: string[];
  onToggleSubregion: (subregionId: string) => void;
}

const SubregionPicker: React.FC<SubregionPickerProps> = ({
  regions,
  selectedRegions,
  selectedSubregions,
  onToggleSubregion,
}) => {
  const groups = selectedRegions
    .map((regionId) => ({ regionId, subs: getSubregions(regionId) }))
    .filter((g) => g.subs.length > 0);
  if (groups.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-gray-800">
          Narrow it down <span className="font-normal text-gray-500">(optional) · उप-क्षेत्र</span>
        </h3>
        <p className="text-[11px] text-gray-500">Dishes from a kitchen you pick rank above the rest of its region</p>
      </div>
      {groups.map(({ regionId, subs }) => (
        <div key={regionId}>
          <p className="text-[11px] font-semibold text-gray-600 mb-2">
            {regions[regionId]?.emoji} {regions[regionId]?.name}
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-label={`${regions[regionId]?.name} kitchens`}>
            {subs.map((sub) => {
              const selected = selectedSubregions.includes(sub.id);
              return (
                <button
                  key={sub.id}
                  type="button"
                  aria-pressed={selected}
                  title={sub.notes}
                  onClick={() => onToggleSubregion(sub.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 ${
                    selected
                      ? 'border-green-500 bg-green-50 text-green-900 shadow-sm'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-green-300'
                  }`}
                >
                  <CvAsset category="subregions" id={sub.id} fallback={sub.emoji} className="w-5 h-5" />
                  {sub.name}
                  <span className="font-normal text-gray-500" lang="hi">
                    {sub.name_hi}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </motion.div>
  );
};

export default SubregionPicker;
