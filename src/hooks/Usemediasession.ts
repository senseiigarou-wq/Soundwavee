// ============================================================
// SOUNDWAVE — useMediaSession Hook
// Syncs the Web Media Session API with our player state so
// the OS lock screen / notification shows song info and
// responds to hardware media buttons.
// ============================================================

import { useEffect } from 'react';
import type { Song } from '@/types';

interface MediaSessionHandlers {
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek?: (time: number) => void;
}

export function useMediaSession(
  song: Song | null,
  isPlaying: boolean,
  currentTime: number,
  duration: number,
  handlers: MediaSessionHandlers
) {
  // ── Update metadata when song changes ──────────────────────
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    if (!song) {
      navigator.mediaSession.metadata = null;
      return;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title:  song.title,
      artist: song.artist,
      album:  'Soundwave',
      artwork: song.cover
        ? [
            { src: song.cover, sizes: '96x96',   type: 'image/jpeg' },
            { src: song.cover, sizes: '128x128',  type: 'image/jpeg' },
            { src: song.cover, sizes: '192x192',  type: 'image/jpeg' },
            { src: song.cover, sizes: '256x256',  type: 'image/jpeg' },
            { src: song.cover, sizes: '512x512',  type: 'image/jpeg' },
          ]
        : [{ src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }],
    });
  }, [song]);

  // ── Sync playback state ────────────────────────────────────
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  // ── Update position state (progress bar on lock screen) ───
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    if (!('setPositionState' in navigator.mediaSession)) return;
    if (duration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration,
          playbackRate: 1,
          position: Math.min(currentTime, duration),
        });
      } catch {
        // Some browsers throw if position > duration during seek
      }
    }
  }, [currentTime, duration]);

  // ── Register action handlers ───────────────────────────────
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const { onPlay, onPause, onNext, onPrevious, onSeek } = handlers;

    navigator.mediaSession.setActionHandler('play',          onPlay);
    navigator.mediaSession.setActionHandler('pause',         onPause);
    navigator.mediaSession.setActionHandler('nexttrack',     onNext);
    navigator.mediaSession.setActionHandler('previoustrack', onPrevious);
    navigator.mediaSession.setActionHandler('stop',          onPause);

    // Seek-to (Android 12+ / Chrome 78+)
    navigator.mediaSession.setActionHandler('seekto', onSeek
      ? (details) => { if (details.seekTime !== undefined) onSeek(details.seekTime); }
      : null
    );

    // Seek-backward / seek-forward (skip 10s)
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      const skip = details.seekOffset ?? 10;
      if (onSeek) onSeek(Math.max(0, currentTime - skip));
    });
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      const skip = details.seekOffset ?? 10;
      if (onSeek) onSeek(Math.min(duration, currentTime + skip));
    });

    return () => {
      // Clean up handlers on unmount
      const actions = ['play','pause','nexttrack','previoustrack','stop','seekto','seekbackward','seekforward'] as MediaSessionAction[];
      actions.forEach(a => {
        try { navigator.mediaSession.setActionHandler(a, null); } catch {}
      });
    };
  }, [handlers, currentTime, duration]);
}