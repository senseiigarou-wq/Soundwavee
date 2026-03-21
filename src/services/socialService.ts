// ============================================================
// SOUNDWAVE — Social Service
// Follow users, collaborative playlists, share links
// All backed by Firestore.
// ============================================================

import {
  doc, getDoc, setDoc, deleteDoc, updateDoc,
  collection, getDocs, query, where, orderBy, limit,
  serverTimestamp, increment, writeBatch, onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/config/Firebase';
import type { PublicUser, SocialPlaylist, Song } from '@/types';

// ═══════════════════════════════════════════════════════════════
// PATHS
// ═══════════════════════════════════════════════════════════════
const userDoc        = (uid: string)                  => doc(db, 'users', uid);
const followersCol   = (uid: string)                  => collection(db, 'users', uid, 'followers');
const followingCol   = (uid: string)                  => collection(db, 'users', uid, 'following');
const followerDoc    = (uid: string, fid: string)     => doc(db, 'users', uid, 'followers', fid);
const followingDoc   = (uid: string, fid: string)     => doc(db, 'users', uid, 'following', fid);
const socialPlCol    = ()                              => collection(db, 'socialPlaylists');
const socialPlDoc    = (id: string)                   => doc(db, 'socialPlaylists', id);

// ═══════════════════════════════════════════════════════════════
// USER PROFILE
// ═══════════════════════════════════════════════════════════════

export async function upsertPublicProfile(
  uid: string,
  displayName: string,
  avatar: string
): Promise<void> {
  const ref = userDoc(uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid, displayName, avatar,
      isPublic: true,
      followersCount: 0,
      followingCount: 0,
      createdAt: serverTimestamp(),
    });
  } else {
    await updateDoc(ref, { displayName, avatar });
  }
}

export async function getUserProfile(uid: string): Promise<PublicUser | null> {
  const snap = await getDoc(userDoc(uid));
  if (!snap.exists()) return null;
  return snap.data() as PublicUser;
}

/** Search users by displayName prefix */
export async function searchUsers(
  queryStr: string,
  currentUid: string,
  max = 10
): Promise<PublicUser[]> {
  const q = query(
    collection(db, 'users'),
    where('isPublic', '==', true),
    where('displayName', '>=', queryStr),
    where('displayName', '<=', queryStr + '\uf8ff'),
    limit(max)
  );
  const snaps = await getDocs(q);
  return snaps.docs
    .map(d => d.data() as PublicUser)
    .filter(u => u.uid !== currentUid);
}

/** Search by exact email (stored separately for privacy) */
export async function searchUserByEmail(
  email: string,
  currentUid: string
): Promise<PublicUser | null> {
  const q = query(
    collection(db, 'users'),
    where('email', '==', email.toLowerCase()),
    limit(1)
  );
  const snaps = await getDocs(q);
  if (snaps.empty) return null;
  const u = snaps.docs[0].data() as PublicUser;
  return u.uid !== currentUid ? u : null;
}

// ═══════════════════════════════════════════════════════════════
// FOLLOW / UNFOLLOW
// ═══════════════════════════════════════════════════════════════

export async function followUser(myUid: string, targetUid: string): Promise<void> {
  const batch = writeBatch(db);
  batch.set(followingDoc(myUid, targetUid), { uid: targetUid, followedAt: serverTimestamp() });
  batch.set(followerDoc(targetUid, myUid), { uid: myUid,     followedAt: serverTimestamp() });
  batch.update(userDoc(myUid),     { followingCount: increment(1) });
  batch.update(userDoc(targetUid), { followersCount: increment(1) });
  await batch.commit();
}

export async function unfollowUser(myUid: string, targetUid: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(followingDoc(myUid, targetUid));
  batch.delete(followerDoc(targetUid, myUid));
  batch.update(userDoc(myUid),     { followingCount: increment(-1) });
  batch.update(userDoc(targetUid), { followersCount: increment(-1) });
  await batch.commit();
}

export async function isFollowing(myUid: string, targetUid: string): Promise<boolean> {
  const snap = await getDoc(followingDoc(myUid, targetUid));
  return snap.exists();
}

export async function getFollowing(uid: string): Promise<PublicUser[]> {
  const snaps = await getDocs(followingCol(uid));
  const uids  = snaps.docs.map(d => d.id);
  if (!uids.length) return [];
  const profiles = await Promise.all(uids.map(id => getUserProfile(id)));
  return profiles.filter(Boolean) as PublicUser[];
}

export async function getFollowers(uid: string): Promise<PublicUser[]> {
  const snaps = await getDocs(followersCol(uid));
  const uids  = snaps.docs.map(d => d.id);
  if (!uids.length) return [];
  const profiles = await Promise.all(uids.map(id => getUserProfile(id)));
  return profiles.filter(Boolean) as PublicUser[];
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC PLAYLISTS OF A USER
// ═══════════════════════════════════════════════════════════════

export async function getUserPublicPlaylists(uid: string): Promise<SocialPlaylist[]> {
  const q = query(
    socialPlCol(),
    where('ownerId', '==', uid),
    where('isPublic', '==', true),
    orderBy('updatedAt', 'desc')
  );
  const snaps = await getDocs(q);
  return snaps.docs.map(d => ({ id: d.id, ...d.data() }) as SocialPlaylist);
}

// ═══════════════════════════════════════════════════════════════
// SOCIAL / COLLABORATIVE PLAYLISTS
// ═══════════════════════════════════════════════════════════════

function generateToken(): string {
  return Math.random().toString(36).slice(2, 10) +
         Math.random().toString(36).slice(2, 10);
}

export async function createSocialPlaylist(
  owner: { uid: string; name: string; avatar: string },
  name: string,
  isPublic: boolean,
  isCollaborative: boolean
): Promise<SocialPlaylist> {
  const ref   = doc(socialPlCol());
  const token = generateToken();
  const pl: Omit<SocialPlaylist, 'id'> = {
    name,
    ownerId:         owner.uid,
    ownerName:       owner.name,
    ownerAvatar:     owner.avatar,
    songs:           [],
    isPublic,
    isCollaborative,
    collaborators:   isCollaborative ? [owner.uid] : [],
    shareToken:      token,
    createdAt:       new Date().toISOString(),
    updatedAt:       new Date().toISOString(),
  };
  await setDoc(ref, pl);
  return { id: ref.id, ...pl };
}

export async function getSocialPlaylist(id: string): Promise<SocialPlaylist | null> {
  const snap = await getDoc(socialPlDoc(id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as SocialPlaylist;
}

export async function getSocialPlaylistByToken(token: string): Promise<SocialPlaylist | null> {
  const q = query(socialPlCol(), where('shareToken', '==', token), limit(1));
  const snaps = await getDocs(q);
  if (snaps.empty) return null;
  return { id: snaps.docs[0].id, ...snaps.docs[0].data() } as SocialPlaylist;
}

export async function addSongToSocialPlaylist(
  playlistId: string,
  song: Song,
  uid: string
): Promise<void> {
  const snap = await getDoc(socialPlDoc(playlistId));
  if (!snap.exists()) throw new Error('Playlist not found');
  const pl = snap.data() as SocialPlaylist;
  if (!pl.isCollaborative && pl.ownerId !== uid) throw new Error('Not authorized');
  if (pl.isCollaborative && !pl.collaborators.includes(uid)) throw new Error('Not a collaborator');
  const songs = [...pl.songs];
  if (songs.some(s => s.youtubeId === song.youtubeId)) return; // already added
  songs.push({ ...song, addedAt: new Date().toISOString() });
  await updateDoc(socialPlDoc(playlistId), { songs, updatedAt: new Date().toISOString() });
}

export async function removeSongFromSocialPlaylist(
  playlistId: string,
  youtubeId: string,
  uid: string
): Promise<void> {
  const snap = await getDoc(socialPlDoc(playlistId));
  if (!snap.exists()) throw new Error('Playlist not found');
  const pl = snap.data() as SocialPlaylist;
  if (pl.ownerId !== uid && !pl.collaborators.includes(uid)) throw new Error('Not authorized');
  const songs = pl.songs.filter(s => s.youtubeId !== youtubeId);
  await updateDoc(socialPlDoc(playlistId), { songs, updatedAt: new Date().toISOString() });
}

export async function joinCollaborativePlaylist(
  playlistId: string,
  uid: string
): Promise<void> {
  const snap = await getDoc(socialPlDoc(playlistId));
  if (!snap.exists()) throw new Error('Playlist not found');
  const pl = snap.data() as SocialPlaylist;
  if (!pl.isCollaborative) throw new Error('Not a collaborative playlist');
  if (pl.collaborators.includes(uid)) return;
  await updateDoc(socialPlDoc(playlistId), {
    collaborators: [...pl.collaborators, uid],
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteSocialPlaylist(
  playlistId: string,
  uid: string
): Promise<void> {
  const snap = await getDoc(socialPlDoc(playlistId));
  if (!snap.exists()) return;
  if ((snap.data() as SocialPlaylist).ownerId !== uid) throw new Error('Not the owner');
  await deleteDoc(socialPlDoc(playlistId));
}

/** Real-time listener for a social playlist */
export function subscribeSocialPlaylist(
  id: string,
  callback: (pl: SocialPlaylist) => void
): Unsubscribe {
  return onSnapshot(socialPlDoc(id), snap => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() } as SocialPlaylist);
  });
}

/** Get all playlists a user collaborates on */
export async function getMyCollabPlaylists(uid: string): Promise<SocialPlaylist[]> {
  const q = query(
    socialPlCol(),
    where('collaborators', 'array-contains', uid),
    orderBy('updatedAt', 'desc')
  );
  const snaps = await getDocs(q);
  return snaps.docs.map(d => ({ id: d.id, ...d.data() }) as SocialPlaylist);
}