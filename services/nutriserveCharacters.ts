// services/nutriserveCharacters.ts
import type { Character } from '../components/games/NutriServeTypes';
import * as visuals from '../components/games/nutriserve-ui/CharacterVisuals';

export const CUSTOMER_CHARACTERS: Character[] = [
    {
        id: 'arjun_fit',
        name: 'Arjun',
        visuals: {
            default: visuals.CharacterA,
            happy: visuals.CharacterAHappy,
            sad: visuals.CharacterASad,
        },
        order: {
            description: "I need a high-protein, hearty meal to refuel after my workout. Not too heavy on the carbs, please!",
            plateSize: 'Hearty',
            diabetesMode: 'Low-Carb',
            required_items: ['chana_masala'],
        },
        dialogue: {
            intro: "I'm ready to eat! What've you got?",
            positive: "This looks perfect! Just the fuel I needed. Thanks!",
            neutral: "It's okay, but I was hoping for a bit more protein.",
            negative: "This isn't quite right for my diet. I feel sluggish already.",
        }
    },
    {
        id: 'priya_balanced',
        name: 'Priya',
        visuals: {
            default: visuals.CharacterB,
            happy: visuals.CharacterBHappy,
            sad: visuals.CharacterBSad,
        },
        order: {
            description: "I'm looking for a balanced, regular-sized meal. Something with good fiber to keep me full. I'm watching my blood sugar.",
            plateSize: 'Regular',
            diabetesMode: 'Balanced',
            required_items: ['palak_dal'],
        },
        dialogue: {
            intro: "Hello! I'd like something healthy and balanced, please.",
            positive: "Delicious and I feel great! This is exactly what balanced tastes like.",
            neutral: "It's good, but the balance feels a little off. Maybe too many carbs?",
            negative: "Oh, this is going to spike my sugar. Not what I was hoping for.",
        }
    },
    {
        id: 'rohan_light',
        name: 'Rohan',
        visuals: {
            default: visuals.CharacterC,
            happy: visuals.CharacterCHappy,
            sad: visuals.CharacterCSad,
        },
        order: {
            description: "Just a light lunch for me, please. I'm not too hungry but need to keep my energy up. Low salt would be great.",
            plateSize: 'Light',
            diabetesMode: 'None',
            required_items: ['sambar'],
        },
        dialogue: {
            intro: "Something light and tasty, if you don't mind.",
            positive: "This is the perfect portion! So fresh and light. Thank you!",
            neutral: "It's a little more than I wanted, but tasty.",
            negative: "Whoa, that's way too heavy for me! And it tastes quite salty.",
        }
    },
];
