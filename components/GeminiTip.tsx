// components/GeminiTip.tsx
import React, { useState, useEffect } from 'react';
import { useWeather } from '../../contexts/WeatherContext';
import { useUserGarden } from '../../contexts/UserGardenContext';
import { getGardeningTip } from '../../services/geminiService';
import { SparklesIcon, LoadingSpinner } from './icons/Icons';

const GeminiTip: React.FC = () => {
    const { weather } = useWeather();
    const { myPlants } = useUserGarden();
    const [tip, setTip] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTip = async () => {
            if (weather && myPlants.length > 0) {
                setLoading(true);
                // Select a random plant from the garden for the tip
                const randomPlant = myPlants[Math.floor(Math.random() * myPlants.length)];
                try {
                    const newTip = await getGardeningTip(weather, randomPlant);
                    setTip(newTip);
                } catch (error) {
                    console.error("Failed to fetch Gemini tip:", error);
                    setTip("Could not get a tip from the cosmos right now.");
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchTip();
    }, [weather, myPlants]);
    
    if (!tip && !loading) return null;

    return (
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-800 rounded-lg shadow-md p-4 flex items-start space-x-4">
            <div className="flex-shrink-0 pt-0.5">
                {loading ? <LoadingSpinner className="h-6 w-6" /> : <SparklesIcon className="h-6 w-6" />}
            </div>
            <div>
                <h3 className="font-bold">Vibe Tip ✨</h3>
                <p className="text-sm">{loading ? 'Thinking...' : tip}</p>
            </div>
        </div>
    );
};

export default GeminiTip;