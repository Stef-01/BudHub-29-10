// components/cookventure/survey/CravingPicker.tsx
import React from 'react';
import { motion } from 'framer-motion';

interface Craving {
  id: string;
  emoji: string;
  label: string;
  description: string;
}

interface CravingPickerProps {
  selectedCravings: string[];
  onToggleCraving: (cravingId: string) => void;
}

const CravingPicker: React.FC<CravingPickerProps> = ({
  selectedCravings,
  onToggleCraving,
}) => {
  const cravings: Craving[] = [
    {
      id: 'spicy',
      emoji: '🌶️',
      label: 'Spicy',
      description: 'High heat, bold flavors',
    },
    {
      id: 'comfort',
      emoji: '🥘',
      label: 'Comfort Food',
      description: 'Warm, familiar, satisfying',
    },
    {
      id: 'light',
      emoji: '🥗',
      label: 'Light & Fresh',
      description: 'Tangy, refreshing dishes',
    },
    {
      id: 'rich',
      emoji: '🍲',
      label: 'Rich & Hearty',
      description: 'Deep flavors, satisfying',
    },
    {
      id: 'quick',
      emoji: '🥙',
      label: 'Quick',
      description: 'Fast prep, easy cooking',
    },
    {
      id: 'street',
      emoji: '🍛',
      label: 'Street Food',
      description: 'Chaat, snacks, bold tastes',
    },
    {
      id: 'breads',
      emoji: '🫓',
      label: 'Breads',
      description: 'Rotis, parathas, naan',
    },
    {
      id: 'coconut',
      emoji: '🥥',
      label: 'Coconut',
      description: 'South Indian coconut-based',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          What are you craving?
        </h2>
        <p className="text-sm text-gray-600">
          Select one or more (we'll find the perfect match)
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cravings.map((craving) => {
          const isSelected = selectedCravings.includes(craving.id);

          return (
            <motion.button
              key={craving.id}
              onClick={() => onToggleCraving(craving.id)}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              className={`group relative p-6 rounded-2xl border-2 transition-all ${
                isSelected
                  ? 'border-orange-500 bg-orange-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-orange-300 shadow-md'
              }`}
            >
              {/* Emoji */}
              <div className="text-5xl mb-3 transition-transform group-hover:scale-110">
                {craving.emoji}
              </div>

              {/* Label */}
              <h3 className="font-bold text-base text-gray-800 mb-1">
                {craving.label}
              </h3>

              {/* Description - shows on hover */}
              <div className="absolute inset-x-0 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/80 to-transparent rounded-b-2xl p-3">
                <p className="text-xs text-white leading-tight">
                  {craving.description}
                </p>
              </div>

              {/* Checkmark for selected */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center"
                >
                  <span className="text-white text-sm">✓</span>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selected summary */}
      {selectedCravings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200"
        >
          <p className="text-sm text-orange-800 font-medium">
            ✨ {selectedCravings.length} craving{selectedCravings.length > 1 ? 's' : ''} selected
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default CravingPicker;
