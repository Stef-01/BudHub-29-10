import React from 'react';
import { XIcon } from './icons/Icons';
import SocialShareButton from './SocialShareButton';

interface GameOverModalProps {
  score: number;
  percentile?: number;
  aiFeedback?: string;
  onPlayAgain: () => void;
  onExit: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ score, percentile, aiFeedback, onPlayAgain, onExit }) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md text-center p-8 relative transform transition-all animate-jump-in max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-3xl font-bold text-green-800">Game Over!</h2>
        <p className="text-gray-600 mt-2">Your final score is:</p>
        <p className="text-6xl font-extrabold text-green-600 my-4">{score}</p>

        {percentile && (
          <p className="text-lg text-emerald-600 font-semibold mb-4">
            Better than {percentile}% of players!
          </p>
        )}

        {aiFeedback && (
          <div className="bg-indigo-50 p-4 rounded-lg mb-6 text-left border border-indigo-100">
            <h3 className="text-sm font-bold text-indigo-800 mb-1 flex items-center gap-2">
              <span>🤖</span> AI Feedback
            </h3>
            <p className="text-indigo-700 text-sm italic">"{aiFeedback}"</p>
          </div>
        )}

        <div className="mt-8 space-y-3">
          {percentile && (
            <SocialShareButton
              score={score}
              percentile={percentile}
              gameName="Nutrient Challenge"
            />
          )}

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
