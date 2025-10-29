// Fix: Implemented GardenView component to resolve missing module errors.
import React, { useState } from 'react';
import type { Weather } from '../types';
import { useUserGarden } from '../contexts/UserGardenContext';
import PlantCard from './PlantCard';
import WeatherCard from './WeatherCard';
import AddPlantModal from './AddPlantModal';
import { PlusIcon } from './icons/Icons';

interface GardenViewProps {
  weather: Weather | null;
}

const GardenView: React.FC<GardenViewProps> = ({ weather }) => {
  const { myPlants } = useUserGarden();
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-8">
      {weather && <WeatherCard weather={weather} />}
      
      <div>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
          <h2 className="text-2xl font-bold text-green-900">My Garden Patch</h2>
          <button 
            onClick={() => setModalOpen(true)}
            className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add/Remove Plants
          </button>
        </div>

        {myPlants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {myPlants.map(plant => (
              <PlantCard key={plant.id} plant={plant} />
            ))}
          </div>
        ) : (
          <div className="text-center p-8 bg-white/80 rounded-xl">
            <h3 className="text-xl font-semibold text-gray-700">Your garden is empty!</h3>
            <p className="text-gray-500 mt-2">Click 'Add/Remove Plants' to start your garden.</p>
          </div>
        )}
      </div>

      {isModalOpen && <AddPlantModal onClose={() => setModalOpen(false)} />}
    </div>
  );
};

export default GardenView;