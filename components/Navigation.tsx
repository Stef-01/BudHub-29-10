
import React from 'react';
import type { Tab } from '../types';
import { GardenIcon, TasksIcon, RecipeBookIcon, CommunityIcon, GameControllerIcon } from './icons/Icons';

interface NavButtonProps {
  label: Tab;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex flex-col items-center justify-center p-2 text-sm font-medium transition-colors rounded-lg ${
      isActive ? 'text-green-700 bg-green-100' : 'text-gray-500 hover:bg-green-50 hover:text-green-600'
    }`}
    aria-current={isActive ? 'page' : undefined}
  >
    {icon}
    <span className="mt-1">{label}</span>
  </button>
);


interface NavigationProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const navItems: { label: Tab; icon: React.ReactNode }[] = [
    { label: 'Garden', icon: <GardenIcon className="h-6 w-6" /> },
    { label: 'Tasks', icon: <TasksIcon className="h-6 w-6" /> },
    { label: 'Recipes', icon: <RecipeBookIcon className="h-6 w-6" /> },
    { label: 'Events', icon: <CommunityIcon className="h-6 w-6" /> },
    { label: 'Games', icon: <GameControllerIcon className="h-6 w-6" /> },
  ];

  return (
    <nav className="sticky top-[81px] z-10 bg-white/80 backdrop-blur-sm shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-around space-x-2 py-2">
          {navItems.map(item => (
            <NavButton
              key={item.label}
              label={item.label}
              icon={item.icon}
              isActive={activeTab === item.label}
              onClick={() => setActiveTab(item.label)}
            />
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;