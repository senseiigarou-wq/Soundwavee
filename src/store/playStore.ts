// ============================================================
// SOUNDWAVE — Player Store (Zustand)
// ============================================================

import { create } from 'zustand';
import type { Song, RepeatMode, YTPlayer } from '@/types';

interface PlayerStore {
  // State
  ytPlayer: YTPlayer | null;
  currentSong: Song | null;
  isPlaying: boolean;
  isReady: boolean;
  isShuffled: boolean;
  repeatMode: RepeatMode;
  volume: number;
  isMuted: number; // 0 = not muted, saved volume when muted
  currentTime: number;
  duration: number;
  isFullPlayerOpen: boolean;

  // Actions
  setYTPlayer: (player: YTPlayer) => void;
  setReady: (ready: boolean) => void;
  setCurrentSong: (song: Song | null) => void;
  setPlaying: (playing: boolean) => void;
  setTime: (current: number, duration: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  openFullPlayer: () => void;
  closeFullPlayer: () => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  ytPlayer: null,
  currentSong: null,
  isPlaying: false,
  isReady: false,
  isShuffled: false,
  repeatMode: 0,
  volume: 70,
  isMuted: 0,
  currentTime: 0,
  duration: 0,
  isFullPlayerOpen: false,

  setYTPlayer: (player) => set({ ytPlayer: player }),
  setReady: (ready) => set({ isReady: ready }),
  setCurrentSong: (song) => set({ currentSong: song }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setTime: (current, duration) => set({ currentTime: current, duration }),

  setVolume: (volume) => {
    const { ytPlayer } = get();
    const clamped = Math.max(0, Math.min(100, volume));
    ytPlayer?.setVolume(clamped);
    set({ volume: clamped, isMuted: 0 });
  },

  toggleMute: () => {
    const { ytPlayer, volume, isMuted } = get();
    if (isMuted > 0) {
      ytPlayer?.setVolume(isMuted);
      set({ isMuted: 0 });
    } else {
      ytPlayer?.setVolume(0);
      set({ isMuted: volume });
    }
  },

  toggleShuffle: () => set(s => ({ isShuffled: !s.isShuffled })),

  cycleRepeat: () =>
    set(s => ({ repeatMode: ((s.repeatMode + 1) % 3) as RepeatMode })),

  openFullPlayer: () => set({ isFullPlayerOpen: true }),
  closeFullPlayer: () => set({ isFullPlayerOpen: false }),
}));