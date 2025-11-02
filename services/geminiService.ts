// services/geminiService.ts

// FIX: import GoogleGenAI from the correct path.
import { GoogleGenAI, Type } from "@google/genai";
import type { Weather, Plant, Recipe } from "../types";

// IMPORTANT: In a real application, this API key should be stored in a secure environment variable.
// This application is designed to run in a specific environment where `process.env.API_KEY` is available.
const API_KEY = process.env.API_KEY;

// FIX: Conditionally initialize GoogleGenAI to avoid errors when API_KEY is missing.
// FIX: Use named parameter for apiKey
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

if (!ai) {
  console.warn("API key not found. Gemini features will be disabled.");
}

export async function getGardeningTip(weather: Weather, plant: Plant): Promise<string> {
  // FIX: Check for the initialized 'ai' instance instead of just the API_KEY.
  if (!ai) {
    return "Gemini is taking a nap... (API key not configured)";
  }

  const prompt = `
    You are a cheerful, "vibe-coded" garden assistant for a gardener in Logan, Queensland, Australia (a subtropical climate).
    Based on this specific weather information and plant, give me one short, creative, and encouraging gardening tip.
    Keep it under 30 words. The tone should be relaxed, positive, and a bit quirky, like a friend giving advice.
    Do not use markdown.

    Weather Today:
    - Condition: ${weather.current.condition}
    - Temperature: ${weather.current.tempC}°C
    - Humidity: ${weather.current.humidity}%

    Plant in Focus:
    - Name: ${plant.name}
    - Category: ${plant.category}
    - Current Stage: ${plant.phenology}

    Generate the tip now.
  `;

  try {
    // FIX: Per coding guidelines, use ai.models.generateContent
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    // FIX: Per coding guidelines, access the .text property directly.
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Could not get a tip from the cosmos right now. Try again later!";
  }
}

export async function getRecipeSuggestion(plants: Plant[]): Promise<Omit<Recipe, 'id' | 'source' | 'keyIngredients'>> {
    if (!ai) {
        throw new Error("API key not configured");
    }

    const harvestablePlants = plants
        .filter(p => ['Fruiting', 'Harvest', 'Vegetative'].includes(p.phenology))
        .map(p => p.name);

    if (harvestablePlants.length === 0) {
        // FIX: Added missing properties to the returned object to match the Recipe type.
        return {
            name: "Garden's Resting",
            image: "😴",
            ingredients: "No ingredients available.",
            instructions: "Nothing is ready for harvest right now. A good time to plan your next planting!",
            course: 'snack',
            diet_tags: [],
            spice_level: 0,
            prep_minutes: 0,
            cook_minutes: 0,
            servings: 0,
            diabetic_friendly: false,
            high_fiber: false,
            high_protein: false,
            low_carb: false,
            gluten_free: false,
        };
    }

    // FIX: Updated prompt to request all necessary recipe details from the model.
    const prompt = `
        You are a creative chef who specializes in garden-to-table recipes for a home cook in a subtropical climate.
        Given the following ingredients available from their garden, create a simple and delicious recipe.
        The recipe should be easy to follow. Provide a suitable emoji for the recipe image.
        Also provide details like course type (e.g., 'main', 'side'), diet tags, spice level (0-3), prep and cook times in minutes, number of servings, and boolean health flags (diabetic_friendly, high_fiber, high_protein, low_carb, gluten_free).

        Available ingredients: ${harvestablePlants.join(', ')}.

        Return the recipe as a JSON object.
    `;

    try {
        // FIX: Per coding guidelines, use ai.models.generateContent
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                // FIX: Expanded responseSchema to include all required fields for a Recipe object.
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "The name of the recipe." },
                        image: { type: Type.STRING, description: "A single emoji that represents the dish." },
                        course: { type: Type.STRING, description: "Course of the meal, e.g., 'main', 'side', 'snack'." },
                        diet_tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Dietary tags like 'vegetarian', 'vegan'." },
                        spice_level: { type: Type.INTEGER, description: "Spice level from 0 (mild) to 3 (spicy)." },
                        prep_minutes: { type: Type.INTEGER, description: "Preparation time in minutes." },
                        cook_minutes: { type: Type.INTEGER, description: "Cooking time in minutes." },
                        servings: { type: Type.INTEGER, description: "Number of servings." },
                        diabetic_friendly: { type: Type.BOOLEAN },
                        high_fiber: { type: Type.BOOLEAN },
                        high_protein: { type: Type.BOOLEAN },
                        low_carb: { type: Type.BOOLEAN },
                        gluten_free: { type: Type.BOOLEAN },
                        ingredients: { type: Type.STRING, description: "A list of ingredients, formatted with newlines." },
                        instructions: { type: Type.STRING, description: "The cooking instructions, formatted with numbered steps." },
                    },
                    required: [
                        "name", "image", "ingredients", "instructions", "course", "diet_tags", "spice_level",
                        "prep_minutes", "cook_minutes", "servings", "diabetic_friendly", "high_fiber",
                        "high_protein", "low_carb", "gluten_free"
                    ],
                },
            },
        });
        
        // FIX: Per coding guidelines, access the .text property directly.
        const jsonText = response.text;
        const recipeData = JSON.parse(jsonText);
        return recipeData;

    } catch (error) {
        console.error("Error generating recipe with Gemini:", error);
        throw new Error("The muses of the kitchen are busy... could not generate a recipe.");
    }
}
