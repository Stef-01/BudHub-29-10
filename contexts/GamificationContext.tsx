import React, { createContext, useState, useContext, useMemo, useEffect, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { LEVEL_XP_BASE, LEVEL_XP_MULTIPLIER, XP_VALUES } from '../config';
import type { TaskPriority } from '../types';

interface GamificationContextType {
  xp: number;
  level: number;
  xpForNextLevel: number;
  prevLevel: number;
  showLevelUp: boolean;
  setShowLevelUp: React.Dispatch<React.SetStateAction<boolean>>;
  addXp: (priority: TaskPriority, action: 'add' | 'remove') => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [xp, setXp] = useLocalStorage<number>('user_xp', 0);
  const [level, setLevel] = useLocalStorage<number>('user_level', 1);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [prevLevel, setPrevLevel] = useState(level);

  const xpForNextLevel = useMemo(() => {
    return Math.floor(LEVEL_XP_BASE * Math.pow(LEVEL_XP_MULTIPLIER, level - 1));
  }, [level]);

  useEffect(() => {
    if (xp >= xpForNextLevel) {
      const newXp = xp - xpForNextLevel;
      setLevel(prev => prev + 1);
      setXp(newXp);
    }
    if (level > prevLevel) {
      setShowLevelUp(true);
      setPrevLevel(level);
    }
  }, [xp, level, xpForNextLevel, setLevel, setXp, prevLevel]);

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
    prevLevel,
    showLevelUp,
    setShowLevelUp,
    addXp
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
