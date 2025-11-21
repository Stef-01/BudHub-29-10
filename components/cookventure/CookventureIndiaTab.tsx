// components/cookventure/CookventureIndiaTab.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserPreferences, TasteAxes, ScoredRecipe } from '../../types/cookventure';
import { loadCookventureData } from '../../services/cookventure/regionalPresets';
import { calculateCookventureScore, sortScoredRecipes } from '../../services/cookventure/cookventureScoring';

// Survey components
import RegionPicker from './survey/RegionPicker';
import FlavorDials from './survey/FlavorDials';
import MasalaTadkaLocker from './survey/MasalaTadkaLocker';

// Results components
import RecipeResultsGrid from './results/RecipeResultsGrid';

type SurveyStep = 'region' | 'flavor' | 'masala_tadka' | 'results';

interface CookventureIndiaTabProps {
  recipes?: any[]; // Will be typed with full Recipe interface later
}

const CookventureIndiaTab: React.FC<CookventureIndiaTabProps> = ({ recipes = [] }) => {
  const [currentStep, setCurrentStep] = useState<SurveyStep>('region');
  const [userPrefs, setUserPrefs] = useState<UserPreferences>({
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

  // Update region selection
  const handleToggleRegion = (regionId: string) => {
    setUserPrefs((prev) => ({
      ...prev,
      selectedRegions: prev.selectedRegions.includes(regionId)
        ? prev.selectedRegions.filter((r) => r !== regionId)
        : [...prev.selectedRegions, regionId],
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
      // Filter recipes that have cookventure data
      const cookventureRecipes = recipes.filter(
        (recipe) => recipe.region_tags || recipe.masala_profiles || recipe.tadka_profiles
      );

      // Score all recipes
      const scored = cookventureRecipes.map((recipe) =>
        calculateCookventureScore(recipe, userPrefs)
      );

      // Sort and filter out zero scores
      const sorted = sortScoredRecipes(scored).filter((sr) => sr.score > 0);

      setScoredRecipes(sorted);
    }
  }, [currentStep, recipes, userPrefs]);

  // Check if can proceed to next step
  const canProceed = () => {
    if (currentStep === 'region') return userPrefs.selectedRegions.length > 0;
    return true;
  };

  // Navigation
  const handleNext = () => {
    if (!canProceed()) return;

    if (currentStep === 'region') setCurrentStep('flavor');
    else if (currentStep === 'flavor') setCurrentStep('masala_tadka');
    else if (currentStep === 'masala_tadka') setCurrentStep('results');
  };

  const handleBack = () => {
    if (currentStep === 'flavor') setCurrentStep('region');
    else if (currentStep === 'masala_tadka') setCurrentStep('flavor');
    else if (currentStep === 'results') setCurrentStep('masala_tadka');
  };

  const handleReset = () => {
    setCurrentStep('region');
    setUserPrefs({
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 py-8 px-4">
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

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            {['region', 'flavor', 'masala_tadka', 'results'].map((step, idx) => {
              const stepIndex = ['region', 'flavor', 'masala_tadka', 'results'].indexOf(currentStep);
              const isActive = idx <= stepIndex;
              const isCurrent = step === currentStep;

              return (
                <React.Fragment key={step}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-400'
                    } ${isCurrent ? 'ring-4 ring-green-200' : ''}`}
                  >
                    {idx + 1}
                  </div>
                  {idx < 3 && (
                    <div
                      className={`w-12 h-1 rounded transition-all ${
                        isActive ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    ></div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
          <div className="flex justify-center text-xs text-gray-500 gap-8">
            <span className={currentStep === 'region' ? 'font-bold text-green-600' : ''}>
              Region
            </span>
            <span className={currentStep === 'flavor' ? 'font-bold text-green-600' : ''}>
              Flavor
            </span>
            <span className={currentStep === 'masala_tadka' ? 'font-bold text-green-600' : ''}>
              Masala & Tadka
            </span>
            <span className={currentStep === 'results' ? 'font-bold text-green-600' : ''}>
              Results
            </span>
          </div>
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
            {currentStep === 'region' && (
              <RegionPicker
                regions={regions as any}
                selectedRegions={userPrefs.selectedRegions}
                onToggleRegion={handleToggleRegion}
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
            disabled={currentStep === 'region'}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              currentStep === 'region'
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
                  ? 'bg-green-500 text-white hover:bg-green-600 shadow-md hover:shadow-lg'
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
