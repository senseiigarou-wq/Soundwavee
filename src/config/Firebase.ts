// ============================================================
// SOUNDWAVE — Firebase Initialization
// Single instance shared across the whole app.
// ============================================================

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { ENV } from '@/config/env';

const firebaseConfig = {
  apiKey:            ENV.FIREBASE_API_KEY,
  authDomain:        ENV.FIREBASE_AUTH_DOMAIN,
  projectId:         ENV.FIREBASE_PROJECT_ID,
  storageBucket:     ENV.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID,
  appId:             ENV.FIREBASE_APP_ID,
};

// ─── Singleton — safe across Vite HMR ────────────────────────
const app: FirebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

// ─── Auth ─────────────────────────────────────────────────────
export const auth: Auth = getAuth(app);

// ─── Google provider ──────────────────────────────────────────
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
// Always show account chooser — important for multi-account users
googleProvider.setCustomParameters({ prompt: 'select_account' });

// ─── Firestore with offline persistence (new API, non-deprecated) ─
// persistentLocalCache replaces the old enableIndexedDbPersistence()
// persistentMultipleTabManager allows multiple tabs simultaneously
export const db: Firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export default app;