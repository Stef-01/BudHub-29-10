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
const FiberIcon = createIcon("M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z");
const CarbIcon = createIcon("M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 12H9v-2h2v2zm4 0h-2v-2h2v2zm-4-4H9V9h2v4zm4-4h-2V9h2v2z");

interface GamesViewProps {
    onPlay: (gameMode: GameMode) => void;
}

const GamesView: React.FC<GamesViewProps> = ({ onPlay }) => {
    const { getHighScoresByMode } = useGameScores();

    const highScores = useMemo(() => ({
        diabetic_friendly: getHighScoresByMode('diabetic_friendly')[0]?.score || 0,
        high_protein: getHighScoresByMode('high_protein')[0]?.score || 0,
        high_fiber: getHighScoresByMode('high_fiber')[0]?.score || 0,
        low_carb: getHighScoresByMode('low_carb')[0]?.score || 0,
        nutriserve: getHighScoresByMode('nutriserve')[0]?.score || 0,
    }), [getHighScoresByMode]);
    
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
            
            <h3 className="text-xl font-bold text-green-800 mb-4">Quick Play</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GameCard
                    gameMode="diabetic_friendly"
                    title="Sugar Smart"
                    description="Which of these recipes is best for managing blood sugar levels?"
                    icon={<HeartIcon className="h-8 w-8 text-blue-700" />}
                    highScore={highScores.diabetic_friendly}
                    onPlay={onPlay}
                />
                <GameCard
                    gameMode="high_protein"
                    title="Protein Packed"
                    description="Identify the recipe with the highest protein content to build muscle."
                    icon={<ZapIcon className="h-8 w-8 text-yellow-700" />}
                    highScore={highScores.high_protein}
                    onPlay={onPlay}
                />
                <GameCard
                    gameMode="high_fiber"
                    title="Fiber Finder"
                    description="Find the meal that's best for gut health and feeling full."
                    icon={<FiberIcon className="h-8 w-8 text-green-700" />}
                    highScore={highScores.high_fiber}
                    onPlay={onPlay}
                />
                <GameCard
                    gameMode="low_carb"
                    title="Carb Counter"
                    description="Pick the recipe with the lowest carbohydrate count."
                    icon={<CarbIcon className="h-8 w-8 text-purple-700" />}
                    highScore={highScores.low_carb}
                    onPlay={onPlay}
                />
            </div>
        </div>
    );
};

export default GamesView;