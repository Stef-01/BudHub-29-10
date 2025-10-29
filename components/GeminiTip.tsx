
import React, { useState, useCallback } from 'react';
import type { Weather, Plant } from '../types';
import { getGardeningTip } from '../services/geminiService';
import { SparklesIcon, LoadingSpinner } from './icons/Icons';

interface GeminiTipProps {
  weather: Weather;
  plants: Plant[];
}

const GeminiTip: React.FC<GeminiTipProps> = ({ weather, plants }) => {
  const [tip, setTip] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetTip = useCallback(async () => {
    setLoading(true);
    setError(null);
    setTip('');
    try {
      // Pick a random plant for variety
      const randomPlant = plants[Math.floor(Math.random() * plants.length)];
      const generatedTip = await getGardeningTip(weather, randomPlant);
      setTip(generatedTip);
    } catch (err) {
      setError('Failed to get a tip. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [weather, plants]);

  return (
    <div className="bg-gradient-to-r from-teal-400 to-blue-500 rounded-xl shadow-lg p-6 text-white">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-grow">
          <h3 className="text-xl font-bold">Cosmic Garden Wisdom</h3>
          {loading && (
            <div className="flex items-center mt-2">
              <LoadingSpinner className="h-5 w-5 text-white" />
              <p className="ml-2 text-sm font-medium">Brewing a fresh tip...</p>
            </div>
          )}
          {error && <p className="mt-2 text-sm text-red-100 font-medium">{error}</p>}
          {tip && <p className="mt-2 text-lg italic">"{tip}"</p>}
        </div>
        <button
          onClick={handleGetTip}
          disabled={loading}
          className="flex items-center justify-center w-full md:w-auto px-6 py-3 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed rounded-full font-semibold transition-all duration-300 ease-in-out backdrop-blur-sm shadow-md"
        >
          <SparklesIcon className="h-5 w-5 mr-2" />
          Get Vibe-Coded Tip
        </button>
      </div>
    </div>
  );
};

export default GeminiTip;
