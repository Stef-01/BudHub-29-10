import React from 'react';
import { XIcon } from './icons/Icons';

interface GameOverModalProps {
  score: number;
  onPlayAgain: () => void;
  onExit: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ score, onPlayAgain, onExit }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm text-center p-8 relative transform transition-all animate-jump-in"
      >
        <h2 className="text-3xl font-bold text-green-800">Game Over!</h2>
        <p className="text-gray-600 mt-2">Your final score is:</p>
        <p className="text-6xl font-extrabold text-green-600 my-4">{score}</p>
        <div className="mt-8 space-y-3">
            <button
            onClick={onPlayAgain}
            className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors"
            >
            Play Again
            </button>
            <button
            onClick={onExit}
            className="w-full px-4 py-3 bg-white text-gray-700 border border-gray-300 font-semibold rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
            >
            Exit to Games
            </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverModal;
