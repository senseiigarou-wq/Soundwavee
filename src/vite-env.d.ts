/// <reference types="vite/client" />

// Explicitly declare import.meta.env so TypeScript is never confused,
// even if tsconfig moduleResolution varies between editors.
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ImportMetaEnv {
  readonly VITE_YOUTUBE_API_KEY: string;
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_URL?: string;
  readonly VITE_RATE_LIMIT_MAX_REQUESTS?: string;
  readonly VITE_RATE_LIMIT_WINDOW_MS?: string;
  readonly VITE_AUTH_MAX_ATTEMPTS?: string;
  readonly VITE_AUTH_LOCKOUT_MS?: string;
  readonly VITE_TRENDING_CACHE_TTL?: string;
  // Vite built-ins
  readonly MODE: string;
  readonly BASE_URL: string;
  readonly PROD: boolean;
  readonly DEV: boolean;
  readonly SSR: boolean;
}