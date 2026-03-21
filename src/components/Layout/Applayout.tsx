import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Layout/Sidebar';
import { BottomNav } from '@/components/Layout/Bottomnav';
import { NowPlayingBar, MobilePlayer } from '@/components/player/Nowplayingbar';
import { FullPlayer } from '@/components/player/Fullplayer';
import { AddToPlaylistModal } from '@/components/common/Addtoplaylistmodal';
import { HomeView } from '@/components/home/Homeview';
import { SearchView } from '@/components/search/Searchview';
import { LibraryView } from '@/components/library/LibraryView';
import { ProfileView } from '@/components/profile/Profileview';
import { ArtistView } from '@/components/Artist/ArtistView';
import { SeeAllView } from '@/components/home/SeeAllView';
import { SocialView } from '@/components/Social/SocialView';
import { SidebarProfilePanel } from '@/components/profile/Sidebarprofilepanel';
import { useLibraryStore } from '@/store/libraryStore';
import { usePlayerStore } from '@/store/playStore';
import type { View, Artist, Genre, SocialPlaylist } from '@/types';

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
  const [seeAll, setSeeAll]                 = useState<{ genre: Genre; label: string } | null>(null);

  // ── Handle shared song/playlist URLs ───────────────────────
  useEffect(() => {
    const path = window.location.pathname;

    // Handle /song/:youtubeId
    const songMatch = path.match(/^\/song\/([a-zA-Z0-9_-]+)$/);
    if (songMatch) {
      const youtubeId = songMatch[1];
      usePlayerStore.getState().playSong({
        youtubeId,
        title:  'Shared Song',
        artist: '',
        cover:  `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
      });
      window.history.replaceState({}, '', '/');
      return;
    }

    // Handle /playlist/:token
    const playlistMatch = path.match(/^\/playlist\/([a-zA-Z0-9_-]+)$/);
    if (playlistMatch) {
      // Token-based playlist sharing — extend this to load from Firestore if needed
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const handleDesktopNavigate = (screen: NonNullable<ProfileScreen>) => {
    setDesktopProfile(screen);
    setCurrentView('profile');
  };

  const navigateToArtist = (artist: Artist, fromView?: View) => {
    if (fromView) setArtistHistory([]);
    setCurrentArtist(artist);
    setCurrentView('artist');
  };

  const handlePlaySocialPlaylist = (pl: SocialPlaylist) => {
    if (pl.songs.length === 0) return;
    useLibraryStore.getState().loadQueue(pl.songs, 0);
    setCurrentView('home');
  };

  const handleArtistBack = () => {
    if (artistHistory.length > 0) {
      const prev = [...artistHistory];
      const last = prev.pop()!;
      setArtistHistory(prev);
      setCurrentArtist(last);
    } else {
      setCurrentArtist(null);
      setCurrentView('home');
    }
  };

  const handleRelatedArtistClick = (artist: Artist) => {
    if (currentArtist) setArtistHistory(prev => [...prev, currentArtist]);
    setCurrentArtist(artist);
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
        if (seeAll) return <SeeAllView genre={seeAll.genre} genreLabel={seeAll.label} onBack={() => setSeeAll(null)} />;
        return <HomeView onArtistClick={(a: Artist) => navigateToArtist(a, 'home')} onSeeAll={(g, l) => setSeeAll({ genre: g, label: l })} />;
      case 'search':  return <SearchView onArtistClick={(a: Artist) => navigateToArtist(a, 'search')} />;
      case 'library': return <LibraryView onNavigate={setCurrentView} onArtistClick={(a: Artist) => navigateToArtist(a, 'library')} />;
      case 'liked':   return <LibraryView onNavigate={setCurrentView} onArtistClick={(a: Artist) => navigateToArtist(a, 'liked')} />;
      case 'social':  return <SocialView onPlaySocialPlaylist={handlePlaySocialPlaylist} />;
      case 'artist':  return currentArtist
        ? <ArtistView artist={currentArtist} onBack={handleArtistBack} onArtistClick={handleRelatedArtistClick} />
        : <HomeView onArtistClick={(a: Artist) => navigateToArtist(a, 'home')} />;
      case 'profile': return (
        <ProfileView
          initialScreen={desktopProfile ?? undefined}
          onScreenClear={() => setDesktopProfile(null)}
        />
      );
      default: return <HomeView onArtistClick={(a: Artist) => navigateToArtist(a, 'home')} />;
    }
  };

  return (
    <div className="app-layout">
      <YouTubeContainer />
      <Sidebar
        currentView={currentView}
        onViewChange={(v: View) => { setCurrentArtist(null); setArtistHistory([]); setSeeAll(null); setCurrentView(v); }}
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
        onViewChange={(v: View) => { setCurrentArtist(null); setArtistHistory([]); setSeeAll(null); setCurrentView(v); }}
      />
      <FullPlayer />
      <AddToPlaylistModal />
    </div>
  );
}
