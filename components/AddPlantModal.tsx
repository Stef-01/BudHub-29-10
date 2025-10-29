import React from 'react';
import type { Plant } from '../types';
import { XIcon, PlusIcon, TrashIcon } from './icons/Icons';
import { PLANT_CATALOG } from '../constants';
import { useUserGarden } from '../contexts/UserGardenContext';

interface AddPlantModalProps {
  onClose: () => void;
}

const AddPlantModal: React.FC<AddPlantModalProps> = ({ onClose }) => {
  const { myPlants, addPlant, removePlant } = useUserGarden();
  const myPlantIds = new Set(myPlants.map(p => p.id));

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-plant-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
          <h2 id="add-plant-title" className="text-xl sm:text-2xl font-bold text-green-900">Manage Your Garden</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            aria-label="Close"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </header>

        <main className="p-4 sm:p-6 overflow-y-auto">
          <ul className="space-y-3">
            {PLANT_CATALOG.map(plant => {
              const isInGarden = myPlantIds.has(plant.id);
              return (
                <li key={plant.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-3xl mr-4">{plant.icon}</span>
                    <div>
                        <p className="font-semibold text-gray-800">{plant.name}</p>
                        <p className="text-sm text-gray-500">{plant.category}</p>
                    </div>
                  </div>
                  {isInGarden ? (
                    <button
                      onClick={() => removePlant(plant.id)}
                      className="flex items-center justify-center px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-full font-semibold transition-colors text-sm"
                      aria-label={`Remove ${plant.name} from your garden`}
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={() => addPlant(plant)}
                      className="flex items-center justify-center px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-full font-semibold transition-colors text-sm"
                      aria-label={`Add ${plant.name} to your garden`}
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </main>

        <footer className="p-4 bg-gray-50 rounded-b-2xl flex justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-green-600 text-white border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  );
};

export default AddPlantModal;