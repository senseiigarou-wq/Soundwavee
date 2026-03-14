// ============================================================
// SOUNDWAVE — useBackgroundAudio Hook
// Creates a silent <audio> element that:
//   1. Keeps the browser's audio session alive so the OS
//      doesn't kill playback when the screen locks.
//   2. Acts as the "audio context" that the Media Session API
//      requires to show lock-screen controls on Android/iOS.
//
// How it works:
//   • A 1-second looping silent MP3 (base64-encoded) plays at
//     volume 0.001 — inaudible but enough to hold the session.
//   • When the YouTube player starts, we .play() this element.
//   • When paused/stopped, we .pause() it.
//   • The Media Session API is attached to THIS element so the
//     OS knows there is an active audio session.
// ============================================================

import { useEffect, useRef } from 'react';

// 1-second silent MP3 (44100 Hz, mono, 8kbps) — base64 encoded
// This is a minimal valid MP3 file with silence.
const SILENT_MP3 =
  'data:audio/mpeg;base64,' +
  'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDA' +
  'wMDMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzM9PT09PT09PT09PT09PT09PT09PT09PT09PT3//////' +
  '//////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAAAASDs';

export function useBackgroundAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(SILENT_MP3);
    audio.loop   = true;
    audio.volume = 0.001;   // inaudible
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const activate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    // Must be triggered from a user gesture the first time
    audio.play().catch(() => {
      // Autoplay blocked — will retry on next user interaction
    });
  };

  const deactivate = () => {
    audioRef.current?.pause();
  };

  return { activate, deactivate, audioRef };
}