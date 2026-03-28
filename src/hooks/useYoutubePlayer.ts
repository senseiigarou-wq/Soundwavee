// ============================================================
// SOUNDWAVE — useYouTubePlayer Hook
// Module-level singleton so initialization runs exactly once
// regardless of how many components call this hook or how many
// times they re-render.
// ============================================================

import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/store/playStore';
import { useLibraryStore } from '@/store/libraryStore';
import { StorageService } from '@/services/storage';
import { useMediaSession } from './Usemediasession';
import { JamendoService } from '@/services/jamendoService';
import { getCachedAudioUrl, cacheSongForOffline } from '@/services/offlineService';
import type { YTPlayer, YTPlayerOptions, Song } from '@/types';

declare global {
  interface Window {
    YT: {
      Player: new (el: HTMLElement | string, options: YTPlayerOptions) => YTPlayer;
      PlayerState: { ENDED: number; PLAYING: number; PAUSED: number; BUFFERING: number; CUED: number; };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

// ── Module-level singletons ──────────────────────────────────
// These live outside React so they are NEVER reset by re-renders.
let ytInitialized  = false;  // YT player created?
let progressTimer: number | null = null;
let bgAudio: HTMLAudioElement | null = null;
let jamendoAudio: HTMLAudioElement | null = null;  // Jamendo direct MP3 player

// Silent 1-second looping MP3 — holds the OS audio session alive
const SILENT_MP3 =
  'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA' +
  '//OEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDA' +
  'wMDAwMDAwMDMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzM9PT09PT09PT09PT09PT09PT09PT09PT09PT3/' +
  '//////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAAAASDs';

function getBgAudio(): HTMLAudioElement {
  if (!bgAudio) {
    bgAudio = new Audio(SILENT_MP3);
    bgAudio.loop   = true;
    bgAudio.volume = 0.001;
  }
  return bgAudio;
}

function startProgress() {
  if (progressTimer !== null) return; // already running
  progressTimer = window.setInterval(() => {
    const player = usePlayerStore.getState().ytPlayer;
    if (!player) return;
    const current = player.getCurrentTime?.() ?? 0;
    const dur     = player.getDuration?.()    ?? 0;
    if (dur > 0) usePlayerStore.getState().setTime(current, dur);
  }, 500);
}

function stopProgress() {
  if (progressTimer !== null) {
    window.clearInterval(progressTimer);
    progressTimer = null;
  }
}

function bgActivate() {
  getBgAudio().play().catch(() => {});
}

function bgDeactivate() {
  getBgAudio().pause();
}

// ── Singleton next/prev (defined once, never recreated) ───────
function handleNext() {
  const lib = useLibraryStore.getState();
  if (lib.songs.length === 0) return;
  const { isShuffled } = usePlayerStore.getState();
  const nextIdx = isShuffled
    ? Math.floor(Math.random() * lib.songs.length)
    : (lib.currentIndex + 1) % lib.songs.length;
  lib.setCurrentIndex(nextIdx);
  const song   = lib.songs[nextIdx];
  const player = usePlayerStore.getState().ytPlayer;
  if (player && song) {
    player.loadVideoById(song.youtubeId);
    usePlayerStore.getState().setCurrentSong(song);
    StorageService.addToRecent(song);
  }
}

function handlePrevious() {
  const player = usePlayerStore.getState().ytPlayer;
  if (!player) return;
  const current = player.getCurrentTime?.() ?? 0;
  if (current > 3) { player.seekTo(0, true); return; }
  const lib     = useLibraryStore.getState();
  const prevIdx = (lib.currentIndex - 1 + lib.songs.length) % lib.songs.length;
  lib.setCurrentIndex(prevIdx);
  const song = lib.songs[prevIdx];
  if (song) {
    player.loadVideoById(song.youtubeId);
    usePlayerStore.getState().setCurrentSong(song);
  }
}

// ── Single YT player init ─────────────────────────────────────
function initYTPlayer() {
  if (ytInitialized) return;
  if (!window.YT?.Player) return;
  const el = document.getElementById('yt-player-container');
  if (!el) return;

  ytInitialized = true; // set BEFORE new Player() to prevent double-init

  const { setYTPlayer, setReady, setPlaying } = usePlayerStore.getState();

  const player = new window.YT.Player(el, {
    height: '0',
    width:  '0',
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
            usePlayerStore.getState().setPlaying(true);
            startProgress();
            bgActivate();
            break;
          case window.YT.PlayerState.PAUSED:
            usePlayerStore.getState().setPlaying(false);
            stopProgress();
            bgDeactivate();
            break;
          case window.YT.PlayerState.ENDED: {
            usePlayerStore.getState().setPlaying(false);
            stopProgress();
            bgDeactivate();
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
}

// ── Hook (thin wrapper — no init logic, just actions + media session) ─
export function useYouTubePlayer() {
  // ── One-time YT API bootstrap (only the FIRST call does real work) ──
  useEffect(() => {
    if (ytInitialized) return; // already done — no-op for every subsequent caller
    if (window.YT?.Player) {
      initYTPlayer();
    } else {
      // Only inject the <script> tag once
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src   = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
      // Safe to overwrite — all callers point to the same initYTPlayer function
      window.onYouTubeIframeAPIReady = initYTPlayer;
    }
    // NO cleanup stopProgress() here — that was killing the interval on re-render
  }, []); // empty deps = truly runs once per mount, no re-runs

  // ── Media Session (lock screen controls) ───────────────────
  const currentSong = usePlayerStore(s => s.currentSong);
  const isPlaying   = usePlayerStore(s => s.isPlaying);
  const currentTime = usePlayerStore(s => s.currentTime);
  const duration    = usePlayerStore(s => s.duration);

  const seekToSeconds = useCallback((seconds: number) => {
    usePlayerStore.getState().ytPlayer?.seekTo(seconds, true);
  }, []);

  useMediaSession(currentSong, isPlaying, currentTime, duration, {
    onPlay:     () => usePlayerStore.getState().ytPlayer?.playVideo(),
    onPause:    () => usePlayerStore.getState().ytPlayer?.pauseVideo(),
    onNext:     handleNext,
    onPrevious: handlePrevious,
    onSeek:     seekToSeconds,
  });

  // ── Public actions ──────────────────────────────────────────
  const loadAndPlay = useCallback((song: Song) => {
    usePlayerStore.getState().setCurrentSong(song);
    StorageService.addToRecent(song);
    useLibraryStore.getState().addToRecent(song);

    // ── Jamendo: play direct MP3 ──────────────────────────────
    if (JamendoService.isJamendo(song.youtubeId)) {
      const rawUrl = song.audioUrl ?? JamendoService.getAudioUrl(song.youtubeId);
      if (!rawUrl) return;

      // Pause YouTube if playing
      const player = usePlayerStore.getState().ytPlayer;
      try { player?.pauseVideo(); } catch {}

      if (!jamendoAudio) {
        jamendoAudio = new Audio();
        jamendoAudio.addEventListener('timeupdate', () => {
          usePlayerStore.getState().setCurrentTime(jamendoAudio!.currentTime);
        });
        jamendoAudio.addEventListener('loadedmetadata', () => {
          usePlayerStore.getState().setDuration(jamendoAudio!.duration);
        });
        jamendoAudio.addEventListener('ended', () => {
          usePlayerStore.getState().setPlaying(false);
          handleNext();
        });
        jamendoAudio.addEventListener('play', () => {
          usePlayerStore.getState().setPlaying(true);
          usePlayerStore.getState().setReady(true);
        });
        jamendoAudio.addEventListener('pause', () => {
          usePlayerStore.getState().setPlaying(false);
        });
      }

      // Use cached audio if available (works offline), else stream
      getCachedAudioUrl(rawUrl).then(resolvedUrl => {
        jamendoAudio!.src = resolvedUrl;
        jamendoAudio!.volume = usePlayerStore.getState().isMuted ? 0 : usePlayerStore.getState().volume / 100;
        jamendoAudio!.play().catch(() => {});
        // Auto-cache in background for future offline use
        cacheSongForOffline(song).catch(() => {});
      });

      bgActivate();
      return;
    }

    // ── YouTube: load via iframe ──────────────────────────────
    // Stop Jamendo if playing
    if (jamendoAudio) {
      jamendoAudio.pause();
      jamendoAudio.src = '';
    }
    const player = usePlayerStore.getState().ytPlayer;
    if (!player) return;
    bgActivate();
    player.loadVideoById(song.youtubeId);
  }, []);

  const toggle = useCallback(() => {
    const currentSong = usePlayerStore.getState().currentSong;
    // Jamendo toggle
    if (currentSong && JamendoService.isJamendo(currentSong.youtubeId) && jamendoAudio) {
      if (jamendoAudio.paused) {
        bgActivate();
        jamendoAudio.play().catch(() => {});
      } else {
        jamendoAudio.pause();
      }
      return;
    }
    // YouTube toggle
    const player = usePlayerStore.getState().ytPlayer;
    if (!player) return;
    if (usePlayerStore.getState().isPlaying) {
      player.pauseVideo();
    } else {
      bgActivate();
      player.playVideo();
    }
  }, []);

  const seekTo = useCallback((pct: number) => {
    const currentSong = usePlayerStore.getState().currentSong;
    // Jamendo seek
    if (currentSong && JamendoService.isJamendo(currentSong.youtubeId) && jamendoAudio) {
      jamendoAudio.currentTime = (pct / 100) * jamendoAudio.duration;
      return;
    }
    // YouTube seek
    const player = usePlayerStore.getState().ytPlayer;
    if (!player) return;
    player.seekTo((pct / 100) * (player.getDuration?.() ?? 0), true);
  }, []);

  const next     = useCallback(() => handleNext(),     []);
  const previous = useCallback(() => handlePrevious(), []);

  return { loadAndPlay, toggle, next, previous, seekTo };
}
