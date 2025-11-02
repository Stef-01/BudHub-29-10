// App.tsx
import React, { useState } from 'react';
import type { Tab, GameMode } from './types';
import { useUserGarden } from './contexts/UserGardenContext';
import { useGamification } from './contexts/GamificationContext';
import { useWeather } from './contexts/WeatherContext';
import { AppProviders } from './contexts/AppProviders';
import MainLayout from './components/layout/MainLayout';
import TabRouter from './components/router/TabRouter';
import LevelUpModal from './components/LevelUpModal';
import LoadingScreen from './components/LoadingScreen';
import GameScreen from './components/GameScreen';
import NutriServeGame from './components/games/NutriServeGame';

const VibeCodedApp: React.FC = () => {
    const { loading: gardenLoading } = useUserGarden();
    const { showLevelUp, setShowLevelUp, level } = useGamification();
    const { loading: weatherLoading } = useWeather();
    
    const [activeTab, setActiveTab] = useState<Tab>('Garden');
    const [activeGame, setActiveGame] = useState<GameMode | null>(null);

    const handlePlayGame = (gameMode: GameMode) => {
        // When a game is selected, switch to the 'Games' tab for context
        setActiveTab('Games');
        setActiveGame(gameMode);
    };

    const handleExitGame = () => {
        setActiveGame(null);
    };

    if (weatherLoading || gardenLoading) {
        return <LoadingScreen />;
    }

    // Full-screen game modes take over the entire render
    if (activeGame === 'nutriserve') {
        return <NutriServeGame onExit={handleExitGame} />;
    }

    // Default app view with main layout
    return (
        <div className="bg-green-50 min-h-screen font-sans">
            <MainLayout activeTab={activeTab} setActiveTab={setActiveTab}>
                {/* Render quick-play games within the layout, replacing the tab content */}
                {activeGame ? (
                    <GameScreen gameMode={activeGame} onExit={handleExitGame} />
                ) : (
                    <TabRouter activeTab={activeTab} onPlayGame={handlePlayGame} />
                )}
            </MainLayout>

            {showLevelUp && <LevelUpModal level={level} onClose={() => setShowLevelUp(false)} />}
        </div>
    );
};

const App: React.FC = () => (
    <AppProviders>
        <VibeCodedApp />
    </AppProviders>
);

export default App;