// components/cookventure/CookventureIndiaTab.tsx
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserPreferences, TasteAxes, ScoredRecipe, RegionsMap } from '../../types/cookventure';
import type { Recipe } from '../../types';
import { RECIPE_CATALOG } from '../../constants';
import { useUserCookbook } from '../../contexts/UserCookbookContext';
import { useGamification } from '../../contexts/GamificationContext';
import { useGameScores } from '../../contexts/GameScoresContext';
import { assignVariant } from '../../services/cookventure/experiments';
import {
  loadLastPreferences,
  saveLastPreferences,
  setAnalyticsVariant,
  startNewSession,
  trackCookventure,
} from '../../services/cookventure/analytics';
import {
  loadCookventureData,
  applyRegionalPreset,
  getSubregion,
  type RegionalPreset,
} from '../../services/cookventure/regionalPresets';
import { calculateCookventureScore, sortScoredRecipes } from '../../services/cookventure/cookventureScoring';
import { STEP_ORDER, STEP_LABELS, type CookventureStep } from '../../services/cookventure/labels';

// Survey components
import CravingPicker from './survey/CravingPicker';
import RegionPicker from './survey/RegionPicker';
import SubregionPicker from './survey/SubregionPicker';
import TimeCoursePicker from './survey/TimeCoursePicker';
import PantryBingo from './survey/PantryBingo';
import FlavorDials from './survey/FlavorDials';
import DietAvoidsPicker from './survey/DietAvoidsPicker';
import MasalaTadkaLocker from './survey/MasalaTadkaLocker';
import RegionalStarterKits from './survey/RegionalStarterKits';

// Results components
import RecipeResultsGrid, { type CookventureReward } from './results/RecipeResultsGrid';

type SurveyStep = CookventureStep;

interface CookventureIndiaTabProps {
  /** The user's cookbook; the full recipe catalog is searched as well */
  recipes?: Recipe[];
}

const DEFAULT_PREFS: UserPreferences = {
  cravings: [],
  selectedRegions: [],
  selectedSubregions: [],
  timeLimit: undefined,
  course: [],
  pantry: [],
  tastePrefs: { heat: 1, masala: 1, tangy: 1, sweet: 0 },
  diet: ['vegetarian'],
  avoids: [],
  masalaLocker: [],
  favouriteTadkas: [],
  diabetic_friendly: false,
};

/** Add the value if absent, remove it if present */
const toggle = (list: string[] | undefined, value: string) =>
  (list || []).includes(value) ? (list || []).filter((v) => v !== value) : [...(list || []), value];

const CookventureIndiaTab: React.FC<CookventureIndiaTabProps> = ({ recipes = [] }) => {
  const [currentStep, setCurrentStep] = useState<SurveyStep>('craving');
  const [userPrefs, setUserPrefs] = useState<UserPreferences>(DEFAULT_PREFS);
  const { saveRecipe, isRecipeSaved } = useUserCookbook();
  const { addXp } = useGamification();
  const { saveScore } = useGameScores();
  const [lastAnswers] = useState(loadLastPreferences);

  // Scoring-weight experiment: one stable variant per person
  const variant = useMemo(() => assignVariant(), []);
  // Per-session bookkeeping for analytics and XP (reset on "Start over")
  const session = useRef({ resultsShown: false, swapped: false, cooked: new Set<string>(), viaKit: undefined as string | undefined });

  // Guarded with a ref: React StrictMode runs mount effects twice in development
  const startedRef = useRef(false);
  useEffect(() => {
    setAnalyticsVariant(variant.id);
    if (startedRef.current) return;
    startedRef.current = true;
    trackCookventure('survey_started', {});
  }, [variant.id]);

  // Load taxonomy data
  const { regions, masalas, tadkas } = loadCookventureData();

  // Search the user's cookbook and the full catalog; the cookbook copy wins when both have a recipe
  const pool = useMemo(() => {
    const byId = new Map<string, Recipe>();
    RECIPE_CATALOG.forEach((r) => byId.set(r.id, r));
    recipes.forEach((r) => byId.set(r.id, r));
    return byId;
  }, [recipes]);

  const handleToggleCraving = (cravingId: string) =>
    setUserPrefs((prev) => ({ ...prev, cravings: toggle(prev.cravings, cravingId) }));

  // Deselecting a region also drops the sub-regions picked under it
  const handleToggleRegion = (regionId: string) =>
    setUserPrefs((prev) => {
      const selectedRegions = toggle(prev.selectedRegions, regionId);
      const selectedSubregions = (prev.selectedSubregions || []).filter((sub) =>
        selectedRegions.includes(getSubregion(sub)?.region ?? '')
      );
      return { ...prev, selectedRegions, selectedSubregions };
    });

  const handleToggleSubregion = (subregionId: string) =>
    setUserPrefs((prev) => ({ ...prev, selectedSubregions: toggle(prev.selectedSubregions, subregionId) }));

  const handleToggleIngredient = (ingredient: string) =>
    setUserPrefs((prev) => ({ ...prev, pantry: toggle(prev.pantry, ingredient) }));

  const handleSelectPack = (ingredients: string[]) =>
    setUserPrefs((prev) => ({ ...prev, pantry: [...new Set([...prev.pantry, ...ingredients])] }));

  const handleChangeTaste = (newTaste: TasteAxes) => setUserPrefs((prev) => ({ ...prev, tastePrefs: newTaste }));

  const handleToggleDiet = (dietId: string) =>
    setUserPrefs((prev) => {
      const diet = toggle(prev.diet, dietId);
      return { ...prev, diet, diabetic_friendly: diet.includes('diabetic_friendly') };
    });

  const handleToggleAvoid = (allergenId: string) =>
    setUserPrefs((prev) => ({ ...prev, avoids: toggle(prev.avoids, allergenId) }));

  const handleToggleMasala = (masalaId: string) =>
    setUserPrefs((prev) => ({ ...prev, masalaLocker: toggle(prev.masalaLocker, masalaId) }));

  const handleToggleTadka = (tadkaId: string) =>
    setUserPrefs((prev) => ({ ...prev, favouriteTadkas: toggle(prev.favouriteTadkas, tadkaId) }));

  // Score and sort every recipe once results are shown; strict diets and allergens hide recipes
  const { visible, hidden } = useMemo(() => {
    if (currentStep !== 'results') return { visible: [] as ScoredRecipe[], hidden: [] as ScoredRecipe[] };
    const scored = [...pool.values()].map((recipe) => calculateCookventureScore(recipe as any, userPrefs, variant.weights));
    return {
      visible: sortScoredRecipes(
        scored.filter((s) => !s.excluded),
        userPrefs.selectedRegions[0]
      ),
      hidden: scored.filter((s) => s.excluded),
    };
  }, [currentStep, pool, userPrefs, variant.weights]);

  // Arriving at results: log the survey, remember the answers, award XP and a Game Center score
  useEffect(() => {
    if (currentStep !== 'results') return;
    const first = !session.current.resultsShown;
    session.current.resultsShown = true;
    const top = visible.slice(0, 3);
    trackCookventure('results_shown', {
      count: visible.length,
      hidden: hidden.length,
      topIds: top.map((s) => s.recipe.id),
      topRegions: Array.from(new Set<string>(top.flatMap((s) => s.recipe.region_tags || []))),
      bestMatch: top[0]?.matchPercent ?? 0,
    });
    if (!first) return;
    trackCookventure('survey_completed', {
      cravings: userPrefs.cravings,
      regions: userPrefs.selectedRegions,
      subregions: userPrefs.selectedSubregions || [],
      masalas: userPrefs.masalaLocker,
      tadkas: userPrefs.favouriteTadkas,
      diet: userPrefs.diet,
      avoids: userPrefs.avoids,
      timeLimit: userPrefs.timeLimit ?? null,
      courses: userPrefs.course || [],
      pantrySize: userPrefs.pantry.length,
      viaKit: session.current.viaKit ?? null,
    });
    saveLastPreferences(userPrefs);
    addXp('Medium', 'add');
    if (top[0]) saveScore('cookventure', top[0].matchPercent);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per arrival at results
  }, [currentStep]);

  // XP for trying things on the results screen: the first swap, and each dish you decide to cook
  const handleReward = useCallback(
    (reward: CookventureReward, recipeId: string) => {
      if (reward === 'swap' && !session.current.swapped) {
        session.current.swapped = true;
        addXp('Low', 'add');
      } else if (reward === 'cook' && !session.current.cooked.has(recipeId)) {
        session.current.cooked.add(recipeId);
        addXp('High', 'add');
      }
    },
    [addXp]
  );

  // Starter kit: fill pantry, masalas, tadka and taste from a classic dish, then jump to results
  const handleApplyKit = (preset: RegionalPreset) => {
    trackCookventure('kit_applied', { kitId: preset.id, region: preset.regionId, subregion: preset.subregionId ?? null });
    session.current.viaKit = preset.id;
    setUserPrefs((prev) => applyRegionalPreset(preset, prev));
    setCurrentStep('results');
  };

  // Repeat visit: reuse the answers from last time and go straight to matches
  const handleUseLastAnswers = () => {
    if (!lastAnswers) return;
    session.current.viaKit = 'last_answers';
    setUserPrefs({ ...DEFAULT_PREFS, ...lastAnswers.prefs });
    setCurrentStep('results');
  };

  const handleSaveRecipe = useCallback(
    async (recipeId: string) => {
      const raw = pool.get(recipeId);
      if (raw) await saveRecipe(raw);
    },
    [pool, saveRecipe]
  );

  // Check if can proceed to next step
  const canProceed = () => {
    if (currentStep === 'craving') return userPrefs.cravings.length > 0;
    return true;
  };

  const currentIndex = STEP_ORDER.indexOf(currentStep);

  const handleNext = () => {
    if (!canProceed() || currentIndex >= STEP_ORDER.length - 1) return;
    trackCookventure('step_completed', { step: currentStep });
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
    startNewSession();
    session.current = { resultsShown: false, swapped: false, cooked: new Set(), viaKit: undefined };
    trackCookventure('survey_started', {});
    setCurrentStep('craving');
    setUserPrefs(DEFAULT_PREFS);
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
                  <div className="flex flex-col items-center w-8 sm:w-14">
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
                    {/* Every label on wider screens; only the current one on phones (below) */}
                    <span
                      className={`hidden sm:block mt-1 text-[10px] leading-tight text-center ${
                        isCurrent ? 'font-bold text-orange-600' : 'text-gray-500'
                      }`}
                    >
                      {label.en}
                    </span>
                    <span className="hidden sm:block text-[10px] leading-tight text-gray-500" lang="hi">
                      {label.hi}
                    </span>
                  </div>
                  {idx < STEP_ORDER.length - 1 && (
                    <div
                      aria-hidden="true"
                      className={`mt-3 w-2 sm:w-4 h-1 rounded transition-all ${
                        idx < currentIndex ? 'bg-orange-500' : 'bg-gray-200'
                      }`}
                    ></div>
                  )}
                </li>
              );
            })}
          </ol>
          <p className="sm:hidden mt-2 text-center text-xs text-gray-600">
            Step {currentIndex + 1} of {STEP_ORDER.length} ·{' '}
            <span className="font-bold text-orange-600">{STEP_LABELS[currentStep].en}</span>{' '}
            <span lang="hi">{STEP_LABELS[currentStep].hi}</span>
          </p>
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
            className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 mb-6"
          >
            {currentStep === 'craving' && (
              <>
                {lastAnswers && (
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
                    <p className="text-sm text-gray-800">
                      👋 Welcome back! Pick up where you left off?
                      <span className="block text-xs text-gray-500">
                        {[
                          ...(lastAnswers.prefs.selectedRegions || []).map((r) => (regions as RegionsMap)[r]?.name ?? r),
                          lastAnswers.prefs.pantry?.length ? `${lastAnswers.prefs.pantry.length} pantry items` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={handleUseLastAnswers}
                      className="rounded-lg bg-orange-500 hover:bg-orange-600 px-4 py-2 text-sm font-bold text-white shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
                    >
                      ↺ Use my last answers
                    </button>
                  </div>
                )}
                <CravingPicker selectedCravings={userPrefs.cravings} onToggleCraving={handleToggleCraving} />
              </>
            )}

            {currentStep === 'region' && (
              <>
                <RegionPicker
                  regions={regions as any}
                  selectedRegions={userPrefs.selectedRegions}
                  onToggleRegion={handleToggleRegion}
                />
                <SubregionPicker
                  regions={regions as RegionsMap}
                  selectedRegions={userPrefs.selectedRegions}
                  selectedSubregions={userPrefs.selectedSubregions || []}
                  onToggleSubregion={handleToggleSubregion}
                />
                <RegionalStarterKits
                  regions={regions as RegionsMap}
                  selectedRegions={userPrefs.selectedRegions}
                  selectedSubregions={userPrefs.selectedSubregions}
                  onApplyKit={handleApplyKit}
                />
              </>
            )}

            {currentStep === 'time_course' && (
              <TimeCoursePicker
                timeLimit={userPrefs.timeLimit}
                courses={userPrefs.course || []}
                onChangeTime={(minutes) => setUserPrefs((prev) => ({ ...prev, timeLimit: minutes }))}
                onToggleCourse={(course) => setUserPrefs((prev) => ({ ...prev, course: toggle(prev.course, course) }))}
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
              <FlavorDials tastePrefs={userPrefs.tastePrefs} onChangeTaste={handleChangeTaste} />
            )}

            {currentStep === 'diet' && (
              <DietAvoidsPicker
                diet={userPrefs.diet}
                avoids={userPrefs.avoids}
                onToggleDiet={handleToggleDiet}
                onToggleAvoid={handleToggleAvoid}
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
              <RecipeResultsGrid
                scoredRecipes={visible}
                hiddenRecipes={hidden}
                userPrefs={userPrefs}
                weights={variant.weights}
                isSaved={isRecipeSaved}
                onSaveRecipe={handleSaveRecipe}
                onEditDiet={() => setCurrentStep('diet')}
                onReward={handleReward}
              />
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
