// App.tsx
import React, { useState, useMemo, useCallback, Suspense, lazy } from 'react';
import { AppProviders } from './contexts/AppProviders';
import { useUserGarden } from './contexts/UserGardenContext';
import { useWeather } from './contexts/WeatherContext';
import { useTasks } from './contexts/TasksContext';
import { useUserCookbook } from './contexts/UserCookbookContext';
import { useGameScores } from './contexts/GameScoresContext';
import { useGamification } from './contexts/GamificationContext';
import type { Tab, GameMode } from './types';
import MainLayout from './components/layout/MainLayout';
import TabRouter from './components/router/TabRouter';
import LoadingScreen from './components/LoadingScreen';
import GameScreen from './components/GameScreen';
// FIX: Correctly import NutriServeGame as a module.
import NutriServeGame from './components/games/NutriServeGame';
import UnifiedNutrientGame from './components/UnifiedNutrientGame';
// Loaded on demand so the remaster's code isn't in the main bundle.
const NutriServeRemaster = lazy(() => import('./src/features/nutriserve/ui/NutriServeRemaster.tsx'));
/** The remaster keeps its saves per browser (this app has no signed-in user id). */
const REMASTER_PLAYER = 'local';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('Garden');
  const [activeGame, setActiveGame] = useState<GameMode | null>(null);

  const gardenCtx = useUserGarden();
  const weatherCtx = useWeather();
  const tasksCtx = useTasks();
  const cookbookCtx = useUserCookbook();
  const scoresCtx = useGameScores();
  const { addXp } = useGamification();

  const isLoading = useMemo(() => {
    return gardenCtx.loading || weatherCtx.loading || tasksCtx.loading || cookbookCtx.loading || scoresCtx.loading;
  }, [gardenCtx.loading, weatherCtx.loading, tasksCtx.loading, cookbookCtx.loading, scoresCtx.loading]);
  
  const handlePlayGame = (gameMode: GameMode) => {
    setActiveGame(gameMode);
  };

  const handleExitGame = () => {
    setActiveGame(null);
  };

  // The remaster reports each finished day once (guarded by a ledger outside its save). XP scales
  // with the day's average score; a day of empty katoris earns none.
  const handleRemasterDay = useCallback(
    ({ averageScore, xpTier }: { day: number; averageScore: number; xpTier: 'Low' | 'Medium' | 'High' | null }) => {
      scoresCtx.saveScore('nutriserve_remaster', averageScore);
      if (xpTier) addXp(xpTier, 'add');
    },
    [scoresCtx, addXp]
  );

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (activeGame) {
    if (activeGame === 'nutriserve') {
      return <NutriServeGame onExit={handleExitGame} />;
    }
    if (activeGame === 'nutriserve_remaster') {
      return (
        <Suspense fallback={<LoadingScreen />}>
          <NutriServeRemaster userId={REMASTER_PLAYER} onExit={handleExitGame} onDayComplete={handleRemasterDay} />
        </Suspense>
      );
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
    </AppProviders>
  );
};

export default App;