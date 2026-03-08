// ============================================================
// SOUNDWAVE — Authentication Service
// Supports: Google Sign-In + Email/Password Sign-Up & Sign-In
// ============================================================

import {
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  verifyPasswordResetCode,
  confirmPasswordReset,
  type User as FirebaseUser,
  type Unsubscribe,
} from 'firebase/auth';
import { auth, googleProvider } from '@/config/Firebase';
import { ENV } from '@/config/env';

// ─── Iframe detection ─────────────────────────────────────────
export function isInIframe(): boolean {
  try { return window.self !== window.top; } catch { return true; }
}

// ─── Brute-force protection ───────────────────────────────────

const BF_KEY = 'sw_auth_bf';
interface BFRecord { attempts: number; lastAttempt: number; lockedUntil: number; }

function loadBF(): BFRecord {
  try { return JSON.parse(localStorage.getItem(BF_KEY) ?? 'null') ?? { attempts: 0, lastAttempt: 0, lockedUntil: 0 }; }
  catch { return { attempts: 0, lastAttempt: 0, lockedUntil: 0 }; }
}
function saveBF(r: BFRecord) { localStorage.setItem(BF_KEY, JSON.stringify(r)); }

export function getLockoutRemaining(): number { return Math.max(0, loadBF().lockedUntil - Date.now()); }
export function getProgressiveDelay(): number {
  const { attempts } = loadBF();
  if (attempts <= 1) return 0;
  return Math.min(2 ** (attempts - 2) * 1000, 30_000);
}
export function recordLoginFailure(): void {
  const bf = loadBF();
  bf.attempts += 1; bf.lastAttempt = Date.now();
  if (bf.attempts >= ENV.AUTH_MAX_ATTEMPTS) bf.lockedUntil = Date.now() + ENV.AUTH_LOCKOUT_MS;
  saveBF(bf);
}
export function recordLoginSuccess(): void { localStorage.removeItem(BF_KEY); }

// ─── Rate limiter ─────────────────────────────────────────────
interface Bucket { tokens: number; lastRefill: number; }
const AUTH_RL_KEY = 'sw_auth_rl';
const AUTH_RL_MAX = 10;
const AUTH_RL_WIN = 5 * 60 * 1000;

export function consumeAuthToken(): boolean {
  let b: Bucket;
  try { b = JSON.parse(localStorage.getItem(AUTH_RL_KEY) ?? 'null') ?? { tokens: AUTH_RL_MAX, lastRefill: Date.now() }; }
  catch { b = { tokens: AUTH_RL_MAX, lastRefill: Date.now() }; }
  const elapsed = Date.now() - b.lastRefill;
  b.tokens = Math.min(AUTH_RL_MAX, b.tokens + (elapsed / AUTH_RL_WIN) * AUTH_RL_MAX);
  b.lastRefill = Date.now();
  if (b.tokens < 1) { localStorage.setItem(AUTH_RL_KEY, JSON.stringify(b)); return false; }
  b.tokens -= 1;
  localStorage.setItem(AUTH_RL_KEY, JSON.stringify(b));
  return true;
}

// ─── Input validation ─────────────────────────────────────────

export function validateEmail(email: string): void {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    throw new Error('Please enter a valid email address.');
  if (email.length > 320) throw new Error('Email address is too long.');
}

export function validatePassword(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 8)       errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password))   errors.push('One uppercase letter');
  if (!/[0-9]/.test(password))   errors.push('One number');
  if (password.length > 128)     errors.push('Max 128 characters');
  return errors;
}

export function validateDisplayName(name: string): void {
  const t = name.trim();
  if (!t || t.length < 2) throw new Error('Name must be at least 2 characters.');
  if (t.length > 50) throw new Error('Name must be 50 characters or less.');
  if (/<|>|script/i.test(t)) throw new Error('Name contains invalid characters.');
}

// ─── Pre-flight ───────────────────────────────────────────────
function preflightCheck() {
  if (!consumeAuthToken()) throw new Error('Too many sign-in attempts. Please wait a few minutes.');
  const lock = getLockoutRemaining();
  if (lock > 0) throw new Error(`Locked out. Try again in ${Math.ceil(lock / 60_000)} min.`);
}

// ─── Google Sign-In (popup → redirect fallback) ───────────────
export async function signInWithGoogle(): Promise<FirebaseUser | null> {
  preflightCheck();
  await setPersistence(auth, browserLocalPersistence);

  if (!isInIframe()) {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      recordLoginSuccess();
      return result.user;
    } catch (err) {
      const code = (err as { code?: string }).code ?? '';
      if (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request') {
        // fall through to redirect
      } else if (code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in cancelled.');
      } else {
        recordLoginFailure();
        throw mapFirebaseError(code);
      }
    }
  }

  await signInWithRedirect(auth, googleProvider);
  return null;
}

export async function getRedirectResultOnReturn(): Promise<FirebaseUser | null> {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) { recordLoginSuccess(); return result.user; }
    return null;
  } catch (err) {
    const code = (err as { code?: string }).code ?? '';
    if (code === 'auth/unauthorized-domain') {
      throw new Error(`Domain not authorized.\n\nFirebase Console → Authentication → Settings → Authorized Domains → Add:\n${window.location.hostname}`);
    }
    recordLoginFailure();
    throw mapFirebaseError(code);
  }
}

// ─── Email / Password Sign-Up ─────────────────────────────────
export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<FirebaseUser> {
  preflightCheck();
  validateEmail(email);
  const pwErrors = validatePassword(password);
  if (pwErrors.length) throw new Error(`Password requirements: ${pwErrors.join(', ')}`);
  validateDisplayName(displayName);

  try {
    await setPersistence(auth, browserLocalPersistence);
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(cred.user, { displayName: displayName.trim() });
    // Send verification email (don't block on it)
    sendEmailVerification(cred.user).catch(() => {});
    recordLoginSuccess();
    return cred.user;
  } catch (err) {
    const code = (err as { code?: string }).code ?? '';
    recordLoginFailure();
    throw mapFirebaseError(code);
  }
}

// ─── Email / Password Sign-In ─────────────────────────────────
export async function loginWithEmail(
  email: string,
  password: string,
): Promise<FirebaseUser> {
  preflightCheck();
  validateEmail(email);

  const delay = getProgressiveDelay();
  if (delay > 0) await new Promise(r => window.setTimeout(r, delay));

  try {
    await setPersistence(auth, browserLocalPersistence);
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    recordLoginSuccess();
    return cred.user;
  } catch (err) {
    const code = (err as { code?: string }).code ?? '';
    recordLoginFailure();
    throw mapFirebaseError(code);
  }
}

// ─── Password Reset ───────────────────────────────────────────
export async function resetPassword(email: string): Promise<void> {
  validateEmail(email);
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (err) {
    throw mapFirebaseError((err as { code?: string }).code ?? '');
  }
}

// ─── Sign-out ─────────────────────────────────────────────────
export async function signOut(): Promise<void> { await firebaseSignOut(auth); }

export function onAuthChange(cb: (user: FirebaseUser | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, cb);
}

// ─── Error mapping ────────────────────────────────────────────
function mapFirebaseError(code: string): Error {
  const map: Record<string, string> = {
    'auth/email-already-in-use':       'An account with this email already exists. Try signing in.',
    'auth/invalid-email':              'Invalid email address.',
    'auth/weak-password':              'Password is too weak. Use at least 8 characters.',
    'auth/user-not-found':             'No account found with this email.',
    'auth/wrong-password':             'Incorrect password. Try again or reset your password.',
    'auth/invalid-credential':         'Incorrect email or password.',
    'auth/too-many-requests':          'Too many failed attempts. Please wait before trying again.',
    'auth/user-disabled':              'This account has been disabled.',
    'auth/network-request-failed':     'Network error. Please check your connection.',
    'auth/popup-blocked':              'Sign-in popup was blocked. Please allow popups for this site.',
    'auth/unauthorized-domain':        `Add "${window.location.hostname}" to Firebase → Auth → Authorized Domains.`,
    'auth/operation-not-allowed':      'Email/password sign-in is not enabled. Enable it in Firebase Console → Authentication → Sign-in method.',
  };
  return new Error(map[code] ?? `Sign-in failed. Please try again. (${code})`);
}

// ─── Update display name in Firebase Auth.
// Avatar is stored in Firestore/localStorage only —
// Firebase Auth photoURL only accepts real URLs, not base64.
export async function updateUserProfile(
  displayName: string,
  photoURL?: string,
): Promise<void> {
  const u = auth.currentUser;
  if (!u) throw new Error('Not signed in.');
  validateDisplayName(displayName);
  // Skip passing photoURL to Firebase Auth if it's base64 data
  const isBase64 = photoURL?.startsWith('data:');
  await updateProfile(u, {
    displayName: displayName.trim(),
    ...(!isBase64 && photoURL !== undefined ? { photoURL } : {}),
  });
}

// ─── Change password (requires re-auth for email users) ──────
export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const u = auth.currentUser;
  if (!u || !u.email) throw new Error('Not signed in with email/password.');
  const issues = validatePassword(newPassword);
  if (issues.length) throw new Error('New password: ' + issues[0]);
  const cred = EmailAuthProvider.credential(u.email, currentPassword);
  await reauthenticateWithCredential(u, cred);
  await updatePassword(u, newPassword);
}

// ─── Delete account (requires re-auth) ───────────────────────
export async function deleteAccount(currentPassword?: string): Promise<void> {
  const u = auth.currentUser;
  if (!u) throw new Error('Not signed in.');
  // If email/password user, re-auth first
  if (u.email && currentPassword) {
    const cred = EmailAuthProvider.credential(u.email, currentPassword);
    await reauthenticateWithCredential(u, cred);
  }
  await deleteUser(u);
}

// ─── Verify oobCode and get email for password reset page ────
export async function verifyResetCode(oobCode: string): Promise<string> {
  return verifyPasswordResetCode(auth, oobCode);
}

// ─── Complete the password reset with new password ───────────
export async function confirmPasswordResetWithCode(
  oobCode: string,
  newPassword: string,
): Promise<void> {
  const issues = validatePassword(newPassword);
  if (issues.length) throw new Error(issues[0]);
  await confirmPasswordReset(auth, oobCode, newPassword);
}