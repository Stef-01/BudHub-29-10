// services/gameService.ts

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
    const eligibleRecipes = allRecipes.filter(r => r.imageMetadata?.status === 'generated' || r.imageMetadata?.status === 'cached');

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

    // 5. Select two incorrect recipes, prioritizing diversity of food groups ('course').
    const incorrectOptions: Recipe[] = [];
    const remainingIncorrect = shuffleArray([...incorrectPile]); // Shuffle once for randomness

    // Separate incorrect options by course for diversity
    const diverseIncorrect = remainingIncorrect.filter(r => r.course !== correctRecipe.course);
    const sameCourseIncorrect = remainingIncorrect.filter(r => r.course === correctRecipe.course);

    // Prioritize picking options from different courses
    if (diverseIncorrect.length >= 2) {
        incorrectOptions.push(diverseIncorrect[0], diverseIncorrect[1]);
    } else if (diverseIncorrect.length === 1) {
        incorrectOptions.push(diverseIncorrect[0]);
        if (sameCourseIncorrect.length > 0) {
            incorrectOptions.push(sameCourseIncorrect[0]);
        }
    } else {
        // Fallback to any two incorrect options if no diverse ones are available
        incorrectOptions.push(...sameCourseIncorrect.slice(0, 2));
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
