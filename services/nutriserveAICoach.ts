// services/nutriserveAICoach.ts
import type { Nutrients, MealGoals } from '../components/games/NutriServeTypes';
import type { NutrientStatus } from './nutriserveUtils';

interface ServedItem {
    id: string;
    label: string;
    amount_g: number;
    nutrients: Nutrients;
}

interface AICoachAnalysis {
    suggestion: string;
    worstNutrient: string;
    pointsLost: number;
}

/**
 * Analyzes the meal performance and generates specific, actionable AI Coach suggestions
 * based on what went wrong and which food items caused the issues.
 */
export function generateAICoachSuggestion(
    score: number,
    mealTotals: Nutrients,
    targets: MealGoals,
    feedback: Record<string, NutrientStatus>,
    servedItems: ServedItem[]
): string {
    // If score is perfect or near-perfect, give positive reinforcement
    if (score >= 140) {
        return "🌟 Excellent work! You nailed the nutritional balance. Keep it up!";
    }

    if (score >= 120) {
        return "👍 Great job! Minor tweaks could make this perfect, but you're doing well!";
    }

    // Find the worst nutrient issue (the one that cost the most points)
    const analysis = analyzeWorstIssue(mealTotals, targets, feedback);

    if (!analysis) {
        return "💡 Good effort! Review the nutrient feedback to see where you can improve.";
    }

    // Generate specific suggestion based on the worst issue and what was served
    const suggestion = generateSpecificSuggestion(
        analysis.worstNutrient,
        mealTotals,
        targets,
        servedItems,
        feedback[analysis.worstNutrient]
    );

    return suggestion;
}

/**
 * Analyzes which nutrient issue caused the most point loss
 */
function analyzeWorstIssue(
    totals: Nutrients,
    targets: MealGoals,
    feedback: Record<string, NutrientStatus>
): AICoachAnalysis | null {
    const MAX_SCORE_PER_NUTRIENT = 25;
    let worstNutrient = '';
    let maxPointsLost = 0;

    for (const key in feedback) {
        const nutrient = key as keyof Nutrients;
        const status = feedback[key];

        if (status === 'good') continue;

        let pointsLost = 0;

        if (status === 'low') {
            const { min } = targets[nutrient] as { min: number };
            const ratio = totals[nutrient] / min;
            if (ratio > 0.75) {
                pointsLost = MAX_SCORE_PER_NUTRIENT * 0.5;
            } else {
                pointsLost = MAX_SCORE_PER_NUTRIENT;
            }
        } else if (status === 'high') {
            const { max } = targets[nutrient] as { max: number };

            if (nutrient === 'sodium_mg') {
                const ratio = totals[nutrient] / max;
                if (ratio < 1.25) {
                    pointsLost = MAX_SCORE_PER_NUTRIENT * 0.25;
                } else if (ratio < 1.5) {
                    pointsLost = MAX_SCORE_PER_NUTRIENT * 0.5;
                } else {
                    pointsLost = MAX_SCORE_PER_NUTRIENT;
                }
            } else {
                const ratio = max / totals[nutrient];
                if (ratio > 0.75) {
                    pointsLost = MAX_SCORE_PER_NUTRIENT * 0.5;
                } else {
                    pointsLost = MAX_SCORE_PER_NUTRIENT;
                }
            }
        }

        if (pointsLost > maxPointsLost) {
            maxPointsLost = pointsLost;
            worstNutrient = nutrient;
        }
    }

    if (!worstNutrient) return null;

    return {
        suggestion: '',
        worstNutrient,
        pointsLost: maxPointsLost
    };
}

/**
 * Generates a specific, actionable suggestion based on the nutrient issue and foods served
 */
function generateSpecificSuggestion(
    nutrient: string,
    totals: Nutrients,
    targets: MealGoals,
    servedItems: ServedItem[],
    status: NutrientStatus
): string {
    const nutrientKey = nutrient as keyof Nutrients;

    // Find the food item that contributed most to this nutrient
    const culprit = findBiggestContributor(nutrientKey, servedItems);

    if (!culprit) {
        return getGenericSuggestion(nutrient, status);
    }

    // Generate specific suggestion based on the nutrient and culprit food
    return getSpecificSuggestion(nutrient, status, culprit, totals, targets);
}

/**
 * Finds which food item contributed the most to a specific nutrient
 */
function findBiggestContributor(
    nutrient: keyof Nutrients,
    servedItems: ServedItem[]
): ServedItem | null {
    if (servedItems.length === 0) return null;

    let maxContribution = 0;
    let culprit: ServedItem | null = null;

    for (const item of servedItems) {
        const contribution = item.nutrients[nutrient];
        if (contribution > maxContribution) {
            maxContribution = contribution;
            culprit = item;
        }
    }

    return culprit;
}

/**
 * Generates specific, actionable suggestions based on the problem and culprit food
 */
function getSpecificSuggestion(
    nutrient: string,
    status: NutrientStatus,
    culprit: ServedItem,
    totals: Nutrients,
    targets: MealGoals
): string {
    const nutrientKey = nutrient as keyof Nutrients;
    const actual = totals[nutrientKey];
    const target = targets[nutrientKey];

    // Calculate how much over/under
    let excess = 0;
    if (status === 'high' && 'max' in target) {
        excess = actual - target.max;
    } else if (status === 'low' && 'min' in target) {
        excess = target.min - actual;
    }

    const foodName = culprit.label;
    const isRice = foodName.toLowerCase().includes('rice');
    const isBread = foodName.toLowerCase().includes('roti') || foodName.toLowerCase().includes('naan') || foodName.toLowerCase().includes('paratha');
    const isDal = foodName.toLowerCase().includes('dal') || foodName.toLowerCase().includes('lentil');

    // Generate specific suggestions based on nutrient type
    if (nutrient === 'calories_kcal' && status === 'high') {
        if (isRice) {
            return `🍚 Calories were too high. Next time, try half the rice portion to bring it down.`;
        }
        if (isBread) {
            return `🫓 Calories were too high. Next time, serve just 1 ${foodName} instead of 2.`;
        }
        return `⚖️ Calories were too high. The ${foodName} added a lot. Try a smaller portion next time.`;
    }

    if (nutrient === 'carbs_g' && status === 'high') {
        if (isRice) {
            return `🍚 Carbs were too high for this diabetic customer. Next time, use half the rice or switch to brown rice.`;
        }
        if (isBread) {
            return `🫓 Carbs were too high. Skip the ${foodName} or serve just one piece next time.`;
        }
        return `🌾 Carbs were too high. The ${foodName} is carb-heavy. Try a smaller portion or a lower-carb option.`;
    }

    if (nutrient === 'sodium_mg' && status === 'high') {
        const isSalty = foodName.toLowerCase().includes('samosa') || foodName.toLowerCase().includes('pickle') || foodName.toLowerCase().includes('papad');
        if (isSalty) {
            return `🧂 Sodium was way too high! Skip the ${foodName} entirely for customers with high blood pressure.`;
        }
        return `🧂 Sodium was too high. The ${foodName} is salty. Use less or skip it for heart health.`;
    }

    if (nutrient === 'protein_g' && status === 'low') {
        if (isDal) {
            return `🥜 Protein was too low. Add more ${foodName} or include a protein-rich side like chicken curry.`;
        }
        return `🥜 Protein was too low. Add dal, paneer, or chicken to boost protein for this customer.`;
    }

    if (nutrient === 'fiber_g' && status === 'low') {
        return `🌾 Fiber was too low. Add more vegetables or switch to brown rice for better blood sugar control.`;
    }

    if (nutrient === 'fat_g' && status === 'high') {
        const isFatty = foodName.toLowerCase().includes('paneer') || foodName.toLowerCase().includes('butter') || foodName.toLowerCase().includes('fried');
        if (isFatty) {
            return `🧈 Fat was too high. The ${foodName} is rich. Use a smaller portion or choose a lighter option.`;
        }
        return `🧈 Fat was too high. The ${foodName} contributed a lot. Try a lighter preparation next time.`;
    }

    return getGenericSuggestion(nutrient, status);
}

/**
 * Fallback generic suggestions when we can't be specific
 */
function getGenericSuggestion(nutrient: string, status: NutrientStatus): string {
    if (nutrient === 'calories_kcal') {
        return status === 'high'
            ? "⚖️ Calories were too high. Try smaller portions of rice and bread next time."
            : "⚖️ Calories were too low. Add more food to meet the customer's energy needs.";
    }

    if (nutrient === 'carbs_g') {
        return status === 'high'
            ? "🌾 Carbs were too high. Reduce rice/bread portions for diabetic customers."
            : "🌾 Carbs were too low. Add some rice or bread for energy.";
    }

    if (nutrient === 'protein_g') {
        return status === 'high'
            ? "🥜 Protein was high. This is usually okay, but watch the portion."
            : "🥜 Protein was too low. Add dal, paneer, or chicken for better balance.";
    }

    if (nutrient === 'fiber_g') {
        return "🌾 Fiber was low. Add more vegetables or choose brown rice for better digestion.";
    }

    if (nutrient === 'sodium_mg') {
        return "🧂 Sodium was too high. Avoid salty items like samosas and pickles for heart health.";
    }

    if (nutrient === 'fat_g') {
        return status === 'high'
            ? "🧈 Fat was too high. Choose lighter options and smaller portions of rich foods."
            : "🧈 Fat was low. A little healthy fat is good for satiety.";
    }

    return "💡 Review the feedback above to see where you can improve next time!";
}
