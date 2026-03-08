import React from 'react';
import { Home, Search, Library, Heart, User } from 'lucide-react';
import type { View } from '@/types';

interface BottomNavProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const items: { view: View; label: string; icon: React.FC<{ size?: number }> }[] = [
  { view: 'home',    label: 'Home',    icon: Home as React.FC<{ size?: number }> },
  { view: 'search',  label: 'Search',  icon: Search as React.FC<{ size?: number }> },
  { view: 'library', label: 'Library', icon: Library as React.FC<{ size?: number }> },
  { view: 'liked',   label: 'Liked',   icon: Heart as React.FC<{ size?: number }> },
  { view: 'profile', label: 'Profile', icon: User as React.FC<{ size?: number }> },
];
export function BottomNav({ currentView, onViewChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      {items.map(({ view, label, icon: Icon }) => (
        <button
          key={view}
          className={`bottom-nav-item${currentView === view ? ' active' : ''}`}
          onClick={() => onViewChange(view)}
          aria-label={label}
        >
          <Icon size={21} />
          {label}
        </button>
      ))}
    </nav>
  );
}