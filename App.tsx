// App.tsx
import React, { useState, useMemo } from 'react';
import { Analytics } from '@vercel/analytics/react';
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
// FIX: Correctly import NutriServeGame as a module.
import NutriServeGame from './components/games/NutriServeGame';
import UnifiedNutrientGame from './components/UnifiedNutrientGame';
import AdminDashboard from './components/AdminDashboard';
import { getUserId } from './hooks/useUserId';
import { trackUserSession } from './lib/analytics';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('Homepage');
  const [activeGame, setActiveGame] = useState<GameMode | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);

  const gardenCtx = useUserGarden();
  const weatherCtx = useWeather();
  const tasksCtx = useTasks();
  const cookbookCtx = useUserCookbook();
  const scoresCtx = useGameScores();

  const isLoading = useMemo(() => {
    const loading = gardenCtx.loading || weatherCtx.loading || tasksCtx.loading || cookbookCtx.loading || scoresCtx.loading;
    console.log('[App] Loading states:', {
      garden: gardenCtx.loading,
      weather: weatherCtx.loading,
      tasks: tasksCtx.loading,
      cookbook: cookbookCtx.loading,
      scores: scoresCtx.loading,
      overall: loading
    });
    return loading;
  }, [gardenCtx.loading, weatherCtx.loading, tasksCtx.loading, cookbookCtx.loading, scoresCtx.loading]);

  // Check for admin mode in URL and track user session
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      setShowAdmin(true);
    }

    // Track user session
    const userId = getUserId();
    trackUserSession(userId);
  }, []);

  const handlePlayGame = (gameMode: GameMode) => {
    setActiveGame(gameMode);
  };

  const handleExitGame = () => {
    setActiveGame(null);
  };

  const handleExitAdmin = () => {
    setShowAdmin(false);
    // Remove admin param from URL
    const params = new URLSearchParams(window.location.search);
    params.delete('admin');
    const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    window.history.replaceState({}, '', newUrl);
  };

  if (isLoading) {
    console.log('[App] Showing loading screen');
    return <LoadingScreen />;
  }

  console.log('[App] Rendering main app, activeTab:', activeTab);

  // Show admin dashboard if admin mode is active
  if (showAdmin) {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('user') || 'dad';
    return <AdminDashboard onExit={handleExitAdmin} userId={userId} />;
  }

  if (activeGame) {
    if (activeGame === 'nutriserve') {
      return <NutriServeGame onExit={handleExitGame} />;
    }
    if (activeGame === 'unified_nutrient') {
      return <UnifiedNutrientGame onExit={handleExitGame} />;
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
      <Analytics />
    </AppProviders>
  );
};

export default App;