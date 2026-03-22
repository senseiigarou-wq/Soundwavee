// ============================================================
// SOUNDWAVE — Firestore Service
//
// All database reads and writes go through this file.
//
// Data structure in Firestore:
//
//   users/{uid}                        ← profile + metadata
//   users/{uid}/playlists/{id}         ← one doc per playlist
//   users/{uid}/likedSongs/{youtubeId} ← one doc per liked song
//   users/{uid}/recentSongs/history    ← single doc, array of songs
//
// ============================================================

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  serverTimestamp,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/config/Firebase';
import type { Song, Playlist, User } from '@/types';

// ─── Path helpers ─────────────────────────────────────────────

const userDoc      = (uid: string)              => doc(db, 'users', uid);
const playlistsCol = (uid: string)              => collection(db, 'users', uid, 'playlists');
const playlistDoc  = (uid: string, id: string)  => doc(db, 'users', uid, 'playlists', id);
const likedCol     = (uid: string)              => collection(db, 'users', uid, 'likedSongs');
const likedDoc     = (uid: string, yid: string) => doc(db, 'users', uid, 'likedSongs', yid);
const recentDoc    = (uid: string)              => doc(db, 'users', uid, 'recentSongs', 'history');

// ─── User Profile ─────────────────────────────────────────────

/**
 * Called on every login.
 * - Creates a full profile for new users
 * - For existing users: syncs name/email/picture AND fills in
 *   any missing fields (uid, displayName, isPublic, etc.)
 *
 * This permanently fixes old accounts that are missing fields
 * without any manual Firestore editing needed.
 */
export async function createUserProfileIfNew(uid: string, data: Omit<User, 'token' | 'id'>): Promise<void> {
  const snap = await getDoc(userDoc(uid));

  if (!snap.exists()) {
    // Brand new user — create complete profile with ALL required fields
    await setDoc(userDoc(uid), {
      uid,
      id:             uid,
      name:           data.name,
      email:          data.email.toLowerCase(),
      picture:        data.picture ?? '',
      displayName:    data.name,
      avatar:         data.picture ?? '',
      isPublic:       true,
      followersCount: 0,
      followingCount: 0,
      createdAt:      serverTimestamp(),
      updatedAt:      serverTimestamp(),
    });
  } else {
    // Existing user — sync latest info + fill any missing fields
    const existing = snap.data();
    await updateDoc(userDoc(uid), {
      // Always keep these up to date
      name:      data.name,
      email:     data.email.toLowerCase(),
      picture:   data.picture ?? existing.picture ?? '',
      updatedAt: serverTimestamp(),

      // Fill missing fields permanently on next login
      ...(!existing.uid                               && { uid }),
      ...(!existing.id                                && { id: uid }),
      ...(!existing.displayName                       && { displayName: data.name }),
      ...(!existing.avatar                            && { avatar: data.picture ?? '' }),
      ...(existing.isPublic       === undefined       && { isPublic: true }),
      ...(existing.followersCount === undefined       && { followersCount: 0 }),
      ...(existing.followingCount === undefined       && { followingCount: 0 }),
    });
  }
}

/**
 * Update profile data when user explicitly saves changes.
 * Syncs both the private (name/picture) and public (displayName/avatar) fields.
 */
export async function upsertUserProfile(uid: string, data: Omit<User, 'token' | 'id'>): Promise<void> {
  await setDoc(userDoc(uid), {
    name:        data.name,
    email:       data.email.toLowerCase(),
    picture:     data.picture,
    displayName: data.name,
    avatar:      data.picture,
    updatedAt:   serverTimestamp(),
  }, { merge: true });
}

/** Fetch stored profile data (name, picture) from Firestore. */
export async function fetchUserProfile(uid: string): Promise<{ name?: string; picture?: string } | null> {
  try {
    const snap = await getDoc(userDoc(uid));
    if (!snap.exists()) return null;
    const d = snap.data();
    return { name: d.name, picture: d.picture };
  } catch { return null; }
}

// ─── Playlists ────────────────────────────────────────────────

export async function fetchPlaylists(uid: string): Promise<Playlist[]> {
  const snap = await getDocs(playlistsCol(uid));
  return snap.docs.map(d => {
    const data = d.data() as DocumentData;
    return {
      id:        d.id,
      name:      data.name ?? '',
      songs:     data.songs ?? [],
      createdAt: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    } as Playlist;
  });
}

export async function savePlaylist(uid: string, playlist: Playlist): Promise<void> {
  await setDoc(playlistDoc(uid, playlist.id), {
    name:      playlist.name,
    songs:     playlist.songs,
    createdAt: playlist.createdAt,
    updatedAt: new Date().toISOString(),
  });
}

export async function deletePlaylistFromDB(uid: string, id: string): Promise<void> {
  await deleteDoc(playlistDoc(uid, id));
}

// ─── Liked Songs ──────────────────────────────────────────────

export async function fetchLikedSongs(uid: string): Promise<Song[]> {
  const snap = await getDocs(likedCol(uid));
  const songs = snap.docs.map(d => d.data() as Song);
  return songs.sort((a, b) =>
    (b.likedAt ?? '').localeCompare(a.likedAt ?? ''),
  );
}

export async function likeSong(uid: string, song: Song): Promise<void> {
  await setDoc(likedDoc(uid, song.youtubeId), {
    ...song,
    likedAt: new Date().toISOString(),
  });
}

export async function unlikeSong(uid: string, youtubeId: string): Promise<void> {
  await deleteDoc(likedDoc(uid, youtubeId));
}

// ─── Recent Songs ─────────────────────────────────────────────

export async function fetchRecentSongs(uid: string): Promise<Song[]> {
  const snap = await getDoc(recentDoc(uid));
  if (!snap.exists()) return [];
  return (snap.data().songs as Song[]) ?? [];
}

export async function saveRecentSongs(uid: string, songs: Song[]): Promise<void> {
  const capped = songs.slice(0, 20);
  await setDoc(recentDoc(uid), { songs: capped, updatedAt: new Date().toISOString() });
}

// ─── Load all user data at once (called after login) ──────────

export interface UserLibraryData {
  playlists:   Playlist[];
  likedSongs:  Song[];
  recentSongs: Song[];
}

export async function loadUserLibrary(uid: string): Promise<UserLibraryData> {
  const [playlists, likedSongs, recentSongs] = await Promise.all([
    fetchPlaylists(uid),
    fetchLikedSongs(uid),
    fetchRecentSongs(uid),
  ]);
  return { playlists, likedSongs, recentSongs };
}

// ─── Wipe all user data (called on account delete) ────────────

export async function deleteAllUserData(uid: string): Promise<void> {
  const batch = writeBatch(db);

  const plSnap = await getDocs(playlistsCol(uid));
  plSnap.docs.forEach(d => batch.delete(d.ref));

  const liSnap = await getDocs(likedCol(uid));
  liSnap.docs.forEach(d => batch.delete(d.ref));

  batch.delete(recentDoc(uid));
  batch.delete(userDoc(uid));

  await batch.commit();
}
