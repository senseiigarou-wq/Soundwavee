// ============================================================
// SOUNDWAVE — Background Playback Service
//
// Problem: Mobile browsers suspend JS timers and can throttle
// iframes when the tab goes to background, interrupting music.
//
// Solution (layered approach):
//  1. Silent looping audio element → tells the OS "audio is
//     active" so it doesn't suspend our tab (already existed).
//  2. AudioContext + tiny oscillator → a second keepalive that
//     works even when the first is suspended by some browsers.
//  3. visibilitychange handler → resumes playback & re-syncs
//     player state the moment the user comes back.
//  4. Service Worker postMessage → notifies SW to cache current
//     song data so it survives tab freeze.
//  5. Wake Lock API → prevents screen-off from killing audio
//     (handled in useYouTubePlayer, referenced here for docs).
// ============================================================

// ── AudioContext keepalive ────────────────────────────────────
let _ctx: AudioContext | null = null;
let _oscillator: OscillatorNode | null = null;
let _gainNode: GainNode | null = null;

export function startAudioContextKeepalive(): void {
  if (_ctx) return; // already running
  try {
    _ctx       = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    _gainNode  = _ctx.createGain();
    _gainNode.gain.value = 0; // completely silent — just keeps the context alive
    _gainNode.connect(_ctx.destination);

    _oscillator = _ctx.createOscillator();
    _oscillator.frequency.value = 1; // 1Hz — inaudible
    _oscillator.connect(_gainNode);
    _oscillator.start();
  } catch {
    // AudioContext not supported — silent fail
  }
}

export function resumeAudioContext(): void {
  if (_ctx?.state === 'suspended') {
    _ctx.resume().catch(() => {});
  }
}

export function stopAudioContextKeepalive(): void {
  try {
    _oscillator?.stop();
    _oscillator?.disconnect();
    _gainNode?.disconnect();
    _ctx?.close();
  } catch {}
  _oscillator = null;
  _gainNode   = null;
  _ctx        = null;
}

// ── visibilitychange recovery ─────────────────────────────────
// When user comes back to the tab, resume anything that was
// suspended by the browser.
type ResumeCallback = () => void;
const _resumeCallbacks: ResumeCallback[] = [];

let _visListenerAttached = false;

export function onAppResume(cb: ResumeCallback): () => void {
  _resumeCallbacks.push(cb);

  if (!_visListenerAttached) {
    _visListenerAttached = true;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        resumeAudioContext();
        _resumeCallbacks.forEach(fn => { try { fn(); } catch {} });
      }
    });
  }

  // Return unsubscribe function
  return () => {
    const idx = _resumeCallbacks.indexOf(cb);
    if (idx !== -1) _resumeCallbacks.splice(idx, 1);
  };
}

// ── Page Visibility API helpers ───────────────────────────────
export function isAppVisible(): boolean {
  return document.visibilityState === 'visible';
}

export function isAppHidden(): boolean {
  return document.visibilityState === 'hidden';
}

// ── Detect if running as installed PWA ───────────────────────
export function isInstalledPWA(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
