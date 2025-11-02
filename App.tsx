// App.tsx
import React, { useState, useMemo } from 'react';
import { AppProviders } from './contexts/AppProviders';
import { useUserGarden } from './contexts/UserGardenContext';
import { useWeather } from './contexts/WeatherContext';
import { useTasks } from './contexts/TasksContext';
import { useUserCookbook } from './contexts/UserCookbookContext';
import { useGameScores } from './contexts/GameScoresContext';
import type { Tab, GameMode } from './types';
import MainLayout from './components/layout/MainLayout';
import TabRouter from './components/router/TabRouter';
import LoadingScreen from './components/LoadingScreen';
import GameScreen from './components/GameScreen';
import NutriServeGame from './components/games/NutriServeGame';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('Garden');
  const [activeGame, setActiveGame] = useState<GameMode | null>(null);

  const gardenCtx = useUserGarden();
  const weatherCtx = useWeather();
  const tasksCtx = useTasks();
  const cookbookCtx = useUserCookbook();
  const scoresCtx = useGameScores();

  const isLoading = useMemo(() => {
    return gardenCtx.loading || weatherCtx.loading || tasksCtx.loading || cookbookCtx.loading || scoresCtx.loading;
  }, [gardenCtx.loading, weatherCtx.loading, tasksCtx.loading, cookbookCtx.loading, scoresCtx.loading]);
  
  const handlePlayGame = (gameMode: GameMode) => {
    setActiveGame(gameMode);
  };

  const handleExitGame = () => {
    setActiveGame(null);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (activeGame) {
    if (activeGame === 'nutriserve') {
      return <NutriServeGame onExit={handleExitGame} />;
    }
    return <GameScreen gameMode={activeGame} onExit={handleExitGame} />;
  }
  
  return (
    <MainLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <TabRouter activeTab={activeTab} onPlayGame={handlePlayGame} />
    </MainLayout>
  );
};

const App: React.FC = () => {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
};

export default App;
