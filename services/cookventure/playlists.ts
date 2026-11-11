// services/cookventure/playlists.ts
// Seasonal playlists: curated recipe lists plus a simple rule, so user-added recipes can join too.
import playlistsData from '../../data/cookventure/playlists.json';
import type { RecipeCookventureData } from '../../types/cookventure';
import { normalizeCourse } from './cookventureScoring';
import { enrichRecipe } from './recipeInferencer';

interface PlaylistRule {
  courses?: string[];
  /** Recipe must mention at least one of these */
  any_ingredients?: string[];
  /** Recipe must mention none of these */
  none_ingredients?: string[];
  min_heat?: number;
  max_heat?: number;
  min_masala?: number;
}

export interface Playlist {
  id: string;
  name: string;
  name_hi: string;
  emoji: string;
  description: string;
  /** Months (1-12) when the season or festival falls in India */
  months_in_india: number[];
  recipe_ids: string[];
  rule?: PlaylistRule;
}

export const PLAYLISTS: Playlist[] = Object.entries(playlistsData as Record<string, Omit<Playlist, 'id'>>).map(
  ([id, playlist]) => ({ ...playlist, id })
);

type PlaylistRecipe = RecipeCookventureData & { id: string; ingredients?: string; course?: string };

function matchesRule(recipe: PlaylistRecipe, rule: PlaylistRule): boolean {
  const enriched = enrichRecipe(recipe);
  const text = (recipe.ingredients || '').toLowerCase();
  const course = normalizeCourse(recipe.course);
  if (rule.courses && (!course || !rule.courses.includes(course))) return false;
  if (rule.any_ingredients && !rule.any_ingredients.some((i) => text.includes(i))) return false;
  if (rule.none_ingredients && rule.none_ingredients.some((i) => text.includes(i))) return false;
  if (rule.min_heat !== undefined && enriched.taste_axes.heat < rule.min_heat) return false;
  if (rule.max_heat !== undefined && enriched.taste_axes.heat > rule.max_heat) return false;
  if (rule.min_masala !== undefined && enriched.taste_axes.masala < rule.min_masala) return false;
  return true;
}

/** Is the recipe on this playlist (curated, or by the playlist's rule)? */
export function isInPlaylist(recipe: PlaylistRecipe, playlist: Playlist): boolean {
  return playlist.recipe_ids.includes(recipe.id) || (!!playlist.rule && matchesRule(recipe, playlist.rule));
}

/** Playlists whose season or festival is on in India this month */
export function playlistsInSeason(date: Date = new Date()): string[] {
  const month = date.getMonth() + 1;
  return PLAYLISTS.filter((p) => p.months_in_india.includes(month)).map((p) => p.id);
}
