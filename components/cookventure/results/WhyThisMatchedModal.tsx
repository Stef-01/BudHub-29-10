// components/cookventure/results/WhyThisMatchedModal.tsx
// Detailed "Why this matched" view: score breakdown, flavor match, pantry check, spices and tadka switcher.
import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import type { MasalasMap, ScoredRecipe, TadkaMap, UserPreferences } from '../../../types/cookventure';
import masalasData from '../../../data/cookventure/masalas.json';
import tadkaData from '../../../data/cookventure/tadka.json';
import { getRegionName } from '../../../services/cookventure/labels';
import { getTadkaOptions } from '../../../services/cookventure/tadkaSwap';
import MatchExplanationChip from './MatchExplanationChip';
import ScoreBreakdown from './ScoreBreakdown';
import FlavorMatchChart from './FlavorMatchChart';
import TadkaSwitcher from './TadkaSwitcher';
import { SpiceLearnRow } from '../shared/LearnCards';

const MASALAS = masalasData as MasalasMap;
const TADKAS = tadkaData as TadkaMap;

interface WhyThisMatchedModalProps {
  /** The recipe as currently shown (after any tadka swap) */
  scored: ScoredRecipe;
  /** The recipe as originally matched */
  original: ScoredRecipe;
  userPrefs: UserPreferences;
  imageUrl?: string;
  onSwapTadka: (tadkaId: string) => void;
  onClose: () => void;
}

function matchLabel(percent: number): string {
  if (percent >= 75) return 'Great match';
  if (percent >= 50) return 'Good match';
  return 'Worth a try';
}

const Section: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({
  title,
  subtitle,
  children,
}) => (
  <section className="px-5 sm:px-6 py-5 border-t border-gray-100">
    <h3 className="text-sm font-bold text-gray-900">{title}</h3>
    {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    <div className="mt-3">{children}</div>
  </section>
);

const WhyThisMatchedModal: React.FC<WhyThisMatchedModalProps> = ({
  scored,
  original,
  userPrefs,
  imageUrl,
  onSwapTadka,
  onClose,
}) => {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const { recipe } = scored;
  const isRenderableImage =
    !!imageUrl && /^(https?:|data:|blob:|\/)/.test(imageUrl);

  // Kept in a ref so a new onClose each render doesn't re-run the focus effect below
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Focus the dialog, close on Escape, lock page scroll, and restore focus on close
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  const totalMinutes = (recipe.prep_minutes || 0) + (recipe.cook_minutes || 0);
  const masalas = (recipe.masala_profiles || [])
    .filter((id: string) => MASALAS[id])
    .map((id: string) => ({ ...MASALAS[id], id }));
  const tadkas = (recipe.tadka_profiles || [])
    .filter((id: string) => TADKAS[id])
    .map((id: string) => ({ ...TADKAS[id], id }));

  const originalHeat = original.recipe.taste_axes?.heat;
  const currentHeat = recipe.taste_axes?.heat;
  const scoreDelta = scored.score - original.score;

  const unsetInputs = [
    userPrefs.selectedRegions.length === 0 && 'regions',
    userPrefs.pantry.length === 0 && 'pantry ingredients',
    userPrefs.masalaLocker.length === 0 && 'masalas',
    userPrefs.favouriteTadkas.length === 0 && 'favourite tadkas',
  ].filter(Boolean) as string[];

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        className="bg-white w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto overscroll-contain rounded-t-2xl sm:rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 px-5 sm:px-6 py-3 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-orange-50 to-green-50 flex items-center justify-center text-2xl flex-shrink-0">
            {isRenderableImage ? (
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span aria-hidden="true">{imageUrl || recipe.image || '🍛'}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="font-bold text-gray-900 leading-tight truncate">
              {recipe.name}
            </h2>
            <p className="text-xs text-gray-500 truncate">
              {[
                recipe.course && String(recipe.course).replace(/^\w/, (c: string) => c.toUpperCase()),
                totalMinutes > 0 && `${totalMinutes} min`,
                recipe.region_tags?.length && recipe.region_tags.map(getRegionName).join(' & '),
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            ✕
          </button>
        </div>

        {/* Headline number */}
        <div className="px-5 sm:px-6 pt-5 pb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Why this matched</p>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-5xl font-semibold text-gray-900">{scored.matchPercent}%</span>
            <span className="text-sm font-semibold text-gray-700">{matchLabel(scored.matchPercent)}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {Math.round(scored.score)} of {scored.maxScore} possible points for your preferences
          </p>
          {scored.reasons.length > 0 && (
            <div className="mt-3">
              <MatchExplanationChip reasons={scored.reasons} />
            </div>
          )}
        </div>

        <Section title="Score breakdown" subtitle="Every recipe starts with 10 points; here's where the rest came from">
          <ScoreBreakdown
            breakdown={scored.breakdown}
            previous={scored.swapped_tadka ? original.breakdown : undefined}
          />
          {unsetInputs.length > 0 && (
            <p className="mt-4 text-xs text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              💡 Add {unsetInputs.join(', ')} to sharpen your matches.
            </p>
          )}
        </Section>

        <Section title="Flavor match" subtitle="Teekha · Masaledar · Khata · Meetha, from 0 (none) to 3 (high)">
          {recipe.taste_axes ? (
            <FlavorMatchChart
              userTaste={userPrefs.tastePrefs}
              dishTaste={recipe.taste_axes}
              previousDishTaste={scored.swapped_tadka ? original.recipe.taste_axes : undefined}
            />
          ) : (
            <p className="text-xs text-gray-500 italic">
              This recipe's flavor profile hasn't been tagged yet, so it can't be compared with your taste.
            </p>
          )}
        </Section>

        {original.can_swap_tadka && (
          <Section title="Switch the tadka" subtitle="Change the tempering and see how the match moves">
            <TadkaSwitcher
              options={getTadkaOptions(original.recipe)}
              originalTadka={original.recipe.tadka_profiles?.[0]}
              currentTadka={recipe.tadka_profiles?.[0]}
              onSwitch={onSwapTadka}
              heatChange={
                typeof originalHeat === 'number' && typeof currentHeat === 'number'
                  ? { from: originalHeat, to: currentHeat }
                  : undefined
              }
              scoreDelta={scored.swapped_tadka ? scoreDelta : undefined}
            />
          </Section>
        )}

        <Section title="Pantry check">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-green-800 mb-1.5">
                ✓ You have ({scored.matched_ingredients.length})
              </p>
              {scored.matched_ingredients.length > 0 ? (
                <ul className="space-y-1 text-xs text-gray-700">
                  {scored.matched_ingredients.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-500 italic">Nothing from your pantry yet</p>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-yellow-800 mb-1.5">
                🛒 You'll need ({scored.missing_ingredients.length})
              </p>
              {scored.missing_ingredients.length > 0 ? (
                <ul className="space-y-1 text-xs text-gray-700">
                  {scored.missing_ingredients.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-500 italic">You have everything 🎉</p>
              )}
            </div>
          </div>
        </Section>

        {(masalas.length > 0 || tadkas.length > 0) && (
          <Section title="Spices in this dish">
            <SpiceLearnRow masalas={masalas} tadkas={tadkas} />
          </Section>
        )}
      </motion.div>
    </motion.div>,
    document.body
  );
};

export default WhyThisMatchedModal;
