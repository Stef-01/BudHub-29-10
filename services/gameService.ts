// services/gameService.ts

import type { Recipe, GameMode, GameQuestion } from '../types';

function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Helper to check if a recipe has an image available
// Recipes always have at least an emoji, so we consider all recipes as having images
function hasImageAvailable(recipe: Recipe): boolean {
    // If it has imageMetadata, it's definitely available
    if (recipe.imageMetadata?.status === 'generated' || recipe.imageMetadata?.status === 'cached') {
        return true;
    }
    // Otherwise, it will fall back to emoji or public folder images, which is fine
    return true;
}

type NutrientMetric = 'high_protein' | 'high_fiber' | 'low_carb' | 'diabetic_friendly';

const METRICS: NutrientMetric[] = ['high_protein', 'high_fiber', 'low_carb', 'diabetic_friendly'];

const metricChallenges: Record<NutrientMetric, string> = {
    high_protein: 'Pick the recipe with the HIGHEST protein content',
    high_fiber: 'Pick the recipe with the HIGHEST fiber content',
    low_carb: 'Pick the recipe with the LOWEST carbs',
    diabetic_friendly: 'Pick the most diabetic-friendly recipe (lowest blood sugar impact)'
};

// Generate a question with a random metric challenge
export function generateDynamicNutrientQuestion(allRecipes: Recipe[]): (GameQuestion & { challenge: string }) | null {
    // Pick a random metric for this question
    const metric = METRICS[Math.floor(Math.random() * METRICS.length)];

    // 1. Filter for recipes that have images available
    const eligibleRecipes = allRecipes.filter(hasImageAvailable);

    // 2. Separate recipes into correct and incorrect piles based on the metric
    const correctPile = eligibleRecipes.filter(r => r[metric]);
    const incorrectPile = eligibleRecipes.filter(r => !r[metric]);

    // 3. Check if a valid question can be formed
    if (correctPile.length < 1 || incorrectPile.length < 2) {
        console.warn(`Cannot generate a '${metric}' question. Not enough recipes.
            Correct: ${correctPile.length}, Incorrect: ${incorrectPile.length}`);
        return null;
    }

    // 4. Randomly select one recipe from the correct pile
    const correctRecipe = correctPile[Math.floor(Math.random() * correctPile.length)];

    // 5. Select two incorrect recipes, maximizing diversity of food groups ('course')
    const incorrectOptions: Recipe[] = [];
    const remainingIncorrect = shuffleArray([...incorrectPile]);

    // Group incorrect recipes by course
    const byCourse = new Map<string, Recipe[]>();
    for (const recipe of remainingIncorrect) {
        const course = recipe.course;
        if (!byCourse.has(course)) {
            byCourse.set(course, []);
        }
        byCourse.get(course)!.push(recipe);
    }

    // Remove the correct recipe's course from consideration for better diversity
    const correctCourse = correctRecipe.course;
    const availableCourses = Array.from(byCourse.keys()).filter(c => c !== correctCourse);

    // Try to pick 2 incorrect options from different courses
    if (availableCourses.length >= 2) {
        incorrectOptions.push(byCourse.get(availableCourses[0])![0]);
        incorrectOptions.push(byCourse.get(availableCourses[1])![0]);
    } else if (availableCourses.length === 1) {
        const recipes = byCourse.get(availableCourses[0])!;
        incorrectOptions.push(...recipes.slice(0, 2));
    } else {
        const sameCourseRecipes = byCourse.get(correctCourse);
        if (sameCourseRecipes && sameCourseRecipes.length >= 2) {
            incorrectOptions.push(...sameCourseRecipes.slice(0, 2));
        } else {
            incorrectOptions.push(...remainingIncorrect.slice(0, 2));
        }
    }

    if (incorrectOptions.length < 2) {
        console.warn(`Could not find two suitable incorrect options for '${metric}'.`);
        return null;
    }

    // 6. Combine and shuffle the final options
    const options = shuffleArray([correctRecipe, ...incorrectOptions]);

    return {
        options,
        correctAnswerId: correctRecipe.id,
        challenge: metricChallenges[metric],
    };
}

export function generateQuestion(gameMode: GameMode, allRecipes: Recipe[]): GameQuestion | null {
    // FIX: Added a check for 'nutriserve' and 'unified_nutrient' game modes, which do not use the boolean flags on the Recipe type, to prevent errors.
    if (gameMode === 'nutriserve' || gameMode === 'unified_nutrient') {
        console.warn(`generateQuestion should not be called for '${gameMode}' mode.`);
        return null;
    }
    // 1. Filter for recipes that have images available
    const eligibleRecipes = allRecipes.filter(hasImageAvailable);

    // 2. Separate recipes into correct and incorrect piles based on the game mode.
    const correctPile = eligibleRecipes.filter(r => r[gameMode]);
    const incorrectPile = eligibleRecipes.filter(r => !r[gameMode]);

    // 3. Check if a valid question can be formed.
    // We need at least one correct answer and two incorrect answers.
    if (correctPile.length < 1 || incorrectPile.length < 2) {
        console.warn(`Cannot generate a '${gameMode}' question. Not enough recipes.
            Correct: ${correctPile.length}, Incorrect: ${incorrectPile.length}`);
        return null;
    }

    // 4. Randomly select one recipe from the correct pile.
    const correctRecipe = correctPile[Math.floor(Math.random() * correctPile.length)];

    // 5. Select two incorrect recipes, maximizing diversity of food groups ('course').
    const incorrectOptions: Recipe[] = [];
    const remainingIncorrect = shuffleArray([...incorrectPile]); // Shuffle once for randomness

    // Group incorrect recipes by course
    const byCourse = new Map<string, Recipe[]>();
    for (const recipe of remainingIncorrect) {
        const course = recipe.course;
        if (!byCourse.has(course)) {
            byCourse.set(course, []);
        }
        byCourse.get(course)!.push(recipe);
    }

    // Remove the correct recipe's course from consideration for better diversity
    const correctCourse = correctRecipe.course;
    const availableCourses = Array.from(byCourse.keys()).filter(c => c !== correctCourse);

    // Try to pick 2 incorrect options from different courses (different from each other AND from correct)
    if (availableCourses.length >= 2) {
        // Pick from first two different courses
        incorrectOptions.push(byCourse.get(availableCourses[0])![0]);
        incorrectOptions.push(byCourse.get(availableCourses[1])![0]);
    } else if (availableCourses.length === 1) {
        // Only one different course available, pick two from it
        const recipes = byCourse.get(availableCourses[0])!;
        incorrectOptions.push(...recipes.slice(0, 2));
    } else {
        // Last resort: pick from same course as correct answer
        const sameCourseRecipes = byCourse.get(correctCourse);
        if (sameCourseRecipes && sameCourseRecipes.length >= 2) {
            incorrectOptions.push(...sameCourseRecipes.slice(0, 2));
        } else {
            // Truly no options available
            incorrectOptions.push(...remainingIncorrect.slice(0, 2));
        }
    }

    // This should not happen due to the initial check, but as a safeguard:
    if (incorrectOptions.length < 2) {
        console.warn(`Could not find two suitable incorrect options for '${gameMode}'.`);
        return null;
    }

    // 6. Combine and shuffle the final options.
    const options = shuffleArray([correctRecipe, ...incorrectOptions]);

    return {
        options,
        correctAnswerId: correctRecipe.id,
    };
}