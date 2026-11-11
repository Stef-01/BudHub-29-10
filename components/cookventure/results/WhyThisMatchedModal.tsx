// components/cookventure/results/WhyThisMatchedModal.tsx
// Detailed "Why this matched" view: score breakdown, flavor match, swaps (tadka, masala, lower sugar),
// pantry check, spices, and the "Make this" cooking view with a rating.
import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import type { MasalasMap, ScoredRecipe, TadkaMap, UserPreferences } from '../../../types/cookventure';
import masalasData from '../../../data/cookventure/masalas.json';
import tadkaData from '../../../data/cookventure/tadka.json';
import { getRegionName } from '../../../services/cookventure/labels';
import { canLowerSugar, getTadkaOptions, type RecipeSwaps } from '../../../services/cookventure/swaps';
import MatchExplanationChip from './MatchExplanationChip';
import ScoreBreakdown from './ScoreBreakdown';
import FlavorMatchChart from './FlavorMatchChart';
import TadkaSwitcher from './TadkaSwitcher';
import MasalaSwapper from './MasalaSwapper';
import LowerSugarPanel from './LowerSugarPanel';
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
  swaps: RecipeSwaps;
  onChangeSwaps: (swaps: RecipeSwaps) => void;
  isSaved?: boolean;
  onSave?: () => void;
  /** Called the first time the user opens the cooking view */
  onCook?: () => void;
  rating?: number;
  onRate?: (stars: number) => void;
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
  swaps,
  onChangeSwaps,
  isSaved,
  onSave,
  onCook,
  rating,
  onRate,
  onClose,
}) => {
  const titleId = useId();
  const [cooking, setCooking] = useState(false);
  const cookRef = useRef<HTMLDivElement>(null);
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
  const swapped = !!(scored.swapped_tadka || scored.swapped_masala || scored.sugar_swaps);
  const tasteEstimated = recipe.cookventure_source?.taste_axes === 'inferred';
  const offerLowerSugar = canLowerSugar(original.recipe);

  const startCooking = () => {
    if (!cooking) onCook?.();
    setCooking(true);
    // Wait a frame so the section exists before scrolling to it
    requestAnimationFrame(() => cookRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

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
          {scored.cautions && scored.cautions.length > 0 && (
            <ul className="mt-3 space-y-1">
              {scored.cautions.map((caution) => (
                <li key={caution} className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                  ⚠️ {caution}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={startCooking}
              className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2 shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
            >
              🍳 Make this
            </button>
            {onSave && (
              <button
                type="button"
                onClick={onSave}
                disabled={isSaved}
                className={`inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold px-4 py-2 border focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300 ${
                  isSaved ? 'bg-green-50 border-green-200 text-green-800 cursor-default' : 'bg-white border-gray-200 text-gray-800 hover:border-green-400'
                }`}
              >
                {isSaved ? '✓ In your cookbook' : '📚 Save to cookbook'}
              </button>
            )}
          </div>
        </div>

        <Section title="Score breakdown" subtitle="Every recipe starts with 10 points; here's where the rest came from">
          <ScoreBreakdown breakdown={scored.breakdown} previous={swapped ? original.breakdown : undefined} />
          {unsetInputs.length > 0 && (
            <p className="mt-4 text-xs text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              💡 Add {unsetInputs.join(', ')} to sharpen your matches.
            </p>
          )}
        </Section>

        <Section title="Flavor match" subtitle="Teekha · Masaledar · Khata · Meetha, from 0 (none) to 3 (high)">
          {recipe.taste_axes ? (
            <>
              <FlavorMatchChart
                userTaste={userPrefs.tastePrefs}
                dishTaste={recipe.taste_axes}
                previousDishTaste={swapped ? original.recipe.taste_axes : undefined}
              />
              {tasteEstimated && (
                <p className="mt-2 text-[11px] text-gray-500">
                  This dish's flavor profile is estimated from its ingredients.
                </p>
              )}
            </>
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
              onSwitch={(tadkaId) =>
                onChangeSwaps({
                  ...swaps,
                  tadka: tadkaId === original.recipe.tadka_profiles?.[0] ? undefined : tadkaId,
                })
              }
              heatChange={
                typeof originalHeat === 'number' && typeof currentHeat === 'number'
                  ? { from: originalHeat, to: currentHeat }
                  : undefined
              }
              scoreDelta={swaps.tadka ? scoreDelta : undefined}
            />
          </Section>
        )}

        {original.can_swap_masala && (
          <Section title="Swap the masala" subtitle="Out of one blend? Try a neighbour">
            <MasalaSwapper
              originalMasalas={original.recipe.masala_profiles || []}
              swap={swaps.masala}
              onSwap={(masala) => onChangeSwaps({ ...swaps, masala })}
              tasteBefore={original.recipe.taste_axes}
              tasteAfter={recipe.taste_axes}
              scoreDelta={swaps.masala ? scoreDelta : undefined}
            />
          </Section>
        )}

        {offerLowerSugar && (
          <Section title="Lower sugar" subtitle="Sweetened with jaggery, sugar, dates or honey">
            <LowerSugarPanel
              enabled={!!swaps.lowerSugar}
              onToggle={(lowerSugar) => onChangeSwaps({ ...swaps, lowerSugar })}
              swaps={scored.sugar_swaps}
              tip={scored.sugar_tip}
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

        {cooking && (
          <div ref={cookRef} className="scroll-mt-20">
            <Section title="🍳 Let's cook" subtitle={swapped ? 'With your swaps applied' : undefined}>
              <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5">Ingredients</h4>
              <ul className="space-y-1 text-sm text-gray-800 mb-4">
                {(recipe.ingredients || '')
                  .split('\n')
                  .map((line: string) => line.trim())
                  .filter(Boolean)
                  .map((line: string, idx: number) =>
                    line.endsWith(':') ? (
                      <li key={idx} className="pt-1 text-xs font-semibold text-gray-600">
                        {line}
                      </li>
                    ) : (
                      <li key={idx}>• {line}</li>
                    )
                  )}
              </ul>
              {scored.swapped_tadka && (
                <p className="mb-4 text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <strong>Tempering swap:</strong> {scored.swapped_tadka.tempering_note}
                </p>
              )}
              {recipe.instructions && (
                <>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5">Method</h4>
                  <ol className="space-y-2 text-sm text-gray-800 list-none">
                    {String(recipe.instructions)
                      .split('\n')
                      .map((step: string) => step.trim())
                      .filter(Boolean)
                      .map((step: string, idx: number) => (
                        <li key={idx}>{step}</li>
                      ))}
                  </ol>
                </>
              )}
              {onRate && (
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 mb-2">How was it?</p>
                  <div className="flex gap-1" role="group" aria-label="Rate this recipe">
                    {[1, 2, 3, 4, 5].map((stars) => (
                      <button
                        key={stars}
                        type="button"
                        onClick={() => onRate(stars)}
                        aria-pressed={rating === stars}
                        aria-label={`${stars} star${stars > 1 ? 's' : ''}`}
                        className={`text-2xl leading-none px-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${
                          rating && stars <= rating ? 'text-amber-500' : 'text-gray-300 hover:text-amber-300'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  {rating ? <p className="mt-1 text-xs text-gray-600">Thanks! You rated it {rating}/5.</p> : null}
                </div>
              )}
            </Section>
          </div>
        )}
      </motion.div>
    </motion.div>,
    document.body
  );
};

export default WhyThisMatchedModal;
