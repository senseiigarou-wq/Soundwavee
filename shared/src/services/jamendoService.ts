// ============================================================
// SOUNDWAVE — Jamendo Service
// Free/CC-licensed music with direct MP3 URLs.
// All calls routed through the Cloudflare Worker for caching.
// ============================================================
import { ENV } // env removed - use WORKER constant directly;

const WORKER = ENV.WORKER_URL.replace(/\/$/, '');

export interface JamendoTrack {
  jamendoId:  string;
  youtubeId:  string;   // synthetic: "jamendo_ID"
  title:      string;
  artist:     string;
  cover:      string;
  audioUrl:   string;   // direct MP3 — can be cached offline
  duration:   number;
  license:    string;
  albumName:  string;
  tags:       string;
}

const _cache = new Map<string, { data: JamendoTrack[]; expiresAt: number }>();

function fromCache(key: string): JamendoTrack[] | null {
  const e = _cache.get(key);
  if (!e || Date.now() > e.expiresAt) { _cache.delete(key); return null; }
  return e.data;
}
function toCache(key: string, data: JamendoTrack[], ttlMs: number) {
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

export const JamendoService = {
  async search(query: string, limit = 10): Promise<JamendoTrack[]> {
    const key = `search:${query}:${limit}`;
    const hit = fromCache(key);
    if (hit) return hit;

    const data = await workerGet<{ tracks: JamendoTrack[] }>(
      '/api/jamendo/search', { q: query, limit }
    );
    const tracks = data?.tracks ?? [];
    if (tracks.length) toCache(key, tracks, 10 * 60 * 1000);
    return tracks;
  },

  async getTrending(tag = '', limit = 12): Promise<JamendoTrack[]> {
    const key = `trending:${tag}:${limit}`;
    const hit = fromCache(key);
    if (hit) return hit;

    const data = await workerGet<{ tracks: JamendoTrack[] }>(
      '/api/jamendo/trending', { limit, ...(tag ? { tag } : {}) }
    );
    const tracks = data?.tracks ?? [];
    if (tracks.length) toCache(key, tracks, 30 * 60 * 1000);
    return tracks;
  },

  /** Convert a JamendoTrack to the Song shape used by the player */
  toSong(t: JamendoTrack): import('@/types').Song {
    return {
      youtubeId: t.youtubeId,   // "jamendo_ID"
      title:     t.title,
      artist:    t.artist,
      cover:     t.cover,
      // Store audioUrl in a custom field — player detects "jamendo_" prefix
      audioUrl:  t.audioUrl,
      duration:  t.duration,
    } as import('@/types').Song & { audioUrl: string };
  },

  isJamendo(youtubeId: string): boolean {
    return youtubeId.startsWith('jamendo_');
  },

  getAudioUrl(youtubeId: string): string | null {
    // audioUrl stored in Song — look it up from cache
    for (const cached of _cache.values()) {
      const track = cached.data.find(t => t.youtubeId === youtubeId);
      if (track) return track.audioUrl;
    }
    return null;
  },
};