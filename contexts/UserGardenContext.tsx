// contexts/UserGardenContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import type { Plant } from '../types';
import { getMyPlants, addPlant as dbAddPlant, removePlant as dbRemovePlant } from '../services/db';
import { backupUserGarden, restoreUserGarden } from '../services/imageBackupService';
import { PLANT_CATALOG, INITIAL_GARDEN } from '../constants';

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
      let plants = await getMyPlants();

      // Self-Healing Logic
      if (plants.length === 0) {
        console.log("Primary garden store is empty, checking for backup...");
        const backupPlantIds = restoreUserGarden();
        if (backupPlantIds) {
          console.log("Found garden backup, restoring...");
          const restoredPlants = backupPlantIds
            .map(id => PLANT_CATALOG.find(p => p.id === id))
            .filter((p): p is Plant => !!p);
          
          // Write the restored data back to the primary DB
          for (const plant of restoredPlants) {
            await dbAddPlant(plant.id);
          }
          plants = restoredPlants;
          console.log("Garden restored from backup.");
        } else {
            console.log("No backup found, initializing with default garden.");
            // If still no plants, initialize with default. This only runs on true first launch.
            for (const plant of INITIAL_GARDEN) {
                await dbAddPlant(plant.id);
            }
            plants = INITIAL_GARDEN;
        }
      }
      setMyPlants(plants);
      setLoading(false);
    };
    loadPlants();
  }, []);

  const addPlant = useCallback(async (plant: Plant) => {
    const plantExists = myPlants.some(p => p.id === plant.id);
    const plantInCatalog = PLANT_CATALOG.find(p => p.id === plant.id);
    
    if (!plantExists && plantInCatalog) {
      const newPlants = [...myPlants, plantInCatalog];
      setMyPlants(newPlants);
      await dbAddPlant(plant.id);
      await backupUserGarden(newPlants); // Write to backup
    }
  }, [myPlants]);

  const removePlant = useCallback(async (plantId: number) => {
    const newPlants = myPlants.filter(p => p.id !== plantId);
    setMyPlants(newPlants);
    await dbRemovePlant(plantId);
    await backupUserGarden(newPlants); // Write to backup
  }, [myPlants]);

  const value = { myPlants, addPlant, removePlant, loading };

  return (
    <UserGardenContext.Provider value={value}>
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