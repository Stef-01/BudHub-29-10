// components/cookventure/survey/PantryBingo.tsx
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface IngredientPack {
  id: string;
  name: string;
  emoji: string;
  ingredients: string[];
  description: string;
}

interface PantryBingoProps {
  selectedRegions: string[];
  selectedIngredients: string[];
  onToggleIngredient: (ingredient: string) => void;
  onSelectPack: (ingredients: string[]) => void;
}

const PantryBingo: React.FC<PantryBingoProps> = ({
  selectedRegions,
  selectedIngredients,
  onToggleIngredient,
  onSelectPack,
}) => {
  // Define ingredient packs
  const ingredientPacks: IngredientPack[] = [
    {
      id: 'indian_essentials',
      name: 'Indian Essentials',
      emoji: '🧄',
      ingredients: ['onion', 'tomato', 'ginger', 'garlic', 'green chilli', 'coriander'],
      description: 'Core ingredients for most Indian cooking',
    },
    {
      id: 'north_staples',
      name: 'North Staples',
      emoji: '🫓',
      ingredients: ['wheat', 'dairy', 'chickpea', 'cumin', 'turmeric', 'red chilli powder'],
      description: 'Common in Punjab, Delhi, UP',
    },
    {
      id: 'south_staples',
      name: 'South Staples',
      emoji: '🥥',
      ingredients: ['rice', 'coconut', 'curry leaves', 'tamarind', 'mustard seeds', 'urad dal'],
      description: 'Tamil Nadu, Kerala, Karnataka',
    },
    {
      id: 'dal_kit',
      name: 'Dal Kit',
      emoji: '🫘',
      ingredients: ['toor dal', 'moong dal', 'masoor dal', 'chana dal', 'urad dal'],
      description: 'Essential lentils & pulses',
    },
    {
      id: 'spice_rack',
      name: 'Spice Rack',
      emoji: '🌶️',
      ingredients: ['cumin', 'coriander powder', 'turmeric', 'red chilli powder', 'garam masala', 'black pepper'],
      description: 'Basic Indian spices',
    },
    {
      id: 'fresh_herbs',
      name: 'Fresh Herbs',
      emoji: '🌿',
      ingredients: ['coriander', 'mint', 'curry leaves', 'ginger', 'garlic', 'green chilli'],
      description: 'Aromatics & fresh flavors',
    },
  ];

  // All unique ingredients from packs
  const allIngredients = useMemo(() => {
    const ingredients = new Set<string>();
    ingredientPacks.forEach(pack => {
      pack.ingredients.forEach(ing => ingredients.add(ing));
    });
    return Array.from(ingredients).sort();
  }, []);

  // Filter packs based on selected regions
  const relevantPacks = useMemo(() => {
    if (selectedRegions.length === 0) return ingredientPacks;

    const packs = [...ingredientPacks];

    // Prioritize region-specific packs
    if (selectedRegions.includes('north')) {
      packs.unshift(packs.splice(packs.findIndex(p => p.id === 'north_staples'), 1)[0]);
    }
    if (selectedRegions.includes('south')) {
      packs.unshift(packs.splice(packs.findIndex(p => p.id === 'south_staples'), 1)[0]);
    }

    return packs;
  }, [selectedRegions]);

  const handlePackClick = (pack: IngredientPack) => {
    onSelectPack(pack.ingredients);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          What's in your fridge & pantry?
        </h2>
        <p className="text-sm text-gray-600">
          Select individual ingredients or use quick packs to speed things up
        </p>
      </div>

      {/* Quick Packs */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span>📦</span>
          <span>Quick Packs</span>
          <span className="text-xs font-normal text-gray-500">(Click to add all)</span>
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {relevantPacks.map((pack) => {
            const packItemsSelected = pack.ingredients.filter(ing =>
              selectedIngredients.includes(ing)
            ).length;
            const isFullySelected = packItemsSelected === pack.ingredients.length;

            return (
              <motion.button
                key={pack.id}
                onClick={() => handlePackClick(pack)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  isFullySelected
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-green-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{pack.emoji}</span>
                  <h4 className="font-bold text-sm text-gray-800">{pack.name}</h4>
                </div>
                <p className="text-xs text-gray-600 mb-2">{pack.description}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${(packItemsSelected / pack.ingredients.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600 font-medium">
                    {packItemsSelected}/{pack.ingredients.length}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Individual Ingredients */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span>🥬</span>
          <span>Individual Ingredients</span>
          <span className="text-xs font-normal text-gray-500">
            ({selectedIngredients.length} selected)
          </span>
        </h3>

        <div className="flex flex-wrap gap-2">
          {allIngredients.map((ingredient) => {
            const isSelected = selectedIngredients.includes(ingredient);

            return (
              <motion.button
                key={ingredient}
                onClick={() => onToggleIngredient(ingredient)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  isSelected
                    ? 'border-green-500 bg-green-100 text-green-800 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-green-300'
                }`}
              >
                {isSelected && '✓ '}
                {ingredient.replace('_', ' ')}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Selected Summary */}
      {selectedIngredients.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-50 rounded-lg border border-green-200"
        >
          <p className="text-sm text-green-800 font-medium mb-2">
            ✓ {selectedIngredients.length} ingredients selected
          </p>
          <div className="flex flex-wrap gap-1">
            {selectedIngredients.slice(0, 15).map((ing) => (
              <span
                key={ing}
                className="inline-block px-2 py-0.5 bg-green-200 text-green-800 rounded text-xs font-medium"
              >
                {ing.replace('_', ' ')}
              </span>
            ))}
            {selectedIngredients.length > 15 && (
              <span className="text-xs text-green-600 px-2 py-0.5">
                +{selectedIngredients.length - 15} more
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* Helper Tip */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-xs text-blue-800 leading-relaxed">
          <span className="font-semibold">💡 Pro tip:</span> Don't worry about common ingredients like
          salt, oil, or water - we'll focus on key ingredients that define the recipe's character!
        </p>
      </div>
    </div>
  );
};

export default PantryBingo;
