// components/cookventure/shared/FlavorAxisSlider.tsx
import React from 'react';

interface FlavorAxisSliderProps {
  label: string;
  labelHi?: string;
  emoji: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  help?: string;
}

const FlavorAxisSlider: React.FC<FlavorAxisSliderProps> = ({
  label,
  labelHi,
  emoji,
  value,
  onChange,
  min = 0,
  max = 3,
  help,
}) => {
  const labels = ['None', 'Mild', 'Medium', 'High'];
  const percentage = (value / max) * 100;

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          <div>
            <h4 className="font-semibold text-gray-800 text-sm">
              {label}
              {labelHi && <span className="ml-2 text-gray-500 text-xs">({labelHi})</span>}
            </h4>
            {help && <p className="text-[10px] text-gray-500">{help}</p>}
          </div>
        </div>
        <div className="font-bold text-lg text-green-600">
          {value}/{max}
        </div>
      </div>

      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
          style={{
            background: `linear-gradient(to right, #10B981 0%, #10B981 ${percentage}%, #E5E7EB ${percentage}%, #E5E7EB 100%)`,
          }}
        />

        {/* Value Labels */}
        <div className="flex justify-between mt-1 px-1">
          {labels.map((label, idx) => (
            <span
              key={idx}
              className={`text-[10px] font-medium ${
                value === idx ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: #10B981;
          border: 3px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider-thumb::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #10B981;
          border: 3px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
};

export default FlavorAxisSlider;
