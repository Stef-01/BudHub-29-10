// components/cookventure/survey/MasalaTadkaLocker.tsx
import React from 'react';
import MasalaCard from '../shared/MasalaCard';
import TadkaCard from '../shared/TadkaCard';
import type { Masala, Tadka } from '../../../types/cookventure';

interface MasalaTadkaLockerProps {
  availableMasalas: Record<string, Masala>;
  availableTadkas: Record<string, Tadka>;
  selectedMasalas: string[];
  selectedTadkas: string[];
  onToggleMasala: (masalaId: string) => void;
  onToggleTadka: (tadkaId: string) => void;
}

const MasalaTadkaLocker: React.FC<MasalaTadkaLockerProps> = ({
  availableMasalas,
  availableTadkas,
  selectedMasalas,
  selectedTadkas,
  onToggleMasala,
  onToggleTadka,
}) => {
  const masalaIds = Object.keys(availableMasalas);
  const tadkaIds = Object.keys(availableTadkas);

  return (
    <div className="space-y-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          What's in your spice cabinet?
        </h2>
        <p className="text-sm text-gray-600">
          Select the masalas and tadkas you have (or want to use)
        </p>
      </div>

      {/* Masala Locker */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-bold text-gray-800">Masala Locker</h3>
          <span className="text-xs text-gray-500">
            (Spice blends you own or want to try)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {masalaIds.map((masalaId) => (
            <MasalaCard
              key={masalaId}
              masala={{ ...availableMasalas[masalaId], id: masalaId }}
              isSelected={selectedMasalas.includes(masalaId)}
              onToggle={() => onToggleMasala(masalaId)}
            />
          ))}
        </div>

        {selectedMasalas.length > 0 && (
          <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-800">
              ✓ {selectedMasalas.length} masala{selectedMasalas.length > 1 ? 's' : ''} selected:{' '}
              {selectedMasalas
                .map((id) => availableMasalas[id].name)
                .join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Tadka Locker */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-bold text-gray-800">Tadka Locker</h3>
          <span className="text-xs text-gray-500">
            (Tempering styles you love)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tadkaIds.map((tadkaId) => (
            <TadkaCard
              key={tadkaId}
              tadka={{ ...availableTadkas[tadkaId], id: tadkaId }}
              isSelected={selectedTadkas.includes(tadkaId)}
              onToggle={() => onToggleTadka(tadkaId)}
            />
          ))}
        </div>

        {selectedTadkas.length > 0 && (
          <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800">
              ✓ {selectedTadkas.length} tadka{selectedTadkas.length > 1 ? 's' : ''} selected:{' '}
              {selectedTadkas
                .map((id) => availableTadkas[id].name)
                .join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Educational Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-xs text-blue-800 leading-relaxed">
          <span className="font-semibold">💡 Pro tip:</span> Tadka (tempering) is the soul of Indian
          cooking! Hot oil, crackling mustard seeds, aromatic curry leaves - it's where the magic happens.
          Each region has its signature style.
        </p>
      </div>
    </div>
  );
};

export default MasalaTadkaLocker;
