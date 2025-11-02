// components/Navigation.tsx
import React from 'react';
import type { Tab } from '../../types';
import { GardenIcon, TasksIcon, RecipeBookIcon, CommunityIcon, GameControllerIcon } from './icons/Icons';

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
  const activeClass = isActive ? 'text-green-600' : 'text-gray-500';
  return (
    <button onClick={onClick} className={`flex-1 flex flex-col items-center justify-center p-2 rounded-lg transition-colors hover:bg-green-100 ${activeClass}`}>
      <Icon className="h-6 w-6" />
      <span className="text-xs font-medium mt-1">{item.label}</span>
    </button>
  );
};

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 shadow-t-md z-40">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex justify-around items-center h-16">
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
