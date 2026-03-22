import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Heart, MoreVertical, ListPlus, Users } from 'lucide-react';
import { SoundwaveIcon } from '@/components/common/Soundwavelogo';
import { usePlayerStore } from '@/store/playStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useToast } from '@/components/common/Toast';
import { AddToCollabModal } from '@/components/Social/AddToCollabModal';
import type { Song } from '@/types';

interface SongCardProps {
  song: Song;
  isActive?: boolean;
  isPlaying?: boolean;
  onPlay: (song: Song) => void;
  onLike?: (song: Song) => void;
  isLiked?: boolean;
  showArtist?: boolean;
  layout?: 'card' | 'row';
  index?: number;
}

function coverBg(id: string) {
  const colors = ['#1a1035','#0d2137','#1a2a10','#2a1010','#10252a','#251020','#1a1a2a'];
  return colors[id.charCodeAt(0) % colors.length];
}

// ── Inline context menu ──────────────────────────────────────
function SongMenu({ song, onClose }: { song: Song; onClose: () => void }) {
  const openAddToPlaylist  = usePlayerStore(s => s.openAddToPlaylist);
  const pendingPlaylist    = usePlayerStore(s => s.pendingPlaylist);
  const setPendingPlaylist = usePlayerStore(s => s.setPendingPlaylist);
  const { addToPlaylist }  = useLibraryStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const [showCollab, setShowCollab] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleAddToPending = () => {
    if (!pendingPlaylist) return;
    addToPlaylist(pendingPlaylist.id, song);
    onClose();
  };

  if (showCollab) {
    return <AddToCollabModal song={song} onClose={() => { setShowCollab(false); onClose(); }} />;
  }

  return (
    <div
      ref={menuRef}
      style={{
        position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
        background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 12, zIndex: 100, minWidth: 210, overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        animation: 'atp-fade-in 0.12s ease',
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Pending playlist shortcut */}
      {pendingPlaylist && (
        <button
          onClick={handleAddToPending}
          style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'11px 14px', background:'rgba(255,107,157,0.08)', border:'none', borderBottom:'1px solid rgba(255,255,255,0.06)', color:'var(--pink)', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,107,157,0.14)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,107,157,0.08)')}
        >
          <ListPlus size={15} color="var(--pink)" />
          Add to "{pendingPlaylist.name}"
        </button>
      )}

      {/* My playlists */}
      <button
        onClick={() => { openAddToPlaylist(song); onClose(); }}
        style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'11px 14px', background:'none', border:'none', borderBottom:'1px solid rgba(255,255,255,0.05)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', textAlign:'left', transition:'background 0.15s' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
      >
        <ListPlus size={15} color="var(--text-muted)" />
        Add to My Playlist…
      </button>

      {/* Collab playlists */}
      <button
        onClick={() => setShowCollab(true)}
        style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'11px 14px', background:'none', border:'none', color:'#7ed0ec', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', textAlign:'left', transition:'background 0.15s' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(126,208,236,0.07)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
      >
        <Users size={15} color="#7ed0ec" />
        Add to Collab Playlist…
      </button>
    </div>
  );
}

export function SongCard({ song, isActive, isPlaying, onPlay, onLike, isLiked, showArtist = true, layout = 'card', index }: SongCardProps) {
  const [imgErr, setImgErr]       = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const openAddToPlaylist  = usePlayerStore(s => s.openAddToPlaylist);
  const pendingPlaylist    = usePlayerStore(s => s.pendingPlaylist);
  const { addToPlaylist }  = useLibraryStore();
  const { showToast }      = useToast();
  const hasCover = song.cover && !imgErr;

  const toggleMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(v => !v);
  }, []);

  const handleCardAdd = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (pendingPlaylist) {
      const ok = addToPlaylist(pendingPlaylist.id, song);
      showToast(ok ? `Added to "${pendingPlaylist.name}" ✓` : `Already in "${pendingPlaylist.name}"`, ok ? 'success' : 'error');
    } else {
      openAddToPlaylist(song);
    }
  }, [pendingPlaylist, addToPlaylist, openAddToPlaylist, song, showToast]);

  if (layout === 'row') {
    return (
      <div className={`song-row${isActive ? ' active' : ''}`} style={{ position: 'relative' }} onClick={() => onPlay(song)}>
        <div className="song-row-num">
          {isActive && isPlaying ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 14, justifyContent: 'center' }}>
              <span className="eq-1" style={{ width: 3, background: 'var(--pink)', borderRadius: 2, display: 'block' }} />
              <span className="eq-2" style={{ width: 3, background: 'var(--pink)', borderRadius: 2, display: 'block' }} />
              <span className="eq-3" style={{ width: 3, background: 'var(--pink)', borderRadius: 2, display: 'block' }} />
            </div>
          ) : (
            <span>{index !== undefined ? index + 1 : ''}</span>
          )}
        </div>
        <div className="song-row-thumb">
          {hasCover
            ? <img src={song.cover} alt={song.title} onError={() => setImgErr(true)} />
            : <div className="song-row-thumb-placeholder" style={{ background: coverBg(song.youtubeId) }}><SoundwaveIcon size={16} color="rgba(255,255,255,0.3)" /></div>
          }
        </div>
        <div className="song-row-info">
          <div className={`song-row-title${isActive ? ' active' : ''}`}>{song.title}</div>
          {showArtist && <div className="song-row-artist">{song.artist}</div>}
        </div>
        <div className="song-row-actions" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {onLike && (
            <button className={`icon-btn${isLiked ? ' active' : ''}`} onClick={e => { e.stopPropagation(); onLike(song); }}>
              <Heart size={15} fill={isLiked ? 'currentColor' : 'none'} />
            </button>
          )}
          {/* ⋮ More menu */}
          <button
            className="icon-btn"
            onClick={toggleMenu}
            title="More options"
            style={{ opacity: menuOpen ? 1 : undefined }}
          >
            <MoreVertical size={15} />
          </button>
        </div>

        {menuOpen && <SongMenu song={song} onClose={() => setMenuOpen(false)} />}
      </div>
    );
  }

  // Card layout — "Add to playlist" on long-press / hover button overlay
  return (
    <div className={`song-card${isActive ? ' active' : ''}`} style={{ position: 'relative' }} onClick={() => onPlay(song)}>
      <div className="song-card-art">
        {hasCover
          ? <img src={song.cover} alt={song.title} onError={() => setImgErr(true)} />
          : <div className="song-card-art-placeholder" style={{ background: coverBg(song.youtubeId) }}><SoundwaveIcon size={16} color="rgba(255,255,255,0.3)" /></div>
        }
        <div className="song-card-overlay">
          <div className="song-card-play-btn">
            <Play size={18} fill="white" color="white" />
          </div>
        </div>
        {isActive && isPlaying && (
          <div className="song-card-eq">
            <span className="eq-1" style={{ width: 3, background: 'var(--pink)', borderRadius: 2 }} />
            <span className="eq-2" style={{ width: 3, background: 'var(--pink)', borderRadius: 2 }} />
            <span className="eq-3" style={{ width: 3, background: 'var(--pink)', borderRadius: 2 }} />
          </div>
        )}
        {/* Add to playlist button on card hover */}
        <button
          className="song-card-add-btn"
          onClick={handleCardAdd}
          title={pendingPlaylist ? `Add to "${pendingPlaylist.name}"` : 'Add to playlist'}
          style={pendingPlaylist ? { background: 'rgba(255,107,157,0.85)', opacity: 1 } : undefined}
        >
          <ListPlus size={13} />
        </button>
      </div>
      <div className="song-card-info">
        <div className={`song-card-title${isActive ? ' active' : ''}`}>{song.title}</div>
        {showArtist && <div className="song-card-artist">{song.artist}</div>}
      </div>
    </div>
  );
}
