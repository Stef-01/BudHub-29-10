// components/games/nutriserve-ui/ChangelogModal.tsx
import React from 'react';
import { IconXMark } from './Icons';

interface ChangelogModalProps {
  onClose: () => void;
}

const changelog = [
    { version: "3.0.0", date: "August 2024", changes: [
        "Major Release: NutriServe Chef is here!",
        "Added a dynamic meal analysis dashboard.",
        "Introduced customer characters with unique dietary needs.",
        "New scoring system based on nutritional targets.",
        "Integrated high scores and gamification rewards.",
    ]},
    { version: "2.9.0", date: "July 2024", changes: [
        "Added new food visuals: Aloo Gobi, Dal Makhani, Veg Biryani.",
        "Balanced nutrient data for breakfast items.",
    ]},
    { version: "2.7.2", date: "June 2024", changes: [
        "Added new 'Treats' visuals: Laddu, Murukku, Jalebi, and more!",
        "Fixed a bug with serving size calculations for portion-based items.",
    ]},
];

const ChangelogModal: React.FC<ChangelogModalProps> = ({ onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-jump-in max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-slate-800">What's New</h2>
            <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-100">
                <IconXMark className="h-6 w-6" />
            </button>
        </div>
        <div className="overflow-y-auto space-y-6">
            {changelog.map(entry => (
                <div key={entry.version}>
                    <h3 className="text-lg font-semibold text-slate-700">
                        Version {entry.version}
                        <span className="text-sm font-normal text-slate-500 ml-2">{entry.date}</span>
                    </h3>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
                        {entry.changes.map((change, index) => (
                            <li key={index}>{change}</li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ChangelogModal;