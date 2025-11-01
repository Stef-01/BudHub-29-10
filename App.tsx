// App.tsx
import React, { useState } from 'react';
import type { Tab } from './types';
import { useUserGarden } from './contexts/UserGardenContext';
import { useGamification } from './contexts/GamificationContext';
import { useWeather } from './contexts/WeatherContext';
import { AppProviders } from './contexts/AppProviders';
import MainLayout from './components/layout/MainLayout';
import TabRouter from './components/router/TabRouter';
import LevelUpModal from './components/LevelUpModal';
import LoadingScreen from './components/LoadingScreen';

const VibeCodedApp: React.FC = () => {
    const { loading: gardenLoading } = useUserGarden();
    const { showLevelUp, setShowLevelUp, level } = useGamification();
    const { loading: weatherLoading } = useWeather();
    
    const [activeTab, setActiveTab] = useState<Tab>('Garden');

    if (weatherLoading || gardenLoading) {
        return <LoadingScreen />;
    }

    return (
        <div className="bg-green-50 min-h-screen font-sans">
            <MainLayout activeTab={activeTab} setActiveTab={setActiveTab}>
                <TabRouter activeTab={activeTab} />
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
