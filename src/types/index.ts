// ============================================================
// SOUNDWAVE — Application Types
// ============================================================

// ─── Music ──────────────────────────────────────────────────

export interface Song {
  youtubeId: string;
  title: string;
  artist: string;
  cover: string;
  genre?: string;
  duration?: number;
  likedAt?: string;
  addedAt?: string;
}

export interface Playlist {
  id: string;
  name: string;
  songs: Song[];
  cover?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Artist {
  name: string;
  channelId?: string;
  thumbnail?: string;
  searchQuery: string;
}

// ─── Player ─────────────────────────────────────────────────

export type RepeatMode = 0 | 1 | 2; // 0=off, 1=all, 2=one

export interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  isShuffled: boolean;
  repeatMode: RepeatMode;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  isReady: boolean;
}

// ─── Auth ────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
  token: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// ─── Library ────────────────────────────────────────────────

export interface LibraryState {
  songs: Song[];
  currentIndex: number;
  playlists: Playlist[];
  likedSongs: Song[];
  recentSongs: Song[];
  currentPlaylistId: string | null;
}

// ─── Search / UI ────────────────────────────────────────────

export type Genre = 'all' | 'opm' | 'phonk' | 'pop' | 'rnb' | 'hiphop' | 'indie';

export type View = 'home' | 'search' | 'library' | 'liked' | 'profile';

export interface SearchResult {
  songs: Song[];
  query: string;
  genre: Genre;
}

// ─── YouTube IFrame API ──────────────────────────────────────

export interface YTPlayer {
  loadVideoById(videoId: string): void;
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead?: boolean): void;
  setVolume(volume: number): void;
  getVolume(): number;
  isMuted(): boolean;
  mute(): void;
  unMute(): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  destroy(): void;
}

export interface YTPlayerOptions {
  height?: string | number;
  width?: string | number;
  videoId?: string;
  playerVars?: Record<string, number | string>;
  events?: {
    onReady?: (event: { target: YTPlayer }) => void;
    onStateChange?: (event: { data: number; target: YTPlayer }) => void;
    onError?: (event: { data: number }) => void;
  };
}

// ─── Rate Limiter ────────────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  message?: string;
}

// ─── Cache ───────────────────────────────────────────────────

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}