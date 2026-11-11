// components/cookventure/results/RecipeResultsGrid.tsx
import React, { useMemo, useState } from 'react';
import type { ScoredRecipe, ScoringWeights, UserPreferences } from '../../../types/cookventure';
import { rescoreWithSwaps, type RecipeSwaps } from '../../../services/cookventure/swaps';
import { PLAYLISTS, isInPlaylist, playlistsInSeason } from '../../../services/cookventure/playlists';
import { getLocalEvents, trackCookventure } from '../../../services/cookventure/analytics';
import { getUserId } from '../../../hooks/useUserId';
import FlippableRecipeCard from './FlippableRecipeCard';
import CvAsset from '../shared/CvAsset';

const PAGE_SIZE = 12;

export type CookventureReward = 'swap' | 'cook' | 'save';

interface RecipeResultsGridProps {
  scoredRecipes: ScoredRecipe[];
  /** Recipes ruled out by strict diets or allergens */
  hiddenRecipes?: ScoredRecipe[];
  userPrefs: UserPreferences;
  weights?: ScoringWeights;
  isSaved?: (recipeId: string) => boolean;
  onSaveRecipe?: (recipeId: string) => void | Promise<void>;
  onEditDiet?: () => void;
  /** Lets the parent hand out XP for playful actions */
  onReward?: (reward: CookventureReward, recipeId: string) => void;
}

/** Latest star rating this user gave each recipe, from the local event log */
function loadRatings(): Record<string, number> {
  const userId = getUserId();
  const ratings: Record<string, number> = {};
  getLocalEvents()
    .filter((e) => e.event === 'recipe_rated' && e.userId === userId)
    .forEach((e) => {
      ratings[String(e.props.recipeId)] = Number(e.props.stars);
    });
  return ratings;
}

const RecipeResultsGrid: React.FC<RecipeResultsGridProps> = ({
  scoredRecipes,
  hiddenRecipes = [],
  userPrefs,
  weights,
  isSaved,
  onSaveRecipe,
  onEditDiet,
  onReward,
}) => {
  // recipe id -> swaps the user made on this screen
  const [swapsById, setSwapsById] = useState<Record<string, RecipeSwaps>>({});
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [showHidden, setShowHidden] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>(loadRatings);
  const inSeason = useMemo(() => playlistsInSeason(), []);

  // Swapped recipes are re-scored in place; the grid keeps its order so cards don't jump around
  const displayed = useMemo(
    () =>
      scoredRecipes.map((original, idx) => ({
        original,
        rank: idx + 1,
        shown: swapsById[original.recipe.id]
          ? rescoreWithSwaps(original, swapsById[original.recipe.id], userPrefs, weights)
          : original,
      })),
    [scoredRecipes, swapsById, userPrefs, weights]
  );

  const playlistCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    PLAYLISTS.forEach((p) => {
      counts[p.id] = scoredRecipes.filter((s) => isInPlaylist(s.recipe, p)).length;
    });
    return counts;
  }, [scoredRecipes]);

  const activePlaylist = PLAYLISTS.find((p) => p.id === playlistId);
  const filtered = activePlaylist ? displayed.filter((d) => isInPlaylist(d.original.recipe, activePlaylist)) : displayed;
  const page = filtered.slice(0, visibleCount);

  const handleChangeSwaps = (original: ScoredRecipe, next: RecipeSwaps) => {
    const id = original.recipe.id;
    const prev = swapsById[id] || {};
    if (next.tadka !== prev.tadka) {
      trackCookventure('tadka_swapped', { recipeId: id, from: original.recipe.tadka_profiles?.[0], to: next.tadka ?? 'original' });
    }
    if (next.masala?.to !== prev.masala?.to) {
      trackCookventure('masala_swapped', { recipeId: id, from: next.masala?.from ?? prev.masala?.from, to: next.masala?.to ?? 'original' });
    }
    if (!!next.lowerSugar !== !!prev.lowerSugar) {
      trackCookventure('lower_sugar', { recipeId: id, on: !!next.lowerSugar });
    }
    onReward?.('swap', id);
    setSwapsById((all) => ({ ...all, [id]: next }));
  };

  const handleRate = (recipeId: string, stars: number, rank: number) => {
    trackCookventure('recipe_rated', { recipeId, stars, rank });
    setRatings((r) => ({ ...r, [recipeId]: stars }));
  };

  if (scoredRecipes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-bold text-gray-700 mb-2">No recipes found</h3>
        <p className="text-sm text-gray-500">
          {hiddenRecipes.length > 0
            ? `All ${hiddenRecipes.length} recipes are ruled out by your diet or allergies.`
            : 'Try adjusting your preferences or adding more ingredients to your pantry'}
        </p>
        {hiddenRecipes.length > 0 && onEditDiet && (
          <button type="button" onClick={onEditDiet} className="mt-4 text-sm font-semibold text-orange-700 underline">
            Edit diet & avoids
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-2xl font-bold text-gray-800">
          Your Matches ({filtered.length})
          <span className="ml-2 text-sm font-normal text-gray-500">नतीजे</span>
        </h2>
        <p className="text-xs text-gray-500">Tap a card to flip it · 🔍 for the full breakdown</p>
      </div>

      {/* Seasonal playlists */}
      <div className="-mx-1 overflow-x-auto pb-1">
        <div className="flex gap-2 px-1 w-max" role="group" aria-label="Seasonal playlists">
          <button
            type="button"
            aria-pressed={!playlistId}
            onClick={() => {
              setPlaylistId(null);
              setVisibleCount(PAGE_SIZE);
            }}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
              !playlistId ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
            }`}
          >
            All ({scoredRecipes.length})
          </button>
          {PLAYLISTS.map((p) => {
            const count = playlistCounts[p.id];
            const active = playlistId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={active}
                disabled={count === 0}
                title={p.description}
                onClick={() => {
                  setPlaylistId(active ? null : p.id);
                  setVisibleCount(PAGE_SIZE);
                  if (!active) trackCookventure('playlist_selected', { playlistId: p.id, count });
                }}
                className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:opacity-40 disabled:cursor-not-allowed ${
                  active ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
                }`}
              >
                <CvAsset category="playlists" id={p.id} fallback={p.emoji} className="w-4 h-4 align-[-2px]" /> {p.name} ({count})
                {inSeason.includes(p.id) && (
                  <span className={`ml-1.5 rounded-full px-1.5 py-px text-[10px] ${active ? 'bg-white/20' : 'bg-green-100 text-green-800'}`}>
                    in season in India
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      {activePlaylist && (
        <p className="text-xs text-gray-600">
          {activePlaylist.emoji} {activePlaylist.description} <span lang="hi" className="text-gray-500">· {activePlaylist.name_hi}</span>
        </p>
      )}

      {/* Recipes hidden by diet / allergens */}
      {hiddenRecipes.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              🚫 {hiddenRecipes.length} recipe{hiddenRecipes.length > 1 ? 's' : ''} hidden by your diet or allergies
            </span>
            <button type="button" onClick={() => setShowHidden((v) => !v)} className="font-semibold text-gray-900 underline" aria-expanded={showHidden}>
              {showHidden ? 'Hide list' : 'Why?'}
            </button>
            {onEditDiet && (
              <button type="button" onClick={onEditDiet} className="font-semibold text-orange-700 underline">
                Edit diet & avoids
              </button>
            )}
          </div>
          {showHidden && (
            <ul className="mt-2 space-y-1">
              {hiddenRecipes.map((h) => (
                <li key={h.recipe.id}>
                  <strong>{h.recipe.name}</strong>: {h.exclusion_reasons?.[0]}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {page.map(({ original, shown, rank }, idx) => (
          <FlippableRecipeCard
            key={original.recipe.id}
            scoredRecipe={shown}
            original={original}
            userPrefs={userPrefs}
            index={idx}
            rank={rank}
            swaps={swapsById[original.recipe.id] || {}}
            onChangeSwaps={(next) => handleChangeSwaps(original, next)}
            isSaved={isSaved?.(original.recipe.id)}
            onSave={
              onSaveRecipe
                ? () => {
                    trackCookventure('recipe_saved', { recipeId: original.recipe.id, rank });
                    onReward?.('save', original.recipe.id);
                    return onSaveRecipe(original.recipe.id);
                  }
                : undefined
            }
            onOpenDetails={() =>
              trackCookventure('details_opened', { recipeId: original.recipe.id, rank, matchPercent: shown.matchPercent })
            }
            onCook={() => {
              trackCookventure('make_this', { recipeId: original.recipe.id, rank, matchPercent: shown.matchPercent });
              onReward?.('cook', original.recipe.id);
            }}
            rating={ratings[original.recipe.id]}
            onRate={(stars) => handleRate(original.recipe.id, stars, rank)}
          />
        ))}
      </div>

      {filtered.length > visibleCount && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
            className="rounded-lg border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-gray-800 hover:border-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            Show more ({filtered.length - visibleCount} left)
          </button>
        </div>
      )}
    </div>
  );
};

export default RecipeResultsGrid;
