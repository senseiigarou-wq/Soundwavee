// ============================================================
// SOUNDWAVE — Library Store
//
// Two-layer storage:
//   1. localStorage — instant local cache (UI updates immediately)
//   2. Firestore    — permanent cloud storage (synced in background)
//
// Every mutation updates localStorage first (so the UI feels
// instant), then syncs to Firestore in the background.
// If Firestore fails, the data is still safe locally.
//
// ============================================================

import { create } from 'zustand';
import { StorageService } // storage - platform specific, removed from shared;
import { RateLimiter } from '../services/ratelimiter';
import {
  savePlaylist,
  deletePlaylistFromDB,
  likeSong,
  unlikeSong,
  saveRecentSongs,
  type UserLibraryData,
} from '../services/firestoreService';
import type { Song, Playlist, Artist, LibraryState } from '../types';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ─── Get current user uid (avoids circular import) ───────────
function getUid(): string | null {
  try {
    const raw = localStorage.getItem('sw_auth_user');
    return raw ? (JSON.parse(raw) as { id: string }).id : null;
  } catch { return null; }
}

// ─── Background Firestore sync helper ────────────────────────
// Retries once after 2s on failure to handle transient errors
function syncBg(fn: () => Promise<void>) {
  fn().catch(() => {
    setTimeout(() => fn().catch(e => console.warn('[Firestore sync]', e)), 2000);
  });
}

// ─── Store ───────────────────────────────────────────────────

interface LibraryStore extends LibraryState {
  init:                () => void;
  hydrateFromFirestore:(data: UserLibraryData) => void;
  clearAll:            () => void;

  addSong:             (song: Song) => void;
  removeSong:          (youtubeId: string) => void;
  setCurrentIndex:     (index: number) => void;
  loadQueue:           (songs: Song[], startIndex?: number) => void;

  toggleLike:          (song: Song) => boolean;
  isLiked:             (youtubeId: string) => boolean;

  createPlaylist:      (name: string) => boolean;
  deletePlaylist:      (id: string) => void;
  addToPlaylist:       (playlistId: string, song: Song) => boolean;
  removeFromPlaylist:  (playlistId: string, youtubeId: string) => void;

  addToRecent:         (song: Song) => void;
  removeFromRecent:    (youtubeId: string) => void;
  clearHistory:        () => void;

  followArtist:        (artist: Artist) => void;
  unfollowArtist:      (name: string) => void;
  isFollowing:         (name: string) => boolean;
}

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  songs:             [],
  currentIndex:      0,
  playlists:         [],
  likedSongs:        [],
  recentSongs:       [],
  followedArtists:   [],
  currentPlaylistId: null,

  // ── Init from localStorage (before Firestore loads) ─────────
  init: () => {
    set({
      songs:           StorageService.getLibrary(),
      playlists:       StorageService.getPlaylists(),
      likedSongs:      StorageService.getLikedSongs(),
      recentSongs:     StorageService.getRecentSongs(),
      followedArtists: StorageService.getFollowedArtists(),
    });
  },

  // ── Hydrate from Firestore (called after login) ──────────────
  // Firestore is the source of truth — overwrites localStorage cache
  hydrateFromFirestore: ({ playlists, likedSongs, recentSongs }) => {
    StorageService.savePlaylists(playlists);
    StorageService.saveLikedSongs(likedSongs);
    StorageService.saveRecentSongs(recentSongs);
    set({ playlists, likedSongs, recentSongs });
  },

  // ── Clear on logout ─────────────────────────────────────────
  clearAll: () => {
    StorageService.saveLibrary([]);
    StorageService.savePlaylists([]);
    StorageService.saveLikedSongs([]);
    StorageService.saveRecentSongs([]);
    set({ songs: [], playlists: [], likedSongs: [], recentSongs: [], currentIndex: 0 });
  },

  // ── Songs (local queue only — not stored in Firestore) ───────
  addSong: (song) => {
    const { songs } = get();
    if (songs.some(s => s.youtubeId === song.youtubeId)) return;
    const updated = [...songs, { ...song, addedAt: new Date().toISOString() }];
    StorageService.saveLibrary(updated);
    set({ songs: updated });
  },

  // Load an entire array as the active playback queue and set the
  // starting index — used when playing from a playlist so next/prev work.
  loadQueue: (songs, startIndex = 0) => {
    const withTimestamp = songs.map(s => ({ ...s, addedAt: s.addedAt ?? new Date().toISOString() }));
    StorageService.saveLibrary(withTimestamp);
    set({ songs: withTimestamp, currentIndex: startIndex });
  },

  removeSong: (youtubeId) => {
    const updated = get().songs.filter(s => s.youtubeId !== youtubeId);
    StorageService.saveLibrary(updated);
    set({ songs: updated });
  },

  setCurrentIndex: (index) => set({ currentIndex: index }),

  // ── Likes ─────────────────────────────────────────────────
  toggleLike: (song) => {
    const { likedSongs } = get();
    const alreadyLiked = likedSongs.some(s => s.youtubeId === song.youtubeId);
    const likedSong = { ...song, likedAt: new Date().toISOString() };

    const updated = alreadyLiked
      ? likedSongs.filter(s => s.youtubeId !== song.youtubeId)
      : [likedSong, ...likedSongs];

    StorageService.saveLikedSongs(updated);
    set({ likedSongs: updated });

    const uid = getUid();
    if (uid) {
      syncBg(() => alreadyLiked
        ? unlikeSong(uid, song.youtubeId)
        : likeSong(uid, likedSong),
      );
    }

    return !alreadyLiked;
  },

  isLiked: (youtubeId) => get().likedSongs.some(s => s.youtubeId === youtubeId),

  // ── Playlists ──────────────────────────────────────────────
  createPlaylist: (name) => {
    const v = RateLimiter.validatePlaylistName(name);
    if (!v.valid) return false;
    const { playlists } = get();
    if (playlists.some(p => p.name.toLowerCase() === v.sanitized.toLowerCase())) return false;

    const newPl: Playlist = {
      id:        generateId(),
      name:      v.sanitized,
      songs:     [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...playlists, newPl];
    StorageService.savePlaylists(updated);
    set({ playlists: updated });

    const uid = getUid();
    if (uid) syncBg(() => savePlaylist(uid, newPl));

    return true;
  },

  deletePlaylist: (id) => {
    const updated = get().playlists.filter(p => p.id !== id);
    StorageService.savePlaylists(updated);
    set({ playlists: updated });

    const uid = getUid();
    if (uid) syncBg(() => deletePlaylistFromDB(uid, id));
  },

  addToPlaylist: (playlistId, song) => {
    const { playlists } = get();
    const pl = playlists.find(p => p.id === playlistId);
    if (!pl || pl.songs.some(s => s.youtubeId === song.youtubeId)) return false;

    const updated = playlists.map(p =>
      p.id === playlistId
        ? { ...p, songs: [...p.songs, song], updatedAt: new Date().toISOString() }
        : p,
    );
    StorageService.savePlaylists(updated);
    set({ playlists: updated });

    const uid = getUid();
    const updatedPl = updated.find(p => p.id === playlistId)!;
    if (uid) syncBg(() => savePlaylist(uid, updatedPl));

    return true;
  },

  removeFromPlaylist: (playlistId, youtubeId) => {
    const updated = get().playlists.map(p =>
      p.id === playlistId
        ? { ...p, songs: p.songs.filter(s => s.youtubeId !== youtubeId), updatedAt: new Date().toISOString() }
        : p,
    );
    StorageService.savePlaylists(updated);
    set({ playlists: updated });

    const uid = getUid();
    const updatedPl = updated.find(p => p.id === playlistId);
    if (uid && updatedPl) syncBg(() => savePlaylist(uid, updatedPl));
  },

  // ── Recent Songs ──────────────────────────────────────────
  addToRecent: (song) => {
    StorageService.addToRecent(song);
    const recentSongs = StorageService.getRecentSongs();
    set({ recentSongs });

    const uid = getUid();
    if (uid) syncBg(() => saveRecentSongs(uid, recentSongs));
  },

  removeFromRecent: (youtubeId) => {
    StorageService.removeFromRecent(youtubeId);
    const recentSongs = StorageService.getRecentSongs();
    set({ recentSongs });

    const uid = getUid();
    if (uid) syncBg(() => saveRecentSongs(uid, recentSongs));
  },

  clearHistory: () => {
    StorageService.clearRecentSongs();
    set({ recentSongs: [] });

    const uid = getUid();
    if (uid) syncBg(() => saveRecentSongs(uid, []));
  },

  // ── Followed Artists ────────────────────────────────────────
  followArtist: (artist) => {
    const current = get().followedArtists;
    if (current.some(a => a.name === artist.name)) return;
    const updated = [artist, ...current];
    StorageService.saveFollowedArtists(updated);
    set({ followedArtists: updated });
  },

  unfollowArtist: (name) => {
    const updated = get().followedArtists.filter(a => a.name !== name);
    StorageService.saveFollowedArtists(updated);
    set({ followedArtists: updated });
  },

  isFollowing: (name) => get().followedArtists.some(a => a.name === name),
}));
