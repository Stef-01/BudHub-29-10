// components/cookventure/survey/FlavorDials.tsx
import React from 'react';
import FlavorAxisSlider from '../shared/FlavorAxisSlider';
import type { TasteAxes } from '../../../types/cookventure';

interface FlavorDialsProps {
  tastePrefs: TasteAxes;
  onChangeTaste: (newTaste: TasteAxes) => void;
}

const FlavorDials: React.FC<FlavorDialsProps> = ({ tastePrefs, onChangeTaste }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          How do you like your food?
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Adjust the flavor intensity to match your taste
        </p>

        {/* Educational Tooltip */}
        <div className="inline-block bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-xs text-blue-800">
          <span className="font-semibold">💡 Did you know?</span> In Indian cooking, "spicy" can mean
          <strong> flavorful</strong> (masaledar) OR <strong>hot</strong> (teekha).
          We split them so you get exactly what you want!
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md space-y-6">
        <FlavorAxisSlider
          label="Teekha (Heat)"
          labelHi="तीखा"
          emoji="🌶️"
          value={tastePrefs.heat}
          onChange={(v) => onChangeTaste({ ...tastePrefs, heat: v })}
          min={0}
          max={3}
          help="Chili heat level"
        />

        <div className="border-t border-gray-200 pt-6">
          <FlavorAxisSlider
            label="Masaledar (Spice-rich)"
            labelHi="मसालेदार"
            emoji="🧄🧅🫚"
            value={tastePrefs.masala}
            onChange={(v) => onChangeTaste({ ...tastePrefs, masala: v })}
            min={0}
            max={3}
            help="Aroma & warmth from spices (not just heat)"
          />
        </div>

        <div className="border-t border-gray-200 pt-6">
          <FlavorAxisSlider
            label="Khata (Tangy)"
            labelHi="खट्टा"
            emoji="🍋"
            value={tastePrefs.tangy}
            onChange={(v) => onChangeTaste({ ...tastePrefs, tangy: v })}
            min={0}
            max={3}
            help="Sourness from tamarind, kokum, amchur"
          />
        </div>

        <div className="border-t border-gray-200 pt-6">
          <FlavorAxisSlider
            label="Meetha (Sweet)"
            labelHi="मीठा"
            emoji="🍯"
            value={tastePrefs.sweet}
            onChange={(v) => onChangeTaste({ ...tastePrefs, sweet: v })}
            min={0}
            max={3}
            help="Sweetness or caramelization"
          />
        </div>
      </div>

      {/* Taste Summary */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
        <p className="text-sm font-medium text-green-800 mb-2">Your flavor profile:</p>
        <div className="flex flex-wrap gap-2">
          {tastePrefs.heat > 0 && (
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
              🌶️ Heat: {tastePrefs.heat}/3
            </span>
          )}
          {tastePrefs.masala > 0 && (
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
              🧄 Masala: {tastePrefs.masala}/3
            </span>
          )}
          {tastePrefs.tangy > 0 && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
              🍋 Tangy: {tastePrefs.tangy}/3
            </span>
          )}
          {tastePrefs.sweet > 0 && (
            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
              🍯 Sweet: {tastePrefs.sweet}/3
            </span>
          )}
          {tastePrefs.heat === 0 && tastePrefs.masala === 0 && tastePrefs.tangy === 0 && tastePrefs.sweet === 0 && (
            <span className="text-xs text-gray-500 italic">
              Adjust the sliders to see your profile
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlavorDials;
