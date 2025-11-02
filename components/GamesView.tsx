// components/GamesView.tsx

import React, { useState } from 'react';
import type { GameMode } from '../types';
import { useGameScores } from '../contexts/GameScoresContext';
import GameCard from './GameCard';
import GameScreen from './GameScreen';
// FIX: The import error is resolved because NutriServeGame.tsx is now a valid module.
import NutriServeGame from './games/NutriServeGame'; // Import the new game
import { HeartIcon, ZapIcon } from './icons/Icons';

const gameModes: {
    mode: GameMode,
    title: string,
    description: string,
    icon: React.ReactNode,
}[] = [
    {
        mode: 'diabetic_friendly',
        title: 'Sugar Smart',
        description: 'Identify the recipes that are friendly for a diabetic diet.',
        icon: <HeartIcon className="h-6 w-6 text-blue-600" />
    },
    {
        mode: 'high_protein',
        title: 'Protein Packed',
        description: 'Find the recipes that are high in protein to fuel your day.',
        icon: <ZapIcon className="h-6 w-6 text-yellow-600" />
    },
    {
        mode: 'high_fiber',
        title: 'Fiber Finder',
        description: 'Spot the high-fiber meals for a healthy gut.',
        icon: <ZapIcon className="h-6 w-6 text-orange-600" />
    },
    {
        mode: 'low_carb',
        title: 'Carb Counter',
        description: 'Pick out the low-carb options for your diet.',
        icon: <ZapIcon className="h-6 w-6 text-purple-600" />
    }
];

const GamesView: React.FC = () => {
    const { getHighScoresByMode } = useGameScores();
    const [activeGame, setActiveGame] = useState<GameMode | null>(null);
    const [playingNutriServe, setPlayingNutriServe] = useState(false); // State for the new game

    const getHighScore = (mode: GameMode) => {
        const scores = getHighScoresByMode(mode);
        return scores.length > 0 ? scores[0].score : 0;
    };

    if (activeGame) {
        return <GameScreen gameMode={activeGame} onExit={() => setActiveGame(null)} />;
    }

    if (playingNutriServe) {
        return <NutriServeGame onExit={() => setPlayingNutriServe(false)} />;
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-green-900 mb-6">Garden Games</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {gameModes.map(game => (
                    <GameCard
                        key={game.mode}
                        gameMode={game.mode}
                        title={game.title}
                        description={game.description}
                        icon={game.icon}
                        highScore={getHighScore(game.mode)}
                        onPlay={setActiveGame}
                    />
                ))}
                 {/* New Game Card for NutriServe Chef */}
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md p-6 flex flex-col">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 bg-green-100 p-3 rounded-full">
                            <span className="text-2xl" role="img" aria-label="salad icon">🥗</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-green-900">NutriServe Chef</h3>
                            <p className="text-sm text-gray-600 mt-1">Build balanced meals for customers based on their recipe requests.</p>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                           High Score: <span className="font-bold text-green-700">{getHighScore('nutriserve')}</span>
                        </div>
                        <button
                            onClick={() => setPlayingNutriServe(true)}
                            className="px-6 py-2 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 transition-colors"
                        >
                            Play
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GamesView;
