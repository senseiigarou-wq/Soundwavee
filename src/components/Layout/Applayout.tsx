import { useState } from 'react';
import { Sidebar } from '@/components/Layout/Sidebar';
import { BottomNav } from '@/components/Layout/Bottomnav';
import { NowPlayingBar, MobilePlayer } from '@/components/player/Nowplayingbar';
import { FullPlayer } from '@/components/player/Fullplayer';
import { HomeView } from '@/components/home/Homeview';
import { SearchView } from '@/components/search/Searchview';
import { LibraryView } from '@/components/library/Libraryview';
import { ProfileView } from '@/components/profile/Profileview';
import { SidebarProfilePanel } from '@/components/profile/Sidebarprofilepanel';
import type { View } from '@/types';

type ProfileScreen = 'edit-profile' | 'notifications' | 'appearance' | 'privacy' | null;

function YouTubeContainer() {
  return <div id="yt-player-container" style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none', top: -9999, left: -9999 }} />;
}

export function AppLayout() {
  const [currentView, setCurrentView]       = useState<View>('home');
  const [panelOpen, setPanelOpen]           = useState(false);
  const [desktopProfile, setDesktopProfile] = useState<ProfileScreen>(null);

  // When a profile sub-screen is requested from the desktop panel,
  // we navigate to the mobile-style ProfileView but pre-opened to that screen.
  // We pass it via a query-param-style prop on ProfileView.
  const handleDesktopNavigate = (screen: NonNullable<ProfileScreen>) => {
    setDesktopProfile(screen);
    setCurrentView('profile');
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':    return <HomeView />;
      case 'search':  return <SearchView />;
      case 'library': return <LibraryView />;
      case 'liked':   return <LibraryView />;
      case 'profile': return (
        <ProfileView
          initialScreen={desktopProfile ?? undefined}
          onScreenClear={() => setDesktopProfile(null)}
        />
      );
      default: return <HomeView />;
    }
  };

  return (
    <div className="app-layout">
      <YouTubeContainer />
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onUserClick={() => setPanelOpen(v => !v)}
      />
      {panelOpen && (
        <SidebarProfilePanel
          onClose={() => setPanelOpen(false)}
          onNavigate={handleDesktopNavigate}
        />
      )}
      <div className="app-main">
        <div className="app-scroll">
          {renderView()}
        </div>
        <div className="app-player">
          <NowPlayingBar />
        </div>
      </div>
      <MobilePlayer />
      <BottomNav currentView={currentView} onViewChange={setCurrentView} />
      <FullPlayer />
    </div>
  );
}