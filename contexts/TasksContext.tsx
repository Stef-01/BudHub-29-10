// contexts/TasksContext.tsx
import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback, useMemo } from 'react';
import type { Task, DayOfWeek } from '../types';
import { getTaskStates, saveTaskState } from '../services/db';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useGamification } from './GamificationContext';
import { useUserGarden } from './UserGardenContext';
import { useWeather } from './WeatherContext';
import { generateWeeklyTasks } from '../services/taskService';

interface TasksContextType {
  getTasksForDay: (day: DayOfWeek) => Task[];
  dismissTask: (taskId: string) => void;
  toggleTaskComplete: (task: Task, isCompleted: boolean) => void;
  getAllTasks: () => Task[];
  loading: boolean;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export const TasksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addXp } = useGamification();
  const { myPlants, loading: gardenLoading } = useUserGarden();
  const { weather, loading: weatherLoading } = useWeather();

  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [dismissedTaskIds, setDismissedTaskIds] = useLocalStorage<string[]>('dismissedTaskIds', []);
  const [dbStatesLoading, setDbStatesLoading] = useState(true);

  useEffect(() => {
    const loadTaskStates = async () => {
      setDbStatesLoading(true);
      const states = await getTaskStates();
      setCompletedTasks(states);
      setDbStatesLoading(false);
    };
    loadTaskStates();
  }, []);

  useEffect(() => {
    if (weather && !gardenLoading) {
        const weeklyTasks = generateWeeklyTasks(myPlants, weather);
        setAllTasks(weeklyTasks);
    }
  }, [weather, myPlants, gardenLoading]);

  const dismissTask = useCallback((taskId: string) => {
    setDismissedTaskIds(prev => {
      if (prev.includes(taskId)) return prev;
      return [...prev, taskId];
    });
  }, [setDismissedTaskIds]);

  const toggleTaskComplete = useCallback((task: Task, isCompleted: boolean) => {
    setCompletedTasks(prev => ({
      ...prev,
      [task.id]: isCompleted,
    }));
    saveTaskState(task.id, isCompleted);
    addXp(task.priority, isCompleted ? 'add' : 'remove');
  }, [addXp]);

  const processedTasks = useMemo(() => {
    return allTasks
      .filter(task => !dismissedTaskIds.includes(task.id))
      .map(task => ({
        ...task,
        isCompleted: !!completedTasks[task.id],
      }));
  }, [allTasks, dismissedTaskIds, completedTasks]);

  const getTasksForDay = useCallback((day: DayOfWeek) => {
      return processedTasks
          .filter(task => task.day === day)
          .sort((a, b) => {
              if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
              const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
              return priorityOrder[a.priority] - priorityOrder[b.priority];
          });
  }, [processedTasks]);

  const getAllTasks = useCallback(() => processedTasks, [processedTasks]);
  
  const loading = gardenLoading || weatherLoading || dbStatesLoading;

  const value = { getTasksForDay, dismissTask, toggleTaskComplete, getAllTasks, loading };

  return (
    <TasksContext.Provider value={value}>
      {children}
    </TasksContext.Provider>
  );
};

export const useTasks = (): TasksContextType => {
  const context = useContext(TasksContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
};
