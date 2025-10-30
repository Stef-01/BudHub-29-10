// Fix: Implemented UserGardenContext to resolve missing module errors.
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import type { Plant } from '../types';
import { getMyPlants, addPlant as dbAddPlant, removePlant as dbRemovePlant } from '../services/db';

interface UserGardenContextType {
  myPlants: Plant[];
  addPlant: (plant: Plant) => void;
  removePlant: (plantId: number) => void;
  loading: boolean;
}

const UserGardenContext = createContext<UserGardenContextType | undefined>(undefined);

export const UserGardenProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [myPlants, setMyPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlants = async () => {
      setLoading(true);
      const plants = await getMyPlants();
      setMyPlants(plants);
      setLoading(false);
    };
    loadPlants();
  }, []);

  const addPlant = (plant: Plant) => {
    setMyPlants(prev => {
      // Avoid duplicates
      if (prev.some(p => p.id === plant.id)) return prev;
      dbAddPlant(plant.id);
      return [...prev, plant];
    });
  };

  const removePlant = (plantId: number) => {
    setMyPlants(prev => prev.filter(p => p.id !== plantId));
    dbRemovePlant(plantId);
  };

  return (
    <UserGardenContext.Provider value={{ myPlants, addPlant, removePlant, loading }}>
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