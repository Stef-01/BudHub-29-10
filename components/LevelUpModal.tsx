
import React from 'react';
import { SparklesIcon, XIcon } from './icons/Icons';

interface LevelUpModalProps {
  level: number;
  onClose: () => void;
}

const LevelUpModal: React.FC<LevelUpModalProps> = ({ level, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm text-center p-8 relative transform transition-all animate-jump-in"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-2 rounded-full text-gray-400 hover:bg-gray-100"
          aria-label="Close"
        >
          <XIcon className="h-6 w-6" />
        </button>
        <div className="text-yellow-500 mb-4">
          <SparklesIcon className="h-16 w-16 mx-auto" />
        </div>
        <h2 className="text-3xl font-bold text-green-800">LEVEL UP!</h2>
        <p className="text-gray-600 mt-2">You've reached</p>
        <p className="text-6xl font-extrabold text-green-600 my-4">Level {level}</p>
        <p className="text-gray-500">Your garden is thriving, and so are you!</p>
        <button
          onClick={onClose}
          className="mt-8 w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors"
        >
          Keep Growing
        </button>
      </div>
    </div>
  );
};

export default LevelUpModal;
