// App.tsx

import React, { useState, useEffect, useMemo } from 'react';
import type { Tab, Weather, Task, Alert } from './types';
import { UserGardenProvider } from './contexts/UserGardenContext';
import { GamificationProvider } from './contexts/GamificationContext';
import { UserCookbookProvider } from './contexts/UserCookbookContext';
import { ImageGenerationProvider } from './contexts/ImageGenerationContext';
import { GameScoresProvider } from './contexts/GameScoresContext';
import { useUserGarden } from './contexts/UserGardenContext';
import { useLocalStorage } from './hooks/useLocalStorage';
import { getMockWeather } from './services/weatherService';
import { generateWeeklyTasks } from './services/taskService';
import { HEATWAVE_THRESHOLD } from './config';
import { COMMUNITY_EVENTS } from './constants';

import Header from './components/Header';
import Navigation from './components/Navigation';
import GardenView from './components/GardenView';
import TaskBoard from './components/TaskBoard';
import RecipeBook from './components/RecipeBook';
import CommunityEvents from './components/CommunityEvents';
import GamesView from './components/GamesView';
import GeminiTip from './components/GeminiTip';
import AlertBanner from './components/AlertBanner';
import LevelUpModal from './components/LevelUpModal';
import { useGamification } from './contexts/GamificationContext';

const AppContent: React.FC = () => {
    const { myPlants, loading: gardenLoading } = useUserGarden();
    const { showLevelUp, setShowLevelUp, level } = useGamification();
    const [activeTab, setActiveTab] = useState<Tab>('Garden');
    const [weather, setWeather] = useState<Weather | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [dismissedTaskIds, setDismissedTaskIds] = useLocalStorage<string[]>('dismissedTaskIds', []);

    useEffect(() => {
        const fetchWeather = async () => {
            const weatherData = await getMockWeather({ city: 'Logan', state: 'QLD' });
            setWeather(weatherData);

            // Generate alerts based on weather
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
        };
        fetchWeather();
    }, []);

    useEffect(() => {
        if (weather && !gardenLoading) {
            const weeklyTasks = generateWeeklyTasks(myPlants, weather);
            setTasks(weeklyTasks);
        }
    }, [weather, myPlants, gardenLoading]);

    const handleDismissTask = (taskId: string) => {
        if (!dismissedTaskIds.includes(taskId)) {
            setDismissedTaskIds(prev => [...prev, taskId]);
        }
    };
    
    const renderContent = () => {
        if (!weather || gardenLoading) {
            return <div className="text-center p-8">Loading your garden vibe...</div>;
        }

        switch (activeTab) {
            case 'Garden':
                return <GardenView weather={weather} />;
            case 'Tasks':
                return <TaskBoard allTasks={tasks} dismissedTaskIds={dismissedTaskIds} onDismissTask={handleDismissTask} />;
            case 'Recipes':
                return <RecipeBook />;
            case 'Events':
                return <CommunityEvents events={COMMUNITY_EVENTS} />;
            case 'Games':
                 return <GamesView />;
            default:
                return null;
        }
    };

    return (
        <div className="bg-green-50 min-h-screen font-sans">
            <Header />
            <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="space-y-6">
                    {alerts.length > 0 && alerts.map((alert, index) => <AlertBanner key={index} alert={alert} />)}

                    {weather && myPlants.length > 0 && <GeminiTip weather={weather} plants={myPlants} />}
                    
                    {renderContent()}
                </div>
            </main>

            {showLevelUp && <LevelUpModal level={level} onClose={() => setShowLevelUp(false)} />}
        </div>
    );
};

const App: React.FC = () => (
    <GamificationProvider>
        <UserGardenProvider>
            <UserCookbookProvider>
                <ImageGenerationProvider>
                    <GameScoresProvider>
                         <AppContent />
                    </GameScoresProvider>
                </ImageGenerationProvider>
            </UserCookbookProvider>
        </UserGardenProvider>
    </GamificationProvider>
);

export default App;