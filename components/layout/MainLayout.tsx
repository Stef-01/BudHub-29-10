// components/layout/MainLayout.tsx
import React from 'react';
import type { Tab } from '../../types';
import { useUserGarden } from '../../contexts/UserGardenContext';
import { useWeather } from '../../contexts/WeatherContext';
import Header from '../Header';
import Navigation from '../Navigation';
import AlertBanner from '../AlertBanner';
import GeminiTip from '../GeminiTip';

interface MainLayoutProps {
    children: React.ReactNode;
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, activeTab, setActiveTab }) => {
    const { myPlants } = useUserGarden();
    const { weather, alerts } = useWeather();

    return (
        <>
            <Header />
            <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="space-y-6">
                    {alerts.length > 0 && alerts.map((alert, index) => <AlertBanner key={index} alert={alert} />)}

                    {weather && myPlants.length > 0 && <GeminiTip weather={weather} plants={myPlants} />}
                    
                    {children}
                </div>
            </main>
        </>
    );
};

export default MainLayout;
