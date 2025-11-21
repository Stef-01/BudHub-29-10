// components/games/nutriserve-ui/DidYouKnowCard.tsx
import React from 'react';
import { IconInfoCircle } from './Icons';

const facts = [
    "Fiber helps slow down sugar absorption, which is great for stable energy levels.",
    "Protein is essential for muscle repair, especially after exercise.",
    "Brown rice retains the bran and germ, giving it more fiber and nutrients than white rice.",
    "Lentils (Dal) are a fantastic source of both protein and fiber.",
    "The spicy compound in chillies, capsaicin, can have metabolism-boosting effects.",
    "Turmeric, a common spice in Indian cooking, contains curcumin, which has anti-inflammatory properties.",
    "A balanced plate is often described as ½ veggies, ¼ protein, and ¼ complex carbs.",
    "Sodium is an essential mineral, but too much can impact blood pressure. Aim for less than 2300mg per day.",
    "Healthy fats, like those in avocados and nuts, are vital for brain health.",
    "Roti made from whole wheat flour is a great source of complex carbohydrates and fiber.",
    "Eating slowly can help you feel fuller and prevent overeating.",
    "Green vegetables are packed with vitamins and minerals essential for good health.",
    "Whole grains provide sustained energy throughout the day.",
    "Drinking water with meals can aid digestion and help you feel satisfied.",
    "Portion control is just as important as food quality for maintaining a healthy weight.",
];

interface DidYouKnowCardProps {
    roundNumber?: number;
}

const DidYouKnowCard: React.FC<DidYouKnowCardProps> = ({ roundNumber = 1 }) => {
    // Use round number to deterministically select a tip (cycles through all tips)
    const factIndex = (roundNumber - 1) % facts.length;
    const selectedFact = facts[factIndex];

    return (
        <div className="bg-white/80 p-4 rounded-lg shadow-md border border-slate-200">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 pt-0.5">
                    <IconInfoCircle className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                    <h4 className="font-bold text-slate-700">Did You Know?</h4>
                    <p className="text-sm text-slate-600 mt-1">{selectedFact}</p>
                </div>
            </div>
        </div>
    );
};

export default DidYouKnowCard;
