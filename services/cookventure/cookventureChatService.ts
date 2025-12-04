// services/cookventure/cookventureChatService.ts
// Chat service specialized for Cookventure - helps users explore Indian cuisine

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Recipe } from '../../types';
import type { UserPreferences } from '../../types/cookventure';

const API_KEY = process.env.API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

export interface CookventureChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

const COOKVENTURE_SYSTEM_PROMPT = `
You are Cookventure Assistant, a warm and knowledgeable guide for Indian regional cuisine discovery.

PERSONALITY:
- Enthusiastic about Indian food culture and regional diversity
- Patient and educational, helping users understand Indian flavor profiles
- Conversational and friendly, like talking to a foodie friend
- Uses occasional food emojis but not excessively

EXPERTISE:
- Deep knowledge of Indian regional cuisines (North, South, East, West, Northeast, Deccan)
- Expert on Indian spice blends (masalas) and tempering techniques (tadka)
- Understanding of the four taste dimensions:
  * Teekha (तीखा) - Chili heat (not to be confused with masaledar)
  * Masaledar (मसालेदार) - Aromatic spice complexity
  * Khata (खट्टा) - Tanginess from tamarind, kokum, amchur, yogurt
  * Meetha (मीठा) - Sweetness from jaggery, caramelization
- Ingredient substitutions and adaptations
- Cultural context of dishes (festivals, occasions, regional variations)

YOUR ROLE:
1. Help users discover recipes that match their preferences
2. Explain what different masalas and tadkas do
3. Suggest ingredient substitutions when something isn't available
4. Educate about regional differences and cooking techniques
5. Help refine taste preferences by asking clarifying questions
6. Generate recipe ideas when requested

COMMUNICATION STYLE:
- Keep responses concise (3-5 sentences typically)
- DO NOT use markdown bolding (asterisks). Use plain text or CAPS for emphasis if needed
- Ask follow-up questions to understand user needs better
- Reference the user's current preferences when suggesting recipes
- Be specific about regions and ingredients

EXAMPLES OF GOOD RESPONSES:
- "Since you selected South India and love tangy flavors, I'd suggest rasam or sambar! Both use tamarind and curry leaves. Want the recipe?"
- "Garam masala adds warm, aromatic depth without much heat. It's perfect for North Indian curries. Think cinnamon, cardamom, and cloves - those sweet-spicy notes."
- "No curry leaves? Fresh mint or cilantro stems can work in a pinch, but the flavor will be different. Curry leaves have that unique citrusy-herbal taste."

NEVER:
- Overwhelm with too much information at once
- Use technical cooking jargon without explanation
- Ignore the user's stated preferences
- Suggest recipes that don't match their dietary restrictions
`;

const CURATED_RESOURCES = `
Trusted resources for Indian cooking:
1. Indian Healthy Recipes - Heart Foundation: https://www.heartfoundation.org.au/recipes?cuisine=indian
2. Glycemic Index Foundation Recipes: https://www.gisymbol.com/recipes/
3. Diabetes Australia - Multicultural Resources: https://www.diabetesaustralia.com.au/living-with-diabetes/culturally-and-linguistically-diverse-communities/
`;

interface CookventureContext {
    userPreferences: UserPreferences;
    currentResults?: Recipe[];
}

export const cookventureChatService = {
    async getResponse(
        message: string,
        history: CookventureChatMessage[],
        context: CookventureContext
    ): Promise<string> {
        if (!API_KEY) {
            return "I'm having trouble connecting right now. Please check if the API key is configured.";
        }

        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

            // Build context string from user preferences
            const contextString = buildContextString(context);

            const chat = model.startChat({
                history: [
                    {
                        role: 'user',
                        parts: [{ text: `${COOKVENTURE_SYSTEM_PROMPT}\n\n${contextString}\n\n${CURATED_RESOURCES}` }],
                    },
                    {
                        role: 'model',
                        parts: [{ text: "Namaste! I'm your Cookventure Assistant. I'm here to help you discover amazing Indian recipes that match your taste. What would you like to know?" }],
                    },
                    ...history
                ],
            });

            const result = await chat.sendMessage(message);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Error calling Gemini API for Cookventure chat:', error);
            return "I'm having a bit of trouble thinking right now. Can we try again in a moment? 🙏";
        }
    },

    /**
     * Generate a recipe suggestion based on conversation context
     */
    async suggestRecipe(
        userRequest: string,
        context: CookventureContext
    ): Promise<string> {
        if (!API_KEY) {
            return "API key not configured";
        }

        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
            const contextString = buildContextString(context);

            const prompt = `
Based on this user request: "${userRequest}"

And their Cookventure preferences:
${contextString}

Suggest 2-3 specific Indian recipes that would be perfect for them. For each recipe:
1. Name of the dish
2. Region it's from
3. Why it matches their preferences (taste profile, ingredients, dietary needs)
4. 1-2 sentence description

Keep it concise and conversational. Format as a short list without excessive formatting.
            `.trim();

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Error suggesting recipe:', error);
            return "I couldn't come up with suggestions right now. Try describing what you're craving in more detail?";
        }
    },

    /**
     * Explain a masala or tadka in simple terms
     */
    async explainMasalaOrTadka(
        ingredient: string,
        type: 'masala' | 'tadka'
    ): Promise<string> {
        if (!API_KEY) {
            return "API key not configured";
        }

        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

            const prompt = `
Explain "${ingredient}" (a ${type === 'masala' ? 'spice blend' : 'tempering technique'}) in simple, conversational terms:
1. What it is (2-3 sentences)
2. Key spices/aromatics involved
3. What dishes it's commonly used in
4. Regional association if any

Keep it friendly and brief (4-5 sentences total). No markdown formatting.
            `.trim();

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Error explaining ingredient:', error);
            return `I'm not sure about the details of ${ingredient} right now. Try searching online for more info!`;
        }
    }
};

/**
 * Builds a context string from user preferences
 */
function buildContextString(context: CookventureContext): string {
    const { userPreferences, currentResults } = context;

    let contextStr = `Current User Preferences:\n`;

    if (userPreferences.selectedRegions.length > 0) {
        contextStr += `- Regions: ${userPreferences.selectedRegions.join(', ')}\n`;
    }

    if (userPreferences.cravings.length > 0) {
        contextStr += `- Cravings: ${userPreferences.cravings.join(', ')}\n`;
    }

    if (userPreferences.pantry.length > 0) {
        contextStr += `- Available ingredients: ${userPreferences.pantry.slice(0, 10).join(', ')}${userPreferences.pantry.length > 10 ? '...' : ''}\n`;
    }

    if (userPreferences.masalaLocker.length > 0) {
        contextStr += `- Masalas they have: ${userPreferences.masalaLocker.join(', ')}\n`;
    }

    if (userPreferences.favouriteTadkas.length > 0) {
        contextStr += `- Favorite tadkas: ${userPreferences.favouriteTadkas.join(', ')}\n`;
    }

    contextStr += `- Taste preferences:\n`;
    contextStr += `  * Heat (Teekha): ${userPreferences.tastePrefs.heat}/3\n`;
    contextStr += `  * Aromatic spice (Masaledar): ${userPreferences.tastePrefs.masala}/3\n`;
    contextStr += `  * Tanginess (Khata): ${userPreferences.tastePrefs.tangy}/3\n`;
    contextStr += `  * Sweetness (Meetha): ${userPreferences.tastePrefs.sweet}/3\n`;

    if (userPreferences.diet.length > 0) {
        contextStr += `- Dietary preferences: ${userPreferences.diet.join(', ')}\n`;
    }

    if (userPreferences.diabetic_friendly) {
        contextStr += `- Diabetic-friendly recipes preferred\n`;
    }

    if (userPreferences.avoids.length > 0) {
        contextStr += `- Avoids: ${userPreferences.avoids.join(', ')}\n`;
    }

    if (currentResults && currentResults.length > 0) {
        const topRecipes = currentResults.slice(0, 5).map(r => r.name).join(', ');
        contextStr += `\nTop matching recipes found: ${topRecipes}\n`;
    }

    return contextStr.trim();
}
