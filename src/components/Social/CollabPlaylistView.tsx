// ============================================================
// SOUNDWAVE — Collaborative Playlist View
// Shows all songs in a collab playlist with real-time updates.
// Any collaborator can play, add or remove songs.
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Play, Pause, Users, Link, Check, Trash2, Music, UserPlus, Share2 } from 'lucide-react';
import {
  subscribeSocialPlaylist,
  removeSongFromSocialPlaylist,
  joinCollaborativePlaylist,
} from '@/services/socialService';
import { useAuthStore } from '@/store/authStore';
import { usePlayerStore } from '@/store/playStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useYouTubePlayer } from '@/hooks/useYoutubePlayer';
import { useToast } from '@/components/common/Toast';
import { ShareModal } from '@/components/Social/ShareModal';
import type { SocialPlaylist, Song } from '@/types';

interface CollabPlaylistViewProps {
  playlist: SocialPlaylist;
  onBack:   () => void;
}

const BASE = 'https://soundwavee.pages.dev';

function fmt(s: number) {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

export function CollabPlaylistView({ playlist: initialPlaylist, onBack }: CollabPlaylistViewProps) {
  const { user }      = useAuthStore();
  const { showToast } = useToast();
  const { currentSong, isPlaying } = usePlayerStore();
  const { loadQueue }  = useLibraryStore();
  const { loadAndPlay } = useYouTubePlayer();

  const [playlist, setPlaylist]   = useState<SocialPlaylist>(initialPlaylist);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [removing, setRemoving]   = useState<string | null>(null);

  const isOwner       = user?.id === playlist.ownerId;
  const isCollaborator = playlist.collaborators.includes(user?.id ?? '');
  const canEdit       = isOwner || isCollaborator;
  const inviteLink    = `${BASE}/playlist/${playlist.shareToken}`;

  // Real-time listener — updates whenever any collaborator adds/removes a song
  useEffect(() => {
    const unsub = subscribeSocialPlaylist(playlist.id, updated => {
      setPlaylist(updated);
    });
    return unsub;
  }, [playlist.id]);

  const handlePlayAll = useCallback(() => {
    if (playlist.songs.length === 0) return;
    loadQueue(playlist.songs, 0);
    loadAndPlay(playlist.songs[0]);
    showToast(`Playing "${playlist.name}"`);
  }, [playlist, loadQueue, loadAndPlay, showToast]);

  const handlePlaySong = useCallback((song: Song, index: number) => {
    loadQueue(playlist.songs, index);
    loadAndPlay(song);
  }, [playlist.songs, loadQueue, loadAndPlay]);

  const handleRemove = async (song: Song) => {
    if (!user || !canEdit) return;
    setRemoving(song.youtubeId);
    try {
      await removeSongFromSocialPlaylist(playlist.id, song.youtubeId, user.id);
      showToast('Song removed');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to remove', 'error');
    } finally {
      setRemoving(null);
    }
  };

  const copyInviteLink = async () => {
    try { await navigator.clipboard.writeText(inviteLink); }
    catch {
      const el = document.createElement('textarea');
      el.value = inviteLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiedLink(true);
    showToast('Invite link copied!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Header */}
      <div className="page-header">
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={onBack} style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text)', flexShrink:0 }}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ minWidth:0 }}>
            <h1 className="page-title" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{playlist.name}</h1>
            <p className="page-subtitle">{playlist.songs.length} songs · {playlist.collaborators.length} collaborators</p>
          </div>
        </div>
      </div>

      {/* Hero card */}
      <div style={{ marginBottom:24, padding:'20px', borderRadius:20, background:'linear-gradient(135deg,rgba(255,107,157,0.1),rgba(126,208,236,0.05))', border:'1px solid rgba(255,107,157,0.15)' }}>
        {/* Cover grid or icon */}
        <div style={{ display:'flex', gap:2, width:80, height:80, borderRadius:16, overflow:'hidden', marginBottom:14, background:'#1a1a2a', flexShrink:0 }}>
          {playlist.songs.slice(0, 4).map((s, i) => (
            s.cover
              ? <img key={i} src={s.cover} alt="" style={{ width: playlist.songs.length >= 4 ? '50%' : '100%', height: playlist.songs.length >= 4 ? '50%' : '100%', objectFit:'cover', flexShrink:0 }} />
              : null
          ))}
          {playlist.songs.length === 0 && (
            <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Music size={28} color="rgba(255,255,255,0.2)" />
            </div>
          )}
        </div>

        <div style={{ fontSize:20, fontWeight:800, color:'#fff', marginBottom:4 }}>{playlist.name}</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', marginBottom:16 }}>
          By {playlist.ownerName} · {playlist.isPublic ? 'Public' : 'Private'} · 🤝 Collaborative
        </div>

        {/* Action buttons */}
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <button onClick={handlePlayAll} disabled={playlist.songs.length === 0} style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 22px', borderRadius:999, border:'none', background: playlist.songs.length > 0 ? 'var(--pink)' : 'rgba(255,255,255,0.1)', color: playlist.songs.length > 0 ? '#fff' : 'var(--text-muted)', fontWeight:700, fontSize:14, cursor: playlist.songs.length > 0 ? 'pointer' : 'not-allowed', fontFamily:'inherit', boxShadow: playlist.songs.length > 0 ? '0 4px 16px rgba(255,107,157,0.35)' : 'none' }}>
            <Play size={15} fill="currentColor" /> Play All
          </button>

          <button onClick={copyInviteLink} style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 18px', borderRadius:999, background: copiedLink ? 'rgba(29,185,84,0.12)' : 'rgba(255,255,255,0.07)', border:`1px solid ${copiedLink ? 'rgba(29,185,84,0.3)' : 'rgba(255,255,255,0.12)'}`, color: copiedLink ? '#1DB954' : 'var(--text)', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}>
            {copiedLink ? <><Check size={14} /> Copied!</> : <><Link size={14} /> Invite</>}
          </button>

          <button onClick={() => setShowShare(true)} style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 18px', borderRadius:999, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', color:'var(--text)', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
            <Share2 size={14} /> Share
          </button>
        </div>
      </div>

      {/* Collaborators */}
      <div style={{ marginBottom:20, padding:'14px 16px', borderRadius:16, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.4)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10 }}>
          Collaborators ({playlist.collaborators.length})
        </div>
        <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:6 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', borderRadius:999, background:'rgba(255,107,157,0.1)', border:'1px solid rgba(255,107,157,0.2)' }}>
            <div style={{ width:20, height:20, borderRadius:'50%', background:'linear-gradient(135deg,#FF6B9D,#E05587)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff' }}>
              {playlist.ownerName?.[0]?.toUpperCase()}
            </div>
            <span style={{ fontSize:12, fontWeight:600, color:'var(--pink)' }}>{playlist.ownerName} 👑</span>
          </div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>+{Math.max(0, playlist.collaborators.length - 1)} others</div>
          {!isCollaborator && !isOwner && (
            <button onClick={async () => {
              if (!user) return;
              try {
                await joinCollaborativePlaylist(playlist.id, user.id);
                showToast('Joined as collaborator! 🤝');
              } catch { showToast('Failed to join', 'error'); }
            }} style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:999, background:'rgba(126,208,236,0.1)', border:'1px solid rgba(126,208,236,0.25)', color:'#7ed0ec', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              <UserPlus size={12} /> Join as collaborator
            </button>
          )}
        </div>
      </div>

      {/* Song list */}
      {playlist.songs.length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px 20px', color:'rgba(255,255,255,0.4)' }}>
          <Music size={40} style={{ marginBottom:12, opacity:0.3 }} />
          <div style={{ fontSize:16, fontWeight:700, color:'rgba(255,255,255,0.6)', marginBottom:6 }}>No songs yet</div>
          <div style={{ fontSize:13, lineHeight:1.6 }}>
            {canEdit
              ? 'Tap ⋮ on any song and choose "Add to Collab Playlist" to add songs here.'
              : 'The owner or collaborators haven\'t added any songs yet.'}
          </div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.4)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:12 }}>
            Songs ({playlist.songs.length})
          </div>
          {playlist.songs.map((song, i) => {
            const isCurrentSong = currentSong?.youtubeId === song.youtubeId;
            const isSongPlaying = isCurrentSong && isPlaying;

            return (
              <div key={song.youtubeId} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:12, marginBottom:4, background: isCurrentSong ? 'rgba(255,107,157,0.08)' : 'transparent', border: isCurrentSong ? '1px solid rgba(255,107,157,0.15)' : '1px solid transparent', transition:'all 0.2s', cursor:'pointer' }}
                onClick={() => handlePlaySong(song, i)}
                onMouseEnter={e => { if (!isCurrentSong) (e.currentTarget.style.background = 'rgba(255,255,255,0.05)'); }}
                onMouseLeave={e => { if (!isCurrentSong) (e.currentTarget.style.background = 'transparent'); }}
              >
                {/* Index / play indicator */}
                <div style={{ width:28, flexShrink:0, textAlign:'center' }}>
                  {isSongPlaying
                    ? <div style={{ display:'flex', gap:2, alignItems:'flex-end', justifyContent:'center', height:16 }}>
                        {[1,2,3].map(b => <div key={b} style={{ width:3, background:'var(--pink)', borderRadius:2, animation:`eq-bar-${b} 0.8s ease-in-out infinite alternate`, height:`${8 + b * 3}px` }} />)}
                      </div>
                    : <span style={{ fontSize:12, color: isCurrentSong ? 'var(--pink)' : 'rgba(255,255,255,0.3)', fontWeight:600 }}>{i + 1}</span>
                  }
                </div>

                {/* Cover */}
                <div style={{ width:44, height:44, borderRadius:8, overflow:'hidden', background:'#1a1a2a', flexShrink:0 }}>
                  {song.cover
                    ? <img src={song.cover} alt={song.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}><Music size={16} color="rgba(255,255,255,0.2)" /></div>
                  }
                </div>

                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:600, color: isCurrentSong ? 'var(--pink)' : '#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{song.title}</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:1 }}>{song.artist}</div>
                </div>

                {/* Play icon on hover */}
                <div style={{ flexShrink:0, color:'rgba(255,255,255,0.3)', marginRight:4 }}>
                  {isSongPlaying ? <Pause size={15} /> : <Play size={15} />}
                </div>

                {/* Remove button — owner or collaborators */}
                {canEdit && (
                  <button onClick={e => { e.stopPropagation(); handleRemove(song); }} disabled={removing === song.youtubeId} style={{ width:28, height:28, borderRadius:8, background:'rgba(255,80,80,0.07)', border:'1px solid rgba(255,80,80,0.15)', color:'rgba(255,100,100,0.7)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget.style.background = 'rgba(255,80,80,0.15)'); (e.currentTarget.style.color = '#ff6b6b'); }}
                    onMouseLeave={e => { (e.currentTarget.style.background = 'rgba(255,80,80,0.07)'); (e.currentTarget.style.color = 'rgba(255,100,100,0.7)'); }}
                  >
                    {removing === song.youtubeId
                      ? <div style={{ width:10, height:10, border:'2px solid rgba(255,100,100,0.3)', borderTopColor:'#ff6b6b', borderRadius:'50%', animation:'cv-spin 0.7s linear infinite' }} />
                      : <Trash2 size={12} />
                    }
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Share modal */}
      {showShare && (
        <ShareModal
          type="playlist"
          title={playlist.name}
          token={playlist.shareToken}
          onClose={() => setShowShare(false)}
        />
      )}

      <style>{`
        @keyframes cv-spin { to { transform: rotate(360deg); } }
        @keyframes eq-bar-1 { from { height: 6px } to { height: 14px } }
        @keyframes eq-bar-2 { from { height: 10px } to { height: 6px } }
        @keyframes eq-bar-3 { from { height: 4px } to { height: 12px } }
      `}</style>
    </div>
  );
}