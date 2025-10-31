import type { Recipe, GameMode, GameQuestion } from '../types';

function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function generateQuestion(gameMode: GameMode, allRecipes: Recipe[]): GameQuestion | null {
    // 1. Filter for recipes that are eligible for the game (must have a generated image).
    const eligibleRecipes = allRecipes.filter(r => r.imageMetadata?.status === 'generated');

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

    // 5. Randomly select two unique recipes from the incorrect pile.
    const shuffledIncorrect = shuffleArray(incorrectPile);
    const incorrectOptions = shuffledIncorrect.slice(0, 2);

    // 6. Combine and shuffle the final options.
    const options = shuffleArray([correctRecipe, ...incorrectOptions]);

    return {
        options,
        correctAnswerId: correctRecipe.id,
    };
}
