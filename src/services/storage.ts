// ============================================================
// SOUNDWAVE — Local Storage Service
// Typed wrapper around localStorage with error handling.
// ============================================================

import type { Song, Playlist } from '@/types';

const KEYS = {
  LIBRARY: 'sw_library',
  PLAYLISTS: 'sw_playlists',
  LIKED: 'sw_liked_songs',
  RECENT: 'sw_recent',
  USER: 'sw_user',
  TRENDING_PREFIX: 'sw_trending_',
} as const;

const MAX_RECENT = 20;

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('[Storage] Failed to save:', key, err);
  }
}

export const StorageService = {
  // ─── Library ──────────────────────────────────────────────
  getLibrary: (): Song[] => safeGet<Song[]>(KEYS.LIBRARY, []),
  saveLibrary: (songs: Song[]) => safeSet(KEYS.LIBRARY, songs),

  // ─── Playlists ────────────────────────────────────────────
  getPlaylists: (): Playlist[] => safeGet<Playlist[]>(KEYS.PLAYLISTS, []),
  savePlaylists: (playlists: Playlist[]) => safeSet(KEYS.PLAYLISTS, playlists),

  // ─── Liked Songs ──────────────────────────────────────────
  getLikedSongs: (): Song[] => safeGet<Song[]>(KEYS.LIKED, []),
  saveLikedSongs: (songs: Song[]) => safeSet(KEYS.LIKED, songs),

  // ─── Recent Songs ─────────────────────────────────────────
getRecentSongs: (): Song[] => safeGet<Song[]>(KEYS.RECENT, []),

addToRecent(song: Song) {
  const recent = this.getRecentSongs().filter(
    s => s.youtubeId !== song.youtubeId
  );
  recent.unshift({ ...song, addedAt: new Date().toISOString() });
  safeSet(KEYS.RECENT, recent.slice(0, MAX_RECENT));
},

saveRecentSongs: (songs: Song[]) => {
  safeSet(KEYS.RECENT, songs.slice(0, MAX_RECENT));
},

  // ─── Trending Cache ───────────────────────────────────────
  getCachedTrending(genre: string): Song[] | null {
    try {
      const raw = localStorage.getItem(KEYS.TRENDING_PREFIX + genre);
      if (!raw) return null;
      const { data, timestamp, ttl } = JSON.parse(raw) as {
        data: Song[];
        timestamp: number;
        ttl: number;
      };
      if (Date.now() - timestamp > ttl) {
        localStorage.removeItem(KEYS.TRENDING_PREFIX + genre);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  },
  saveTrendingCache(genre: string, songs: Song[], ttl: number) {
    safeSet(KEYS.TRENDING_PREFIX + genre, { data: songs, timestamp: Date.now(), ttl });
  },

  // ─── Clear ────────────────────────────────────────────────
  clearAll() {
    Object.values(KEYS).forEach(key => {
      if (typeof key === 'string') localStorage.removeItem(key);
    });
  },
};