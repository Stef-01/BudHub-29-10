// components/GardenView.tsx
import React, { useState } from 'react';
import { useUserGarden } from '../contexts/UserGardenContext';
import PlantCard from './PlantCard';
import WeatherCard from './WeatherCard';
import GeminiTip from './GeminiTip';
import { useWeather } from '../contexts/WeatherContext';
import AlertBanner from './AlertBanner';
import AddPlantModal from './AddPlantModal';
import Button from './ui/Button';
import { PlusIcon } from './icons/Icons';

const GardenView: React.FC = () => {
    const { myPlants } = useUserGarden();
    const { weather, alerts } = useWeather();
    const [isAddPlantModalOpen, setAddPlantModalOpen] = useState(false);

    return (
        <div className="space-y-6">
            {alerts.map((alert, index) => <AlertBanner key={index} alert={alert} />)}
            
            {weather && <WeatherCard weather={weather} />}
            
            {weather && myPlants.length > 0 && <GeminiTip />}

            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-green-900">My Garden</h2>
                    <Button onClick={() => setAddPlantModalOpen(true)}>
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Manage Plants
                    </Button>
                </div>
                {myPlants.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {myPlants.map(plant => (
                            <PlantCard key={plant.id} plant={plant} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-8 bg-white/80 rounded-xl">
                        <h3 className="text-xl font-semibold text-gray-700">Your garden is empty!</h3>
                        <p className="text-gray-500 mt-2">Add some plants to get started and receive personalized tasks.</p>
                    </div>
                )}
            </div>

            {isAddPlantModalOpen && <AddPlantModal onClose={() => setAddPlantModalOpen(false)} />}
        </div>
    );
};

export default GardenView;
