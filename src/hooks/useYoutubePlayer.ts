// ============================================================
// SOUNDWAVE — useYouTubePlayer Hook
// Manages YouTube IFrame API lifecycle.
// ============================================================

import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/store/playStore';
import { useLibraryStore } from '@/store/libraryStore';
import { StorageService } from '@/services/storage';
import type { YTPlayer, YTPlayerOptions, Song } from '@/types';

declare global {
  interface Window {
    YT: {
      Player: new (el: HTMLElement | string, options: YTPlayerOptions) => YTPlayer;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

export function useYouTubePlayer() {
  const intervalRef = useRef<number | null>(null);
  const { setYTPlayer, setReady, setPlaying } = usePlayerStore();

  const stopProgress = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startProgress = useCallback(() => {
    stopProgress();
    intervalRef.current = window.setInterval(() => {
      const player = usePlayerStore.getState().ytPlayer;
      if (!player) return;
      const current = player.getCurrentTime?.() ?? 0;
      const dur = player.getDuration?.() ?? 0;
      if (dur > 0) {
        usePlayerStore.getState().setTime(current, dur);
      }
    }, 500);
  }, [stopProgress]);

  const handleNext = useCallback(() => {
    const lib = useLibraryStore.getState();
    if (lib.songs.length === 0) return;
    const { isShuffled } = usePlayerStore.getState();
    const nextIdx = isShuffled
      ? Math.floor(Math.random() * lib.songs.length)
      : (lib.currentIndex + 1) % lib.songs.length;
    lib.setCurrentIndex(nextIdx);
    const song = lib.songs[nextIdx];
    const player = usePlayerStore.getState().ytPlayer;
    if (player && song) {
      player.loadVideoById(song.youtubeId);
      usePlayerStore.getState().setCurrentSong(song);
      StorageService.addToRecent(song);
    }
  }, []);

  const initPlayer = useCallback(() => {
    if (!window.YT?.Player) return;
    const el = document.getElementById('yt-player-container');
    if (!el) return;

    const player = new window.YT.Player(el, {
      height: '0',
      width: '0',
      playerVars: { autoplay: 0, controls: 0, rel: 0, modestbranding: 1 },
      events: {
        onReady: ({ target }) => {
          target.setVolume(usePlayerStore.getState().volume);
          setYTPlayer(target as YTPlayer);
          setReady(true);
        },
        onStateChange: ({ data }) => {
          if (!window.YT) return;
          switch (data) {
            case window.YT.PlayerState.PLAYING:
              setPlaying(true);
              startProgress();
              break;
            case window.YT.PlayerState.PAUSED:
              setPlaying(false);
              stopProgress();
              break;
            case window.YT.PlayerState.ENDED: {
              setPlaying(false);
              stopProgress();
              const { repeatMode: rm } = usePlayerStore.getState();
              if (rm === 2) {
                player.seekTo(0, true);
                player.playVideo();
              } else {
                handleNext();
              }
              break;
            }
          }
        },
        onError: () => {
          console.warn('[YT] Playback error — skipping');
          window.setTimeout(handleNext, 1500);
        },
      },
    });
  }, [setYTPlayer, setReady, setPlaying, startProgress, stopProgress, handleNext]);

  useEffect(() => {
    if (window.YT?.Player) {
      initPlayer();
    } else {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
      window.onYouTubeIframeAPIReady = initPlayer;
    }
    return () => stopProgress();
  }, [initPlayer, stopProgress]);

  // ─── Player Actions ──────────────────────────────────────

  const loadAndPlay = useCallback((song: Song) => {
    const player = usePlayerStore.getState().ytPlayer;
    if (!player) return;
    player.loadVideoById(song.youtubeId);
    usePlayerStore.getState().setCurrentSong(song);
    StorageService.addToRecent(song);
    useLibraryStore.getState().addToRecent(song);
  }, []);

  const toggle = useCallback(() => {
    const player = usePlayerStore.getState().ytPlayer;
    if (!player) return;
    const { isPlaying } = usePlayerStore.getState();
    isPlaying ? player.pauseVideo() : player.playVideo();
  }, []);

  const seekTo = useCallback((pct: number) => {
    const player = usePlayerStore.getState().ytPlayer;
    if (!player) return;
    const dur = player.getDuration?.() ?? 0;
    player.seekTo((pct / 100) * dur, true);
  }, []);

  const next = useCallback(() => handleNext(), [handleNext]);

  const previous = useCallback(() => {
    const player = usePlayerStore.getState().ytPlayer;
    if (!player) return;
    const current = player.getCurrentTime?.() ?? 0;
    if (current > 3) {
      player.seekTo(0, true);
      return;
    }
    const lib = useLibraryStore.getState();
    const prevIdx = (lib.currentIndex - 1 + lib.songs.length) % lib.songs.length;
    lib.setCurrentIndex(prevIdx);
    const song = lib.songs[prevIdx];
    if (song) {
      player.loadVideoById(song.youtubeId);
      usePlayerStore.getState().setCurrentSong(song);
    }
  }, []);

  return { loadAndPlay, toggle, next, previous, seekTo };
}