// components/cookventure/CookventureIndiaTab.tsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserPreferences, TasteAxes, ScoredRecipe, RegionsMap } from '../../types/cookventure';
import {
  loadCookventureData,
  applyRegionalPreset,
  type RegionalPreset,
} from '../../services/cookventure/regionalPresets';
import { calculateCookventureScore, sortScoredRecipes } from '../../services/cookventure/cookventureScoring';
import { STEP_ORDER, STEP_LABELS, type CookventureStep } from '../../services/cookventure/labels';

// Survey components
import CravingPicker from './survey/CravingPicker';
import RegionPicker from './survey/RegionPicker';
import PantryBingo from './survey/PantryBingo';
import FlavorDials from './survey/FlavorDials';
import MasalaTadkaLocker from './survey/MasalaTadkaLocker';
import RegionalStarterKits from './survey/RegionalStarterKits';

// Results components
import RecipeResultsGrid from './results/RecipeResultsGrid';

type SurveyStep = CookventureStep;

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

  // Score and sort ALL recipes once results are shown (untagged recipes still get base scores,
  // so every recipe from the cookbook appears)
  const scoredRecipes = useMemo<ScoredRecipe[]>(() => {
    if (currentStep !== 'results') return [];
    return sortScoredRecipes(recipes.map((recipe) => calculateCookventureScore(recipe, userPrefs)));
  }, [currentStep, recipes, userPrefs]);

  // Starter kit: fill pantry, masalas, tadka and taste from a classic dish, then jump to results
  const handleApplyKit = (preset: RegionalPreset) => {
    setUserPrefs((prev) => applyRegionalPreset(preset, prev));
    setCurrentStep('results');
  };

  // Check if can proceed to next step
  const canProceed = () => {
    if (currentStep === 'craving') return userPrefs.cravings.length > 0;
    return true;
  };

  // Navigation with preserved state
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  const handleNext = () => {
    if (!canProceed() || currentIndex >= STEP_ORDER.length - 1) return;
    setCurrentStep(STEP_ORDER[currentIndex + 1]);
  };

  const handleBack = () => {
    if (currentIndex <= 0) return;
    setCurrentStep(STEP_ORDER[currentIndex - 1]);
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
        <nav className="mb-8" aria-label="Cookventure steps">
          <ol className="flex items-start justify-center">
            {STEP_ORDER.map((step, idx) => {
              const isActive = idx <= currentIndex;
              const isCurrent = step === currentStep;
              const isClickable = currentStep === 'results' && step !== 'results';
              const label = STEP_LABELS[step];

              return (
                <li key={step} className="flex items-start">
                  <div className="flex flex-col items-center w-12 sm:w-16">
                    <motion.button
                      type="button"
                      whileHover={isClickable ? { scale: 1.15 } : {}}
                      whileTap={isClickable ? { scale: 0.95 } : {}}
                      onClick={() => isClickable && handleJumpToStep(step)}
                      disabled={!isClickable}
                      aria-current={isCurrent ? 'step' : undefined}
                      aria-label={`Step ${idx + 1}: ${label.en}${isClickable ? ' (edit)' : ''}`}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isActive ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'
                      } ${isCurrent ? 'ring-4 ring-orange-200' : ''} ${
                        isClickable ? 'cursor-pointer hover:ring-2 hover:ring-orange-300' : 'cursor-default'
                      }`}
                    >
                      {idx + 1}
                    </motion.button>
                    <span
                      className={`mt-1 text-[10px] leading-tight text-center ${
                        isCurrent ? 'font-bold text-orange-600' : 'text-gray-500'
                      }`}
                    >
                      {label.en}
                    </span>
                    <span className="text-[10px] leading-tight text-gray-500" lang="hi">
                      {label.hi}
                    </span>
                  </div>
                  {idx < STEP_ORDER.length - 1 && (
                    <div
                      aria-hidden="true"
                      className={`mt-3 w-3 sm:w-6 h-1 rounded transition-all ${
                        idx < currentIndex ? 'bg-orange-500' : 'bg-gray-200'
                      }`}
                    ></div>
                  )}
                </li>
              );
            })}
          </ol>
          {currentStep === 'results' && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-xs text-orange-600 mt-2 font-medium"
            >
              💡 Click any step above to adjust your preferences
            </motion.p>
          )}
        </nav>

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
              <>
                <RegionPicker
                  regions={regions as any}
                  selectedRegions={userPrefs.selectedRegions}
                  onToggleRegion={handleToggleRegion}
                />
                <RegionalStarterKits
                  regions={regions as RegionsMap}
                  selectedRegions={userPrefs.selectedRegions}
                  onApplyKit={handleApplyKit}
                />
              </>
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
              <RecipeResultsGrid scoredRecipes={scoredRecipes} userPrefs={userPrefs} />
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
