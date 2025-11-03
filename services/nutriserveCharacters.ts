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
    {
        id: 'maya_protein',
        name: 'Maya',
        visuals: {
            default: visuals.CharacterD,
            happy: visuals.CharacterDHappy,
            sad: visuals.CharacterDSad,
        },
        order: {
            description: "I want something really filling with lots of protein! I'm training for a marathon and need the fuel.",
            plateSize: 'Hearty',
            diabetesMode: 'None',
            required_items: ['chicken_curry'],
        },
        dialogue: {
            intro: "Hey! I need a big meal with lots of protein today!",
            positive: "Perfect! This will fuel my training perfectly. Thanks so much!",
            neutral: "It's good, but I was hoping for more protein.",
            negative: "This doesn't have enough protein for my needs. I'm still hungry!",
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
            description: "Doctor's orders - I need to watch my sodium intake. Something light and flavorful but low in salt, please.",
            plateSize: 'Light',
            diabetesMode: 'None',
            required_items: ['sprouts_salad'],
        },
        dialogue: {
            intro: "Hi there! I need something low in sodium today.",
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
            description: "Morning! I'd love a traditional breakfast that's not too heavy. Something with good fiber to start my day right.",
            plateSize: 'Regular',
            diabetesMode: 'Balanced',
            required_items: ['idli_plain'],
        },
        dialogue: {
            intro: "Good morning! I need a healthy breakfast, please.",
            positive: "This is exactly what I needed! Light, healthy, and delicious!",
            neutral: "It's nice, but maybe a bit too much for breakfast.",
            negative: "This is too heavy for a morning meal. I feel sluggish already.",
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
            description: "I'm vegetarian and watching my carbs. Can you make me something nutritious with lots of veggies?",
            plateSize: 'Regular',
            diabetesMode: 'Low-Carb',
            required_items: ['palak_paneer'],
        },
        dialogue: {
            intro: "Hi! I need a veggie-packed, lower-carb meal.",
            positive: "Excellent! So many vegetables and perfect nutrition. Love it!",
            neutral: "Good flavor, but maybe too many carbs for what I wanted.",
            negative: "This has way too many carbs! I specifically asked for low-carb.",
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
            description: "I'm all about that fiber life! Need something with great fiber content to keep me going all day.",
            plateSize: 'Regular',
            diabetesMode: 'Balanced',
            required_items: ['rajma_masala'],
        },
        dialogue: {
            intro: "Hello! I'm looking for a high-fiber meal today.",
            positive: "Wow, this is fiber-rich and delicious! My gut will thank you!",
            neutral: "It's tasty, but could use more fiber.",
            negative: "This doesn't have nearly enough fiber. I'll be hungry in an hour.",
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
            description: "Just finished my workout. Need a hearty meal with good protein and some carbs to recover!",
            plateSize: 'Hearty',
            diabetesMode: 'None',
            required_items: ['brown_rice'],
        },
        dialogue: {
            intro: "Post-workout hunger is real! I need a big meal!",
            positive: "This hits the spot! Perfect recovery meal. Thanks!",
            neutral: "It's alright, but I was hoping for more after that workout.",
            negative: "This isn't enough! I burned way more calories than this covers!",
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
            description: "Missing home! Can you make me something from Kerala cuisine? Preferably something traditional.",
            plateSize: 'Regular',
            diabetesMode: 'None',
            required_items: ['kerala_parippu_curry'],
        },
        dialogue: {
            intro: "I'm craving some authentic Kerala food!",
            positive: "Oh my! This tastes just like home! Thank you so much!",
            neutral: "It's good, but not quite authentic Kerala style.",
            negative: "This doesn't taste like Kerala food at all. I'm disappointed.",
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
            description: "I believe in balance! A regular-sized meal with all the food groups in good proportions, please.",
            plateSize: 'Regular',
            diabetesMode: 'Balanced',
            required_items: ['mixed_veg_curry'],
        },
        dialogue: {
            intro: "I'd like a well-balanced, nutritious meal please.",
            positive: "Perfect balance of everything! This is textbook nutrition!",
            neutral: "Close to balanced, but something feels off in the proportions.",
            negative: "This is way out of balance! Too much of one thing, not enough of others.",
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
            description: "I'm not very hungry today. Just something light and refreshing, please!",
            plateSize: 'Light',
            diabetesMode: 'None',
            required_items: ['raita'],
        },
        dialogue: {
            intro: "Just a light snack for me today, thanks!",
            positive: "This is perfect! Light, refreshing, and just the right amount!",
            neutral: "It's a bit more than I wanted, but still okay.",
            negative: "This is way too much food! I said I wanted something light!",
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
            description: "I'm diabetic and need to be careful with carbs. Something hearty but low-carb would be great!",
            plateSize: 'Hearty',
            diabetesMode: 'Low-Carb',
            required_items: ['masoor_dal'],
        },
        dialogue: {
            intro: "Hi! I'm diabetic, so I need a low-carb meal please.",
            positive: "Excellent! This will keep my blood sugar stable. Thank you!",
            neutral: "It's okay, but a bit more carbs than I'd prefer.",
            negative: "Way too many carbs! This will spike my blood sugar for sure.",
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
            description: "Give me something traditional - rice, dal, and vegetables. Simple, satisfying, and balanced!",
            plateSize: 'Regular',
            diabetesMode: 'Balanced',
            required_items: ['dal_tadka'],
        },
        dialogue: {
            intro: "I'd like a traditional Indian thali, please!",
            positive: "Just like grandmother used to make! Perfect traditional meal!",
            neutral: "Good, but missing that authentic home-cooked feel.",
            negative: "This isn't what I expected at all. Where's the traditional touch?",
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
            description: "I love spicy food! Give me something with a kick - maybe a Kerala curry? Regular portion!",
            plateSize: 'Regular',
            diabetesMode: 'None',
            required_items: ['kadala_curry'],
        },
        dialogue: {
            intro: "I'm in the mood for something spicy!",
            positive: "Yes! This has the perfect amount of heat! Love it!",
            neutral: "Good flavor, but could be spicier.",
            negative: "This is barely spicy at all! I wanted heat!",
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
            description: "I'm on a wellness journey. Need something light, high in fiber, with lots of nutrition!",
            plateSize: 'Light',
            diabetesMode: 'Balanced',
            required_items: ['moringa_leaf_thoran'],
        },
        dialogue: {
            intro: "Looking for something healthy and nutritious!",
            positive: "This is so wholesome! I can feel the nutrition. Thank you!",
            neutral: "Healthy, but maybe missing some key nutrients.",
            negative: "This doesn't feel nutritious at all. Not what I needed.",
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
            description: "I love seafood! Can you make me something with fish? Regular portion with good protein!",
            plateSize: 'Regular',
            diabetesMode: 'None',
            required_items: ['mathi_sardine_curry'],
        },
        dialogue: {
            intro: "I'm craving some good fish today!",
            positive: "The fish is cooked perfectly! This is amazing!",
            neutral: "The fish is okay, but could be better.",
            negative: "The fish doesn't taste fresh. I'm disappointed.",
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
            description: "I'm being very careful with what I eat. Light portion, balanced nutrition, watching carbs and sodium.",
            plateSize: 'Light',
            diabetesMode: 'Balanced',
            required_items: ['beans_carrot_thoran'],
        },
        dialogue: {
            intro: "I need something light and very balanced, please.",
            positive: "This is exactly what I needed! Light and perfectly balanced!",
            neutral: "Almost right, but something's a bit off nutritionally.",
            negative: "This has way too much of something. Not balanced at all!",
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
            description: "I'm starving! Need a huge hearty meal with everything - carbs, protein, the works!",
            plateSize: 'Hearty',
            diabetesMode: 'None',
            required_items: ['veg_biryani'],
        },
        dialogue: {
            intro: "I'm so hungry I could eat a horse!",
            positive: "Finally! This is the feast I needed! Thank you!",
            neutral: "Good, but I'm still a bit hungry.",
            negative: "That's it? I asked for hearty! I'm still starving!",
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
            description: "Early morning, not too hungry yet. Just want a light breakfast to wake me up gently.",
            plateSize: 'Light',
            diabetesMode: 'None',
            required_items: ['dosa_plain'],
        },
        dialogue: {
            intro: "Just need something light to start my day!",
            positive: "Perfect wake-up food! Light and energizing!",
            neutral: "A bit much for early morning, but tasty.",
            negative: "This is way too heavy for breakfast! I feel stuffed!",
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
            description: "Fitness is my lifestyle. High protein, low carb, hearty portion - I need fuel for gains!",
            plateSize: 'Hearty',
            diabetesMode: 'Low-Carb',
            required_items: ['kerala_lamb_curry'],
        },
        dialogue: {
            intro: "I need serious protein for my gains!",
            positive: "Yes! High protein, low carb - perfect for muscle building!",
            neutral: "Decent, but could use more protein.",
            negative: "Where's the protein?! This won't help my gains at all!",
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
            description: "Need some comfort food today. Something warm, satisfying, and balanced. Regular portion!",
            plateSize: 'Regular',
            diabetesMode: 'Balanced',
            required_items: ['moru_curry_pulissery'],
        },
        dialogue: {
            intro: "I need some comfort food today...",
            positive: "Ahh, this is so comforting! Just what I needed!",
            neutral: "It's nice, but not quite the comfort I was hoping for.",
            negative: "This doesn't feel comforting at all. I'm still sad.",
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
            description: "Long day ahead! Need sustained energy - good carbs, some protein, fiber. Regular portion!",
            plateSize: 'Regular',
            diabetesMode: 'Balanced',
            required_items: ['lemon_rice'],
        },
        dialogue: {
            intro: "Need energy for a long day ahead!",
            positive: "Perfect! I can feel the sustained energy already!",
            neutral: "It's okay, but I might need a snack later.",
            negative: "This won't give me enough energy. I'll crash in an hour!",
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
            description: "Keep it simple for me - just dal and rice. Light portion, easy on the stomach.",
            plateSize: 'Light',
            diabetesMode: 'None',
            required_items: ['moong_dal_tadka'],
        },
        dialogue: {
            intro: "Simple dal-rice for me, please!",
            positive: "Simple, clean, delicious! Perfect!",
            neutral: "Good, but maybe too much going on for simple food.",
            negative: "I said simple! This is too complicated!",
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
            description: "Load me up with vegetables! I want a hearty, veggie-packed meal with great nutrition!",
            plateSize: 'Hearty',
            diabetesMode: 'None',
            required_items: ['aloo_gobi'],
        },
        dialogue: {
            intro: "Give me all the vegetables you've got!",
            positive: "So many veggies! This is vegetable heaven!",
            neutral: "Good veggies, but was hoping for more variety.",
            negative: "Where are all the vegetables? I expected more!",
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
            description: "I love trying new things! Something unique and flavorful, regular portion, balanced nutrition!",
            plateSize: 'Regular',
            diabetesMode: 'Balanced',
            required_items: ['banana_flower_thoran'],
        },
        dialogue: {
            intro: "Surprise me with something unique!",
            positive: "Wow, this is so unique and delicious! Love trying new things!",
            neutral: "Interesting, but not as unique as I hoped.",
            negative: "This is too plain! I wanted something exciting!",
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
            description: "In a rush! Something quick, light, but satisfying. Low sodium preferred!",
            plateSize: 'Light',
            diabetesMode: 'None',
            required_items: ['upma'],
        },
        dialogue: {
            intro: "Quick meal, I'm in a hurry!",
            positive: "Perfect for a quick meal! Thanks!",
            neutral: "Okay, but took longer than expected.",
            negative: "This is too heavy for a quick meal! Now I'm really late!",
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
            description: "I love whole grains! Something with red or brown rice, balanced and filling. Regular portion!",
            plateSize: 'Regular',
            diabetesMode: 'Balanced',
            required_items: ['red_rice'],
        },
        dialogue: {
            intro: "I want something with nutritious whole grains!",
            positive: "These whole grains are perfect! So nutritious!",
            neutral: "Good, but I was expecting more whole grain benefits.",
            negative: "Where are the whole grains? This seems refined!",
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
            description: "Light meal but with good protein. I'm not that hungry but want to hit my protein goals!",
            plateSize: 'Light',
            diabetesMode: 'None',
            required_items: ['chana_masala'],
        },
        dialogue: {
            intro: "Light portion but make it protein-rich!",
            positive: "Perfect! Light but packed with protein!",
            neutral: "Decent protein, but portion's a bit much.",
            negative: "This is either too heavy or not enough protein!",
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
            description: "I've been wanting to try jackfruit seeds! Something with that, regular portion, balanced!",
            plateSize: 'Regular',
            diabetesMode: 'Balanced',
            required_items: ['jackfruit_seeds_thoran'],
        },
        dialogue: {
            intro: "I hear jackfruit seeds are nutritious!",
            positive: "The jackfruit seeds are so good! Never had them before!",
            neutral: "Interesting taste, but not sure about it.",
            negative: "The seeds don't taste good at all. Disappointing!",
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
            description: "Big appetite but watching my blood sugar. Hearty portion with balanced carbs, lots of fiber!",
            plateSize: 'Hearty',
            diabetesMode: 'Balanced',
            required_items: ['sambar'],
        },
        dialogue: {
            intro: "I need a big meal that's blood-sugar friendly!",
            positive: "This is hearty AND balanced! Perfect for my needs!",
            neutral: "Filling, but my blood sugar might spike a bit.",
            negative: "This is going to mess with my blood sugar! Too many simple carbs!",
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
            description: "I love yogurt-based dishes! Something cooling and balanced, regular portion!",
            plateSize: 'Regular',
            diabetesMode: 'Balanced',
            required_items: ['okra_pachadi'],
        },
        dialogue: {
            intro: "Craving something cool and yogurt-based!",
            positive: "The yogurt base is perfect! So cooling and delicious!",
            neutral: "Good, but the yogurt flavor could be stronger.",
            negative: "Barely any yogurt flavor! This isn't what I wanted!",
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
            description: "I'm a meat lover! Give me a hearty portion with good meat - Kerala style beef if you have it!",
            plateSize: 'Hearty',
            diabetesMode: 'None',
            required_items: ['kerala_beef_curry'],
        },
        dialogue: {
            intro: "I need a good, hearty meat dish!",
            positive: "The meat is cooked to perfection! This is amazing!",
            neutral: "Good meat, but could be more tender.",
            negative: "The meat is tough and lacking flavor. Not impressed.",
        }
    },
];
