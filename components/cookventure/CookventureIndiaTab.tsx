// components/cookventure/CookventureIndiaTab.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserPreferences, TasteAxes, ScoredRecipe } from '../../types/cookventure';
import { loadCookventureData } from '../../services/cookventure/regionalPresets';
import { calculateCookventureScore, sortScoredRecipes } from '../../services/cookventure/cookventureScoring';

// Survey components
import CravingPicker from './survey/CravingPicker';
import RegionPicker from './survey/RegionPicker';
import PantryBingo from './survey/PantryBingo';
import FlavorDials from './survey/FlavorDials';
import MasalaTadkaLocker from './survey/MasalaTadkaLocker';

// Results components
import RecipeResultsGrid from './results/RecipeResultsGrid';

type SurveyStep = 'craving' | 'region' | 'pantry' | 'flavor' | 'masala_tadka' | 'results';

interface CookventureIndiaTabProps {
  recipes?: any[]; // Will be typed with full Recipe interface later
}

const CookventureIndiaTab: React.FC<CookventureIndiaTabProps> = ({ recipes = [] }) => {
  const [currentStep, setCurrentStep] = useState<SurveyStep>('craving');
  const [userPrefs, setUserPrefs] = useState<UserPreferences>({
    cravings: [],
    selectedRegions: [],
    pantry: [],
    tastePrefs: { heat: 1, masala: 1, tangy: 1, sweet: 0 },
    diet: ['vegetarian'],
    avoids: [],
    masalaLocker: [],
    favouriteTadkas: [],
    diabetic_friendly: false,
  });
  const [scoredRecipes, setScoredRecipes] = useState<ScoredRecipe[]>([]);

  // Load taxonomy data
  const { regions, masalas, tadkas } = loadCookventureData();

  // Update craving selection
  const handleToggleCraving = (cravingId: string) => {
    setUserPrefs((prev) => ({
      ...prev,
      cravings: prev.cravings.includes(cravingId)
        ? prev.cravings.filter((c) => c !== cravingId)
        : [...prev.cravings, cravingId],
    }));
  };

  // Update region selection
  const handleToggleRegion = (regionId: string) => {
    setUserPrefs((prev) => ({
      ...prev,
      selectedRegions: prev.selectedRegions.includes(regionId)
        ? prev.selectedRegions.filter((r) => r !== regionId)
        : [...prev.selectedRegions, regionId],
    }));
  };

  // Update pantry ingredients
  const handleToggleIngredient = (ingredient: string) => {
    setUserPrefs((prev) => ({
      ...prev,
      pantry: prev.pantry.includes(ingredient)
        ? prev.pantry.filter((i) => i !== ingredient)
        : [...prev.pantry, ingredient],
    }));
  };

  // Select ingredient pack
  const handleSelectPack = (ingredients: string[]) => {
    setUserPrefs((prev) => ({
      ...prev,
      pantry: [...new Set([...prev.pantry, ...ingredients])],
    }));
  };

  // Update taste preferences
  const handleChangeTaste = (newTaste: TasteAxes) => {
    setUserPrefs((prev) => ({ ...prev, tastePrefs: newTaste }));
  };

  // Update masala selection
  const handleToggleMasala = (masalaId: string) => {
    setUserPrefs((prev) => ({
      ...prev,
      masalaLocker: prev.masalaLocker.includes(masalaId)
        ? prev.masalaLocker.filter((m) => m !== masalaId)
        : [...prev.masalaLocker, masalaId],
    }));
  };

  // Update tadka selection
  const handleToggleTadka = (tadkaId: string) => {
    setUserPrefs((prev) => ({
      ...prev,
      favouriteTadkas: prev.favouriteTadkas.includes(tadkaId)
        ? prev.favouriteTadkas.filter((t) => t !== tadkaId)
        : [...prev.favouriteTadkas, tadkaId],
    }));
  };

  // Calculate and sort recipes when reaching results
  useEffect(() => {
    if (currentStep === 'results') {
      // Score ALL recipes (not just those with cookventure data)
      // Recipes without cookventure metadata will still get base scores
      const scored = recipes.map((recipe) =>
        calculateCookventureScore(recipe, userPrefs)
      );

      // Sort recipes - show ALL recipes, even with low scores
      // This ensures every recipe from the cookbook appears
      const sorted = sortScoredRecipes(scored);

      setScoredRecipes(sorted);
    }
  }, [currentStep, recipes, userPrefs]);

  // Check if can proceed to next step
  const canProceed = () => {
    if (currentStep === 'craving') return userPrefs.cravings.length > 0;
    return true;
  };

  // Navigation with preserved state
  const handleNext = () => {
    if (!canProceed()) return;

    if (currentStep === 'craving') setCurrentStep('region');
    else if (currentStep === 'region') setCurrentStep('pantry');
    else if (currentStep === 'pantry') setCurrentStep('flavor');
    else if (currentStep === 'flavor') setCurrentStep('masala_tadka');
    else if (currentStep === 'masala_tadka') setCurrentStep('results');
  };

  const handleBack = () => {
    if (currentStep === 'region') setCurrentStep('craving');
    else if (currentStep === 'pantry') setCurrentStep('region');
    else if (currentStep === 'flavor') setCurrentStep('pantry');
    else if (currentStep === 'masala_tadka') setCurrentStep('flavor');
    else if (currentStep === 'results') setCurrentStep('masala_tadka');
  };

  // Allow jumping to any completed step from results
  const handleJumpToStep = (step: SurveyStep) => {
    if (step !== 'results') {
      setCurrentStep(step);
    }
  };

  const handleReset = () => {
    setCurrentStep('craving');
    setUserPrefs({
      cravings: [],
      selectedRegions: [],
      pantry: [],
      tastePrefs: { heat: 1, masala: 1, tangy: 1, sweet: 0 },
      diet: ['vegetarian'],
      avoids: [],
      masalaLocker: [],
      favouriteTadkas: [],
      diabetic_friendly: false,
    });
    setScoredRecipes([]);
  };

  return (
    <div className="py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black mb-3 bg-gradient-to-r from-orange-600 via-red-500 to-green-600 bg-clip-text text-transparent"
          >
            Cookventure India
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 text-sm md:text-base"
          >
            Discover authentic Indian recipes matched to your region, pantry, and taste
          </motion.p>
        </div>

        {/* Progress Bar - Clickable from results page */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            {['craving', 'region', 'pantry', 'flavor', 'masala_tadka', 'results'].map((step, idx) => {
              const stepIndex = ['craving', 'region', 'pantry', 'flavor', 'masala_tadka', 'results'].indexOf(currentStep);
              const isActive = idx <= stepIndex;
              const isCurrent = step === currentStep;
              const isClickable = currentStep === 'results' && step !== 'results' && isActive;

              return (
                <React.Fragment key={step}>
                  <motion.button
                    whileHover={isClickable ? { scale: 1.15 } : {}}
                    whileTap={isClickable ? { scale: 0.95 } : {}}
                    onClick={() => isClickable && handleJumpToStep(step as SurveyStep)}
                    disabled={!isClickable}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-200 text-gray-400'
                    } ${isCurrent ? 'ring-4 ring-orange-200' : ''} ${
                      isClickable ? 'cursor-pointer hover:ring-2 hover:ring-orange-300' : 'cursor-default'
                    }`}
                  >
                    {idx + 1}
                  </motion.button>
                  {idx < 5 && (
                    <div
                      className={`w-8 h-1 rounded transition-all ${
                        isActive ? 'bg-orange-500' : 'bg-gray-200'
                      }`}
                    ></div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
          <div className="flex justify-center text-[10px] text-gray-500 gap-3">
            <span className={currentStep === 'craving' ? 'font-bold text-orange-600' : ''}>
              Cravings
            </span>
            <span className={currentStep === 'region' ? 'font-bold text-orange-600' : ''}>
              Region
            </span>
            <span className={currentStep === 'pantry' ? 'font-bold text-orange-600' : ''}>
              Pantry
            </span>
            <span className={currentStep === 'flavor' ? 'font-bold text-orange-600' : ''}>
              Flavor
            </span>
            <span className={currentStep === 'masala_tadka' ? 'font-bold text-orange-600' : ''}>
              Masala
            </span>
            <span className={currentStep === 'results' ? 'font-bold text-orange-600' : ''}>
              Results
            </span>
          </div>
          {currentStep === 'results' && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-xs text-orange-600 mt-2 font-medium"
            >
              💡 Click any step above to adjust your preferences
            </motion.p>
          )}
        </div>

        {/* Survey Steps */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6"
          >
            {currentStep === 'craving' && (
              <CravingPicker
                selectedCravings={userPrefs.cravings}
                onToggleCraving={handleToggleCraving}
              />
            )}

            {currentStep === 'region' && (
              <RegionPicker
                regions={regions as any}
                selectedRegions={userPrefs.selectedRegions}
                onToggleRegion={handleToggleRegion}
              />
            )}

            {currentStep === 'pantry' && (
              <PantryBingo
                selectedRegions={userPrefs.selectedRegions}
                selectedIngredients={userPrefs.pantry}
                onToggleIngredient={handleToggleIngredient}
                onSelectPack={handleSelectPack}
              />
            )}

            {currentStep === 'flavor' && (
              <FlavorDials
                tastePrefs={userPrefs.tastePrefs}
                onChangeTaste={handleChangeTaste}
              />
            )}

            {currentStep === 'masala_tadka' && (
              <MasalaTadkaLocker
                availableMasalas={masalas as any}
                availableTadkas={tadkas as any}
                selectedMasalas={userPrefs.masalaLocker}
                selectedTadkas={userPrefs.favouriteTadkas}
                onToggleMasala={handleToggleMasala}
                onToggleTadka={handleToggleTadka}
              />
            )}

            {currentStep === 'results' && (
              <RecipeResultsGrid scoredRecipes={scoredRecipes} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={currentStep === 'results' ? handleReset : handleBack}
            disabled={currentStep === 'craving'}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              currentStep === 'craving'
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {currentStep === 'results' ? '🔄 Start Over' : '← Back'}
          </button>

          {currentStep !== 'results' && (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                canProceed()
                  ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-md hover:shadow-lg'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {currentStep === 'masala_tadka' ? 'Find Recipes →' : 'Next →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CookventureIndiaTab;
