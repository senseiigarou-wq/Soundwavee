// ============================================================
// SOUNDWAVE — Collaborative Playlist Modal
// Create, join, and manage collaborative playlists
// ============================================================
import React, { useState, useEffect } from 'react';
import { X, Users, Link, Copy, Check, Plus, Trash2, Play, UserPlus, Music } from 'lucide-react';
import {
  createSocialPlaylist, joinCollaborativePlaylist, getSocialPlaylistByToken,
  addSongToSocialPlaylist, removeSongFromSocialPlaylist, deleteSocialPlaylist,
  getMyCollabPlaylists, subscribeSocialPlaylist,
} from '@/services/socialService';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/common/Toast';
import type { SocialPlaylist } from '@/types';

const BASE = 'https://soundwavee.pages.dev';

interface CollabPlaylistModalProps {
  onClose:    () => void;
  onPlay:     (pl: SocialPlaylist) => void;
}

type Tab = 'mine' | 'join' | 'create';

export function CollabPlaylistModal({ onClose, onPlay }: CollabPlaylistModalProps) {
  const { user }      = useAuthStore();
  const { showToast } = useToast();
  const [tab, setTab]           = useState<Tab>('mine');
  const [playlists, setPlaylists] = useState<SocialPlaylist[]>([]);
  const [loading, setLoading]   = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Create form
  const [newName, setNewName]   = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);

  // Join form
  const [joinToken, setJoinToken] = useState('');
  const [joining, setJoining]     = useState(false);

  useEffect(() => {
    if (!user) return;
    getMyCollabPlaylists(user.id)
      .then(setPlaylists)
      .finally(() => setLoading(false));
  }, [user]);

  const handleCreate = async () => {
    if (!user || !newName.trim()) return;
    setCreating(true);
    try {
      const pl = await createSocialPlaylist(
        { uid: user.id, name: user.name, avatar: user.picture },
        newName.trim(), isPublic, true
      );
      setPlaylists(prev => [pl, ...prev]);
      setNewName('');
      setTab('mine');
      showToast(`"${pl.name}" created! 🎉`);
    } catch { showToast('Failed to create', 'error'); }
    finally { setCreating(false); }
  };

  const handleJoin = async () => {
    if (!user || !joinToken.trim()) return;
    setJoining(true);
    try {
      // Support both full URL and just the token
      const token = joinToken.includes('/playlist/')
        ? joinToken.split('/playlist/')[1]
        : joinToken.trim();
      const pl = await getSocialPlaylistByToken(token);
      if (!pl) { showToast('Playlist not found', 'error'); return; }
      await joinCollaborativePlaylist(pl.id, user.id);
      if (!playlists.find(p => p.id === pl.id)) setPlaylists(prev => [pl, ...prev]);
      setJoinToken('');
      setTab('mine');
      showToast(`Joined "${pl.name}" 🤝`);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to join', 'error');
    } finally { setJoining(false); }
  };

  const copyInviteLink = async (pl: SocialPlaylist) => {
    const link = `${BASE}/playlist/${pl.shareToken}`;
    await navigator.clipboard.writeText(link).catch(() => {});
    setCopiedId(pl.id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast('Invite link copied!');
  };

  const handleDelete = async (pl: SocialPlaylist) => {
    if (!user || pl.ownerId !== user.id) return;
    try {
      await deleteSocialPlaylist(pl.id, user.id);
      setPlaylists(prev => prev.filter(p => p.id !== pl.id));
      showToast('Playlist deleted');
    } catch { showToast('Failed to delete', 'error'); }
  };

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:400, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)' }} />
      <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:401, background:'#181818', borderRadius:'24px 24px 0 0', border:'1px solid rgba(255,255,255,0.08)', padding:`0 0 max(28px, env(safe-area-inset-bottom))`, animation:'sm-slide 0.28s cubic-bezier(0.16,1,0.3,1)', maxWidth:540, margin:'0 auto', maxHeight:'88vh', display:'flex', flexDirection:'column' }}>

        <div style={{ display:'flex', justifyContent:'center', padding:'14px 0 0', flexShrink:0 }}>
          <div style={{ width:36, height:4, borderRadius:2, background:'rgba(255,255,255,0.15)' }} />
        </div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px 0', flexShrink:0 }}>
          <div style={{ fontSize:17, fontWeight:800, color:'#fff', display:'flex', alignItems:'center', gap:8 }}><Users size={18} color="var(--pink)" /> Collab Playlists</div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, background:'rgba(255,255,255,0.07)', border:'none', color:'var(--text-muted)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:6, padding:'14px 20px', flexShrink:0 }}>
          {(['mine','join','create'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex:1, padding:'9px', borderRadius:10, border:`1.5px solid ${tab===t ? 'var(--pink)' : 'rgba(255,255,255,0.08)'}`, background: tab===t ? 'rgba(255,107,157,0.1)' : 'rgba(255,255,255,0.03)', color: tab===t ? 'var(--pink)' : 'var(--text-muted)', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}>
              {t === 'mine' ? 'My Collabs' : t === 'join' ? '+ Join' : '+ Create'}
            </button>
          ))}
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'0 20px' }}>
          {/* My collabs */}
          {tab === 'mine' && (
            <div>
              {loading && <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text-muted)' }}>Loading…</div>}
              {!loading && playlists.length === 0 && (
                <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)' }}>
                  <Users size={32} style={{ marginBottom:10, opacity:0.4 }} />
                  <div style={{ fontSize:14, marginBottom:6 }}>No collaborative playlists yet</div>
                  <div style={{ fontSize:12 }}>Create one or join a friend's</div>
                </div>
              )}
              {playlists.map(pl => (
                <div key={pl.id} style={{ marginBottom:12, padding:'14px', borderRadius:16, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                    <div style={{ width:44, height:44, borderRadius:10, background:'linear-gradient(135deg,rgba(255,107,157,0.2),rgba(126,208,236,0.1))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Music size={18} color="var(--pink)" />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{pl.name}</div>
                      <div style={{ fontSize:12, color:'var(--text-muted)' }}>{pl.songs.length} songs · {pl.collaborators.length} collaborators</div>
                    </div>
                    {pl.ownerId === user?.id && (
                      <button onClick={() => handleDelete(pl)} style={{ width:30, height:30, borderRadius:8, background:'rgba(255,80,80,0.08)', border:'none', color:'#ff6b6b', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => onPlay(pl)} style={{ flex:1, padding:'8px', borderRadius:10, background:'rgba(255,107,157,0.1)', border:'1px solid rgba(255,107,157,0.2)', color:'var(--pink)', fontWeight:600, fontSize:12, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                      <Play size={12} /> Play
                    </button>
                    <button onClick={() => copyInviteLink(pl)} style={{ flex:1, padding:'8px', borderRadius:10, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color: copiedId===pl.id ? '#1DB954' : 'var(--text-muted)', fontWeight:600, fontSize:12, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                      {copiedId===pl.id ? <><Check size={12} /> Copied!</> : <><Link size={12} /> Invite</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Join */}
          {tab === 'join' && (
            <div style={{ paddingTop:8 }}>
              <div style={{ fontSize:14, color:'var(--text-muted)', marginBottom:16, lineHeight:1.6 }}>
                Got an invite link from a friend? Paste it below to join their collaborative playlist.
              </div>
              <input
                value={joinToken}
                onChange={e => setJoinToken(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                placeholder="Paste invite link or token…"
                autoFocus
                style={{ width:'100%', padding:'13px 14px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, color:'#fff', fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box', marginBottom:12 }}
              />
              <button onClick={handleJoin} disabled={!joinToken.trim() || joining} style={{ width:'100%', padding:'14px', borderRadius:14, background: joinToken.trim() ? 'linear-gradient(135deg,#FF6B9D,#E05587)' : 'rgba(255,255,255,0.08)', border:'none', color: joinToken.trim() ? '#fff' : 'var(--text-muted)', fontWeight:700, fontSize:15, cursor: joinToken.trim() ? 'pointer' : 'not-allowed', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <UserPlus size={16} /> {joining ? 'Joining…' : 'Join Playlist'}
              </button>
            </div>
          )}

          {/* Create */}
          {tab === 'create' && (
            <div style={{ paddingTop:8 }}>
              <div style={{ fontSize:14, color:'var(--text-muted)', marginBottom:16, lineHeight:1.6 }}>
                Create a playlist your friends can add songs to.
              </div>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:'0.07em', textTransform:'uppercase', display:'block', marginBottom:7 }}>Playlist Name</label>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="Our Summer Playlist…"
                autoFocus
                maxLength={60}
                style={{ width:'100%', padding:'13px 14px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, color:'#fff', fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box', marginBottom:12 }}
              />
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', marginBottom:16 }}>
                <span style={{ fontSize:14, color:'var(--text-muted)', flex:1 }}>Make playlist public</span>
                <button onClick={() => setIsPublic(v => !v)} style={{ width:44, height:24, borderRadius:12, background: isPublic ? 'var(--pink)' : 'rgba(255,255,255,0.1)', border:'none', cursor:'pointer', position:'relative', transition:'background 0.2s' }}>
                  <div style={{ width:18, height:18, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left: isPublic ? 23 : 3, transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.3)' }} />
                </button>
              </div>
              <button onClick={handleCreate} disabled={!newName.trim() || creating} style={{ width:'100%', padding:'14px', borderRadius:14, background: newName.trim() ? 'linear-gradient(135deg,#FF6B9D,#E05587)' : 'rgba(255,255,255,0.08)', border:'none', color: newName.trim() ? '#fff' : 'var(--text-muted)', fontWeight:700, fontSize:15, cursor: newName.trim() ? 'pointer' : 'not-allowed', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <Plus size={16} /> {creating ? 'Creating…' : 'Create Playlist'}
              </button>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes sm-slide{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
    </>
  );
}