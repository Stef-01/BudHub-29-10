import React from 'react';
import ProgressBar from './ProgressBar';
import { useGamification } from '../contexts/GamificationContext';

const Header: React.FC = () => {
  const { xp, level, xpForNextLevel } = useGamification();
  
  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-green-800">Garden<span className="text-green-500">Vibe</span></h1>
            <p className="text-sm text-gray-500">Your Logan, QLD Garden Companion</p>
          </div>
          <div className="w-1/3 max-w-xs">
            <div className="flex items-center">
              <span className="text-sm font-semibold text-green-800 mr-2">Lvl {level}</span>
              <ProgressBar progress={(xp / xpForNextLevel) * 100} />
            </div>
            <p className="text-xs text-center text-gray-500 mt-1">{xp} / {xpForNextLevel} XP</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;