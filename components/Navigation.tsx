// components/Navigation.tsx
import React from 'react';
import type { Tab } from '../types';
import { GardenIcon, TasksIcon, RecipeBookIcon, CommunityIcon, GameControllerIcon, AdminIcon } from './icons/Icons';

interface NavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const navItems: { tab: Tab, label: string, icon: React.FC<any> }[] = [
  { tab: 'Garden', label: 'Garden', icon: GardenIcon },
  { tab: 'Tasks', label: 'Tasks', icon: TasksIcon },
  { tab: 'Recipes', label: 'Recipes', icon: RecipeBookIcon },
  { tab: 'Events', label: 'Events', icon: CommunityIcon },
  { tab: 'Games', label: 'Games', icon: GameControllerIcon },
];

const NavItem: React.FC<{
  item: typeof navItems[0];
  isActive: boolean;
  onClick: () => void;
}> = ({ item, isActive, onClick }) => {
  const Icon = item.icon;
  const activeClass = isActive ? 'text-green-600 bg-green-50' : 'text-gray-500';
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-200 hover:bg-green-100 ${activeClass}`}
    >
      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
      <span className="text-[10px] sm:text-xs font-medium mt-1 whitespace-nowrap">{item.label}</span>
    </button>
  );
};

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg z-40">
      <div className="max-w-7xl mx-auto px-1 sm:px-2 lg:px-4">
        <div className="flex justify-between items-center h-16 gap-0.5 sm:gap-1">
          {navItems.map(item => (
            <NavItem
              key={item.tab}
              item={item}
              isActive={activeTab === item.tab}
              onClick={() => onTabChange(item.tab)}
            />
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
