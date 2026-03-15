// ============================================================
// SOUNDWAVE — Cloudflare Worker API Client
// All calls go to the worker proxy instead of YouTube directly.
// API keys are never exposed to the browser.
// ============================================================

import { ENV } from '@/config/env';
import type { Song, Artist, Genre } from '@/types';

// ── Debounce helper ───────────────────────────────────────────
const debouncers = new Map<string, ReturnType<typeof setTimeout>>();

export function debounce<T>(
  key: string,
  fn: () => Promise<T>,
  ms = 500,
): Promise<T> {
  return new Promise((resolve, reject) => {
    if (debouncers.has(key)) clearTimeout(debouncers.get(key)!);
    debouncers.set(key, setTimeout(() => {
      debouncers.delete(key);
      fn().then(resolve).catch(reject);
    }, ms));
  });
}

// ── Fetch wrapper ─────────────────────────────────────────────
async function workerFetch<T>(path: string, params: Record<string, string | number> = {}): Promise<T | null> {
  const base = ENV.WORKER_URL.replace(/\/$/, '');
  const qs   = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  ).toString();
  const url  = qs ? `${base}${path}?${qs}` : `${base}${path}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' })) as { error?: string };
      if (res.status === 503) {
        console.warn('[Worker] API quota exhausted on all keys');
        return null;
      }
      if (res.status === 429) throw new Error('Rate limited');
      console.error(`[Worker] ${res.status}:`, err.error);
      return null;
    }
    return await res.json() as T;
  } catch (e) {
    if ((e as Error).message === 'Rate limited') throw e;
    console.error('[Worker] Fetch failed:', e);
    return null;
  }
}

// ── In-memory client-side cache (avoids repeat requests) ─────
const clientCache = new Map<string, { data: unknown; expiresAt: number }>();

function fromClientCache<T>(key: string): T | null {
  const entry = clientCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { clientCache.delete(key); return null; }
  return entry.data as T;
}

function toClientCache(key: string, data: unknown, ttlMs: number): void {
  clientCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

const CLIENT_TTL = {
  SEARCH:   5 * 60 * 1000,   // 5 min client-side (KV handles 10 min server-side)
  TRENDING: 15 * 60 * 1000,
  ARTISTS:  15 * 60 * 1000,
};

// ─────────────────────────────────────────────────────────────

export const WorkerClient = {

  /** Search songs — debounced 500ms + client cache */
  async search(query: string, max = 5): Promise<Song[]> {
    const key = `search:${query}:${max}`;
    const hit = fromClientCache<Song[]>(key);
    if (hit) return hit;

    return debounce(key, async () => {
      const data = await workerFetch<{ songs: Song[] }>('/api/youtube/search', { q: query, max });
      const songs = data?.songs ?? [];
      if (songs.length) toClientCache(key, songs, CLIENT_TTL.SEARCH);
      return songs;
    }, 500);
  },

  /** Trending songs by genre */
  async getTrending(genre: Genre = 'all', max = 10): Promise<Song[]> {
    const key = `trending:${genre}:${max}`;
    const hit = fromClientCache<Song[]>(key);
    if (hit) return hit;

    const data = await workerFetch<{ songs: Song[] }>('/api/youtube/trending', { genre, max });
    const songs = data?.songs ?? [];
    if (songs.length) toClientCache(key, songs, CLIENT_TTL.TRENDING);
    return songs;
  },

  /** Popular Artists */
  async getPopularArtists(max = 8): Promise<Artist[]> {
    const key = `artists:${max}`;
    const hit = fromClientCache<Artist[]>(key);
    if (hit) return hit;

    const data = await workerFetch<{ artists: Artist[] }>('/api/youtube/artists', { max });
    const artists = data?.artists ?? [];
    if (artists.length) toClientCache(key, artists, CLIENT_TTL.ARTISTS);
    return artists;
  },

  /** Artist songs */
  async getArtistSongs(name: string, channelId?: string, max = 10): Promise<Song[]> {
    const key = `artist_songs:${name}:${max}`;
    const hit = fromClientCache<Song[]>(key);
    if (hit) return hit;

    const params: Record<string, string | number> = { name, max };
    if (channelId) params.channelId = channelId;

    const data = await workerFetch<{ songs: Song[] }>('/api/youtube/artist/songs', params);
    const songs = data?.songs ?? [];
    if (songs.length) toClientCache(key, songs, CLIENT_TTL.ARTISTS);
    return songs;
  },

  /** Related artists */
  async getRelatedArtists(name: string, max = 6): Promise<Artist[]> {
    const key = `related:${name}:${max}`;
    const hit = fromClientCache<Artist[]>(key);
    if (hit) return hit;

    const data = await workerFetch<{ artists: Artist[] }>('/api/youtube/artist/related', { name, max });
    const artists = data?.artists ?? [];
    if (artists.length) toClientCache(key, artists, CLIENT_TTL.ARTISTS);
    return artists;
  },
};
