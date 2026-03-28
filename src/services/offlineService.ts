// ============================================================
// SOUNDWAVE — Offline Cache Service
// Manages which Jamendo songs are cached for offline playback.
// Uses the Cache API (via service worker) for audio files and
// localStorage to track the list of cached songs.
// ============================================================
import type { Song } from '@/types';

const STORE_KEY  = 'sw_offline_songs';
const CACHE_NAME = 'jamendo-audio-v1';

// ── Persisted list of offline-available songs ─────────────────
export function getOfflineSongs(): Song[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveOfflineSongs(songs: Song[]) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(songs));
  } catch {}
}

export function isOfflineCached(youtubeId: string): boolean {
  return getOfflineSongs().some(s => s.youtubeId === youtubeId);
}

// ── Cache a Jamendo song audio file ───────────────────────────
export async function cacheSongForOffline(song: Song): Promise<boolean> {
  if (!song.audioUrl) return false;
  if (isOfflineCached(song.youtubeId)) return true;

  try {
    // Use Cache API directly — works even without a service worker
    const cache = await caches.open(CACHE_NAME);

    // Fetch the audio and store it
    const response = await fetch(song.audioUrl, { mode: 'cors' });
    if (!response.ok) return false;

    await cache.put(song.audioUrl, response);

    // Track in localStorage
    const songs = getOfflineSongs();
    if (!songs.some(s => s.youtubeId === song.youtubeId)) {
      songs.push({ ...song, addedAt: new Date().toISOString() });
      saveOfflineSongs(songs);
    }
    return true;
  } catch (e) {
    console.warn('[Offline] Cache failed:', e);
    return false;
  }
}

// ── Remove a cached song ──────────────────────────────────────
export async function removeSongFromOffline(youtubeId: string): Promise<void> {
  const songs   = getOfflineSongs();
  const song    = songs.find(s => s.youtubeId === youtubeId);
  const updated = songs.filter(s => s.youtubeId !== youtubeId);
  saveOfflineSongs(updated);

  if (song?.audioUrl) {
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.delete(song.audioUrl);
    } catch {}
  }
}

// ── Get cached audio URL (returns blob URL if cached) ─────────
export async function getCachedAudioUrl(audioUrl: string): Promise<string> {
  try {
    const cache    = await caches.open(CACHE_NAME);
    const response = await cache.match(audioUrl);
    if (response) {
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }
  } catch {}
  return audioUrl; // fallback to original URL
}

// ── Total size estimate ───────────────────────────────────────
export async function getOfflineCacheSize(): Promise<string> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys  = await cache.keys();
    let total   = 0;
    for (const req of keys) {
      const res = await cache.match(req);
      if (res) {
        const buf = await res.clone().arrayBuffer();
        total += buf.byteLength;
      }
    }
    if (total < 1024 * 1024) return `${(total / 1024).toFixed(1)} KB`;
    return `${(total / (1024 * 1024)).toFixed(1)} MB`;
  } catch { return '0 MB'; }
}

// ── Network status helpers ────────────────────────────────────
export function isOnline(): boolean {
  return navigator.onLine;
}

export function onNetworkChange(cb: (online: boolean) => void): () => void {
  const onOnline  = () => cb(true);
  const onOffline = () => cb(false);
  window.addEventListener('online',  onOnline);
  window.addEventListener('offline', onOffline);
  return () => {
    window.removeEventListener('online',  onOnline);
    window.removeEventListener('offline', onOffline);
  };
}