// components/layout/MainLayout.tsx
import React from 'react';
import Header from '../Header';
import Navigation from '../Navigation';
import type { Tab } from '../../types';

interface MainLayoutProps {
    children: React.ReactNode;
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, activeTab, onTabChange }) => {
    return (
        <div className="bg-lime-50 min-h-screen font-sans">
            <Header />
            <main className="pt-24 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {children}
            </main>
            <Navigation activeTab={activeTab} onTabChange={onTabChange} />
        </div>
    );
};

export default MainLayout;