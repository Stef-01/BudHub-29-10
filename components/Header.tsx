// components/Header.tsx
import React from 'react';
import { useGamification } from '../contexts/GamificationContext';
import ProgressBar from './ProgressBar';
import LevelUpModal from './LevelUpModal';

const Header: React.FC = () => {
    const { xp, level, xpForNextLevel, showLevelUp, setShowLevelUp } = useGamification();
    const progress = (xp / xpForNextLevel) * 100;

    return (
        <>
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm shadow-md z-40 p-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-green-800">SWAAD</h1>
                        <div className="text-lg font-bold text-green-700">Level {level}</div>
                    </div>
                    <div className="mt-2">
                        <ProgressBar progress={progress} />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>XP: {Math.floor(xp)} / {Math.floor(xpForNextLevel)}</span>
                            <span>Next Level</span>
                        </div>
                    </div>
                </div>
            </header>
            {showLevelUp && <LevelUpModal level={level} onClose={() => setShowLevelUp(false)} />}
        </>
    );
};

export default Header;