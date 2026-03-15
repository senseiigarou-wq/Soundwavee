import React, { useState } from 'react';
import { Sidebar } from '@/components/Layout/Sidebar';
import { BottomNav } from '@/components/Layout/Bottomnav';
import { NowPlayingBar, MobilePlayer } from '@/components/player/Nowplayingbar';
import { FullPlayer } from '@/components/player/Fullplayer';
import { AddToPlaylistModal } from '@/components/common/Addtoplaylistmodal';
import { HomeView } from '@/components/home/Homeview';
import { SearchView } from '@/components/search/Searchview';
import { LibraryView } from '@/components/library/Libraryview';
import { ProfileView } from '@/components/profile/Profileview';
import { ArtistView } from '@/components/artist/Artistview';
import { SidebarProfilePanel } from '@/components/profile/Sidebarprofilepanel';
import type { View, Artist } from '@/types';

type ProfileScreen = 'edit-profile' | 'notifications' | 'appearance' | 'privacy' | null;

function YouTubeContainer() {
  return <div id="yt-player-container" style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none', top: -9999, left: -9999 }} />;
}

export function AppLayout() {
  const [currentView, setCurrentView]       = useState<View>('home');
  const [panelOpen, setPanelOpen]           = useState(false);
  const [desktopProfile, setDesktopProfile] = useState<ProfileScreen>(null);
  const [currentArtist, setCurrentArtist]   = useState<Artist | null>(null);
  const [artistHistory, setArtistHistory]   = useState<Artist[]>([]);

  const handleDesktopNavigate = (screen: NonNullable<ProfileScreen>) => {
    setDesktopProfile(screen);
    setCurrentView('profile');
  };

  // Navigate to artist page — supports back-stack for related artist clicks
  const navigateToArtist = (artist: Artist, fromView?: View) => {
    if (fromView) setArtistHistory([]); // fresh entry from non-artist view
    setCurrentArtist(artist);
    setCurrentView('artist');
  };

  const handleArtistBack = () => {
    if (artistHistory.length > 0) {
      // Pop back to previous artist
      const prev = [...artistHistory];
      const last = prev.pop()!;
      setArtistHistory(prev);
      setCurrentArtist(last);
    } else {
      // Back to wherever we came from
      setCurrentArtist(null);
      setCurrentView('home');
    }
  };

  const handleRelatedArtistClick = (artist: Artist) => {
    // Push current artist to history stack
    if (currentArtist) {
      setArtistHistory(prev => [...prev, currentArtist]);
    }
    setCurrentArtist(artist);
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':    return <HomeView onArtistClick={a => navigateToArtist(a, 'home')} />;
      case 'search':  return <SearchView onArtistClick={a => navigateToArtist(a, 'search')} />;
      case 'library': return <LibraryView onNavigate={setCurrentView} onArtistClick={a => navigateToArtist(a, 'library')} />;
      case 'liked':   return <LibraryView onNavigate={setCurrentView} onArtistClick={a => navigateToArtist(a, 'liked')} />;
      case 'artist':  return currentArtist
        ? <ArtistView artist={currentArtist} onBack={handleArtistBack} onArtistClick={handleRelatedArtistClick} />
        : <HomeView onArtistClick={a => navigateToArtist(a, 'home')} />;
      case 'profile': return (
        <ProfileView
          initialScreen={desktopProfile ?? undefined}
          onScreenClear={() => setDesktopProfile(null)}
        />
      );
      default: return <HomeView onArtistClick={a => navigateToArtist(a, 'home')} />;
    }
  };

  return (
    <div className="app-layout">
      <YouTubeContainer />
      <Sidebar
        currentView={currentView}
        onViewChange={v => { setCurrentArtist(null); setArtistHistory([]); setCurrentView(v); }}
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
      <BottomNav
        currentView={currentView}
        onViewChange={v => { setCurrentArtist(null); setArtistHistory([]); setCurrentView(v); }}
      />
      <FullPlayer />
      <AddToPlaylistModal />
    </div>
  );
}
