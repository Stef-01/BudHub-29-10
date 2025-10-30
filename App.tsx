import React, { useState, useEffect, useMemo } from 'react';
import type { Weather, Alert, Tab, Task } from './types';
import { getMockWeather } from './services/weatherService';
import { generateWeeklyTasks } from './services/taskService';
import { HEATWAVE_THRESHOLD } from './config';
import { COMMUNITY_EVENTS } from './constants';
import { GamificationProvider, useGamification } from './contexts/GamificationContext';
import { UserGardenProvider, useUserGarden } from './contexts/UserGardenContext';
import { UserCookbookProvider, useUserCookbook } from './contexts/UserCookbookContext';
import { ImageGenerationProvider } from './contexts/ImageGenerationContext';
import { getDismissedTaskIds, saveDismissedTaskIds } from './services/db';

import Header from './components/Header';
import Navigation from './components/Navigation';
import AlertBanner from './components/AlertBanner';
import GeminiTip from './components/GeminiTip';
import LevelUpModal from './components/LevelUpModal';
import GardenView from './components/GardenView';
import TaskBoard from './components/TaskBoard';
import RecipeBook from './components/RecipeBook';
import CommunityEvents from './components/CommunityEvents';
import { LoadingSpinner } from './components/icons/Icons';

const AppContent: React.FC = () => {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('Garden');
  const [weatherLoading, setWeatherLoading] = useState<boolean>(true);
  const [dismissedTaskIds, setDismissedTaskIds] = useState<string[]>([]);
  const [dismissedTasksLoading, setDismissedTasksLoading] = useState(true);

  const { myPlants, loading: gardenLoading } = useUserGarden();
  const { showLevelUp, setShowLevelUp, level, loading: gamificationLoading } = useGamification();
  const { loading: cookbookLoading } = useUserCookbook();

  useEffect(() => {
    const fetchWeatherData = async () => {
      setWeatherLoading(true);
      try {
        const weatherData = await getMockWeather({ city: 'Logan', state: 'QLD' });
        setWeather(weatherData);
      } catch (error) {
        console.error("Failed to fetch weather data", error);
      } finally {
        setWeatherLoading(false);
      }
    };

    const loadDismissedTasks = async () => {
        setDismissedTasksLoading(true);
        const ids = await getDismissedTaskIds();
        setDismissedTaskIds(ids);
        setDismissedTasksLoading(false);
    };

    fetchWeatherData();
    loadDismissedTasks();
  }, []);

  useEffect(() => {
    if (weather && myPlants.length > 0) {
      const generatedTasks = generateWeeklyTasks(myPlants, weather);
      setTasks(generatedTasks);
    } else {
      setTasks([]);
    }
  }, [weather, myPlants]);

  const handleDismissTask = (taskId: string) => {
    setDismissedTaskIds(prev => {
      if (prev.includes(taskId)) return prev;
      const newIds = [...prev, taskId];
      saveDismissedTaskIds(newIds);
      return newIds;
    });
  };

  const alerts = useMemo((): Alert[] => {
    if (!weather) return [];
    const highTempDays = weather.forecast.filter(day => day.maxTempC >= HEATWAVE_THRESHOLD);
    if (highTempDays.length >= 3) {
      return [{
        type: 'Heatwave',
        title: `Heatwave Alert! ${highTempDays.length} days over ${HEATWAVE_THRESHOLD}°C`,
        message: 'Keep your plants well-watered, especially in the mornings. Consider providing temporary shade for sensitive plants.',
        severity: 'Warning'
      }];
    }
    return [];
  }, [weather]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'Garden':
        return <GardenView weather={weather} />;
      case 'Tasks':
        return <TaskBoard allTasks={tasks} dismissedTaskIds={dismissedTaskIds} onDismissTask={handleDismissTask} />;
      case 'Recipes':
        return <RecipeBook />;
      case 'Events':
        return <CommunityEvents events={COMMUNITY_EVENTS} />;
      default:
        return <GardenView weather={weather} />;
    }
  };

  const loading = weatherLoading || gardenLoading || cookbookLoading || gamificationLoading || dismissedTasksLoading;

  return (
    <div className="bg-green-50 min-h-screen font-sans">
      <Header />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner className="h-12 w-12 text-green-600" />
            <p className="ml-4 text-gray-600">Loading your garden...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {alerts.map((alert, index) => <AlertBanner key={index} alert={alert} />)}
            {weather && myPlants.length > 0 && activeTab === 'Garden' && <GeminiTip weather={weather} plants={myPlants} />}
            {renderActiveTab()}
          </div>
        )}
      </main>
      {showLevelUp && <LevelUpModal level={level} onClose={() => setShowLevelUp(false)} />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <GamificationProvider>
      <UserGardenProvider>
        <UserCookbookProvider>
          <ImageGenerationProvider>
            <AppContent />
          </ImageGenerationProvider>
        </UserCookbookProvider>
      </UserGardenProvider>
    </GamificationProvider>
  );
};

export default App;