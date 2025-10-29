// Fix: Implemented UserGardenContext to resolve missing module errors.
import React, { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Plant } from '../types';
import { PLANT_CATALOG } from '../constants';

interface UserGardenContextType {
  myPlants: Plant[];
  addPlant: (plant: Plant) => void;
  removePlant: (plantId: number) => void;
}

const UserGardenContext = createContext<UserGardenContextType | undefined>(undefined);

// Start the user with a couple of plants to get them going.
const INITIAL_GARDEN: Plant[] = [PLANT_CATALOG[0], PLANT_CATALOG[2]];

export const UserGardenProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [myPlants, setMyPlants] = useLocalStorage<Plant[]>('user_garden_plants', INITIAL_GARDEN);

  const addPlant = (plant: Plant) => {
    setMyPlants(prev => {
      // Avoid duplicates
      if (prev.some(p => p.id === plant.id)) return prev;
      return [...prev, plant];
    });
  };

  const removePlant = (plantId: number) => {
    setMyPlants(prev => prev.filter(p => p.id !== plantId));
  };

  return (
    <UserGardenContext.Provider value={{ myPlants, addPlant, removePlant }}>
      {children}
    </UserGardenContext.Provider>
  );
};

export const useUserGarden = (): UserGardenContextType => {
  const context = useContext(UserGardenContext);
  if (context === undefined) {
    throw new Error('useUserGarden must be used within a UserGardenProvider');
  }
  return context;
};