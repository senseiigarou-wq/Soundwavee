import React from 'react';
import { Home, Search, Library, Users, User, type LucideIcon } from 'lucide-react';
import type { View } from '@/types';

interface BottomNavProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const items: { view: View; label: string; icon: LucideIcon }[] = [
  { view: 'home',    label: 'Home',    icon: Home    },
  { view: 'search',  label: 'Search',  icon: Search  },
  { view: 'library', label: 'Library', icon: Library },
  { view: 'social',  label: 'Social',  icon: Users   },
  { view: 'profile', label: 'Profile', icon: User    },
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
          <Icon size={20} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
