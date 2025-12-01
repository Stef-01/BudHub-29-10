// hooks/useSwaadCoachContext.ts
// hooks/useSwaadCoachContext.ts
import { useMemo } from 'react';
import { UserContext } from '../services/swaadCoachService';

// Mock data for now - in a real implementation, this would pull from your game state stores
// You might need to export these types from your game components or create a shared types file
export const useSwaadCoachContext = (): UserContext => {
    // TODO: Connect to actual game state
    // For now, we'll return a structure that matches what we expect
    // In the future, you would use useContext(GameScoreContext) etc.

    const context = useMemo(() => {
        // Retrieve data from localStorage
        const savedScores = localStorage.getItem('nutriServeScores');
        const scores = savedScores ? JSON.parse(savedScores) : [];

        const savedMistakes = localStorage.getItem('nutriServeMistakes');
        const mistakeHistory = savedMistakes ? JSON.parse(savedMistakes) : [];

        // Analyze mistakes to find common ones
        const mistakeCounts: Record<string, number> = {};
        mistakeHistory.forEach((entry: any) => {
            if (entry.mistakes) {
                Object.entries(entry.mistakes).forEach(([nutrient, data]: [string, any]) => {
                    if (data.type !== 'good' && data.type !== 'ok') {
                        mistakeCounts[nutrient] = (mistakeCounts[nutrient] || 0) + 1;
                    }
                });
            }
        });

        const commonMistakes = Object.entries(mistakeCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([nutrient]) => nutrient);

        return {
            nutriServeStats: {
                recentScores: scores.slice(-5), // Last 5 scores
                commonMistakes: commonMistakes.length ? commonMistakes : ['None yet! Play NutriServe to get analysis.'],
                averageScore: scores.length ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0,
            },
            nutriChallengeStats: {
                accuracy: 0.75, // Placeholder until NutriChallenge is wired up
                weakNutrients: [],
            },
            preferences: {
                region: 'North Indian',
                dietaryRestrictions: ['Vegetarian'],
                favoriteDishes: ['Paneer Butter Masala', 'Dal Makhani'],
            },
            isDiabetic: true, // Default to true for the demo context
        };
    }, []);

    return context;
};
