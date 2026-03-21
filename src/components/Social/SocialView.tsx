// ============================================================
// SOUNDWAVE — Social Hub
// Find people, manage follows, collab playlists, share
// ============================================================
import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Music, Share2, Link } from 'lucide-react';
import { getFollowing, getFollowers } from '@/services/socialService';
import { useAuthStore } from '@/store/authStore';
import { UserSearchModal } from './UserSearchModal';
import { UserProfileModal } from './UserProfileModal';
import { CollabPlaylistModal } from './CollabPlaylistModal';
import type { PublicUser, SocialPlaylist } from '@/types';

interface SocialViewProps {
  onPlaySocialPlaylist: (pl: SocialPlaylist) => void;
}

export function SocialView({ onPlaySocialPlaylist }: SocialViewProps) {
  const { user } = useAuthStore();
  const [following, setFollowing]   = useState<PublicUser[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [showCollab, setShowCollab] = useState(false);
  const [viewUser, setViewUser]     = useState<PublicUser | null>(null);

  useEffect(() => {
    if (!user) return;
    getFollowing(user.id).then(setFollowing).finally(() => setLoading(false));
  }, [user]);

  return (
    <div style={{ paddingBottom: 32 }}>
      <div className="page-header">
        <h1 className="page-title">Community</h1>
        <p className="page-subtitle">Connect with friends, share music</p>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
        <button onClick={() => setShowSearch(true)} style={{ padding: '16px', borderRadius: 16, background: 'rgba(255,107,157,0.08)', border: '1px solid rgba(255,107,157,0.2)', color: 'var(--pink)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, transition: 'all 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,107,157,0.14)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,107,157,0.08)')}
        >
          <UserPlus size={22} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Find People</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Search by name or email</div>
          </div>
        </button>
        <button onClick={() => setShowCollab(true)} style={{ padding: '16px', borderRadius: 16, background: 'rgba(126,208,236,0.08)', border: '1px solid rgba(126,208,236,0.2)', color: '#7ed0ec', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, transition: 'all 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(126,208,236,0.14)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(126,208,236,0.08)')}
        >
          <Users size={22} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Collab Playlists</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Build playlists together</div>
          </div>
        </button>
      </div>

      {/* Following */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
          Following ({following.length})
        </div>
        {loading && <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>}
        {!loading && following.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
            <Users size={36} style={{ marginBottom: 10, opacity: 0.3 }} />
            <div style={{ fontSize: 14, marginBottom: 4 }}>Not following anyone yet</div>
            <div style={{ fontSize: 12 }}>Find your classmates and follow them</div>
          </div>
        )}
        {following.map(u => (
          <div key={u.uid} onClick={() => setViewUser(u)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', borderRadius: 14, cursor: 'pointer', marginBottom: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
          >
            <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg,#FF6B9D,#E05587)', flexShrink: 0 }}>
              {u.avatar ? <img src={u.avatar} alt={u.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff' }}>{u.displayName[0]}</div>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{u.displayName}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.followersCount} followers</div>
            </div>
            <Music size={15} color="var(--text-muted)" />
          </div>
        ))}
      </div>

      {/* Modals */}
      {showSearch && (
        <UserSearchModal
          onClose={() => setShowSearch(false)}
          onViewUser={u => { setShowSearch(false); setViewUser(u); }}
        />
      )}
      {viewUser && (
        <UserProfileModal
          targetUser={viewUser}
          onClose={() => setViewUser(null)}
          onPlaylist={pl => { setViewUser(null); onPlaySocialPlaylist(pl); }}
        />
      )}
      {showCollab && (
        <CollabPlaylistModal
          onClose={() => setShowCollab(false)}
          onPlay={pl => { setShowCollab(false); onPlaySocialPlaylist(pl); }}
        />
      )}
    </div>
  );
}