// components/cookventure/survey/DietAvoidsPicker.tsx
// Survey step: diets (strict ones hide recipes, goals boost them) and allergens to avoid.
import React from 'react';
import { motion } from 'framer-motion';
import { ALLERGEN_OPTIONS, DIET_OPTIONS } from '../../../services/cookventure/dietRules';

interface DietAvoidsPickerProps {
  diet: string[];
  avoids: string[];
  onToggleDiet: (dietId: string) => void;
  onToggleAvoid: (allergenId: string) => void;
}

const Chip: React.FC<{
  selected: boolean;
  onClick: () => void;
  emoji: string;
  label: string;
  hi: string;
  help: string;
  tone: 'green' | 'blue' | 'red';
}> = ({ selected, onClick, emoji, label, hi, help, tone }) => {
  const on = {
    green: 'border-green-500 bg-green-50 ring-green-300',
    blue: 'border-sky-500 bg-sky-50 ring-sky-300',
    red: 'border-rose-500 bg-rose-50 ring-rose-300',
  }[tone];
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      aria-pressed={selected}
      onClick={onClick}
      className={`relative text-left rounded-xl border-2 p-3 transition-all focus:outline-none focus-visible:ring-2 ${
        selected ? `${on} shadow-md ring-1` : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      {selected && (
        <span className="absolute top-2 right-2 text-xs font-bold text-gray-700" aria-hidden="true">
          ✓
        </span>
      )}
      <span className="flex items-center gap-2">
        <span className="text-xl" aria-hidden="true">
          {emoji}
        </span>
        <span>
          <span className="block text-sm font-bold text-gray-800">{label}</span>
          <span className="block text-[10px] text-gray-500" lang="hi">
            {hi}
          </span>
        </span>
      </span>
      <span className="block mt-1.5 text-[11px] text-gray-600 leading-snug">{help}</span>
    </motion.button>
  );
};

const DietAvoidsPicker: React.FC<DietAvoidsPickerProps> = ({ diet, avoids, onToggleDiet, onToggleAvoid }) => {
  const strict = DIET_OPTIONS.filter((d) => d.kind === 'strict');
  const goals = DIET_OPTIONS.filter((d) => d.kind === 'goal');

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Diet & avoids</h2>
        <p className="text-xs text-gray-500">Diets and allergens hide recipes that don't fit · goals just rank them higher</p>
      </div>

      <section>
        <h3 className="text-sm font-bold text-gray-700 mb-3">
          🥬 I eat <span className="font-normal text-gray-500">आहार</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {strict.map((option) => (
            <Chip
              key={option.id}
              selected={diet.includes(option.id)}
              onClick={() => onToggleDiet(option.id)}
              emoji={option.emoji}
              label={option.label}
              hi={option.hi}
              help={option.help}
              tone="green"
            />
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold text-gray-700 mb-3">
          🎯 Health goals <span className="font-normal text-gray-500">लक्ष्य</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {goals.map((option) => (
            <Chip
              key={option.id}
              selected={diet.includes(option.id)}
              onClick={() => onToggleDiet(option.id)}
              emoji={option.emoji}
              label={option.label}
              hi={option.hi}
              help={option.help}
              tone="blue"
            />
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold text-gray-700 mb-3">
          🚫 Allergies to avoid <span className="font-normal text-gray-500">एलर्जी</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ALLERGEN_OPTIONS.map((option) => (
            <Chip
              key={option.id}
              selected={avoids.includes(option.id)}
              onClick={() => onToggleAvoid(option.id)}
              emoji={option.emoji}
              label={option.label}
              hi={option.hi}
              help={option.help}
              tone="red"
            />
          ))}
        </div>
        <p className="mt-3 text-[11px] text-gray-500 leading-relaxed">
          We check each recipe's ingredient list, so packaged items (stock, hing, spice mixes) can still contain
          allergens. Always check labels if an allergy is serious.
        </p>
      </section>
    </div>
  );
};

export default DietAvoidsPicker;
