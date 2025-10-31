import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import type { GameScore, GameMode } from '../types';
import { getHighScores, saveScore as dbSaveScore } from '../services/db';

interface GameScoresContextType {
  scores: GameScore[];
  getHighScoresByMode: (gameMode: GameMode) => GameScore[];
  saveScore: (gameMode: GameMode, score: number) => void;
  loading: boolean;
}

const GameScoresContext = createContext<GameScoresContextType | undefined>(undefined);

export const GameScoresProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [scores, setScores] = useState<GameScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadScores = async () => {
      setLoading(true);
      const allScores = await getHighScores();
      setScores(allScores);
      setLoading(false);
    };
    loadScores();
  }, []);

  const getHighScoresByMode = useCallback((gameMode: GameMode) => {
    return scores
      .filter(s => s.gameMode === gameMode)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Return top 5
  }, [scores]);

  const saveScore = useCallback(async (gameMode: GameMode, score: number) => {
    const newScoreOmitId: Omit<GameScore, 'id'> = {
      gameMode,
      score,
      date: new Date().toISOString(),
    };
    await dbSaveScore(newScoreOmitId);
    // Refetch scores to get the one with the new ID
    const allScores = await getHighScores();
    setScores(allScores);
  }, []);

  const value = { scores, getHighScoresByMode, saveScore, loading };

  return (
    <GameScoresContext.Provider value={value}>
      {children}
    </GameScoresContext.Provider>
  );
};

export const useGameScores = (): GameScoresContextType => {
  const context = useContext(GameScoresContext);
  if (context === undefined) {
    throw new Error('useGameScores must be used within a GameScoresProvider');
  }
  return context;
};
