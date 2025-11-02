// services/nutriserveCharacters.ts
import type { Character } from '../components/games/NutriServeTypes';
import { CharacterA, CharacterAHappy, CharacterASad, CharacterB, CharacterBHappy, CharacterBSad, CharacterC, CharacterCHappy, CharacterCSad } from '../components/games/nutriserve-ui/CharacterVisuals';

export const CHARACTERS: Character[] = [
    {
        id: 'customer_a',
        name: 'Rohan',
        visuals: {
            default: CharacterA,
            happy: CharacterAHappy,
            sad: CharacterASad
        },
        order: {
            description: "I'm looking for a balanced, regular-sized meal. I'd love some Chana Masala if you have it.",
            plateSize: 'Regular',
            diabetesMode: 'None',
            required_items: ['chana_masala'],
        },
        dialogue: {
            intro: "Hello! What's on the menu today?",
            positive: "Wow, this is perfect! Exactly what I needed. Delicious and balanced. 10/10!",
            neutral: "Thanks, this is pretty good. A few tweaks and it would be perfect.",
            negative: "Hmm, this isn't quite what I had in mind. It's a bit off from my request.",
        }
    },
    {
        id: 'customer_b',
        name: 'Priya',
        visuals: {
            default: CharacterB,
            happy: CharacterBHappy,
            sad: CharacterBSad
        },
        order: {
            description: "I need a hearty, high-protein meal. How about some Bhindi Masala? I'm trying to watch my carbs.",
            plateSize: 'Hearty',
            diabetesMode: 'Low-Carb',
            required_items: ['bhindi_masala'],
        },
        dialogue: {
            intro: "Hi there! I need something substantial today.",
            positive: "Excellent! This is just the high-protein, low-carb meal I was looking for. You nailed it!",
            neutral: "Not bad. The protein is good, but it could be better balanced for my diet.",
            negative: "This doesn't really fit my dietary needs. I was expecting something different.",
        }
    },
    {
        id: 'customer_c',
        name: 'Mr. Verma',
        visuals: {
            default: CharacterC,
            happy: CharacterCHappy,
            sad: CharacterCSad
        },
        order: {
            description: "I need a light meal, please. Some Palak Dal would be wonderful. No sugary treats!",
            plateSize: 'Light',
            diabetesMode: 'Balanced',
            required_items: ['palak_dal'],
        },
        dialogue: {
            intro: "Good day. Something light and healthy, if you please.",
            positive: "Marvelous! A light, perfectly balanced meal. Thank you so much!",
            neutral: "It's alright. A bit heavier than I'd like, but it will do.",
            negative: "Oh dear, this is not quite right for my diet. It's not what I asked for.",
        }
    }
];
