// services/cookventure/ingredients.ts
// Ingredient vocabulary: Hindi / regional synonyms, spelling normalisation and matching.
import synonymsData from '../../data/cookventure/ingredient_synonyms.json';

const SYNONYMS = synonymsData as Record<string, string[]>;

/** Phrases that contain another ingredient's word but are not that ingredient */
const NOT_THE_SAME: Record<string, string[]> = {
  dairy: ['coconut milk', 'coconut cream', 'almond milk', 'oat milk', 'soy milk', 'soya milk', 'rice milk', 'cashew milk', 'peanut butter', 'milk of your choice'],
  yogurt: ['coconut yogurt'],
  coconut: ['coconut oil'],
};

/**
 * Lowercase, treat taxonomy ids like plain words ("curry_leaves" -> "curry leaves"),
 * and fold chili spellings together (chile, chili, chilly, chillies -> chilli).
 */
export function normalizeIngredientText(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\bchil+(?:i|e|y)(?:e?s)?\b/g, 'chilli')
    .replace(/\s+/g, ' ')
    .trim();
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Word-boundary matcher that also accepts simple plurals ("tomato" matches "tomatoes") */
function wordPattern(term: string): RegExp {
  // \b doesn't work next to Devanagari, so non-Latin terms fall back to a plain substring test
  if (/[^\x00-\x7F]/.test(term)) return new RegExp(escapeRegExp(term));
  return new RegExp(`\\b${escapeRegExp(term)}(?:e?s)?\\b`);
}

const patternCache = new Map<string, RegExp[]>();

/** Every way a pantry item can appear in an ingredient line: itself plus its synonyms */
function termsFor(pantryItem: string): RegExp[] {
  const item = normalizeIngredientText(pantryItem);
  const cached = patternCache.get(item);
  if (cached) return cached;
  const synonyms = (SYNONYMS[item] || []).map(normalizeIngredientText);
  const patterns = [item, ...synonyms].map(wordPattern);
  patternCache.set(item, patterns);
  return patterns;
}

/**
 * Does this ingredient line use the pantry item? Matches the item or any of its synonyms
 * ("palak" for spinach, "dahi" for yogurt) as whole words, plurals included.
 */
export function lineUsesItem(line: string, pantryItem: string): boolean {
  const item = normalizeIngredientText(pantryItem);
  let normalizedLine = normalizeIngredientText(line);
  (NOT_THE_SAME[item] || []).forEach((phrase) => {
    normalizedLine = normalizedLine.split(phrase).join(' ');
  });
  // Whole words only, so "gur" (jaggery) never matches inside "yogurt"
  return termsFor(item).some((re) => re.test(normalizedLine));
}

/** Synonyms for a canonical ingredient, for display ("tomato" -> ["tamatar", "thakkali", ...]) */
export function getSynonyms(item: string): string[] {
  return SYNONYMS[normalizeIngredientText(item)] || [];
}

export interface IngredientSuggestion {
  /** Canonical name to add to the pantry */
  item: string;
  /** The synonym that matched, when the query wasn't the canonical name */
  matchedAlias?: string;
}

/**
 * Search a vocabulary by name or synonym: "tamatar" finds tomato, "dhaniya" finds coriander.
 * Exact and prefix matches rank above substring matches.
 */
export function searchIngredients(query: string, vocabulary: string[], limit = 8): IngredientSuggestion[] {
  const q = normalizeIngredientText(query);
  if (!q) return [];

  const candidates = [...new Set([...vocabulary, ...Object.keys(SYNONYMS)])];
  const ranked: Array<{ suggestion: IngredientSuggestion; rank: number }> = [];

  candidates.forEach((item) => {
    const name = normalizeIngredientText(item);
    const rankName = name === q ? 0 : name.startsWith(q) ? 1 : name.includes(q) ? 3 : Infinity;
    let best: { rank: number; alias?: string } = { rank: rankName };
    getSynonyms(item).forEach((alias) => {
      const a = normalizeIngredientText(alias);
      const r = a === q ? 0.5 : a.startsWith(q) ? 2 : a.includes(q) ? 4 : Infinity;
      if (r < best.rank) best = { rank: r, alias };
    });
    if (best.rank < Infinity) {
      ranked.push({ suggestion: { item, matchedAlias: best.alias }, rank: best.rank });
    }
  });

  return ranked
    .sort((a, b) => a.rank - b.rank || a.suggestion.item.localeCompare(b.suggestion.item))
    .slice(0, limit)
    .map((r) => r.suggestion);
}
