// services/cookventure/cookventureRecipeGenerator.ts
// AI-powered recipe generation for Cookventure with full regional metadata

import { GoogleGenAI, Type } from "@google/genai";
import type { Recipe } from "../../types";
import type { UserPreferences, TasteAxes } from "../../types/cookventure";

const API_KEY = process.env.API_KEY;
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

if (!ai) {
  console.warn("API key not found in cookventureRecipeGenerator. Recipe generation will be disabled.");
}

interface RecipeGenerationParams {
  userPrefs: UserPreferences;
  count?: number; // Number of recipes to generate
  specificCraving?: string; // Optional specific dish request
}

/**
 * Generates recipes tailored to user's Cookventure preferences
 * Includes full Cookventure metadata: region_tags, masala_profiles, tadka_profiles, taste_axes
 */
export async function generateCookventureRecipes(
  params: RecipeGenerationParams
): Promise<Omit<Recipe, 'id' | 'source'>[]> {
  if (!ai) {
    throw new Error("Gemini API not initialized. Cannot generate recipes.");
  }

  const { userPrefs, count = 1, specificCraving } = params;

  // Build comprehensive prompt based on user preferences
  const prompt = buildRecipePrompt(userPrefs, count, specificCraving);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recipes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Recipe name" },
                  image: { type: Type.STRING, description: "Single emoji representing the dish" },
                  course: {
                    type: Type.STRING,
                    description: "Course type",
                    enum: ["main", "side", "snack", "soup", "beverage", "breakfast", "condiment"]
                  },
                  diet_tags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Dietary tags like vegetarian, vegan, jain"
                  },
                  spice_level: {
                    type: Type.INTEGER,
                    description: "Overall spice level 0-3"
                  },
                  prep_minutes: { type: Type.INTEGER },
                  cook_minutes: { type: Type.INTEGER },
                  servings: { type: Type.INTEGER },
                  diabetic_friendly: { type: Type.BOOLEAN },
                  high_fiber: { type: Type.BOOLEAN },
                  high_protein: { type: Type.BOOLEAN },
                  low_carb: { type: Type.BOOLEAN },
                  gluten_free: { type: Type.BOOLEAN },
                  protein_grams: { type: Type.NUMBER, nullable: true },
                  fiber_grams: { type: Type.NUMBER, nullable: true },
                  carbs_grams: { type: Type.NUMBER, nullable: true },
                  keyIngredients: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "List of 3-5 key ingredients"
                  },
                  ingredients: {
                    type: Type.STRING,
                    description: "Full ingredient list with quantities, newline-separated"
                  },
                  instructions: {
                    type: Type.STRING,
                    description: "Cooking instructions, numbered steps"
                  },
                  region_tags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Regional tags like 'South India', 'North India', 'Tamil Nadu'"
                  },
                  masala_profiles: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Masala blends used: garam_masala, sambar_powder, rasam_powder, etc."
                  },
                  tadka_profiles: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Tadka types: mustard_curry_leaf, hing_jeera, lehsun_lal_mirch, panch_phoron"
                  },
                  taste_axes: {
                    type: Type.OBJECT,
                    properties: {
                      heat: { type: Type.INTEGER, description: "Teekha - chili heat 0-3" },
                      masala: { type: Type.INTEGER, description: "Masaledar - aromatic spice complexity 0-3" },
                      tangy: { type: Type.INTEGER, description: "Khata - sourness/tanginess 0-3" },
                      sweet: { type: Type.INTEGER, description: "Meetha - sweetness 0-3" },
                    },
                    required: ["heat", "masala", "tangy", "sweet"]
                  }
                },
                required: [
                  "name", "image", "ingredients", "instructions", "course", "diet_tags",
                  "spice_level", "prep_minutes", "cook_minutes", "servings",
                  "diabetic_friendly", "high_fiber", "high_protein", "low_carb", "gluten_free",
                  "keyIngredients", "region_tags", "masala_profiles", "tadka_profiles", "taste_axes"
                ]
              }
            }
          },
          required: ["recipes"]
        }
      }
    });

    const jsonText = response.text;
    const data = JSON.parse(jsonText);

    return data.recipes || [];

  } catch (error) {
    console.error("Error generating Cookventure recipes:", error);
    throw new Error("Failed to generate recipes. Please try again.");
  }
}

/**
 * Builds a detailed prompt for recipe generation based on user preferences
 */
function buildRecipePrompt(
  userPrefs: UserPreferences,
  count: number,
  specificCraving?: string
): string {
  const regions = userPrefs.selectedRegions.length > 0
    ? userPrefs.selectedRegions.join(", ")
    : "any Indian region";

  const pantryItems = userPrefs.pantry.length > 0
    ? userPrefs.pantry.join(", ")
    : "common Indian ingredients";

  const cravings = specificCraving || (userPrefs.cravings.length > 0
    ? userPrefs.cravings.join(", ")
    : "authentic Indian dishes");

  const masalas = userPrefs.masalaLocker.length > 0
    ? userPrefs.masalaLocker.join(", ")
    : "any appropriate masala";

  const tadkas = userPrefs.favouriteTadkas.length > 0
    ? userPrefs.favouriteTadkas.join(", ")
    : "any appropriate tadka";

  const tasteDesc = describeTastePreferences(userPrefs.tastePrefs);

  return `
You are a creative Indian chef specializing in authentic regional cuisine. Generate ${count} ${count === 1 ? 'recipe' : 'recipes'} based on these preferences:

REGIONAL FOCUS: ${regions}
CRAVINGS/DISH TYPE: ${cravings}
AVAILABLE PANTRY: ${pantryItems}
MASALA PREFERENCES: ${masalas}
TADKA PREFERENCES: ${tadkas}
DIETARY REQUIREMENTS: ${userPrefs.diet.join(", ")}
${userPrefs.diabetic_friendly ? "DIABETIC FRIENDLY: Required" : ""}
${userPrefs.avoids.length > 0 ? `AVOID: ${userPrefs.avoids.join(", ")}` : ""}

FLAVOR PROFILE:
${tasteDesc}

INSTRUCTIONS:
1. Create authentic, home-cookable recipes that match the regional style
2. Use ingredients from the available pantry where possible
3. Match the flavor profile (heat, masala, tangy, sweet levels)
4. Use the specified masalas and tadkas where appropriate
5. Include accurate Cookventure metadata:
   - region_tags: Specific regions/states (e.g., ["South India", "Tamil Nadu"])
   - masala_profiles: Masala blends used (e.g., ["sambar_powder", "garam_masala"])
   - tadka_profiles: Tempering used (e.g., ["mustard_curry_leaf"])
   - taste_axes: Exact scores for heat, masala, tangy, sweet (0-3 scale)
6. Provide realistic prep/cook times and nutritional info
7. Format ingredients with quantities (e.g., "2 cups rice", "1 tsp cumin")
8. Number the instruction steps clearly

Generate diverse recipes that showcase the richness of Indian cuisine while respecting the user's preferences.
`.trim();
}

/**
 * Converts taste axes to human-readable description
 */
function describeTastePreferences(taste: TasteAxes): string {
  const levels = ["none/mild", "light", "moderate", "strong"];

  return `
- Heat (Teekha): ${levels[taste.heat]} - ${taste.heat === 0 ? "no chili heat" : taste.heat === 1 ? "gentle warmth" : taste.heat === 2 ? "medium spicy" : "very hot"}
- Aromatic Spice (Masaledar): ${levels[taste.masala]} - ${taste.masala === 0 ? "simple/minimal" : taste.masala === 1 ? "lightly spiced" : taste.masala === 2 ? "well-spiced" : "intensely aromatic"}
- Tanginess (Khata): ${levels[taste.tangy]} - ${taste.tangy === 0 ? "no sourness" : taste.tangy === 1 ? "subtle tang" : taste.tangy === 2 ? "noticeably tangy" : "very sour"}
- Sweetness (Meetha): ${levels[taste.sweet]} - ${taste.sweet === 0 ? "no sweetness" : taste.sweet === 1 ? "hint of sweet" : taste.sweet === 2 ? "balanced sweet" : "prominently sweet"}
  `.trim();
}

/**
 * Generate a single recipe based on a specific craving/request
 */
export async function generateSingleRecipe(
  craving: string,
  userPrefs: UserPreferences
): Promise<Omit<Recipe, 'id' | 'source'>> {
  const recipes = await generateCookventureRecipes({
    userPrefs,
    count: 1,
    specificCraving: craving
  });

  if (recipes.length === 0) {
    throw new Error("No recipe generated");
  }

  return recipes[0];
}
