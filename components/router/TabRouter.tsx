// components/router/TabRouter.tsx
import React from 'react';
import type { Tab } from '../../types';
import { COMMUNITY_EVENTS } from '../../constants';

import GardenView from '../GardenView';
import TaskBoard from '../TaskBoard';
import RecipeBook from '../RecipeBook';
import CommunityEvents from '../CommunityEvents';
import GamesView from '../GamesView';
import AnimatedContent from '../ui/AnimatedContent';

interface TabRouterProps {
    activeTab: Tab;
}

const TabRouter: React.FC<TabRouterProps> = ({ activeTab }) => {
    const renderContent = () => {
        switch (activeTab) {
            case 'Garden':
                return <GardenView />;
            case 'Tasks':
                return <TaskBoard />;
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
        <AnimatedContent key={activeTab}>
            {renderContent()}
        </AnimatedContent>
    );
};

export default TabRouter;
