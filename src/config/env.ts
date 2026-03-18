// ============================================================
// SOUNDWAVE — Environment Configuration
// ============================================================

function getEnv(key: string, fallback = ''): string {
  const v = import.meta.env[key];
  if (!v) { if (!fallback) console.warn(`[Config] Missing: ${key}`); return fallback; }
  return String(v);
}

export const ENV = {
  // ── YouTube proxy worker URL ──────────────────────────────
  // Set VITE_WORKER_URL to your deployed Cloudflare Worker URL.
  // e.g. https://soundwave-worker.your-subdomain.workers.dev
  WORKER_URL: getEnv('VITE_WORKER_URL', ''),

  // Direct YouTube API key (only used if WORKER_URL is not set)
  YOUTUBE_API_KEY: getEnv('VITE_YOUTUBE_API_KEY'),

  // Google AdSense publisher ID e.g. ca-pub-1234567890123456
  ADSENSE_PUB_ID: getEnv('VITE_ADSENSE_PUB_ID', ''),

  FIREBASE_API_KEY:             getEnv('VITE_FIREBASE_API_KEY'),
  FIREBASE_AUTH_DOMAIN:         getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  FIREBASE_PROJECT_ID:          getEnv('VITE_FIREBASE_PROJECT_ID'),
  FIREBASE_STORAGE_BUCKET:      getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  FIREBASE_MESSAGING_SENDER_ID: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  FIREBASE_APP_ID:              getEnv('VITE_FIREBASE_APP_ID'),

  APP_NAME: getEnv('VITE_APP_NAME', 'Soundwave'),
  APP_URL:  getEnv('VITE_APP_URL',  'http://localhost:5173'),

  RATE_LIMIT_MAX_REQUESTS: parseInt(getEnv('VITE_RATE_LIMIT_MAX_REQUESTS', '30')),
  RATE_LIMIT_WINDOW_MS:    parseInt(getEnv('VITE_RATE_LIMIT_WINDOW_MS',    '60000')),
  AUTH_MAX_ATTEMPTS:       parseInt(getEnv('VITE_AUTH_MAX_ATTEMPTS', '5')),
  AUTH_LOCKOUT_MS:         parseInt(getEnv('VITE_AUTH_LOCKOUT_MS',   '900000')),
  TRENDING_CACHE_TTL:      parseInt(getEnv('VITE_TRENDING_CACHE_TTL','1800000')),

  isWorkerConfigured(): boolean {
    return Boolean(this.WORKER_URL && this.WORKER_URL.startsWith('https://'));
  },
  isYouTubeConfigured(): boolean {
    return this.isWorkerConfigured() ||
      Boolean(this.YOUTUBE_API_KEY && !this.YOUTUBE_API_KEY.startsWith('YOUR_'));
  },
  isFirebaseConfigured(): boolean {
    return Boolean(
      this.FIREBASE_API_KEY &&
      !this.FIREBASE_API_KEY.startsWith('YOUR_') &&
      !this.FIREBASE_API_KEY.startsWith('AIzaSy_')
    );
  },
};
