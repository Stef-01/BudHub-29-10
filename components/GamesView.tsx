// components/GamesView.tsx

import React, { useState } from 'react';
import type { GameMode } from '../types';
import { useGameScores } from '../contexts/GameScoresContext';
import GameCard from './GameCard';
import GameScreen from './GameScreen';
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

    const getHighScore = (mode: GameMode) => {
        const scores = getHighScoresByMode(mode);
        return scores.length > 0 ? scores[0].score : 0;
    };

    if (activeGame) {
        return <GameScreen gameMode={activeGame} onExit={() => setActiveGame(null)} />;
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
            </div>
        </div>
    );
};

export default GamesView;
