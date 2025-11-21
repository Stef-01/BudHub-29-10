// components/GamesView.tsx

import React, { useMemo } from 'react';
import type { GameMode } from '../types';
import { useGameScores } from '../contexts/GameScoresContext';
import GameCard from './GameCard';
import { HeartIcon, ZapIcon, BookOpenIcon } from './icons/Icons';

// A helper to create placeholder SVG icons
const createIcon = (path: string) => (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d={path} />
    </svg>
);
const NutrientIcon = createIcon("M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z");
const CompassIcon = createIcon("M12 10.9c-.61 0-1.1.49-1.1 1.1s.49 1.1 1.1 1.1c.61 0 1.1-.49 1.1-1.1s-.49-1.1-1.1-1.1zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.19 12.19L6 18l3.81-8.19L18 6l-3.81 8.19z");

interface GamesViewProps {
    onPlay: (gameMode: GameMode) => void;
}

const GamesView: React.FC<GamesViewProps> = ({ onPlay }) => {
    const { getHighScoresByMode } = useGameScores();

    const highScores = useMemo(() => {
        // Get the highest score from any of the unified nutrient games
        const unifiedScores = [
            getHighScoresByMode('diabetic_friendly')[0]?.score || 0,
            getHighScoresByMode('high_protein')[0]?.score || 0,
            getHighScoresByMode('high_fiber')[0]?.score || 0,
            getHighScoresByMode('low_carb')[0]?.score || 0,
        ];

        return {
            nutriserve: getHighScoresByMode('nutriserve')[0]?.score || 0,
            unified_nutrient: Math.max(...unifiedScores),
        };
    }, [getHighScoresByMode]);
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-green-900">Game Center</h2>
            </div>

            <div className="mb-8">
                 <GameCard
                    gameMode="nutriserve"
                    title="NutriServe Chef"
                    description="Assemble balanced meals for customers with specific dietary needs in this planner-style challenge."
                    icon={<BookOpenIcon className="h-8 w-8 text-emerald-700" />}
                    highScore={highScores.nutriserve}
                    onPlay={onPlay}
                />
            </div>

            <div className="mb-8">
                <GameCard
                    gameMode="cookventure"
                    title="🍛 Cookventure India"
                    description="Discover authentic Indian recipes matched to your region, pantry, and taste! Explore 6 regional cuisines with our 4-axis flavor system (Teekha, Masaledar, Khata, Meetha) and find your perfect recipe match."
                    icon={<CompassIcon className="h-8 w-8 text-orange-600" />}
                    highScore={0}
                    onPlay={onPlay}
                />
            </div>

            <h3 className="text-xl font-bold text-green-800 mb-4">Quick Play</h3>
            <div className="mb-8">
                <GameCard
                    gameMode="unified_nutrient"
                    title="Nutrient Challenge"
                    description="Test your knowledge! Choose your focus (protein, fiber, carbs, or blood sugar) and identify the best recipe. Recipe images from your cookbook help you pick wisely!"
                    icon={<NutrientIcon className="h-8 w-8 text-indigo-700" />}
                    highScore={highScores.unified_nutrient}
                    onPlay={onPlay}
                />
            </div>
        </div>
    );
};

export default GamesView;