// services/cookventure/dietRules.ts
// Deterministic diet and allergen checks over a recipe's ingredient list.
import { normalizeIngredientText } from './ingredients';

export type DietId =
  | 'vegetarian'
  | 'vegan'
  | 'jain'
  | 'no_onion_garlic'
  | 'gluten_free'
  | 'diabetic_friendly'
  | 'high_fiber';

export type AllergenId = 'nut' | 'soy' | 'dairy';

export interface DietOption {
  id: DietId;
  label: string;
  hi: string;
  emoji: string;
  help: string;
  /** strict = recipes that break it are hidden; goal = recipes that meet it score higher */
  kind: 'strict' | 'goal';
}

export const DIET_OPTIONS: DietOption[] = [
  { id: 'vegetarian', label: 'Vegetarian', hi: 'शाकाहारी', emoji: '🥬', help: 'No meat, fish or egg', kind: 'strict' },
  { id: 'vegan', label: 'Vegan', hi: 'वीगन', emoji: '🌱', help: 'Also no dairy or honey', kind: 'strict' },
  { id: 'jain', label: 'Jain', hi: 'जैन', emoji: '🙏', help: 'Vegetarian, no onion, garlic, roots or mushrooms', kind: 'strict' },
  { id: 'no_onion_garlic', label: 'No onion & garlic', hi: 'बिना प्याज़-लहसुन', emoji: '🧅', help: 'Satvik / temple-style', kind: 'strict' },
  { id: 'gluten_free', label: 'Gluten-free', hi: 'ग्लूटेन-मुक्त', emoji: '🌾', help: 'No wheat, semolina, barley or oats', kind: 'strict' },
  { id: 'diabetic_friendly', label: 'Diabetes-friendly', hi: 'मधुमेह-अनुकूल', emoji: '🩺', help: 'Prefer gentler blood-sugar picks', kind: 'goal' },
  { id: 'high_fiber', label: 'High fiber', hi: 'उच्च फाइबर', emoji: '🫘', help: 'Prefer 5 g+ fiber per serving', kind: 'goal' },
];

export const ALLERGEN_OPTIONS: Array<{ id: AllergenId; label: string; hi: string; emoji: string; help: string }> = [
  { id: 'nut', label: 'Nuts', hi: 'मेवे', emoji: '🥜', help: 'Peanuts, cashews, almonds & other nuts' },
  { id: 'dairy', label: 'Dairy', hi: 'डेयरी', emoji: '🥛', help: 'Milk, ghee, yogurt, paneer, butter' },
  { id: 'soy', label: 'Soy', hi: 'सोया', emoji: '🫛', help: 'Soy sauce, tofu, soy milk' },
];

type RuleGroup = 'meat' | 'dairy' | 'honey' | 'nut' | 'soy' | 'gluten' | 'onion_garlic' | 'jain_roots';

const GROUPS: Record<RuleGroup, { label: string; words: string[]; notWhen?: string[] }> = {
  meat: {
    label: 'meat, fish or egg',
    words: ['chicken', 'mutton', 'lamb', 'beef', 'pork', 'fish', 'sardine', 'mathi', 'prawn', 'shrimp', 'crab', 'egg', 'meat', 'keema', 'anchov', 'tuna', 'salmon', 'bacon', 'ham'],
    notWhen: ['eggplant', 'egg-free', 'eggless'],
  },
  dairy: {
    label: 'dairy',
    words: ['milk', 'ghee', 'butter', 'yogurt', 'yoghurt', 'curd', 'buttermilk', 'paneer', 'cream', 'cheese', 'khoa', 'khoya', 'malai', 'dahi'],
    notWhen: ['coconut milk', 'coconut cream', 'almond milk', 'oat milk', 'soy milk', 'soya milk', 'rice milk', 'cashew milk', 'peanut butter', 'coconut yogurt'],
  },
  honey: { label: 'honey', words: ['honey'] },
  nut: {
    label: 'nuts',
    words: ['cashew', 'almond', 'peanut', 'groundnut', 'walnut', 'pistachio', 'hazelnut', 'pecan', 'macadamia', 'pine nut', 'brazil nut'],
  },
  soy: { label: 'soy', words: ['soy', 'soya', 'tofu', 'edamame', 'tempeh'] },
  gluten: {
    label: 'gluten',
    words: ['wheat', 'maida', 'atta', 'semolina', 'sooji', 'suji', 'rava', 'dalia', 'barley', 'rye', 'bread', 'baguette', 'pasta', 'seitan', 'vermicelli', 'semiya', 'oats', 'couscous'],
    notWhen: ['rice rava', 'buckwheat'],
  },
  onion_garlic: {
    label: 'onion or garlic',
    words: ['onion', 'garlic', 'shallot', 'leek', 'chive', 'scallion'],
  },
  jain_roots: {
    label: 'root vegetables or mushrooms',
    // Fresh ginger is a root; dried ground ginger (sonth) is generally accepted
    words: ['potato', 'carrot', 'beetroot', 'beet', 'radish', 'yam', 'tapioca', 'cassava', 'koorka', 'turnip', 'mushroom', 'ginger'],
    notWhen: ['ground ginger', 'dry ginger', 'dried ginger', 'ginger powder'],
  },
};

const RULES: Partial<Record<DietId, RuleGroup[]>> = {
  vegetarian: ['meat'],
  vegan: ['meat', 'dairy', 'honey'],
  jain: ['meat', 'onion_garlic', 'jain_roots', 'honey'],
  no_onion_garlic: ['onion_garlic'],
  gluten_free: ['gluten'],
};

const ALLERGEN_GROUP: Record<AllergenId, RuleGroup> = { nut: 'nut', soy: 'soy', dairy: 'dairy' };

/** Diet tags as recipes spell them ("gluten-free") -> DietId */
function normalizeTag(tag: string): string {
  return tag.toLowerCase().replace(/[-\s]+/g, '_');
}

function lineHasGroup(line: string, group: RuleGroup): boolean {
  const { words, notWhen = [] } = GROUPS[group];
  let text = ` ${normalizeIngredientText(line)} `;
  notWhen.forEach((phrase) => {
    text = text.split(phrase).join(' ');
  });
  return words.some((w) => new RegExp(`(^|[^a-z])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(text));
}

/**
 * A line breaks a rule only if every alternative on it does ("1 tbsp ghee or oil" is fine for
 * vegans), and optional ingredients never do.
 */
function lineBreaks(line: string, group: RuleGroup): boolean {
  // Optional and "of your choice" ingredients can always be left out or swapped
  if (/optional|of your choice/i.test(line)) return false;
  const alternatives = line.split(/\bor\b/i).map((part) => part.trim()).filter(Boolean);
  return alternatives.length > 0 && alternatives.every((alt) => lineHasGroup(alt, group));
}

export interface DietCheck {
  passes: boolean;
  /** Human-readable reasons the recipe was excluded, e.g. "Contains ghee (dairy)" */
  violations: string[];
  /** Strict diets confirmed by the recipe's own diet tags */
  verified: DietId[];
  /** Strict diets that pass the ingredient check but aren't on the recipe's label */
  unverified: DietId[];
  /** Worth-knowing notes that don't exclude the recipe */
  cautions: string[];
}

interface DietCheckable {
  ingredients?: string;
  diet_tags?: string[];
}

/**
 * Check a recipe against strict diets and allergens.
 * A recipe whose own diet tags include a diet is trusted for it; otherwise its ingredients are checked.
 * Allergens are always checked against ingredients.
 */
export function checkDiet(recipe: DietCheckable, diets: string[], avoids: string[]): DietCheck {
  const ingredientLines = (recipe.ingredients || '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.endsWith(':'));
  const tags = (recipe.diet_tags || []).map(normalizeTag);
  const violations: string[] = [];
  const verified: DietId[] = [];
  const unverified: DietId[] = [];
  const cautions: string[] = [];

  const firstBreakingLine = (group: RuleGroup) => ingredientLines.find((line) => lineBreaks(line, group));

  diets.forEach((dietId) => {
    const groups = RULES[dietId as DietId];
    if (!groups) return; // goals (diabetic_friendly, high_fiber) never exclude
    if (tags.includes(dietId)) {
      verified.push(dietId as DietId);
      return;
    }
    const broken = groups.map((g) => ({ g, line: firstBreakingLine(g) })).find((b) => b.line);
    if (broken) {
      violations.push(`Not ${labelFor(dietId)}: ${shorten(broken.line!)} (${GROUPS[broken.g].label})`);
    } else {
      unverified.push(dietId as DietId);
    }
  });

  avoids.forEach((avoid) => {
    const group = ALLERGEN_GROUP[avoid as AllergenId];
    if (group) {
      const line = firstBreakingLine(group);
      if (line) violations.push(`Contains ${GROUPS[group].label}: ${shorten(line)}`);
    } else if (avoid.trim()) {
      // Free-text avoid ("mushroom"): plain substring check
      const needle = normalizeIngredientText(avoid);
      const line = ingredientLines.find((l) => normalizeIngredientText(l).includes(needle));
      if (line) violations.push(`Contains ${avoid}: ${shorten(line)}`);
    }
  });

  if (
    (diets.includes('vegan') || avoids.includes('dairy')) &&
    ingredientLines.some((l) => /milk of your choice/i.test(l))
  ) {
    cautions.push('Pick a plant-based milk.');
  }
  if (diets.includes('gluten_free') && ingredientLines.some((l) => /asafoetida|\bhing\b/i.test(l))) {
    cautions.push('Most compounded hing contains wheat flour: use a gluten-free asafoetida.');
  }
  if (diets.includes('gluten_free') && ingredientLines.some((l) => /\boats?\b/i.test(l)) && tags.includes('gluten_free')) {
    cautions.push('Use oats labelled gluten-free.');
  }

  return { passes: violations.length === 0, violations, verified, unverified, cautions };
}

function labelFor(dietId: string): string {
  return getDietLabel(dietId).toLowerCase();
}

/** "gluten_free" -> "Gluten-free" */
export function getDietLabel(dietId: string): string {
  return DIET_OPTIONS.find((d) => d.id === dietId)?.label ?? dietId.replace(/_/g, ' ');
}

function shorten(line: string): string {
  return line.length > 48 ? `${line.slice(0, 45)}…` : line;
}

/** Does the recipe meet a soft goal? */
export function meetsGoal(
  recipe: { diabetic_friendly?: boolean; high_fiber?: boolean; fiber_grams?: number; diabetic_adapted?: boolean },
  goal: DietId
): boolean {
  if (goal === 'diabetic_friendly') return !!recipe.diabetic_friendly;
  if (goal === 'high_fiber') return !!recipe.high_fiber || (recipe.fiber_grams ?? 0) >= 5;
  return false;
}
