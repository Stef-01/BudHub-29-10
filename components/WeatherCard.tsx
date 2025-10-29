
import React from 'react';
import type { Weather } from '../types';
import { SunIcon, CloudIcon, RainIcon, WindIcon, DropletIcon } from './icons/Icons';

const WeatherIcon: React.FC<{ condition: string; className?: string }> = ({ condition, className = 'h-6 w-6' }) => {
  const lowerCondition = condition.toLowerCase();
  if (lowerCondition.includes('sun') || lowerCondition.includes('clear')) {
    return <SunIcon className={className} />;
  }
  if (lowerCondition.includes('cloud') || lowerCondition.includes('overcast')) {
    return <CloudIcon className={className} />;
  }
  if (lowerCondition.includes('rain') || lowerCondition.includes('shower')) {
    return <RainIcon className={className} />;
  }
  return <CloudIcon className={className} />;
};

const WeatherCard: React.FC<{ weather: Weather }> = ({ weather }) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        {/* Current Weather */}
        <div className="flex items-center gap-4">
          <WeatherIcon condition={weather.current.condition} className="h-16 w-16 text-yellow-500" />
          <div>
            <p className="text-lg text-gray-600">{weather.location.name}, {weather.location.region}</p>
            <p className="text-5xl font-bold text-gray-800">{weather.current.tempC}°C</p>
            <p className="font-medium text-gray-500">{weather.current.condition}</p>
          </div>
        </div>
        <div className="flex space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
                <DropletIcon className="h-5 w-5 text-blue-500" />
                <span>{weather.current.humidity}% Hum.</span>
            </div>
            <div className="flex items-center space-x-2">
                <WindIcon className="h-5 w-5 text-gray-500" />
                <span>{weather.current.windKPH} kph Wind</span>
            </div>
        </div>
      </div>
      
      {/* 7-Day Forecast */}
      <div className="mt-6 pt-6 border-t border-green-100">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-4 text-center">
          {weather.forecast.map(day => (
            <div key={day.day} className="flex flex-col items-center space-y-1 p-2 rounded-lg hover:bg-green-50 transition-colors">
              <p className="font-semibold text-sm text-gray-700">{day.day.substring(0, 3)}</p>
              <WeatherIcon condition={day.condition} className="h-8 w-8 text-gray-500" />
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
