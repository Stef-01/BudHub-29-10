import React, { createContext, useState, useContext, useMemo, useEffect, ReactNode, useCallback } from 'react';
import { LEVEL_XP_BASE, LEVEL_XP_MULTIPLIER, XP_VALUES } from '../config';
import type { TaskPriority } from '../types';
import { getGamificationState, saveGamificationState } from '../services/db';

interface GamificationContextType {
  xp: number;
  level: number;
  xpForNextLevel: number;
  showLevelUp: boolean;
  setShowLevelUp: React.Dispatch<React.SetStateAction<boolean>>;
  addXp: (priority: TaskPriority, action: 'add' | 'remove') => void;
  loading: boolean;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [prevLevel, setPrevLevel] = useState(1);

  useEffect(() => {
    const loadState = async () => {
      try {
        setLoading(true);
        console.log('[GamificationContext] Loading gamification state...');
        const { xp, level } = await getGamificationState();
        setXp(xp);
        setLevel(level);
        setPrevLevel(level);
        console.log('[GamificationContext] ✓ State loaded successfully: Level', level, 'XP', xp);
      } catch (error) {
        console.error('[GamificationContext] ❌ Error loading gamification state:', error);
        setXp(0);
        setLevel(1);
        setPrevLevel(1);
      } finally {
        setLoading(false);
      }
    };
    loadState();
  }, []);

  const xpForNextLevel = useMemo(() => {
    return Math.floor(LEVEL_XP_BASE * Math.pow(LEVEL_XP_MULTIPLIER, level - 1));
  }, [level]);

  const updateStateInDb = useCallback(async (newXp: number, newLevel: number) => {
    await saveGamificationState(newXp, newLevel);
  }, []);

  useEffect(() => {
    if (loading) return;
    
    let needsDbUpdate = false;
    let currentXp = xp;
    let currentLevel = level;

    if (currentXp >= xpForNextLevel) {
      const newXp = currentXp - xpForNextLevel;
      const newLevel = currentLevel + 1;
      setLevel(newLevel);
      setXp(newXp);
      needsDbUpdate = true;
    } else {
      needsDbUpdate = true;
    }
    
    if(needsDbUpdate) {
        updateStateInDb(xp, level);
    }

    if (level > prevLevel) {
      setShowLevelUp(true);
      setPrevLevel(level);
    }
  }, [xp, level, xpForNextLevel, loading, prevLevel, updateStateInDb]);

  const addXp = (priority: TaskPriority, action: 'add' | 'remove') => {
    const amount = XP_VALUES[priority] || 15;
    if (action === 'add') {
      setXp(currentXp => currentXp + amount);
    } else {
      setXp(currentXp => Math.max(0, currentXp - amount));
    }
  };

  const value = {
    xp,
    level,
    xpForNextLevel,
    showLevelUp,
    setShowLevelUp,
    addXp,
    loading
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = (): GamificationContextType => {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};