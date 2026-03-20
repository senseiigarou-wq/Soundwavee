// ============================================================
// SOUNDWAVE — Spotify API Client
// Routes all calls through the Cloudflare Worker proxy.
// Spotify credentials are NEVER exposed to the browser.
// ============================================================

import { ENV } from '@/config/env';

const WORKER = ENV.WORKER_URL.replace(/\/$/, '');
const COUNTRY = 'PH';

// ── Types ─────────────────────────────────────────────────────

export interface SpotifyAlbum {
  id:          string;
  name:        string;
  type:        'album' | 'single' | 'compilation';
  artists:     string;
  cover:       string;
  releaseDate: string;
  spotifyUrl:  string;
  totalTracks: number;
}

export interface SpotifyPlaylist {
  id:          string;
  name:        string;
  description: string;
  cover:       string;
  spotifyUrl:  string;
  trackCount:  number;
  owner:       string;
}

export interface SpotifyStation {
  id:    string;
  name:  string;
  cover: string;
}

// ── Client-side cache (avoids repeat requests within session) ─
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
    const qs  = new URLSearchParams(Object.entries(params).map(([k,v]) => [k, String(v)])).toString();
    const url = qs ? `${WORKER}${path}?${qs}` : `${WORKER}${path}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null;
  }
}

// ── Public API ────────────────────────────────────────────────

export const SpotifyClient = {

  /** New album & single releases */
  async getNewReleases(limit = 10): Promise<SpotifyAlbum[]> {
    const key = `new:${limit}`;
    const hit = fromCache<SpotifyAlbum[]>(key);
    if (hit) return hit;

    const data = await workerGet<{ albums: SpotifyAlbum[] }>(
      '/api/spotify/new-releases', { limit, country: COUNTRY }
    );
    const albums = data?.albums ?? [];
    if (albums.length) toCache(key, albums, 3 * 60 * 60 * 1000); // 3 hrs
    return albums;
  },

  /** Featured playlists / charts */
  async getFeaturedPlaylists(limit = 8): Promise<SpotifyPlaylist[]> {
    const key = `featured:${limit}`;
    const hit = fromCache<SpotifyPlaylist[]>(key);
    if (hit) return hit;

    const data = await workerGet<{ playlists: SpotifyPlaylist[] }>(
      '/api/spotify/featured', { limit, country: COUNTRY }
    );
    const playlists = data?.playlists ?? [];
    if (playlists.length) toCache(key, playlists, 2 * 60 * 60 * 1000); // 2 hrs
    return playlists;
  },

  /** Radio stations (Spotify categories) */
  async getRadioStations(limit = 8): Promise<SpotifyStation[]> {
    const key = `radio:${limit}`;
    const hit = fromCache<SpotifyStation[]>(key);
    if (hit) return hit;

    const data = await workerGet<{ stations: SpotifyStation[] }>(
      '/api/spotify/radio', { limit, country: COUNTRY }
    );
    const stations = data?.stations ?? [];
    if (stations.length) toCache(key, stations, 6 * 60 * 60 * 1000); // 6 hrs
    return stations;
  },
};