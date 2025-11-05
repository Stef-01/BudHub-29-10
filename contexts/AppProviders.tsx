// contexts/AppProviders.tsx
import React from 'react';
import { UserGardenProvider } from './UserGardenContext';
import { GamificationProvider } from './GamificationContext';
import { UserCookbookProvider } from './UserCookbookContext';
// ImageGenerationProvider removed - no longer using AI image generation
import { GameScoresProvider } from './GameScoresContext';
import { TasksProvider } from './TasksContext';
import { WeatherProvider } from './WeatherContext';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <GamificationProvider>
        <UserGardenProvider>
            <WeatherProvider>
                <TasksProvider>
                    <UserCookbookProvider>
                        <GameScoresProvider>
                            {children}
                        </GameScoresProvider>
                    </UserCookbookProvider>
                </TasksProvider>
            </WeatherProvider>
        </UserGardenProvider>
    </GamificationProvider>
);
