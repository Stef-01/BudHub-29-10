// components/WeatherCard.tsx
import React from 'react';
import type { Weather } from '../types';
import { SunIcon, CloudIcon, RainIcon, DropletIcon, WindIcon } from './icons/Icons';

const WeatherIcon: React.FC<{ condition: string; className?: string }> = ({ condition, className = "h-6 w-6" }) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('rain') || lowerCondition.includes('shower')) return <RainIcon className={className} />;
    if (lowerCondition.includes('cloud')) return <CloudIcon className={className} />;
    return <SunIcon className={className} />;
};

const WeatherCard: React.FC<{ weather: Weather }> = ({ weather }) => {
    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-6">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-blue-800">{weather.current.tempC}°C</h2>
                    <p className="text-gray-600">{weather.location.name}, {weather.location.region}</p>
                    <p className="text-sm text-gray-500 capitalize">{weather.current.condition}</p>
                </div>
                <WeatherIcon condition={weather.current.condition} className="h-12 w-12 text-yellow-500" />
            </div>
            <div className="flex justify-between items-center mt-4 text-sm text-gray-600 border-t pt-4">
                <div className="flex items-center"><DropletIcon className="h-4 w-4 mr-1 text-blue-500" /> {weather.current.humidity}%</div>
                <div className="flex items-center"><WindIcon className="h-4 w-4 mr-1 text-gray-500" /> {weather.current.windKPH} kph</div>
                <div className="flex items-center"><RainIcon className="h-4 w-4 mr-1 text-cyan-500" /> {weather.current.precipMM} mm</div>
            </div>

            <div className="mt-4 border-t pt-4">
                <div className="flex justify-between">
                    {weather.forecast.slice(0, 5).map(day => (
                        <div key={day.day} className="flex flex-col items-center text-center w-1/5">
                            <p className="text-sm font-semibold text-gray-700">{day.day.substring(0, 3)}</p>
                            <WeatherIcon condition={day.condition} className="h-6 w-6 text-gray-500 my-1" />
                            <p className="text-sm font-bold text-gray-800">{day.maxTempC}°</p>
                            <p className="text-xs text-gray-500">{day.minTempC}°</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WeatherCard;
