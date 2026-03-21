// ============================================================
// SOUNDWAVE — Deezer Discovery Client
// Fetches Top Albums, Chart Tracks, and Radio Stations
// via the Cloudflare Worker proxy.
// No API key required — Deezer public API.
// ============================================================
import { ENV } from '@/config/env';

const WORKER = ENV.WORKER_URL.replace(/\/$/, '');

// ── Types ─────────────────────────────────────────────────────
export interface DeezerAlbum {
  id:          string;
  name:        string;
  type:        string;
  artists:     string;
  cover:       string;
  releaseDate: string;
  deezerUrl:   string;
  totalTracks: number;
}

export interface DeezerTrack {
  id:        string;
  title:     string;
  artist:    string;
  cover:     string;
  preview:   string;  // 30-sec MP3 preview URL
  deezerUrl: string;
  albumName: string;
  rank:      number;
}

export interface DeezerStation {
  id:        string;
  name:      string;
  cover:     string;
  deezerUrl: string;
  tracklist: string;
}

// ── In-memory cache ───────────────────────────────────────────
const _cache = new Map<string, { data: unknown; expiresAt: number }>();
function fromCache<T>(key: string): T | null {
  const e = _cache.get(key);
  if (!e || Date.now() > e.expiresAt) { _cache.delete(key); return null; }
  return e.data as T;
}
function toCache(key: string, data: unknown, ttlMs: number) {
  _cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

async function workerGet<T>(path: string, params: Record<string, string | number> = {}): Promise<T | null> {
  if (!WORKER) return null;
  try {
    const qs  = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
    const res = await fetch(`${WORKER}${path}?${qs}`);
    if (!res.ok) return null;
    return await res.json() as T;
  } catch { return null; }
}

// ── Public API ────────────────────────────────────────────────
export const DeezerClient = {

  /** Top albums from Deezer charts */
  async getTopAlbums(limit = 10): Promise<DeezerAlbum[]> {
    const key = `dz:albums:${limit}`;
    const hit = fromCache<DeezerAlbum[]>(key);
    if (hit) return hit;
    const data = await workerGet<{ albums: DeezerAlbum[] }>('/api/spotify/new-releases', { limit });
    const items = data?.albums ?? [];
    if (items.length) toCache(key, items, 3 * 60 * 60 * 1000);
    return items;
  },

  /** Top chart tracks */
  async getChartTracks(limit = 10): Promise<DeezerTrack[]> {
    const key = `dz:tracks:${limit}`;
    const hit = fromCache<DeezerTrack[]>(key);
    if (hit) return hit;
    const data = await workerGet<{ tracks: DeezerTrack[] }>('/api/spotify/featured', { limit });
    const items = data?.tracks ?? [];
    if (items.length) toCache(key, items, 2 * 60 * 60 * 1000);
    return items;
  },

  /** Radio stations */
  async getRadioStations(limit = 8): Promise<DeezerStation[]> {
    const key = `dz:radio:${limit}`;
    const hit = fromCache<DeezerStation[]>(key);
    if (hit) return hit;
    const data = await workerGet<{ stations: DeezerStation[] }>('/api/spotify/radio', { limit });
    const items = data?.stations ?? [];
    if (items.length) toCache(key, items, 6 * 60 * 60 * 1000);
    return items;
  },
};
