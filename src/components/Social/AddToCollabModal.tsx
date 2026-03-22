// ============================================================
// SOUNDWAVE — Add to Collaborative Playlist Modal
// Lets any collaborator pick a collab playlist to add a song to
// ============================================================
import React, { useState, useEffect } from 'react';
import { X, Users, Check, Plus, Music } from 'lucide-react';
import { getMyCollabPlaylists, addSongToSocialPlaylist } from '@/services/socialService';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/common/Toast';
import type { Song, SocialPlaylist } from '@/types';

interface AddToCollabModalProps {
  song:    Song;
  onClose: () => void;
}

export function AddToCollabModal({ song, onClose }: AddToCollabModalProps) {
  const { user }      = useAuthStore();
  const { showToast } = useToast();
  const [playlists, setPlaylists] = useState<SocialPlaylist[]>([]);
  const [loading, setLoading]     = useState(true);
  const [adding, setAdding]       = useState<string | null>(null);
  const [added, setAdded]         = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    getMyCollabPlaylists(user.id)
      .then(pls => {
        setPlaylists(pls);
        // Mark already-added playlists
        const alreadyIn = new Set(
          pls.filter(pl => pl.songs.some(s => s.youtubeId === song.youtubeId)).map(pl => pl.id)
        );
        setAdded(alreadyIn);
      })
      .finally(() => setLoading(false));
  }, [user, song.youtubeId]);

  const handleAdd = async (pl: SocialPlaylist) => {
    if (!user || added.has(pl.id)) return;
    setAdding(pl.id);
    try {
      await addSongToSocialPlaylist(pl.id, song, user.id);
      setAdded(prev => new Set([...prev, pl.id]));
      showToast(`Added to "${pl.name}" ✓`);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to add', 'error');
    } finally {
      setAdding(null);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)' }} />
      <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:501, background:'#181818', borderRadius:'24px 24px 0 0', border:'1px solid rgba(255,255,255,0.08)', paddingBottom:`max(28px, env(safe-area-inset-bottom))`, animation:'ctm-slide 0.28s cubic-bezier(0.16,1,0.3,1)', maxWidth:540, margin:'0 auto', maxHeight:'75vh', display:'flex', flexDirection:'column' }}>

        {/* Handle */}
        <div style={{ display:'flex', justifyContent:'center', padding:'14px 0 0', flexShrink:0 }}>
          <div style={{ width:36, height:4, borderRadius:2, background:'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px 12px', flexShrink:0 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:'#fff', display:'flex', alignItems:'center', gap:8 }}>
              <Users size={16} color="var(--pink)" /> Add to Collab Playlist
            </div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:220 }}>
              {song.title}
            </div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, background:'rgba(255,255,255,0.07)', border:'none', color:'rgba(255,255,255,0.6)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={16} />
          </button>
        </div>

        {/* Song preview */}
        <div style={{ margin:'0 20px 14px', padding:'10px 14px', borderRadius:12, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
          <div style={{ width:40, height:40, borderRadius:8, overflow:'hidden', background:'#1a1a2a', flexShrink:0 }}>
            {song.cover
              ? <img src={song.cover} alt={song.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}><Music size={16} color="var(--pink)" /></div>
            }
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{song.title}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>{song.artist}</div>
          </div>
        </div>

        {/* Playlist list */}
        <div style={{ flex:1, overflowY:'auto', padding:'0 20px' }}>
          {loading && (
            <div style={{ textAlign:'center', padding:'30px 0', color:'rgba(255,255,255,0.4)', fontSize:14 }}>
              Loading playlists…
            </div>
          )}

          {!loading && playlists.length === 0 && (
            <div style={{ textAlign:'center', padding:'30px 0' }}>
              <Users size={32} style={{ marginBottom:10, opacity:0.3, color:'#fff' }} />
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)', marginBottom:6 }}>No collaborative playlists yet</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>
                Go to Social → Collab Playlists to create one
              </div>
            </div>
          )}

          {playlists.map(pl => {
            const isAdded   = added.has(pl.id);
            const isAdding  = adding === pl.id;
            const isOwner   = pl.ownerId === user?.id;

            return (
              <button
                key={pl.id}
                onClick={() => handleAdd(pl)}
                disabled={isAdded || isAdding}
                style={{
                  width:'100%', display:'flex', alignItems:'center', gap:12,
                  padding:'12px', borderRadius:14, marginBottom:8,
                  background: isAdded ? 'rgba(29,185,84,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isAdded ? 'rgba(29,185,84,0.25)' : 'rgba(255,255,255,0.07)'}`,
                  cursor: isAdded ? 'default' : 'pointer',
                  transition:'all 0.2s', textAlign:'left', fontFamily:'inherit',
                }}
                onMouseEnter={e => { if (!isAdded) (e.currentTarget.style.background = 'rgba(255,255,255,0.07)'); }}
                onMouseLeave={e => { if (!isAdded) (e.currentTarget.style.background = 'rgba(255,255,255,0.03)'); }}
              >
                {/* Icon */}
                <div style={{ width:44, height:44, borderRadius:10, background:'linear-gradient(135deg,rgba(255,107,157,0.15),rgba(126,208,236,0.08))', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(255,107,157,0.15)' }}>
                  <Users size={18} color="var(--pink)" />
                </div>

                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:700, color: isAdded ? '#1DB954' : '#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {pl.name}
                  </div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:2 }}>
                    {pl.songs.length} songs · {pl.collaborators.length} collaborators
                    {isOwner && ' · Owner'}
                  </div>
                </div>

                {/* Action */}
                <div style={{ flexShrink:0, width:32, height:32, borderRadius:8, background: isAdded ? 'rgba(29,185,84,0.15)' : 'rgba(255,107,157,0.1)', border: `1px solid ${isAdded ? 'rgba(29,185,84,0.3)' : 'rgba(255,107,157,0.2)'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {isAdding
                    ? <div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.2)', borderTopColor:'var(--pink)', borderRadius:'50%', animation:'ctm-spin 0.7s linear infinite' }} />
                    : isAdded
                      ? <Check size={15} color="#1DB954" />
                      : <Plus size={15} color="var(--pink)" />
                  }
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <style>{`
        @keyframes ctm-slide { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes ctm-spin  { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}