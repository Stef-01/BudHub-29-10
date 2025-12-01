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
            description: "I'm pre-diabetic and need protein! I'll take the Chana Masala - high protein, good for my blood sugar.",
            plateSize: 'Hearty',
            diabetesMode: 'Low-Carb',
            required_items: ['chana_masala'],
        },
        dialogue: {
            intro: "I need something protein-rich for my condition!",
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
            description: "I have Type 2 diabetes. I'd like the Palak Dal please - good fiber and it won't spike my blood sugar!",
            plateSize: 'Regular',
            diabetesMode: 'Balanced',
            required_items: ['palak_dal'],
        },
        dialogue: {
            intro: "Hello! I need a diabetes-friendly dal please.",
            positive: "Delicious and I feel great! This won't spike my sugar at all!",
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
            description: "I'm diabetic and watching my weight. Light portion of Sambar please - low in fat!",
            plateSize: 'Light',
            diabetesMode: 'Balanced',
            required_items: ['sambar'],
        },
        dialogue: {
            intro: "Something light and diabetic-friendly please!",
            positive: "This is the perfect portion! So fresh and light. Thank you!",
            neutral: "It's a little more than I wanted, but tasty.",
            negative: "Whoa, that's way too heavy for me! And it tastes quite salty.",
        }
    },
    {
        id: 'maya_protein',
        name: 'Maya',
        visuals: {
            default: visuals.CharacterD,
            happy: visuals.CharacterDHappy,
            sad: visuals.CharacterDSad,
        },
        order: {
            description: "I'm pre-diabetic and training for a marathon. I need the Chicken Curry - high protein, low carb!",
            plateSize: 'Hearty',
            diabetesMode: 'Low-Carb',
            required_items: ['chicken_curry'],
        },
        dialogue: {
            intro: "Hey! I need a diabetes-friendly protein meal!",
            positive: "Perfect! This will fuel my training without spiking my sugar!",
            neutral: "It's good, but I was hoping for more protein.",
            negative: "This has too many carbs for my condition!",
        }
    },
    {
        id: 'vikram_lowsodium',
        name: 'Vikram',
        visuals: {
            default: visuals.CharacterE,
            happy: visuals.CharacterEHappy,
            sad: visuals.CharacterESad,
        },
        order: {
            description: "I'm diabetic with high blood pressure. Doctor says low sodium! I'll take the Sprouts Salad.",
            plateSize: 'Light',
            diabetesMode: 'Balanced',
            required_items: ['sprouts_salad'],
        },
        dialogue: {
            intro: "Hi! I need diabetic-friendly, low-sodium food.",
            positive: "This is perfect and so flavorful without all the salt! Thank you!",
            neutral: "It's okay, but seems a bit salty for my diet.",
            negative: "Oh no, this is way too salty for me. My doctor won't be happy.",
        }
    },
    {
        id: 'ananya_breakfast',
        name: 'Ananya',
        visuals: {
            default: visuals.CharacterF,
            happy: visuals.CharacterFHappy,
            sad: visuals.CharacterFSad,
        },
        order: {
            description: "Morning! I'm pre-diabetic, need a breakfast with good fiber. Idli please!",
            plateSize: 'Regular',
            diabetesMode: 'Balanced',
            required_items: ['idli_plain'],
        },
        dialogue: {
            intro: "Good morning! I need a diabetes-friendly breakfast.",
            positive: "This is exactly what I needed! Light, healthy, and blood sugar friendly!",
            neutral: "It's nice, but maybe a bit too much for breakfast.",
            negative: "This is too heavy and will spike my sugar!",
        }
    },
    {
        id: 'raj_vegetarian',
        name: 'Raj',
        visuals: {
            default: visuals.CharacterG,
            happy: visuals.CharacterGHappy,
            sad: visuals.CharacterGSad,
        },
        order: {
            description: "I'm diabetic and vegetarian. Low-carb please! Palak Paneer would be perfect.",
            plateSize: 'Regular',
            diabetesMode: 'Low-Carb',
            required_items: ['palak_paneer'],
        },
        dialogue: {
            intro: "Hi! I need veggie-packed, low-carb, diabetic-friendly meal.",
            positive: "Excellent! Perfect nutrition and won't spike my sugar!",
            neutral: "Good flavor, but maybe too many carbs for what I wanted.",
            negative: "This has way too many carbs! My blood sugar will spike!",
        }
    },
    {
        id: 'divya_fiber',
        name: 'Divya',
        visuals: {
            default: visuals.CharacterH,
            happy: visuals.CharacterHHappy,
            sad: visuals.CharacterHSad,
        },
        order: {
            description: "I'm Type 2 diabetic. Doctor says I need more fiber! Rajma Masala is perfect for me.",
            plateSize: 'Regular',
            diabetesMode: 'Balanced',
            required_items: ['rajma_masala'],
        },
        dialogue: {
            intro: "Hello! I need high-fiber, diabetes-friendly meal!",
            positive: "Wow, this is fiber-rich and my blood sugar will stay stable!",
            neutral: "It's tasty, but could use more fiber.",
            negative: "This doesn't have enough fiber and has too many simple carbs!",
        }
    },
    {
        id: 'karan_athletic',
        name: 'Karan',
        visuals: {
            default: visuals.CharacterI,
            happy: visuals.CharacterIHappy,
            sad: visuals.CharacterISad,
        },
        order: {
            description: "Pre-diabetic athlete here! Post-workout - I need Brown Rice, good carbs and won't spike my sugar!",
            plateSize: 'Hearty',
            diabetesMode: 'Low-Carb',
            required_items: ['brown_rice'],
        },
        dialogue: {
            intro: "Post-workout and pre-diabetic - need the right carbs!",
            positive: "This hits the spot! Perfect recovery without spiking blood sugar!",
            neutral: "It's alright, but I was hoping for lower glycemic options.",
            negative: "This will spike my blood sugar! Wrong type of carbs!",
        }
    },
    {
        id: 'meera_kerala',
        name: 'Meera',
        visuals: {
            default: visuals.CharacterJ,
            happy: visuals.CharacterJHappy,
            sad: visuals.CharacterJSad,
        },
        order: {
            description: "I'm diabetic and missing home! Kerala Parippu Curry please - traditional and diabetes-friendly!",
            plateSize: 'Regular',
            diabetesMode: 'Balanced',
            required_items: ['kerala_parippu_curry'],
        },
        dialogue: {
            intro: "I need authentic Kerala food that's diabetic-friendly!",
            positive: "Oh my! This tastes like home AND is good for my blood sugar!",
            neutral: "It's good, but not quite right for my condition.",
            negative: "This will spike my sugar! Not authentic or diabetes-friendly!",
        }
    },
    {
        id: 'aditya_balanced',
        name: 'Aditya',
        visuals: {
            default: visuals.CharacterK,
            happy: visuals.CharacterKHappy,
            sad: visuals.CharacterKSad,
        },
        order: {
            description: "Type 2 diabetic - I need balanced nutrition. Mixed Veg Curry has everything in the right proportions!",
            plateSize: 'Regular',
            diabetesMode: 'Balanced',
            required_items: ['mixed_veg_curry'],
        },
        dialogue: {
            intro: "I need a well-balanced, diabetes-friendly meal!",
            positive: "Perfect balance! Great for my blood sugar control!",
            neutral: "Close to balanced, but something feels off.",
            negative: "This is way out of balance! My sugar will spike!",
        }
    },
    {
        id: 'sneha_light',
        name: 'Sneha',
        visuals: {
            default: visuals.CharacterL,
            happy: visuals.CharacterLHappy,
            sad: visuals.CharacterLSad,
        },
        order: {
            description: "I'm pre-diabetic and not very hungry. Just a light Raita please!",
            plateSize: 'Light',
            diabetesMode: 'Balanced',
            required_items: ['raita'],
        },
        dialogue: {
            intro: "Just a light, diabetes-friendly snack please!",
            positive: "This is perfect! Light and won't affect my blood sugar!",
            neutral: "It's a bit more than I wanted.",
            negative: "This is way too much! And too many carbs!",
        }
    },
    {
        id: 'rahul_diabetic',
        name: 'Rahul',
        visuals: {
            default: visuals.CharacterM,
            happy: visuals.CharacterMHappy,
            sad: visuals.CharacterMSad,
        },
        order: {
            description: "I'm diabetic, need low-carb but filling! Masoor Dal is perfect - protein and fiber!",
            plateSize: 'Hearty',
            diabetesMode: 'Low-Carb',
            required_items: ['masoor_dal'],
        },
        dialogue: {
            intro: "Hi! Diabetic here, need low-carb filling meal!",
            positive: "Excellent! This will keep my blood sugar stable all day!",
            neutral: "It's okay, but a bit more carbs than I'd prefer.",
            negative: "Way too many carbs! This will spike my blood sugar!",
        }
    },
    {
        id: 'lakshmi_traditional',
        name: 'Lakshmi',
        visuals: {
            default: visuals.CharacterN,
            happy: visuals.CharacterNHappy,
            sad: visuals.CharacterNSad,
        },
        order: {
            description: "I'm diabetic. Give me traditional Dal Tadka - simple and blood sugar friendly!",
            plateSize: 'Regular',
            diabetesMode: 'Balanced',
            required_items: ['dal_tadka'],
        },
        dialogue: {
            intro: "I'd like traditional, diabetes-friendly dal!",
            positive: "Just like grandmother used to make! And good for my sugar!",
            neutral: "Good, but not quite right for my condition.",
            negative: "This isn't diabetes-friendly at all!",
        }
    },
    {
        id: 'aryan_spicy',
        name: 'Aryan',
        visuals: {
            default: visuals.CharacterO,
            happy: visuals.CharacterOHappy,
            sad: visuals.CharacterOSad,
        },
        order: {
            description: "Pre-diabetic but I love spicy! Kadala Curry - spicy and low glycemic index!",
            plateSize: 'Regular',
            diabetesMode: 'Low-Carb',
            required_items: ['kadala_curry'],
        },
        dialogue: {
            intro: "I need spicy food that's diabetes-friendly!",
            positive: "Yes! Perfect heat and won't spike my sugar!",
            neutral: "Good flavor, but could be spicier and lower carb.",
            negative: "Not spicy enough and too many carbs!",
        }
    },
    {
        id: 'pooja_wellness',
        name: 'Pooja',
        visuals: {
            default: visuals.CharacterP,
            happy: visuals.CharacterPHappy,
            sad: visuals.CharacterPSad,
        },
        order: {
            description: "I'm pre-diabetic on wellness journey. Moringa Leaf Thoran - super nutritious and low carb!",
            plateSize: 'Light',
            diabetesMode: 'Balanced',
            required_items: ['moringa_leaf_thoran'],
        },
        dialogue: {
            intro: "Looking for diabetes-friendly superfood!",
            positive: "This is so wholesome! Perfect for my blood sugar!",
            neutral: "Healthy, but maybe not ideal for diabetes.",
            negative: "This doesn't feel diabetes-friendly at all!",
        }
    },
    {
        id: 'sanjay_seafood',
        name: 'Sanjay',
        visuals: {
            default: visuals.CharacterQ,
            happy: visuals.CharacterQHappy,
            sad: visuals.CharacterQSad,
        },
        order: {
            description: "I'm diabetic and love seafood! Mathi Sardine Curry - high protein, omega-3s, low carb!",
            plateSize: 'Regular',
            diabetesMode: 'Low-Carb',
            required_items: ['mathi_sardine_curry'],
        },
        dialogue: {
            intro: "I'm craving diabetes-friendly fish!",
            positive: "The fish is perfect! Great for my blood sugar!",
            neutral: "The fish is okay, but too many carbs in the sauce.",
            negative: "Too many carbs! This will spike my sugar!",
        }
    },
    {
        id: 'kavya_careful',
        name: 'Kavya',
        visuals: {
            default: visuals.CharacterR,
            happy: visuals.CharacterRHappy,
            sad: visuals.CharacterRSad,
        },
        order: {
            description: "I'm diabetic being very careful. Light Beans & Carrot Thoran - low carb, high fiber!",
            plateSize: 'Light',
            diabetesMode: 'Balanced',
            required_items: ['beans_carrot_thoran'],
        },
        dialogue: {
            intro: "I need light, balanced, diabetes-safe food.",
            positive: "This is exactly what I needed! Perfect for my condition!",
            neutral: "Almost right, but something's a bit off.",
            negative: "This has way too much! Not safe for diabetics!",
        }
    },
    {
        id: 'nikhil_hungry',
        name: 'Nikhil',
        visuals: {
            default: visuals.CharacterS,
            happy: visuals.CharacterSHappy,
            sad: visuals.CharacterSSad,
        },
        order: {
            description: "I'm pre-diabetic and starving! Veg Biryani - hearty but need balanced version!",
            plateSize: 'Hearty',
            diabetesMode: 'Balanced',
            required_items: ['veg_biryani'],
        },
        dialogue: {
            intro: "I'm so hungry but need diabetes-friendly!",
            positive: "Finally! This is hearty AND blood sugar friendly!",
            neutral: "Good, but might spike my sugar a bit.",
            negative: "This will spike my blood sugar way too much!",
        }
    },
    {
        id: 'riya_breakfast_light',
        name: 'Riya',
        visuals: {
            default: visuals.CharacterT,
            happy: visuals.CharacterTHappy,
            sad: visuals.CharacterTSad,
        },
        order: {
            description: "Early morning, I'm diabetic. Light Plain Dosa - slow-release carbs!",
            plateSize: 'Light',
            diabetesMode: 'Balanced',
            required_items: ['dosa_plain'],
        },
        dialogue: {
            intro: "Light diabetes-friendly breakfast please!",
            positive: "Perfect wake-up food! Won't spike my sugar!",
            neutral: "A bit much for early morning and my condition.",
            negative: "This is too heavy and will spike my blood sugar!",
        }
    },
    {
        id: 'amit_fitness',
        name: 'Amit',
        visuals: {
            default: visuals.CharacterU,
            happy: visuals.CharacterUHappy,
            sad: visuals.CharacterUSad,
        },
        order: {
            description: "Pre-diabetic bodybuilder! Kerala Lamb Curry - high protein, low carb for gains!",
            plateSize: 'Hearty',
            diabetesMode: 'Low-Carb',
            required_items: ['kerala_lamb_curry'],
        },
        dialogue: {
            intro: "I need diabetes-safe protein for gains!",
            positive: "Yes! High protein, low carb - perfect for my condition!",
            neutral: "Decent, but could use more protein or fewer carbs.",
            negative: "Where's the protein?! And too many carbs for a diabetic!",
        }
    },
    {
        id: 'nisha_comfort',
        name: 'Nisha',
        visuals: {
            default: visuals.CharacterV,
            happy: visuals.CharacterVHappy,
            sad: visuals.CharacterVSad,
        },
        order: {
            description: "I'm diabetic and need comfort food. Moru Curry - traditional and blood sugar friendly!",
            plateSize: 'Regular',
            diabetesMode: 'Balanced',
            required_items: ['moru_curry_pulissery'],
        },
        dialogue: {
            intro: "I need diabetes-safe comfort food...",
            positive: "Ahh, this is comforting AND good for my blood sugar!",
            neutral: "It's nice, but not ideal for my condition.",
            negative: "This will spike my sugar! Not comforting at all!",
        }
    },
    {
        id: 'vivek_energy',
        name: 'Vivek',
        visuals: {
            default: visuals.CharacterW,
            happy: visuals.CharacterWHappy,
            sad: visuals.CharacterWSad,
        },
        order: {
            description: "Pre-diabetic with long day ahead! Lemon Rice - sustained energy without sugar spike!",
            plateSize: 'Regular',
            diabetesMode: 'Balanced',
            required_items: ['lemon_rice'],
        },
        dialogue: {
            intro: "Need diabetes-safe sustained energy!",
            positive: "Perfect! Sustained energy without spiking sugar!",
            neutral: "It's okay, but might need to check my sugar later.",
            negative: "This will give me a sugar crash, not sustained energy!",
        }
    },
    {
        id: 'tara_simple',
        name: 'Tara',
        visuals: {
            default: visuals.CharacterX,
            happy: visuals.CharacterXHappy,
            sad: visuals.CharacterXSad,
        },
        order: {
            description: "I'm diabetic, keep it simple! Moong Dal Tadka - easy on stomach and blood sugar!",
            plateSize: 'Light',
            diabetesMode: 'Balanced',
            required_items: ['moong_dal_tadka'],
        },
        dialogue: {
            intro: "Simple, diabetes-safe dal please!",
            positive: "Simple, clean, and perfect for my blood sugar!",
            neutral: "Good, but maybe too complex for my condition.",
            negative: "I said simple and diabetes-safe! This isn't!",
        }
    },
    {
        id: 'rohit_veggie',
        name: 'Rohit',
        visuals: {
            default: visuals.CharacterY,
            happy: visuals.CharacterYHappy,
            sad: visuals.CharacterYSad,
        },
        order: {
            description: "I'm diabetic vegetable lover! Aloo Gobi - load of veggies, balanced carbs!",
            plateSize: 'Hearty',
            diabetesMode: 'Balanced',
            required_items: ['aloo_gobi'],
        },
        dialogue: {
            intro: "Give me diabetes-friendly vegetables!",
            positive: "So many veggies! Great for my blood sugar!",
            neutral: "Good veggies, but maybe too many potatoes.",
            negative: "Where are the low-carb vegetables? This will spike my sugar!",
        }
    },
    {
        id: 'ishita_variety',
        name: 'Ishita',
        visuals: {
            default: visuals.CharacterZ,
            happy: visuals.CharacterZHappy,
            sad: visuals.CharacterZSad,
        },
        order: {
            description: "I'm pre-diabetic trying new things! Banana Flower Thoran - unique and low glycemic!",
            plateSize: 'Regular',
            diabetesMode: 'Balanced',
            required_items: ['banana_flower_thoran'],
        },
        dialogue: {
            intro: "Surprise me with something diabetes-friendly and unique!",
            positive: "Wow, unique and perfect for my blood sugar!",
            neutral: "Interesting, but not sure if it's right for diabetics.",
            negative: "This is boring and not diabetes-safe!",
        }
    },
    {
        id: 'gaurav_quick',
        name: 'Gaurav',
        visuals: {
            default: visuals.CharacterAA,
            happy: visuals.CharacterAAHappy,
            sad: visuals.CharacterAASad,
        },
        order: {
            description: "Diabetic in a rush! Quick Upma - fast, filling, low glycemic index!",
            plateSize: 'Light',
            diabetesMode: 'Balanced',
            required_items: ['upma'],
        },
        dialogue: {
            intro: "Quick diabetes-safe meal!",
            positive: "Perfect for quick meal! Won't spike my sugar!",
            neutral: "Okay, but worried about my blood sugar.",
            negative: "This is too heavy and not diabetes-safe!",
        }
    },
    {
        id: 'shreya_grain',
        name: 'Shreya',
        visuals: {
            default: visuals.CharacterAB,
            happy: visuals.CharacterABHappy,
            sad: visuals.CharacterABSad,
        },
        order: {
            description: "I'm diabetic and love whole grains! Red Rice - low GI, perfect for blood sugar!",
            plateSize: 'Regular',
            diabetesMode: 'Balanced',
            required_items: ['red_rice'],
        },
        dialogue: {
            intro: "I need diabetes-safe whole grains!",
            positive: "These whole grains are perfect for my blood sugar!",
            neutral: "Good, but not sure about the glycemic impact.",
            negative: "These aren't whole grains! This will spike my sugar!",
        }
    },
    {
        id: 'manish_protein_light',
        name: 'Manish',
        visuals: {
            default: visuals.CharacterAC,
            happy: visuals.CharacterACHappy,
            sad: visuals.CharacterACSad,
        },
        order: {
            description: "Pre-diabetic, light but protein-rich! Chana Masala - perfect protein without carb overload!",
            plateSize: 'Light',
            diabetesMode: 'Low-Carb',
            required_items: ['chana_masala'],
        },
        dialogue: {
            intro: "Light, protein-rich, diabetes-safe please!",
            positive: "Perfect! Light, protein-packed, and blood sugar friendly!",
            neutral: "Decent protein, but portion or carbs are off.",
            negative: "Too heavy or too many carbs for a diabetic!",
        }
    },
    {
        id: 'priyanka_seeds',
        name: 'Priyanka',
        visuals: {
            default: visuals.CharacterAD,
            happy: visuals.CharacterADHappy,
            sad: visuals.CharacterADSad,
        },
        order: {
            description: "I'm diabetic, want to try Jackfruit Seeds Thoran - heard it's diabetes-friendly!",
            plateSize: 'Regular',
            diabetesMode: 'Balanced',
            required_items: ['jackfruit_seeds_thoran'],
        },
        dialogue: {
            intro: "I heard jackfruit seeds are good for diabetics!",
            positive: "The jackfruit seeds are perfect for my blood sugar!",
            neutral: "Interesting, but not sure about my sugar levels.",
            negative: "This doesn't taste good and will spike my sugar!",
        }
    },
    {
        id: 'deepak_hearty_bal',
        name: 'Deepak',
        visuals: {
            default: visuals.CharacterAE,
            happy: visuals.CharacterAEHappy,
            sad: visuals.CharacterAESad,
        },
        order: {
            description: "I'm diabetic with big appetite! Sambar - hearty, balanced, blood sugar friendly!",
            plateSize: 'Hearty',
            diabetesMode: 'Balanced',
            required_items: ['sambar'],
        },
        dialogue: {
            intro: "I need hearty diabetes-friendly meal!",
            positive: "This is hearty AND my blood sugar will stay stable!",
            neutral: "Filling, but might spike my sugar a bit.",
            negative: "This will mess with my blood sugar! Too many simple carbs!",
        }
    },
    {
        id: 'zara_yogurt',
        name: 'Zara',
        visuals: {
            default: visuals.CharacterAF,
            happy: visuals.CharacterAFHappy,
            sad: visuals.CharacterAFSad,
        },
        order: {
            description: "I'm pre-diabetic, love yogurt! Okra Pachadi - probiotics and blood sugar control!",
            plateSize: 'Regular',
            diabetesMode: 'Balanced',
            required_items: ['okra_pachadi'],
        },
        dialogue: {
            intro: "Craving diabetes-safe yogurt dish!",
            positive: "The yogurt is perfect! Great for my gut and blood sugar!",
            neutral: "Good, but not sure if it's optimal for diabetics.",
            negative: "Barely any yogurt and will spike my sugar!",
        }
    },
    {
        id: 'yash_meatlover',
        name: 'Yash',
        visuals: {
            default: visuals.CharacterAG,
            happy: visuals.CharacterAGHappy,
            sad: visuals.CharacterAGSad,
        },
        order: {
            description: "I'm diabetic meat lover! Kerala Beef Curry - high protein, low carb, blood sugar safe!",
            plateSize: 'Hearty',
            diabetesMode: 'Low-Carb',
            required_items: ['kerala_beef_curry'],
        },
        dialogue: {
            intro: "I need diabetes-safe hearty meat!",
            positive: "The meat is perfect! High protein, won't spike my sugar!",
            neutral: "Good meat, but worried about the carbs in sauce.",
            negative: "Too many carbs! This will spike my blood sugar!",
        }
    },
    {
        id: 'sara_wholegrains',
        name: 'Sara',
        visuals: {
            default: visuals.CharacterAH,
            happy: visuals.CharacterAHHappy,
            sad: visuals.CharacterAHSad,
        },
        order: {
            description: "I'm pre-diabetic, love whole grains! Millet Rice - ancient grains, low GI!",
            plateSize: 'Regular',
            diabetesMode: 'Balanced',
            required_items: ['brown_rice'],
        },
        dialogue: {
            intro: "Looking for diabetes-friendly whole grains!",
            positive: "These whole grains are amazing for my blood sugar!",
            neutral: "Good, but not sure about the glycemic load.",
            negative: "This doesn't feel like whole grains to me!",
        }
    },
    {
        id: 'omar_protein',
        name: 'Omar',
        visuals: {
            default: visuals.CharacterAI,
            happy: visuals.CharacterAIHappy,
            sad: visuals.CharacterAISad,
        },
        order: {
            description: "Diabetic athlete! Toor Dal - protein-packed, slow-release energy!",
            plateSize: 'Hearty',
            diabetesMode: 'Low-Carb',
            required_items: ['dal_tadka'],
        },
        dialogue: {
            intro: "Need diabetes-safe protein for my workout!",
            positive: "Perfect protein! This won't spike my sugar during training!",
            neutral: "Decent, but could use more protein.",
            negative: "Not enough protein and too many carbs!",
        }
    },
    {
        id: 'fatima_light',
        name: 'Fatima',
        visuals: {
            default: visuals.CharacterAJ,
            happy: visuals.CharacterAJHappy,
            sad: visuals.CharacterAJSad,
        },
        order: {
            description: "I'm diabetic, watching portions. Light Cucumber Raita - cooling and blood sugar friendly!",
            plateSize: 'Light',
            diabetesMode: 'Balanced',
            required_items: ['raita'],
        },
        dialogue: {
            intro: "Just a light diabetes-safe snack please!",
            positive: "This is perfect! Light and won't affect my sugar!",
            neutral: "A bit more than I wanted.",
            negative: "This is too heavy for what I need!",
        }
    },
    {
        id: 'chen_veggie',
        name: 'Chen',
        visuals: {
            default: visuals.CharacterAK,
            happy: visuals.CharacterAKHappy,
            sad: visuals.CharacterAKSad,
        },
        order: {
            description: "Pre-diabetic vegetable enthusiast! Bhindi Masala - fiber-rich, low carb!",
            plateSize: 'Regular',
            diabetesMode: 'Balanced',
            required_items: ['bhindi_masala'],
        },
        dialogue: {
            intro: "I need diabetes-friendly vegetables!",
            positive: "So many veggies! Perfect for my blood sugar!",
            neutral: "Good vegetables, but portion seems off.",
            negative: "Where are the low-carb vegetables?!",
        }
    },
    {
        id: 'elena_breakfast',
        name: 'Elena',
        visuals: {
            default: visuals.CharacterAL,
            happy: visuals.CharacterALHappy,
            sad: visuals.CharacterALSad,
        },
        order: {
            description: "Morning! I'm diabetic. Poha - light breakfast, won't spike sugar!",
            plateSize: 'Light',
            diabetesMode: 'Balanced',
            required_items: ['poha'],
        },
        dialogue: {
            intro: "Need a diabetes-safe light breakfast!",
            positive: "Perfect morning meal! Light and blood sugar friendly!",
            neutral: "A bit heavy for early morning.",
            negative: "This will spike my sugar too early!",
        }
    },
    {
        id: 'hassan_hearty',
        name: 'Hassan',
        visuals: {
            default: visuals.CharacterAM,
            happy: visuals.CharacterAMHappy,
            sad: visuals.CharacterAMSad,
        },
        order: {
            description: "I'm diabetic with big appetite! Hearty Roti - whole wheat, fiber-rich!",
            plateSize: 'Hearty',
            diabetesMode: 'Balanced',
            required_items: ['roti'],
        },
        dialogue: {
            intro: "I need hearty diabetes-friendly bread!",
            positive: "This whole wheat is perfect! Filling and blood sugar safe!",
            neutral: "Good, but might spike my sugar a bit.",
            negative: "Too refined! This will spike my blood sugar!",
        }
    },
    {
        id: 'ling_traditional',
        name: 'Ling',
        visuals: {
            default: visuals.CharacterAN,
            happy: visuals.CharacterANHappy,
            sad: visuals.CharacterANSad,
        },
        order: {
            description: "Diabetic craving comfort food. Sambar - traditional and blood sugar friendly!",
            plateSize: 'Regular',
            diabetesMode: 'Balanced',
            required_items: ['sambar'],
        },
        dialogue: {
            intro: "I need traditional diabetes-safe comfort food!",
            positive: "This tastes like home AND is good for my sugar!",
            neutral: "Traditional, but not sure about my blood sugar.",
            negative: "This doesn't feel diabetes-friendly!",
        }
    },
    {
        id: 'marcus_lowcarb',
        name: 'Marcus',
        visuals: {
            default: visuals.CharacterAO,
            happy: visuals.CharacterAOHappy,
            sad: visuals.CharacterAOSad,
        },
        order: {
            description: "Pre-diabetic on keto! Palak Paneer - high fat, low carb, perfect!",
            plateSize: 'Regular',
            diabetesMode: 'Low-Carb',
            required_items: ['palak_paneer'],
        },
        dialogue: {
            intro: "I need strict low-carb diabetes-safe food!",
            positive: "Perfect macros! Low carb and won't spike my sugar!",
            neutral: "Good, but worried about hidden carbs.",
            negative: "Too many carbs! This isn't keto-friendly!",
        }
    },
    {
        id: 'sofia_fiber',
        name: 'Sofia',
        visuals: {
            default: visuals.CharacterAP,
            happy: visuals.CharacterAPHappy,
            sad: visuals.CharacterAPSad,
        },
        order: {
            description: "I'm diabetic, doctor says more fiber! Sprouts Salad - fiber bomb!",
            plateSize: 'Regular',
            diabetesMode: 'Balanced',
            required_items: ['sprouts_salad'],
        },
        dialogue: {
            intro: "I need high-fiber diabetes-friendly food!",
            positive: "So much fiber! Perfect for my blood sugar control!",
            neutral: "Good, but could use more fiber.",
            negative: "Not enough fiber for my needs!",
        }
    },
    {
        id: 'ahmed_spice',
        name: 'Ahmed',
        visuals: {
            default: visuals.CharacterAQ,
            happy: visuals.CharacterAQHappy,
            sad: visuals.CharacterAQSad,
        },
        order: {
            description: "Diabetic who loves spice! Baingan Bharta - spicy and low carb!",
            plateSize: 'Regular',
            diabetesMode: 'Balanced',
            required_items: ['baingan_bharta'],
        },
        dialogue: {
            intro: "Give me spicy diabetes-friendly food!",
            positive: "Perfect spice level and blood sugar friendly!",
            neutral: "Good flavor, but portion seems off.",
            negative: "Not spicy enough and too many carbs!",
        }
    },
    {
        id: 'nina_simple',
        name: 'Nina',
        visuals: {
            default: visuals.CharacterAR,
            happy: visuals.CharacterARHappy,
            sad: visuals.CharacterARSad,
        },
        order: {
            description: "I'm diabetic, keep it simple! Plain Idli - steamed, no oil, low GI!",
            plateSize: 'Light',
            diabetesMode: 'Balanced',
            required_items: ['idli_plain'],
        },
        dialogue: {
            intro: "Simple diabetes-safe food please!",
            positive: "Simple and perfect for my blood sugar!",
            neutral: "Good, but maybe too simple.",
            negative: "I said simple AND diabetes-safe!",
        }
    },
    {
        id: 'raj_protein_rich',
        name: 'Rajesh',
        visuals: {
            default: visuals.CharacterAS,
            happy: visuals.CharacterASHappy,
            sad: visuals.CharacterASSad,
        },
        order: {
            description: "Pre-diabetic bodybuilder! Chicken Curry - lean protein, muscle fuel!",
            plateSize: 'Hearty',
            diabetesMode: 'Low-Carb',
            required_items: ['chicken_curry'],
        },
        dialogue: {
            intro: "Need diabetes-safe lean protein!",
            positive: "Lean protein perfection! Won't spike my sugar!",
            neutral: "Good protein, but sauce has carbs.",
            negative: "Where's the protein?! Too many carbs!",
        }
    },
    {
        id: 'yuki_balanced',
        name: 'Yuki',
        visuals: {
            default: visuals.CharacterAT,
            happy: visuals.CharacterATHappy,
            sad: visuals.CharacterATSad,
        },
        order: {
            description: "Diabetic seeking balance. Mixed Veg Curry - variety of nutrients!",
            plateSize: 'Regular',
            diabetesMode: 'Balanced',
            required_items: ['mixed_veg_curry'],
        },
        dialogue: {
            intro: "I need balanced diabetes-friendly meal!",
            positive: "Perfect balance! Great for my blood sugar!",
            neutral: "Close to balanced, but something's off.",
            negative: "This is way out of balance!",
        }
    },
    {
        id: 'diego_energy',
        name: 'Diego',
        visuals: {
            default: visuals.CharacterAU,
            happy: visuals.CharacterAUHappy,
            sad: visuals.CharacterAUSad,
        },
        order: {
            description: "Pre-diabetic with long shift! Brown Rice - sustained energy, low GI!",
            plateSize: 'Hearty',
            diabetesMode: 'Balanced',
            required_items: ['brown_rice'],
        },
        dialogue: {
            intro: "Need diabetes-safe sustained energy!",
            positive: "Perfect! This will keep me going without sugar spikes!",
            neutral: "Good, but worried about energy crash.",
            negative: "This will crash my energy AND spike my sugar!",
        }
    },
    {
        id: 'amara_traditional',
        name: 'Amara',
        visuals: {
            default: visuals.CharacterAV,
            happy: visuals.CharacterAVHappy,
            sad: visuals.CharacterAVSad,
        },
        order: {
            description: "I'm diabetic missing home. Dal Tadka - simple, traditional, blood sugar safe!",
            plateSize: 'Regular',
            diabetesMode: 'Balanced',
            required_items: ['dal_tadka'],
        },
        dialogue: {
            intro: "I need traditional diabetes-safe dal!",
            positive: "Tastes like home and good for my sugar!",
            neutral: "Traditional, but not quite right.",
            negative: "This isn't traditional OR diabetes-safe!",
        }
    },
    {
        id: 'kai_veggie_lover',
        name: 'Kai',
        visuals: {
            default: visuals.CharacterAW,
            happy: visuals.CharacterAWHappy,
            sad: visuals.CharacterAWSad,
        },
        order: {
            description: "Pre-diabetic vegetable fanatic! Aloo Gobi - veggies galore!",
            plateSize: 'Hearty',
            diabetesMode: 'Balanced',
            required_items: ['aloo_gobi'],
        },
        dialogue: {
            intro: "Load me up with diabetes-safe vegetables!",
            positive: "So many vegetables! Perfect for my blood sugar!",
            neutral: "Good veggies, but too many potatoes.",
            negative: "Where are the low-carb vegetables?!",
        }
    },
    {
        id: 'zara_light_protein',
        name: 'Zara',
        visuals: {
            default: visuals.CharacterAX,
            happy: visuals.CharacterAXHappy,
            sad: visuals.CharacterAXSad,
        },
        order: {
            description: "Diabetic, light but protein-rich! Masoor Dal - light lentils, high protein!",
            plateSize: 'Light',
            diabetesMode: 'Low-Carb',
            required_items: ['masoor_dal'],
        },
        dialogue: {
            intro: "Light, protein-rich, diabetes-safe please!",
            positive: "Light yet protein-packed! Perfect for my sugar!",
            neutral: "Decent, but portion or protein is off.",
            negative: "Too heavy OR not enough protein!",
        }
    },
    {
        id: 'lucas_wholesome',
        name: 'Lucas',
        visuals: {
            default: visuals.CharacterAY,
            happy: visuals.CharacterAYHappy,
            sad: visuals.CharacterAYSad,
        },
        order: {
            description: "I'm pre-diabetic wellness focused. Moong Dal Tadka - wholesome and blood sugar friendly!",
            plateSize: 'Regular',
            diabetesMode: 'Balanced',
            required_items: ['moong_dal_tadka'],
        },
        dialogue: {
            intro: "Looking for wholesome diabetes-safe food!",
            positive: "So wholesome! Perfect for my blood sugar!",
            neutral: "Healthy, but not sure about my sugar.",
            negative: "This doesn't feel wholesome OR diabetes-safe!",
        }
    },
    {
        id: 'maya_curious',
        name: 'Maya',
        visuals: {
            default: visuals.CharacterAZ,
            happy: visuals.CharacterAZHappy,
            sad: visuals.CharacterAZSad,
        },
        order: {
            description: "Diabetic trying new things! Rajma Masala - kidney beans, unique and blood sugar safe!",
            plateSize: 'Regular',
            diabetesMode: 'Balanced',
            required_items: ['rajma_masala'],
        },
        dialogue: {
            intro: "Surprise me with diabetes-friendly food!",
            positive: "Unique and perfect for my blood sugar!",
            neutral: "Interesting, but not sure about my sugar.",
            negative: "This is boring AND not diabetes-safe!",
        }
    },
    {
        id: 'ibrahim_hearty_protein',
        name: 'Ibrahim',
        visuals: {
            default: visuals.CharacterBA,
            happy: visuals.CharacterBAHappy,
            sad: visuals.CharacterBASad,
        },
        order: {
            description: "I'm diabetic with big appetite! Chana Masala - hearty protein, blood sugar safe!",
            plateSize: 'Hearty',
            diabetesMode: 'Low-Carb',
            required_items: ['chana_masala'],
        },
        dialogue: {
            intro: "I need hearty diabetes-safe protein!",
            positive: "Hearty AND my blood sugar will stay stable!",
            neutral: "Filling, but might spike my sugar.",
            negative: "This will mess with my blood sugar!",
        }
    },
];
