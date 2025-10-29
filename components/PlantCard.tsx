
import React from 'react';
import type { Plant } from '../types';

const PlantCard: React.FC<{ plant: Plant }> = ({ plant }) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-4 flex flex-col justify-between hover:shadow-lg transition-shadow">
      <div>
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-lg text-green-900">{plant.name}</h3>
          <span className="text-2xl">{plant.icon}</span>
        </div>
        <p className="text-sm text-gray-600">{plant.category}</p>
      </div>
      <div className="mt-4">
        <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-1 rounded-full">
          {plant.phenology}
        </span>
      </div>
    </div>
  );
};

export default PlantCard;
