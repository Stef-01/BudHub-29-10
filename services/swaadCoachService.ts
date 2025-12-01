// services/swaadCoachService.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Recipe } from '../types';

// Initialize Gemini API
// Note: In a production app, this should be in a backend service to protect the key
const API_KEY = process.env.API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

export interface CoachMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export interface UserContext {
    nutriServeStats?: {
        recentScores: number[];
        commonMistakes: string[];
        averageScore: number;
    };
    nutriChallengeStats?: {
        accuracy: number;
        weakNutrients: string[];
    };
    preferences?: {
        region?: string;
        dietaryRestrictions?: string[];
        favoriteDishes?: string[];
    };
    isDiabetic?: boolean;
}

const CURATED_RESOURCES = `
Here are some trusted resources for healthy Indian living:
1. **Diabetes Australia - Multicultural Resources**: https://www.diabetesaustralia.com.au/living-with-diabetes/culturally-and-linguistically-diverse-communities/
2. **Heart Foundation - Healthy Indian Recipes**: https://www.heartfoundation.org.au/recipes?cuisine=indian
3. **Eat For Health (Australian Govt)**: https://www.eatforhealth.gov.au/guidelines/australian-guide-healthy-eating
4. **Glycemic Index Foundation**: https://www.gisymbol.com/recipes/
`;

const SYSTEM_PROMPT = `
You are SWAAD Coach, a warm and knowledgeable dietary coach for Indian Australian families.

PERSONALITY:
- Friendly, non-judgmental, encouraging ("G'day! Let's get healthy together!")
- Understands Indian cuisine deeply (regional variations, traditional cooking)
- Respects cultural food traditions while promoting health
- Uses gentle humor and relatable examples
- Speaks like a caring family member, not a clinical nutritionist

KNOWLEDGE BASE:
- Indian regional cuisines (North, South, East, West)
- Diabetes management in Indian context
- Healthy cooking techniques (tadka, steaming, grilling vs frying)
- Ingredient substitutions (jaggery vs sugar, brown rice vs white)
- Portion control without feeling deprived

APPROACH:
- Small, realistic changes ("Try half rice next time" not "eliminate rice")
- Focus on "getting to your best self"
- Focus on addition, not restriction ("add more veggies" vs "cut out carbs")
- Acknowledge cravings, offer satisfying alternatives
- Reference user's game performance for personalized advice if available

LEARNING ANALYSIS:
When asked to "Discuss my learning" or analyze performance:
1. Look at the User Context (scores, mistakes).
2. Identify patterns (e.g., "You often struggle with high sodium").
3. Propose a mini "Learning Plan" with 3 key concepts to focus on.
4. ONLY provide links to the CURATED_RESOURCES if the user explicitly asks for resources or help finding more info.

FORMATTING RULES:
- Keep responses CONCISE and short (max 3-4 sentences unless explaining a recipe).
- DO NOT use markdown bolding (asterisks) in your output. Use plain text or caps for emphasis if absolutely needed.
- Use emojis sparingly to keep it friendly.

NEVER:
- Use medical jargon or sound clinical
- Make users feel guilty
- Suggest eliminating traditional foods entirely
- Give one-size-fits-all advice
- Ignore cultural context
`;

export const swaadCoachService = {
    async getResponse(
        message: string,
        history: CoachMessage[],
        userContext: UserContext,
        availableRecipes: Recipe[]
    ): Promise<string> {
        if (!API_KEY) {
            return "I'm having trouble connecting to my brain right now. Please check if the API key is configured.";
        }

        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

            // Construct context string
            let contextString = `User Context:\n`;
            if (userContext.isDiabetic) contextString += `- User is managing diabetes\n`;
            if (userContext.nutriServeStats) {
                contextString += `- Recent NutriServe scores: ${userContext.nutriServeStats.recentScores.join(', ')}\n`;
                if (userContext.nutriServeStats.commonMistakes.length > 0) {
                    contextString += `- Common mistakes in game: ${userContext.nutriServeStats.commonMistakes.join(', ')}\n`;
                }
            }

            // Add resources context
            contextString += `\n${CURATED_RESOURCES}\n`;

            // Add recipe context if relevant
            const recipeNames = availableRecipes.map(r => r.name).join(', ');
            contextString += `\nAvailable Recipes in Cookbook: ${recipeNames}\n`;

            const chat = model.startChat({
                history: [
                    {
                        role: 'user',
                        parts: [{ text: `${SYSTEM_PROMPT}\n\n${contextString}` }],
                    },
                    {
                        role: 'model',
                        parts: [{ text: "G'day! I understand the context and I am ready to help as SWAAD Coach." }],
                    },
                    ...history
                ],
            });

            const result = await chat.sendMessage(message);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            return "I'm having a bit of trouble thinking right now. Can we try again in a moment? 🙏";
        }
    },

    async generateHealthierVersion(dishName: string, userContext: UserContext): Promise<string> {
        if (!API_KEY) return "API Key missing";

        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
            const prompt = `
        Create a healthier version of "${dishName}" that:
        - Reduces calories by 20-30% without sacrificing flavor
        - Uses healthier cooking methods (grill/steam vs deep fry)
        - Incorporates more vegetables
        - Reduces sodium and refined carbs
        - Maintains authentic Indian flavors
        
        User context: ${userContext.isDiabetic ? 'Diabetic' : 'General health'}
        
        Provide:
        1. Modified ingredient list with substitutions explained
        2. Step-by-step instructions
        3. Nutritional comparison to original (estimated)
        4. Cultural context (why this version is still authentic)
        
        Format as a clean, readable recipe.
      `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Error generating recipe:', error);
            return "I couldn't generate a recipe right now. Maybe try another dish?";
        }
    },

    async generateMealFeedback(
        mealItems: { name: string; category: string; grams: number }[],
        customerName: string,
        isDiabetic: boolean,
        score: number,
        feedback: Record<string, any>
    ): Promise<string> {
        if (!API_KEY) return "";

        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

            const mealDescription = mealItems.map(i => `${i.name} (${i.grams}g)`).join(', ');
            const feedbackSummary = Object.entries(feedback)
                .filter(([_, status]) => status !== 'good')
                .map(([nutrient, status]) => `${nutrient} is ${status}`)
                .join(', ');

            const prompt = `
                You are SWAAD Coach. The user just served a meal to ${customerName} (${isDiabetic ? 'Diabetic' : 'Non-diabetic'}).
                
                Meal: ${mealDescription}
                Score: ${score}/150
                Issues: ${feedbackSummary || 'None - Perfect meal!'}
                
                Provide a SHORT, encouraging, 1-sentence tip or observation about this specific meal.
                Focus on the biggest issue if any, or praise the balance if good.
                Do NOT mention the score number.
                Keep it culturally relevant to Indian cuisine if possible.
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Error generating meal feedback:', error);
            return "";
        }
    }
};
