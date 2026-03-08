// ============================================================
// SOUNDWAVE — Auth Store (Zustand)
// ============================================================

import { create } from 'zustand';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  signInWithGoogle,
  getRedirectResultOnReturn,
  loginWithEmail,
  registerWithEmail,
  resetPassword,
  signOut,
  onAuthChange,
  getLockoutRemaining,
  getProgressiveDelay,
  updateUserProfile,
  changePassword,
  deleteAccount,
} from '@/services/authservice';
import { createUserProfileIfNew, loadUserLibrary, upsertUserProfile, fetchUserProfile } from '@/services/Firestoreservice';
import { useLibraryStore } from '@/store/libraryStore';
import type { User, AuthState } from '@/types';

interface AuthStore extends AuthState {
  firebaseUser:        FirebaseUser | null;
  isInitialized:       boolean;
  error:               string;
  lockRemaining:       number;
  progressDelay:       number;
  loginGoogle:         () => Promise<void>;
  loginEmail:          (email: string, password: string) => Promise<void>;
  registerEmail:       (email: string, password: string, name: string) => Promise<void>;
  sendPasswordReset:   (email: string) => Promise<void>;
  handleRedirectResult:() => Promise<void>;
  logout:              () => Promise<void>;
  updateProfileData:   (name: string, picture?: string) => Promise<void>;
  changeUserPassword:  (current: string, next: string) => Promise<void>;
  deleteUserAccount:   (password?: string) => Promise<void>;
  clearError:          () => void;
  setLoading:          (v: boolean) => void;
}

const USER_KEY = 'sw_auth_user';

function toAppUser(fu: FirebaseUser): User {
  return { id: fu.uid, name: fu.displayName ?? 'User', email: fu.email ?? '', picture: fu.photoURL ?? '', token: '' };
}
function persistUser(u: User) {
  localStorage.setItem(USER_KEY, JSON.stringify({ id: u.id, name: u.name, email: u.email, picture: u.picture }));
}
function loadPersistedUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw) as User;
    return u.id && u.email ? { ...u, token: '' } : null;
  } catch { return null; }
}

async function applyFirebaseUser(fu: FirebaseUser, set: (p: Partial<AuthStore>) => void) {
  const user = toAppUser(fu);
  persistUser(user);
  try {
    await createUserProfileIfNew(user.id, user);
    const lib = await loadUserLibrary(user.id);
    useLibraryStore.getState().hydrateFromFirestore(lib);
  } catch (e) {
    console.warn('[Auth] Firestore sync skipped:', (e as Error).message);
  }
  set({ user, firebaseUser: fu, isAuthenticated: true, isLoading: false, error: '' });
}

export const useAuthStore = create<AuthStore>((set) => ({
  user:            loadPersistedUser(),
  firebaseUser:    null,
  isAuthenticated: Boolean(loadPersistedUser()),
  isInitialized:   false,
  isLoading:       false,
  error:           '',
  lockRemaining:   getLockoutRemaining(),
  progressDelay:   getProgressiveDelay(),

  loginGoogle: async () => {
    set({ isLoading: true, error: '' });
    try {
      const fu = await signInWithGoogle();
      if (fu) await applyFirebaseUser(fu, set);
      // null = redirect triggered, page navigates away
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed.';
      set({ isLoading: false, error: msg, lockRemaining: getLockoutRemaining() });
      throw err;
    }
  },

  loginEmail: async (email, password) => {
    set({ isLoading: true, error: '' });
    try {
      const fu = await loginWithEmail(email, password);
      await applyFirebaseUser(fu, set);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed.';
      set({ isLoading: false, error: msg, lockRemaining: getLockoutRemaining() });
      throw err;
    }
  },

  registerEmail: async (email, password, name) => {
    set({ isLoading: true, error: '' });
    try {
      const fu = await registerWithEmail(email, password, name);
      await applyFirebaseUser(fu, set);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      set({ isLoading: false, error: msg });
      throw err;
    }
  },

  sendPasswordReset: async (email) => {
    await resetPassword(email);
  },

  handleRedirectResult: async () => {
    try {
      const fu = await getRedirectResultOnReturn();
      if (fu) await applyFirebaseUser(fu, set);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Sign-in failed after redirect.' });
    }
  },

  logout: async () => {
    await signOut();
    localStorage.removeItem(USER_KEY);
    useLibraryStore.getState().clearAll();
    set({ user: null, firebaseUser: null, isAuthenticated: false, error: '' });
  },

  clearError: () => set({ error: '' }),
  setLoading: (v) => set({ isLoading: v }),

  changeUserPassword: async (current, next) => {
    set({ isLoading: true, error: '' });
    try {
      await changePassword(current, next);
      set({ isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Failed.' });
      throw err;
    }
  },

  deleteUserAccount: async (password) => {
    set({ isLoading: true, error: '' });
    try {
      const uid = useAuthStore.getState().user?.id;
      if (uid) {
        const { deleteAllUserData } = await import('@/services/Firestoreservice');
        await deleteAllUserData(uid).catch(() => {});
      }
      await deleteAccount(password);
      localStorage.clear();
      useLibraryStore.getState().clearAll();
      set({ user: null, firebaseUser: null, isAuthenticated: false, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Failed.' });
      throw err;
    }
  },

  updateProfileData: async (name, picture) => {
    set({ isLoading: true, error: '' });
    try {
      await updateUserProfile(name, picture);
      const fu = useAuthStore.getState().firebaseUser;
      if (fu) {
        const updated = { ...useAuthStore.getState().user!, name, ...(picture !== undefined ? { picture } : {}) };
        persistUser(updated);
        await upsertUserProfile(updated.id, updated);
        set({ user: updated, isLoading: false });
      }
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Update failed.' });
      throw err;
    }
  },
}));

onAuthChange(async (fu) => {
  if (fu) {
    const user = toAppUser(fu);
    // Restore avatar from Firestore (Firebase Auth photoURL can't hold base64)
    const profile = await fetchUserProfile(fu.uid).catch(() => null);
    if (profile?.picture) user.picture = profile.picture;
    if (profile?.name)    user.name    = profile.name;
    persistUser(user);
    const already = useAuthStore.getState().isAuthenticated;
    if (!already) {
      try {
        const lib = await loadUserLibrary(user.id);
        useLibraryStore.getState().hydrateFromFirestore(lib);
      } catch { /* local cache fallback */ }
    }
    useAuthStore.setState({ user, firebaseUser: fu, isAuthenticated: true, isInitialized: true });
  } else {
    localStorage.removeItem(USER_KEY);
    useAuthStore.setState({ user: null, firebaseUser: null, isAuthenticated: false, isInitialized: true });
  }
});