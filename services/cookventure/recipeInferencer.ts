// services/cookventure/recipeInferencer.ts
// Fills in Cookventure fields (region, masala, tadka, taste) for recipes that don't carry them.
//
// Precedence, per field: the recipe's own value > curated tags (data/cookventure/recipe_tags.json)
// > values inferred from the ingredient list. Curated tags live in a separate file, not in the
// recipes themselves, because cookbooks are persisted in IndexedDB on first load; an overlay
// keyed by recipe id reaches existing users too.
import type { RecipeCookventureData, SouringMap, SweetenersMap, TasteAxes } from '../../types/cookventure';
import recipeTags from '../../data/cookventure/recipe_tags.json';
import souringData from '../../data/cookventure/souring_map.json';
import sweetenersData from '../../data/cookventure/sweeteners_map.json';

const CURATED = recipeTags as Record<string, Required<RecipeCookventureData>>;
const SOURING = souringData as SouringMap;
const SWEETENERS = sweetenersData as SweetenersMap;

export type CookventureField = 'region_tags' | 'subregion_tags' | 'masala_profiles' | 'tadka_profiles' | 'taste_axes';
export type FieldSource = 'recipe' | 'curated' | 'inferred';

const FIELDS: CookventureField[] = ['region_tags', 'subregion_tags', 'masala_profiles', 'tadka_profiles', 'taste_axes'];

interface RecipeLike extends RecipeCookventureData {
  id: string;
  ingredients?: string;
  course?: string;
}

export type EnrichedRecipe<R extends RecipeLike = RecipeLike> = R &
  Required<Pick<RecipeCookventureData, 'region_tags' | 'subregion_tags' | 'masala_profiles' | 'tadka_profiles'>> & {
    taste_axes: TasteAxes;
    /** Where each Cookventure field came from, so the UI can say when a value is an estimate */
    cookventure_source: Record<CookventureField, FieldSource>;
  };

const clamp03 = (n: number) => Math.max(0, Math.min(3, Math.round(n)));
const text = (recipe: RecipeLike) => (recipe.ingredients || '').toLowerCase();
const has = (haystack: string, ...needles: string[]) => needles.some((n) => haystack.includes(n));

// --- Taste ----------------------------------------------------------------

/** Ingredient signals for chili heat; each matching line adds its weight */
const HEAT_SIGNALS: Array<[RegExp, number]> = [
  [/green chil/, 1],
  [/chil+[iy]e?s? powder|kashmiri/, 1],
  [/(dried|dry) red chil|red chil+i(es)? *$|dried red chile/, 0.5],
  [/black pepper|peppercorn/, 0.5],
  [/\bpepper\b(?! *, *bell)/, 0.25],
];

/** Spice signals for masaledar (aromatic complexity) */
const MASALA_SIGNALS: Array<[RegExp, number]> = [
  [/garam masala|sambar powder|rasam powder|goda masala/, 2],
  [/panch phoron/, 1.5],
  [/chaat masala/, 1],
  [/cumin|jeera/, 1],
  [/coriander (powder|seed)/, 1],
  [/cardamom|cinnamon|clove|fennel|fenugreek|star anise|nutmeg|mace|bay lea|poppy/, 1],
  [/asafoetida|\bhing\b/, 0.5],
  [/turmeric|mustard seed|ginger|garlic/, 0.5],
];

const SOURING_SYNONYMS: Record<string, string> = { buttermilk: 'yogurt', curd: 'yogurt', 'lemon juice': 'lemon' };

function lines(recipe: RecipeLike): string[] {
  return text(recipe)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

/**
 * Estimate Teekha / Masaledar / Khata / Meetha (0-3) from the ingredient list.
 * Souring and sweetening strength come from souring_map.json and sweeteners_map.json.
 */
export function inferTasteAxes(recipe: RecipeLike): TasteAxes {
  const ingredientLines = lines(recipe);
  const all = text(recipe);

  let heat = 0;
  ingredientLines.forEach((line) => {
    const hit = HEAT_SIGNALS.find(([re]) => re.test(line) && !/bell pepper/.test(line));
    if (hit) heat += hit[1];
  });

  let masala = 0;
  MASALA_SIGNALS.forEach(([re, weight]) => {
    const count = ingredientLines.filter((line) => re.test(line)).length;
    masala += Math.min(count, 2) * weight;
  });

  // Tang: strongest souring agent, plus half a point for each extra one
  const souring = Object.keys(SOURING)
    .filter((agent) => all.includes(agent))
    .concat(Object.keys(SOURING_SYNONYMS).filter((s) => all.includes(s)).map((s) => SOURING_SYNONYMS[s]));
  const sourBoosts = [...new Set(souring)].map((agent) => SOURING[agent]?.khata_boost ?? 0).sort((a, b) => b - a);
  let tangy = sourBoosts.length > 0 ? sourBoosts[0] + 0.5 * (sourBoosts.length - 1) : 0;
  if (/urad dal|yeast|ferment/.test(all) && /rice/.test(all)) tangy = Math.max(tangy, 1); // fermented batters

  // Sweet: strongest sweetener. Coconut and cinnamon only hint at sweetness, so on their own they
  // round down to 0; they matter when the recipe has nothing sweeter.
  const sweetBoosts = Object.keys(SWEETENERS)
    .filter((s) => all.includes(s.replace(/_/g, ' ')))
    .map((s) => (s === 'coconut' || s === 'cinnamon' ? 0.4 : SWEETENERS[s].meetha_boost));
  if (/honey|maple|raisin/.test(all)) sweetBoosts.push(1);
  let sweet = sweetBoosts.length > 0 ? Math.max(...sweetBoosts) : 0;
  if (recipe.course === 'dessert') sweet = 3;

  return { heat: clamp03(heat), masala: clamp03(masala / 2), tangy: clamp03(tangy), sweet: clamp03(sweet) };
}

// --- Tadka & masala ---------------------------------------------------------

/** Tadkas implied by the tempering ingredients, strongest signal first */
export function inferTadkas(recipe: RecipeLike): string[] {
  const all = text(recipe);
  const found: string[] = [];
  if (has(all, 'mustard seed') && has(all, 'curry lea')) found.push('mustard_curry_leaf');
  if (has(all, 'panch phoron') || (has(all, 'fennel') && has(all, 'nigella', 'kalonji'))) found.push('panch_phoron');
  if (has(all, 'cumin seed', 'jeera') && has(all, 'asafoetida', 'hing')) found.push('hing_jeera');
  if (has(all, 'garlic') && /(dried|dry) red chil/.test(all) && /temper|tadka/.test(all)) found.push('lehsun_lal_mirch');
  if (found.length === 0 && has(all, 'cumin seed')) found.push('hing_jeera');
  return found;
}

const MASALA_NAMES: Record<string, string> = {
  'garam masala': 'garam_masala',
  'goda masala': 'goda_masala',
  'panch phoron': 'panch_phoron',
  'sambar powder': 'sambar_powder',
  'rasam powder': 'rasam_powder',
  'chaat masala': 'chaat_masala',
};

/** Spice blends named in the ingredient list */
export function inferMasalas(recipe: RecipeLike): string[] {
  const all = text(recipe);
  return Object.keys(MASALA_NAMES)
    .filter((name) => all.includes(name))
    .map((name) => MASALA_NAMES[name]);
}

// --- Region -------------------------------------------------------------------

const REGION_SIGNALS: Array<[RegExp, string, number]> = [
  [/coconut oil/, 'south', 2],
  [/curry lea/, 'south', 1],
  [/tamarind/, 'south', 1],
  [/sambar powder|rasam powder/, 'south', 2],
  [/urad dal|parboiled rice|rice flour/, 'south', 1],
  [/garam masala/, 'north', 1],
  [/chaat masala|kasuri methi|paneer|kidney bean|rajma/, 'north', 2],
  [/\bghee\b/, 'north', 0.5],
  [/panch phoron|mustard oil|poppy seed|posto/, 'east', 2],
  [/goda masala|kokum/, 'west', 2],
  [/bamboo shoot/, 'northeast', 2],
];

/** Most likely region (and Kerala, when coconut oil leads a South Indian dish); empty when unclear */
export function inferRegions(recipe: RecipeLike): { region_tags: string[]; subregion_tags: string[] } {
  const all = text(recipe);
  const scores: Record<string, number> = {};
  REGION_SIGNALS.forEach(([re, region, weight]) => {
    if (re.test(all)) scores[region] = (scores[region] || 0) + weight;
  });
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [best, runnerUp] = ranked;
  if (!best || best[1] < 2 || (runnerUp && best[1] - runnerUp[1] < 1)) {
    return { region_tags: [], subregion_tags: [] };
  }
  const subregion_tags = best[0] === 'south' && all.includes('coconut oil') ? ['kerala'] : [];
  return { region_tags: [best[0]], subregion_tags };
}

// --- Enrichment -----------------------------------------------------------------

const cache = new WeakMap<object, EnrichedRecipe>();

/**
 * Return the recipe with every Cookventure field filled in.
 * Results are cached per recipe object, so the same input always returns the same (stable) object.
 */
export function enrichRecipe<R extends RecipeLike>(recipe: R): EnrichedRecipe<R> {
  // Already enriched (e.g. a swapped copy of an enriched recipe): keep its field sources
  if ('cookventure_source' in recipe) return recipe as EnrichedRecipe<R>;
  const cached = cache.get(recipe);
  if (cached) return cached as EnrichedRecipe<R>;

  const curated = CURATED[recipe.id];
  let inferred: Required<RecipeCookventureData> | undefined;
  const getInferred = () => {
    if (!inferred) {
      inferred = {
        ...inferRegions(recipe),
        masala_profiles: inferMasalas(recipe),
        tadka_profiles: inferTadkas(recipe),
        taste_axes: inferTasteAxes(recipe),
      };
    }
    return inferred;
  };

  const source = {} as Record<CookventureField, FieldSource>;
  const values = {} as Record<CookventureField, unknown>;
  FIELDS.forEach((field) => {
    if (recipe[field] !== undefined) {
      values[field] = recipe[field];
      source[field] = 'recipe';
    } else if (curated && curated[field] !== undefined) {
      values[field] = curated[field];
      source[field] = 'curated';
    } else {
      values[field] = getInferred()[field];
      source[field] = 'inferred';
    }
  });

  const enriched = { ...recipe, ...values, cookventure_source: source } as EnrichedRecipe<R>;
  cache.set(recipe, enriched);
  return enriched;
}

/** True when the flavor profile is an estimate from ingredients rather than a curated value */
export function isTasteEstimated(recipe: { cookventure_source?: Partial<Record<CookventureField, FieldSource>> }): boolean {
  return recipe.cookventure_source?.taste_axes === 'inferred';
}
