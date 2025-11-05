// contexts/WeatherContext.tsx
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import type { Weather, Alert } from '../types';
import { getMockWeather } from '../services/weatherService';
import { HEATWAVE_THRESHOLD } from '../config';

interface WeatherContextType {
  weather: Weather | null;
  alerts: Alert[];
  loading: boolean;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

export const WeatherProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        console.log('[WeatherContext] Loading weather data...');
        const weatherData = await getMockWeather({ city: 'Logan', state: 'QLD' });
        setWeather(weatherData);

        const newAlerts: Alert[] = [];
        if (weatherData.current.tempC > HEATWAVE_THRESHOLD) {
          newAlerts.push({
            type: 'Heatwave',
            severity: 'Critical',
            title: 'Heatwave Alert!',
            message: `It's ${weatherData.current.tempC}°C! Ensure your plants are deeply watered and consider providing temporary shade.`
          });
        }
        setAlerts(newAlerts);
        console.log('[WeatherContext] ✓ Weather data loaded successfully');
      } catch (error) {
        console.error('[WeatherContext] ❌ Error loading weather:', error);
        setWeather(null);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, []);

  return (
    <WeatherContext.Provider value={{ weather, alerts, loading }}>
      {children}
    </WeatherContext.Provider>
  );
};

export const useWeather = (): WeatherContextType => {
  const context = useContext(WeatherContext);
  if (context === undefined) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
};
