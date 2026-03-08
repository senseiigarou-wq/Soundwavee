// ============================================================
// SOUNDWAVE — YouTube API Service
// All YouTube Data API v3 calls go through this module.
// Includes rate limiting, input validation, caching.
// ============================================================

import { ENV } from '@/config/env';
import { RateLimiter, RL_ACTIONS } from '@/services/ratelimiter';
import type { Song, Artist, Genre, CacheEntry } from '@/types';

// ─── Cache ───────────────────────────────────────────────────

class SimpleCache<T> {
  private store = new Map<string, CacheEntry<T>>();

  set(key: string, data: T, ttl: number): void {
    this.store.set(key, { data, timestamp: Date.now(), ttl });
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  clear(): void {
    this.store.clear();
  }
}

const searchCache = new SimpleCache<Song[]>();
const trendingCache = new SimpleCache<Song[]>();

// ─── Genre Queries ───────────────────────────────────────────

const GENRE_QUERIES: Record<Genre, string[]> = {
  all: [
    'top music 2024',
    'trending songs 2025',
    'popular music hits',
    'viral songs 2024',
  ],
  opm: [
    'Filipino OPM hits 2024',
    'Pinoy music trending 2024',
    'Filipino love songs OPM',
    'OPM ballad 2024',
  ],
  phonk: [
    'Phonk music 2024',
    'Brazilian Phonk drift',
    'Phonk aggressive 2024',
    'dark phonk music',
  ],
  pop: [
    'Pop hits 2024',
    'Top 40 pop music',
    'Billboard pop songs 2024',
    'trending pop music',
  ],
  rnb: [
    'R&B hits 2024',
    'Neo soul music 2024',
    'RnB love songs trending',
    'slow R&B 2024',
  ],
  hiphop: [
    'Hip hop beats 2024',
    'rap music trending 2024',
    'new hip hop songs',
    'trap music 2024',
  ],
  indie: [
    'indie music 2024',
    'indie pop songs trending',
    'alternative indie 2024',
    'indie folk music',
  ],
};

// ─── Fallback Songs ───────────────────────────────────────────

const FALLBACK_SONGS: Song[] = [
  { youtubeId: 'oIYWenB637c', title: 'To The Bones', artist: 'Pamungkas', cover: '' },
  { youtubeId: 'es7LUCzLWI0', title: 'After Dark', artist: 'Mr. Kitty', cover: '' },
  { youtubeId: 'Rht8rS4cR1s', title: 'Multo', artist: 'Cup of Joe', cover: '' },
  { youtubeId: 'myh5xtfUG-I', title: 'Double Take', artist: 'dhruv', cover: '' },
  { youtubeId: 'fukGbiPuBjU', title: 'I Wanna Be Yours', artist: 'Arctic Monkeys', cover: '' },
  { youtubeId: 'rfTgO9rpqck', title: 'Heat Waves', artist: 'Glass Animals', cover: '' },
  { youtubeId: '3zh9Wb1KuW8', title: 'Shinunoga E-Wa', artist: 'Fujii Kaze', cover: '' },
  { youtubeId: 'ZB0amc1TZ3Y', title: 'No Batidão', artist: 'ZXKAI', cover: '' },
  { youtubeId: 'GX3X9PmQOHY', title: 'Umaasa', artist: 'Calein', cover: '' },
  { youtubeId: 'BPgEgaPk62M', title: 'Paint The Town Red', artist: 'Doja Cat', cover: '' },
];

const FALLBACK_ARTISTS: Artist[] = [
  { name: 'Taylor Swift', searchQuery: 'Taylor Swift', thumbnail: '' },
  { name: 'The Weeknd', searchQuery: 'The Weeknd', thumbnail: '' },
  { name: 'Billie Eilish', searchQuery: 'Billie Eilish', thumbnail: '' },
  { name: 'Dua Lipa', searchQuery: 'Dua Lipa', thumbnail: '' },
  { name: 'Drake', searchQuery: 'Drake', thumbnail: '' },
  { name: 'Ed Sheeran', searchQuery: 'Ed Sheeran', thumbnail: '' },
  { name: 'Ariana Grande', searchQuery: 'Ariana Grande', thumbnail: '' },
  { name: 'Post Malone', searchQuery: 'Post Malone', thumbnail: '' },
];

// ─── API Helpers ─────────────────────────────────────────────

function mapYTItemToSong(item: {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: { high?: { url: string }; medium?: { url: string }; default?: { url: string } };
  };
}): Song {
  return {
    youtubeId: item.id.videoId,
    title: item.snippet.title,
    artist: item.snippet.channelTitle,
    cover:
      item.snippet.thumbnails.high?.url ||
      item.snippet.thumbnails.medium?.url ||
      item.snippet.thumbnails.default?.url ||
      '',
  };
}

async function ytFetch(url: string): Promise<{ items: unknown[] } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[YouTube] HTTP ${res.status}`);
      return null;
    }
    const data = await res.json();
    if (data.error) {
      console.error('[YouTube] API error:', data.error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error('[YouTube] Fetch error:', err);
    return null;
  }
}

// ─── YouTube Service ─────────────────────────────────────────

export const YouTubeService = {
  // ─── Search ────────────────────────────────────────────────

  async search(query: string, maxResults = 24): Promise<Song[]> {
    // Input validation
    const validation = RateLimiter.validateSearchQuery(query);
    if (!validation.valid) {
      throw new Error(validation.error ?? 'Invalid query');
    }

    const cleanQuery = validation.sanitized;

    // Rate limit
    const rl = RateLimiter.consume(RL_ACTIONS.SEARCH);
    if (!rl.allowed) {
      throw new Error(rl.message ?? 'Rate limit exceeded');
    }

    // Cache
    const cacheKey = `search:${cleanQuery}:${maxResults}`;
    const cached = searchCache.get(cacheKey);
    if (cached) return cached;

    if (!ENV.isYouTubeConfigured()) {
      return FALLBACK_SONGS.filter(
        s =>
          s.title.toLowerCase().includes(cleanQuery.toLowerCase()) ||
          s.artist.toLowerCase().includes(cleanQuery.toLowerCase())
      );
    }

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${maxResults}&q=${encodeURIComponent(cleanQuery + ' music')}&type=video&videoCategoryId=10&key=${ENV.YOUTUBE_API_KEY}`;
    const data = await ytFetch(url);
    if (!data) return [];

    const songs = (data.items as Parameters<typeof mapYTItemToSong>[0][]).map(mapYTItemToSong);
    searchCache.set(cacheKey, songs, 10 * 60 * 1000); // 10 min cache
    return songs;
  },

  // ─── Trending ──────────────────────────────────────────────

  async getTrending(genre: Genre = 'all', maxResults = 20): Promise<Song[]> {
    const cacheKey = `trending:${genre}`;
    const cached = trendingCache.get(cacheKey);
    if (cached) return cached;

    const rl = RateLimiter.consume(RL_ACTIONS.TRENDING);
    if (!rl.allowed) {
      console.warn('[YouTube] Trending rate limited, using fallback');
      return this.getFallbackByGenre(genre);
    }

    if (!ENV.isYouTubeConfigured()) {
      return this.getFallbackByGenre(genre);
    }

    const queries = GENRE_QUERIES[genre] ?? GENRE_QUERIES.all;
    const query = queries[Math.floor(Math.random() * queries.length)];

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${maxResults}&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&order=viewCount&key=${ENV.YOUTUBE_API_KEY}`;
    const data = await ytFetch(url);
    if (!data) return this.getFallbackByGenre(genre);

    const songs = (data.items as Parameters<typeof mapYTItemToSong>[0][]).map(item => ({
      ...mapYTItemToSong(item),
      genre,
    }));

    if (songs.length > 0) {
      trendingCache.set(cacheKey, songs, ENV.TRENDING_CACHE_TTL);
    }

    return songs.length > 0 ? songs : this.getFallbackByGenre(genre);
  },

  // ─── Recommended ───────────────────────────────────────────

  async getRecommended(maxResults = 8): Promise<Song[]> {
    const rl = RateLimiter.consume(RL_ACTIONS.RECOMMENDED);
    if (!rl.allowed || !ENV.isYouTubeConfigured()) {
      return FALLBACK_SONGS.slice(0, maxResults);
    }

    try {
      const songs = await this.getTrending('all', maxResults * 2);
      return songs.slice(0, maxResults);
    } catch {
      return FALLBACK_SONGS.slice(0, maxResults);
    }
  },

  // ─── Popular Artists ───────────────────────────────────────

  async getPopularArtists(maxResults = 10): Promise<Artist[]> {
    const rl = RateLimiter.consume(RL_ACTIONS.ARTISTS);
    if (!rl.allowed || !ENV.isYouTubeConfigured()) {
      return FALLBACK_ARTISTS;
    }

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=${maxResults}&q=popular+music+artist+2024&key=${ENV.YOUTUBE_API_KEY}`;
    const data = await ytFetch(url);
    if (!data) return FALLBACK_ARTISTS;

    const items = data.items as {
      id: { channelId: string };
      snippet: {
        title: string;
        thumbnails: { high?: { url: string }; default?: { url: string } };
      };
    }[];

    return items.map(item => ({
      name: item.snippet.title,
      channelId: item.id.channelId,
      thumbnail: item.snippet.thumbnails.high?.url ?? item.snippet.thumbnails.default?.url ?? '',
      searchQuery: item.snippet.title,
    }));
  },

  // ─── Helpers ───────────────────────────────────────────────

  getFallbackByGenre(_genre: Genre): Song[] {
    return FALLBACK_SONGS;
  },

  clearCache(): void {
    searchCache.clear();
    trendingCache.clear();
  },

  getRateLimitStatus() {
    return {
      search: RateLimiter.peek(RL_ACTIONS.SEARCH),
      trending: RateLimiter.peek(RL_ACTIONS.TRENDING),
    };
  },
};