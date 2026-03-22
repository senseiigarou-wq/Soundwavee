// ============================================================
// SOUNDWAVE — User Profile Modal
// View another user's public playlists, follow them
// ============================================================
import React, { useState, useEffect } from 'react';
import { X, UserPlus, UserCheck, ListMusic, Play } from 'lucide-react';
import { getUserPublicPlaylists, followUser, unfollowUser, isFollowing as checkFollowing } from '@/services/socialService';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/common/Toast';
import type { PublicUser, SocialPlaylist } from '@/types';

interface UserProfileModalProps {
  targetUser: PublicUser;
  onClose:    () => void;
  onPlaylist: (pl: SocialPlaylist) => void;
}

export function UserProfileModal({ targetUser, onClose, onPlaylist }: UserProfileModalProps) {
  const { user }      = useAuthStore();
  const { showToast } = useToast();
  const [playlists, setPlaylists] = useState<SocialPlaylist[]>([]);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!user || !targetUser.uid) return;
    Promise.all([
      getUserPublicPlaylists(targetUser.uid),
      checkFollowing(user.id, targetUser.uid),
    ]).then(([pls, isF]) => {
      setPlaylists(pls);
      setFollowing(isF);
    }).catch(() => {
      showToast('Failed to load profile', 'error');
    }).finally(() => setLoading(false));
  }, [targetUser.uid, user]);

  const toggleFollow = async () => {
    if (!user) return;
    if (!targetUser.uid) {
      showToast('Cannot follow — user profile incomplete', 'error');
      return;
    }
    try {
      if (following) {
        await unfollowUser(user.id, targetUser.uid);
        setFollowing(false);
        showToast(`Unfollowed ${targetUser.displayName}`);
      } else {
        await followUser(user.id, targetUser.uid);
        setFollowing(true);
        showToast(`Following ${targetUser.displayName} ♥`);
      }
    } catch {
      showToast('Action failed', 'error');
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:402, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(10px)' }} />
      <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:403, background:'#181818', borderRadius:'24px 24px 0 0', border:'1px solid rgba(255,255,255,0.08)', padding:`0 0 max(28px, env(safe-area-inset-bottom))`, animation:'sm-slide 0.28s cubic-bezier(0.16,1,0.3,1)', maxWidth:540, margin:'0 auto', maxHeight:'85vh', display:'flex', flexDirection:'column' }}>

        <div style={{ display:'flex', justifyContent:'center', padding:'14px 0 0', flexShrink:0 }}>
          <div style={{ width:36, height:4, borderRadius:2, background:'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Close */}
        <div style={{ display:'flex', justifyContent:'flex-end', padding:'12px 20px 0', flexShrink:0 }}>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, background:'rgba(255,255,255,0.07)', border:'none', color:'var(--text-muted)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={16} />
          </button>
        </div>

        {/* Profile hero */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, padding:'8px 20px 20px', flexShrink:0 }}>
          <div style={{ width:80, height:80, borderRadius:'50%', overflow:'hidden', background:'linear-gradient(135deg,#FF6B9D,#E05587)', border:'3px solid rgba(255,107,157,0.4)' }}>
            {targetUser.avatar
              ? <img src={targetUser.avatar} alt={targetUser.displayName} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:800, color:'#fff' }}>{targetUser.displayName?.[0] ?? '?'}</div>
            }
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:20, fontWeight:800, color:'#fff' }}>{targetUser.displayName}</div>
            <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:4, display:'flex', gap:16, justifyContent:'center' }}>
              <span><strong style={{ color:'#fff' }}>{targetUser.followersCount ?? 0}</strong> followers</span>
              <span><strong style={{ color:'#fff' }}>{targetUser.followingCount ?? 0}</strong> following</span>
            </div>
          </div>
          {user && user.id !== targetUser.uid && (
            <button
              onClick={toggleFollow}
              style={{ padding:'9px 24px', borderRadius:999, border:`1.5px solid ${following ? 'rgba(255,255,255,0.2)' : 'var(--pink)'}`, background: following ? 'rgba(255,255,255,0.06)' : 'rgba(255,107,157,0.12)', color: following ? 'var(--text-muted)' : 'var(--pink)', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6 }}
            >
              {following
                ? <><UserCheck size={14} /> Following</>
                : <><UserPlus size={14} /> Follow</>
              }
            </button>
          )}
        </div>

        {/* Playlists */}
        <div style={{ flex:1, overflowY:'auto', padding:'0 20px' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--text-muted)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:12 }}>Public Playlists</div>
          {loading && (
            <div style={{ color:'var(--text-muted)', fontSize:14, textAlign:'center', padding:'20px 0' }}>Loading…</div>
          )}
          {!loading && playlists.length === 0 && (
            <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text-muted)', fontSize:14 }}>
              <ListMusic size={28} style={{ marginBottom:8, opacity:0.4 }} />
              <div>No public playlists yet</div>
            </div>
          )}
          {playlists.map(pl => (
            <div
              key={pl.id}
              onClick={() => onPlaylist(pl)}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'12px', borderRadius:14, cursor:'pointer', marginBottom:8, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', transition:'background 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
            >
              <div style={{ width:48, height:48, borderRadius:10, overflow:'hidden', background:'linear-gradient(135deg,rgba(255,107,157,0.2),rgba(126,208,236,0.1))', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {pl.cover
                  ? <img src={pl.cover} alt={pl.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <ListMusic size={20} color="var(--pink)" />
                }
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:700, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{pl.name}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>{pl.songs.length} songs {pl.isCollaborative && '· 🤝 Collab'}</div>
              </div>
              <Play size={16} color="var(--text-muted)" />
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes sm-slide { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>
    </>
  );
}
