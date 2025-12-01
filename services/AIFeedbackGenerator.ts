
/**
 * Generates "AI-style" feedback based on game performance.
 * Since we don't have a live AI backend for this specific feature,
 * we use a rule-based system to generate personalized messages.
 */

interface GameStats {
    score: number;
    mistakes?: Record<string, { count: number; type: 'high' | 'low' | 'off' }>;
    totalRounds?: number;
    perfectRounds?: number;
}

export function generateAIFeedback(gameType: 'nutriserve' | 'nutrient_challenge', stats: GameStats): string {
    if (gameType === 'nutriserve') {
        return generateNutriServeFeedback(stats);
    } else {
        return generateNutrientChallengeFeedback(stats);
    }
}

function generateNutriServeFeedback(stats: GameStats): string {
    const { score, mistakes, totalRounds } = stats;

    // High level summary
    if (score > (totalRounds || 5) * 130) {
        return "Incredible work, Chef! 🌟 Your nutritional intuition is spot on. You've mastered the art of balancing macros while keeping customers happy. You're ready for the big leagues!";
    }

    if (mistakes && Object.keys(mistakes).length > 0) {
        // Find the biggest mistake
        const sortedMistakes = Object.entries(mistakes).sort(([, a], [, b]) => b.count - a.count);
        const [topMistakeNutrient, topMistakeData] = sortedMistakes[0];

        const nutrientName = topMistakeNutrient.replace('_g', '').replace('_mg', '');
        const issue = topMistakeData.type === 'high' ? 'too high' : 'too low';

        return `Good effort! You're getting there. I noticed that ${nutrientName} tends to be ${issue} in your meals. Try to focus on balancing that next time, and your score will skyrocket! 🚀`;
    }

    return "Solid performance! You have a good grasp of the basics. To reach the next level, try to hit those perfect rounds by paying closer attention to the specific dietary needs of each customer.";
}

function generateNutrientChallengeFeedback(stats: GameStats): string {
    const { score } = stats;

    if (score > 1000) {
        return "Wow! You're a walking encyclopedia of nutrition! 🧠🥦 Your knowledge of food composition is impressive. Have you considered a career as a dietitian?";
    }

    if (score > 500) {
        return "Great job! You know your food well. You can identify high-protein and high-fiber foods with ease. Keep practicing to sharpen your speed!";
    }

    return "Nice try! Nutrition can be tricky. Remember to check labels and learn which foods are rich in specific nutrients. You'll get better with every round! 🌱";
}

/**
 * Calculates a percentile rank based on the score.
 * Uses a normal distribution approximation.
 */
export function calculatePercentile(score: number, gameType: 'nutriserve' | 'nutrient_challenge'): number {
    let mean, stdDev;

    if (gameType === 'nutriserve') {
        // User request: Score of 800 should be ~20th percentile.
        // Assuming Max Score ~1500 (10 rounds * 150).
        // Mean = 1000, StdDev = 240 gives:
        // 800 -> Z = -0.83 (~20th percentile)
        // 1000 -> Z = 0 (50th percentile)
        // 1200 -> Z = 0.83 (~80th percentile)
        // 1500 -> Z = 2.08 (~98th percentile)
        mean = 1000;
        stdDev = 240;
    } else {
        // Nutrient challenge: 10 rounds, ~10-20 points per round. Max ~200.
        // Mean might be around 80.
        mean = 80;
        stdDev = 30;
    }

    const z = (score - mean) / stdDev;

    // Approximation of CDF for standard normal distribution
    // Using error function approximation
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

    if (z > 0) {
        prob = 1 - prob;
    }

    return Math.min(99, Math.max(1, Math.round(prob * 100)));
}
