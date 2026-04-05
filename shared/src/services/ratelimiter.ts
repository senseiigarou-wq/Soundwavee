// ============================================================
// SOUNDWAVE — Rate Limiter Service
// Token Bucket Algorithm for client-side API rate limiting.
// Also validates inputs server-side style to prevent abuse.
// ============================================================

import { ENV } from '@/config/env';
import type { RateLimitResult } from '@/types';

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const STORAGE_KEY = 'sw_rate_buckets';

class RateLimiterService {
  private buckets: Map<string, Bucket> = new Map();
  private readonly maxTokens: number;
  private readonly windowMs: number;

  constructor() {
    this.maxTokens = ENV.RATE_LIMIT_MAX_REQUESTS;
    this.windowMs = ENV.RATE_LIMIT_WINDOW_MS;
    this.loadBuckets();
  }

  // ─── Core Token Bucket ───────────────────────────────────

  /**
   * Attempt to consume a token for the given action.
   * Returns allowed=true if the request should proceed.
   */
  consume(action: string, cost = 1): RateLimitResult {
    this.refillBucket(action);

    const bucket = this.getBucket(action);
    const resetAt = Date.now() + this.windowMs;

    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      this.saveBuckets();

      return {
        allowed: true,
        remaining: Math.floor(bucket.tokens),
        resetAt,
      };
    }

    const waitMs = this.windowMs - (Date.now() - bucket.lastRefill);

    return {
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + waitMs,
      message: `Too many requests. Please wait ${Math.ceil(waitMs / 1000)}s before trying again.`,
    };
  }

  /**
   * Check remaining tokens without consuming.
   */
  peek(action: string): RateLimitResult {
    this.refillBucket(action);
    const bucket = this.getBucket(action);
    return {
      allowed: bucket.tokens >= 1,
      remaining: Math.floor(bucket.tokens),
      resetAt: bucket.lastRefill + this.windowMs,
    };
  }

  // ─── Input Validation ────────────────────────────────────

  /**
   * Validate a search query for safety and sanity.
   */
  validateSearchQuery(query: string): { valid: boolean; sanitized: string; error?: string } {
    if (!query || typeof query !== 'string') {
      return { valid: false, sanitized: '', error: 'Query must be a non-empty string.' };
    }

    // Strip control characters and excessive whitespace
    const sanitized = query
      .replace(/[\x00-\x1F\x7F]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (sanitized.length === 0) {
      return { valid: false, sanitized: '', error: 'Query cannot be empty.' };
    }

    if (sanitized.length > 200) {
      return {
        valid: false,
        sanitized: sanitized.slice(0, 200),
        error: 'Query is too long (max 200 characters).',
      };
    }

    // Block suspicious patterns (SQL injection attempts, script tags, etc.)
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /--/,
      /;\s*(drop|insert|update|delete|select)\s/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(sanitized)) {
        return { valid: false, sanitized: '', error: 'Invalid characters in query.' };
      }
    }

    return { valid: true, sanitized };
  }

  /**
   * Validate a playlist name.
   */
  validatePlaylistName(name: string): { valid: boolean; sanitized: string; error?: string } {
    if (!name || typeof name !== 'string') {
      return { valid: false, sanitized: '', error: 'Name is required.' };
    }

    const sanitized = name.replace(/[\x00-\x1F\x7F]/g, '').trim();

    if (sanitized.length === 0) return { valid: false, sanitized: '', error: 'Name cannot be empty.' };
    if (sanitized.length > 60) return { valid: false, sanitized: '', error: 'Name too long (max 60 chars).' };

    return { valid: true, sanitized };
  }

  // ─── Internals ───────────────────────────────────────────

  private getBucket(action: string): Bucket {
    if (!this.buckets.has(action)) {
      this.buckets.set(action, {
        tokens: this.maxTokens,
        lastRefill: Date.now(),
      });
    }
    return this.buckets.get(action)!;
  }

  private refillBucket(action: string): void {
    const bucket = this.getBucket(action);
    const now = Date.now();
    const elapsed = now - bucket.lastRefill;

    if (elapsed >= this.windowMs) {
      // Full refill after window has passed
      bucket.tokens = this.maxTokens;
      bucket.lastRefill = now;
    } else {
      // Partial refill proportional to elapsed time
      const refillAmount = (elapsed / this.windowMs) * this.maxTokens;
      bucket.tokens = Math.min(this.maxTokens, bucket.tokens + refillAmount);
      if (refillAmount > 0) bucket.lastRefill = now;
    }
  }

  private saveBuckets(): void {
    try {
      const data: Record<string, Bucket> = {};
      this.buckets.forEach((bucket, key) => {
        data[key] = bucket;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage might be full; silently fail
    }
  }

  private loadBuckets(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as Record<string, Bucket>;
      Object.entries(data).forEach(([key, bucket]) => {
        this.buckets.set(key, bucket);
      });
    } catch {
      // Corrupted data; reset
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  /** Clear all rate limit state (useful for testing). */
  reset(): void {
    this.buckets.clear();
    localStorage.removeItem(STORAGE_KEY);
  }
}

// Singleton export
export const RateLimiter = new RateLimiterService();

// Named rate limit actions
export const RL_ACTIONS = {
  SEARCH: 'youtube_search',
  TRENDING: 'youtube_trending',
  ARTISTS: 'youtube_artists',
  RECOMMENDED: 'youtube_recommended',
  LOGIN: 'auth_login',
} as const;