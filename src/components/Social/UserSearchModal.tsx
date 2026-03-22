// ============================================================
// SOUNDWAVE — User Search Modal
// Find users by name or email, follow them
// ============================================================
import React, { useState, useCallback } from 'react';
import { X, Search, UserPlus, UserCheck, Loader, Users } from 'lucide-react';
import { searchUsers, searchUserByEmail, followUser, unfollowUser, isFollowing as checkFollowing } from '@/services/socialService';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/common/Toast';
import type { PublicUser, SocialPlaylist } from '@/types';

interface UserSearchModalProps {
  onClose:    () => void;
  onViewUser: (user: PublicUser) => void;
}

export function UserSearchModal({ onClose, onViewUser }: UserSearchModalProps) {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState<PublicUser[]>([]);
  const [loading, setLoading]     = useState(false);
  const [following, setFollowing] = useState<Set<string>>(new Set());

  const search = useCallback(async (q: string) => {
    if (!q.trim() || !user) return;
    setLoading(true);
    try {
      let found: PublicUser[] = [];
      if (q.includes('@')) {
        const byEmail = await searchUserByEmail(q, user.id);
        if (byEmail) found = [byEmail];
      } else {
        found = await searchUsers(q, user.id);
      }
      setResults(found);
      // Check follow status for all results
      const statuses = await Promise.all(found.map(u => checkFollowing(user.id, u.uid)));
      const followSet = new Set<string>();
      found.forEach((u, i) => { if (statuses[i]) followSet.add(u.uid); });
      setFollowing(followSet);
    } catch (e) {
      console.error('Search error:', e);
      showToast('Search failed', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  const handleFollow = async (targetUser: PublicUser) => {
    if (!user) return;

    // Guard against missing uid on old accounts
    if (!targetUser.uid) {
      showToast('Cannot follow — user profile incomplete', 'error');
      return;
    }

    try {
      if (following.has(targetUser.uid)) {
        await unfollowUser(user.id, targetUser.uid);
        setFollowing(prev => { const s = new Set(prev); s.delete(targetUser.uid); return s; });
        showToast(`Unfollowed ${targetUser.displayName}`);
      } else {
        await followUser(user.id, targetUser.uid);
        setFollowing(prev => new Set([...prev, targetUser.uid]));
        showToast(`Following ${targetUser.displayName} ♥`);
      }
    } catch (e) {
      console.error('Follow error:', e);
      showToast('Action failed', 'error');
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:400, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)' }} />
      <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:401, background:'#181818', borderRadius:'24px 24px 0 0', border:'1px solid rgba(255,255,255,0.08)', padding:`0 0 max(28px, env(safe-area-inset-bottom))`, animation:'sm-slide 0.28s cubic-bezier(0.16,1,0.3,1)', maxWidth:540, margin:'0 auto', maxHeight:'80vh', display:'flex', flexDirection:'column' }}>

        <div style={{ display:'flex', justifyContent:'center', padding:'14px 0 0', flexShrink:0 }}>
          <div style={{ width:36, height:4, borderRadius:2, background:'rgba(255,255,255,0.15)' }} />
        </div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px 14px', flexShrink:0 }}>
          <div style={{ fontSize:17, fontWeight:800, color:'#fff' }}>Find People</div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, background:'rgba(255,255,255,0.07)', border:'none', color:'var(--text-muted)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={16} />
          </button>
        </div>

        {/* Search input */}
        <div style={{ padding:'0 20px 16px', flexShrink:0 }}>
          <div style={{ display:'flex', gap:8 }}>
            <div style={{ flex:1, display:'flex', alignItems:'center', gap:10, padding:'11px 14px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12 }}>
              <Search size={16} color="var(--text-muted)" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search(query)}
                placeholder="Search by name or email…"
                autoFocus
                style={{ flex:1, background:'none', border:'none', outline:'none', color:'var(--text)', fontSize:14, fontFamily:'inherit' }}
              />
            </div>
            <button onClick={() => search(query)} style={{ padding:'11px 18px', borderRadius:12, background:'var(--pink)', border:'none', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
              {loading
                ? <Loader size={14} style={{ animation:'spin 0.8s linear infinite' }} />
                : 'Search'
              }
            </button>
          </div>
        </div>

        {/* Results */}
        <div style={{ flex:1, overflowY:'auto', padding:'0 20px' }}>
          {results.length === 0 && !loading && query && (
            <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)', fontSize:14 }}>
              <Users size={32} style={{ marginBottom:10, opacity:0.4 }} />
              <div>No users found for "{query}"</div>
            </div>
          )}
          {results.map(u => (
            <div key={u.uid} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              <div
                style={{ width:44, height:44, borderRadius:'50%', overflow:'hidden', background:'linear-gradient(135deg,#FF6B9D,#E05587)', flexShrink:0, cursor:'pointer' }}
                onClick={() => onViewUser(u)}
              >
                {u.avatar
                  ? <img src={u.avatar} alt={u.displayName} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color:'#fff' }}>{u.displayName?.[0] ?? '?'}</div>
                }
              </div>
              <div style={{ flex:1, minWidth:0, cursor:'pointer' }} onClick={() => onViewUser(u)}>
                <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>{u.displayName}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>{u.followersCount ?? 0} followers</div>
              </div>
              <button
                onClick={() => handleFollow(u)}
                style={{ padding:'7px 14px', borderRadius:20, border:`1.5px solid ${following.has(u.uid) ? 'rgba(255,255,255,0.15)' : 'var(--pink)'}`, background: following.has(u.uid) ? 'rgba(255,255,255,0.05)' : 'rgba(255,107,157,0.1)', color: following.has(u.uid) ? 'var(--text-muted)' : 'var(--pink)', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:5 }}
              >
                {following.has(u.uid)
                  ? <><UserCheck size={13} /> Following</>
                  : <><UserPlus size={13} /> Follow</>
                }
              </button>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes sm-slide { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </>
  );
}
