// components/GameCard.tsx

import React from 'react';
import type { GameMode } from '../types';

interface GameCardProps {
    gameMode: GameMode;
    title: string;
    description: string;
    icon: React.ReactNode;
    highScore: number;
    onPlay: (gameMode: GameMode) => void;
}

const GameCard: React.FC<GameCardProps> = ({ gameMode, title, description, icon, highScore, onPlay }) => {
    return (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md p-6 flex flex-col">
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 bg-green-100 p-3 rounded-full">
                    {icon}
                </div>
                <div>
                    <h3 className="text-xl font-bold text-green-900">{title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{description}</p>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                    High Score: <span className="font-bold text-green-700">{highScore}</span>
                </div>
                <button
                    onClick={() => onPlay(gameMode)}
                    className="px-6 py-2 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 transition-colors"
                >
                    Play
                </button>
            </div>
        </div>
    );
};

export default GameCard;
