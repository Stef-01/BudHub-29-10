// components/router/TabRouter.tsx
import React, { Suspense, lazy } from 'react';
import type { Tab, GameMode } from '../../types';
import { COMMUNITY_EVENTS } from '../../constants';

import HomepageView from '../HomepageView';
import GardenView from '../GardenView';
import TaskBoard from '../TaskBoard';
import RecipeBook from '../RecipeBook';
import CommunityEvents from '../CommunityEvents';
import GamesView from '../GamesView';
import AnimatedContent from '../ui/AnimatedContent';

// Lazy load AdminView - it's rarely used and contains heavy image upload features
const AdminView = lazy(() => import('../AdminView'));

interface TabRouterProps {
    activeTab: Tab;
    onPlayGame: (gameMode: GameMode) => void;
}

const TabRouter: React.FC<TabRouterProps> = ({ activeTab, onPlayGame }) => {
    const renderContent = () => {
        switch (activeTab) {
            case 'Homepage':
                return <HomepageView onPlayGame={onPlayGame} />;
            case 'Garden':
                return <GardenView />;
            case 'Tasks':
                return <TaskBoard />;
            case 'Recipes':
                return <RecipeBook />;
            case 'Events':
                return <CommunityEvents events={COMMUNITY_EVENTS} />;
            case 'Games':
                 return <GamesView onPlay={onPlayGame} />;
            case 'Admin':
                // Wrap lazy-loaded AdminView in Suspense with loading fallback
                return (
                    <Suspense fallback={
                        <div className="flex items-center justify-center h-screen">
                            <div className="text-center">
                                <div className="text-2xl mb-2">🔧</div>
                                <p className="text-gray-600">Loading Admin Panel...</p>
                            </div>
                        </div>
                    }>
                        <AdminView />
                    </Suspense>
                );
            default:
                return null;
        }
    };

    return (
        <AnimatedContent key={activeTab}>
            {renderContent()}
        </AnimatedContent>
    );
};

export default TabRouter;