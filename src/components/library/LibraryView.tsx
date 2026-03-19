import { SoundwaveIcon } from "@/components/common/Soundwavelogo";
import React, { useState } from 'react';
import { Plus, Trash2, Play, Music, X, ListPlus } from 'lucide-react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { AdBanner } from '@/components/common/AdBanner';
import { useLibraryStore } from '@/store/libraryStore';
import { usePlayerStore } from '@/store/playStore';
import { useYouTubePlayer } from '@/hooks/useYoutubePlayer';
import { useToast } from '@/components/common/Toast';
import { SongCard } from '@/components/common/Songcard';
import { RateLimiter } from '@/services/ratelimiter';
import type { Song, Playlist, View, Artist } from '@/types';

type Tab = 'playlists' | 'liked' | 'history' | 'following';

export function LibraryView({ onNavigate, onArtistClick }: { onNavigate?: (view: View) => void; onArtistClick?: (artist: Artist) => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('playlists');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const { playlists, likedSongs, recentSongs, followedArtists, createPlaylist, deletePlaylist, removeFromPlaylist, removeFromRecent, clearHistory, unfollowArtist, loadQueue } = useLibraryStore();
  const { currentSong, isPlaying, setPendingPlaylist } = usePlayerStore();
  const { loadAndPlay } = useYouTubePlayer();
  const { showToast } = useToast();

  const openConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ isOpen: true, title, message, onConfirm });
  };
  const closeConfirm = () => setConfirmDialog(d => ({ ...d, isOpen: false }));
  const removeFromRecentStore = (youtubeId: string) => {
    if (youtubeId === '__clear__') {
      clearHistory();
      showToast('History cleared', 'success');
    } else {
      removeFromRecent(youtubeId);
    }
  };

  const handleCreate = () => {
    const v = RateLimiter.validatePlaylistName(newName);
    if (!v.valid) { showToast(v.error ?? 'Invalid name', 'error'); return; }
    const ok = createPlaylist(newName.trim());
    if (ok) { showToast('Playlist created! 🎧', 'success'); setNewName(''); setShowCreateForm(false); }
    else showToast('Name already exists', 'warning');
  };

  // Plays a song AND loads the correct surrounding queue so next/prev work.
  // The queue source depends on which tab/playlist is active.
  const handlePlaySong = (song: Song, queueOverride?: Song[]) => {
    const queue = queueOverride
      ?? (selectedPlaylist ? (playlists.find(p => p.id === selectedPlaylist.id)?.songs ?? [song])
        : activeTab === 'liked'   ? likedSongs
        : activeTab === 'history' ? recentSongs
        : [song]);

    const startIndex = Math.max(0, queue.findIndex(s => s.youtubeId === song.youtubeId));
    loadQueue(queue, startIndex);
    loadAndPlay(song);
    showToast(`Playing: ${song.title.slice(0, 28)}`);
  };

  const handleLike = (song: Song) => {
    const liked = useLibraryStore.getState().toggleLike(song);
    showToast(liked ? '♥ Liked' : '♡ Removed');
  };

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: 'playlists', label: 'Playlists', count: playlists.length },
    { id: 'liked', label: 'Liked Songs', count: likedSongs.length },
    { id: 'history',   label: 'History',   count: recentSongs.length },
    { id: 'following', label: 'Following',  count: followedArtists.length },
  ];

  // Playlist detail
  if (selectedPlaylist) {
    const pl = playlists.find(p => p.id === selectedPlaylist.id) ?? selectedPlaylist;
    return (
      <div>
        <button onClick={() => setSelectedPlaylist(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, marginBottom: 24, transition: 'color 0.2s' }}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text)')}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)')}
        >
          ← Back to Library
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 28, marginBottom: 32, flexWrap: 'wrap' }}>
          <div style={{ width: 140, height: 140, borderRadius: 16, background: 'linear-gradient(135deg, rgba(255,107,157,0.4), rgba(224,85,135,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(255,107,157,0.2)', flexShrink: 0 }}>
            <Music size={56} style={{ color: 'rgba(255,107,157,0.7)' }} />
          </div>
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Playlist</p>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 6 }}>{pl.name}</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{pl.songs.length} song{pl.songs.length !== 1 ? 's' : ''}</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              {pl.songs.length > 0 && (
                <button onClick={() => handlePlaySong(pl.songs[0], pl.songs)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 999, background: 'var(--pink)', color: '#fff', fontWeight: 700, fontSize: 14, boxShadow: '0 4px 16px rgba(255,107,157,0.35)', transition: 'all 0.2s', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <Play size={16} fill="white" /> Play All
                </button>
              )}
              <button
                onClick={() => { setPendingPlaylist({ id: pl.id, name: pl.name }); setSelectedPlaylist(null); onNavigate?.('search'); }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 999, background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'var(--text)', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
                onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(255,255,255,0.12)'; }}
                onMouseLeave={e => { (e.currentTarget).style.background = 'rgba(255,255,255,0.07)'; }}
              >
                <ListPlus size={16} /> Add Songs
              </button>
            </div>
          </div>
        </div>

        {pl.songs.length === 0
          ? <div className="empty-state">
              <div className="empty-state-icon"><SoundwaveIcon size={36} color="var(--text-muted)" /></div>
              <div className="empty-state-title">No songs yet</div>
              <div className="empty-state-sub" style={{ marginBottom: 20 }}>Go to Search, find a song, tap <strong style={{ color: 'var(--pink)' }}>⋮</strong> and choose <strong style={{ color: 'var(--pink)' }}>Add to Playlist</strong></div>
              <button
                onClick={() => { setPendingPlaylist({ id: pl.id, name: pl.name }); setSelectedPlaylist(null); onNavigate?.('search'); }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 999, background: 'linear-gradient(135deg,#FF6B9D,#E05587)', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(255,107,157,0.35)' }}
              >
                <ListPlus size={16} /> Find Songs to Add
              </button>
            </div>
          : pl.songs.map((song, i) => (
            <div key={song.youtubeId} style={{ position: 'relative' }}
              onMouseEnter={e => { const btn = e.currentTarget.querySelector('.del-btn') as HTMLElement; if (btn) btn.style.opacity = '1'; }}
              onMouseLeave={e => { const btn = e.currentTarget.querySelector('.del-btn') as HTMLElement; if (btn) btn.style.opacity = '0'; }}
            >
              <SongCard song={song} layout="row" index={i} isActive={currentSong?.youtubeId === song.youtubeId} isPlaying={isPlaying && currentSong?.youtubeId === song.youtubeId} onPlay={handlePlaySong} />
              <button className="del-btn icon-btn" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0, transition: 'opacity 0.2s' }}
                onClick={() => { removeFromPlaylist(pl.id, song.youtubeId); showToast('Removed from playlist'); }}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = '#ff4444')}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)')}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        }
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingTop: 'max(8px, env(safe-area-inset-top))' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>Your Library</h1>
        <button
          onClick={() => setShowCreateForm(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 999, background: 'var(--pink)', color: '#fff', fontWeight: 700, fontSize: 13, boxShadow: '0 4px 14px rgba(255,107,157,0.3)', transition: 'all 0.2s' }}
        >
          <Plus size={15} /> New Playlist
        </button>
      </div>

      {showCreateForm && (
        <div style={{ marginBottom: 20, padding: '16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', animation: 'slideDown 0.25s cubic-bezier(0.16,1,0.3,1)' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>Create Playlist</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} placeholder="My awesome playlist..." maxLength={60} autoFocus
              style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 13, outline: 'none' }}
            />
            <button onClick={handleCreate} style={{ padding: '10px 18px', borderRadius: 8, background: 'var(--pink)', color: '#fff', fontWeight: 700, fontSize: 13 }}>Create</button>
            <button onClick={() => setShowCreateForm(false)} style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>✕</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="lib-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`lib-tab${activeTab === t.id ? ' active' : ''}`} onClick={() => setActiveTab(t.id)}>
            {t.label} {t.count > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>({t.count})</span>}
          </button>
        ))}
      </div>

      {/* Ad — shown once per library visit, non-intrusive */}
      <AdBanner
        slot="6203471608"
        style={{ margin: '12px 0 16px' }}
      />

      {/* Playlists */}
      {activeTab === 'playlists' && (
        playlists.length === 0
          ? <div className="empty-state"><div className="empty-state-icon"><SoundwaveIcon size={36} color="var(--text-muted)" /></div><div className="empty-state-title">No playlists yet</div><div className="empty-state-sub">Create your first playlist above</div></div>
          : <div className="playlist-grid">
              {playlists.map(pl => (
                <div key={pl.id} className="playlist-card" onClick={() => setSelectedPlaylist(pl)}
                  onMouseEnter={e => { const d = e.currentTarget.querySelector('.playlist-card-del') as HTMLElement; if (d) d.style.opacity = '1'; }}
                  onMouseLeave={e => { const d = e.currentTarget.querySelector('.playlist-card-del') as HTMLElement; if (d) d.style.opacity = '0'; }}
                >
                  <div className="playlist-card-art" style={{ background: 'linear-gradient(135deg, rgba(255,107,157,0.25), rgba(224,85,135,0.1))' }}>
                    {pl.songs.filter(s => s.cover).length >= 4 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', height: '100%' }}>
                        {pl.songs.filter(s => s.cover).slice(0, 4).map(s => <img key={s.youtubeId} src={s.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />)}
                      </div>
                    ) : <Music size={48} style={{ color: 'rgba(255,107,157,0.5)' }} />}
                    <div className="playlist-card-overlay">
                      <div className="playlist-card-play"><Play size={18} fill="white" color="white" /></div>
                    </div>
                  </div>
                  <div className="playlist-card-info">
                    <div className="playlist-card-name">{pl.name}</div>
                    <div className="playlist-card-count">{pl.songs.length} songs</div>
                  </div>
                  <button className="playlist-card-del" style={{ opacity: 0, transition: 'opacity 0.2s' }}
                    onClick={e => { e.stopPropagation(); openConfirm('Delete Playlist', `Delete "${pl.name}"? All songs in this playlist will be removed.`, () => { deletePlaylist(pl.id); showToast('Playlist deleted'); closeConfirm(); }); }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
      )}

      {/* Liked */}
      {activeTab === 'liked' && (
        likedSongs.length === 0
          ? <div className="empty-state"><div className="empty-state-icon">❤️</div><div className="empty-state-title">No liked songs</div><div className="empty-state-sub">Heart a song to see it here</div></div>
          : likedSongs.map((song, i) => (
            <SongCard key={song.youtubeId} song={song} layout="row" index={i}
              isActive={currentSong?.youtubeId === song.youtubeId}
              isPlaying={isPlaying && currentSong?.youtubeId === song.youtubeId}
              isLiked onPlay={handlePlaySong} onLike={handleLike}
            />
          ))
      )}

      {/* History */}
      {activeTab === 'history' && (
        recentSongs.length === 0
          ? <div className="empty-state"><div className="empty-state-icon"><SoundwaveIcon size={36} color="var(--text-muted)" /></div><div className="empty-state-title">Nothing played yet</div><div className="empty-state-sub">Start playing music to build your history</div></div>
          : <>
              {/* Clear all header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 4px 12px', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{recentSongs.length} song{recentSongs.length !== 1 ? 's' : ''}</span>
                <button
                  onClick={() => openConfirm('Clear History', 'This will permanently remove all songs from your history. This cannot be undone.', () => { removeFromRecentStore('__clear__'); closeConfirm(); })}
                  style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, transition: 'all 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ff6b6b'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,100,100,0.3)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}
                >
                  Clear All
                </button>
              </div>
              {recentSongs.map((song, i) => (
                <div key={`${song.youtubeId}-${i}`} style={{ position: 'relative' }} className="history-row">
                  <SongCard song={song} layout="row" index={i}
                    isActive={currentSong?.youtubeId === song.youtubeId}
                    isPlaying={isPlaying && currentSong?.youtubeId === song.youtubeId}
                    onPlay={handlePlaySong}
                  />
                  <button
                    onClick={e => { e.stopPropagation(); removeFromRecentStore(song.youtubeId); }}
                    title="Remove from history"
                    className="history-remove-btn"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </>
      )}

      {/* Following */}
      {activeTab === 'following' && (
        followedArtists.length === 0
          ? <div className="empty-state">
              <div className="empty-state-icon" style={{ fontSize: 36 }}>🎤</div>
              <div className="empty-state-title">Not following anyone yet</div>
              <div className="empty-state-sub">Go to Home and tap Follow on an artist</div>
            </div>
          : <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 4px 16px' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                  {followedArtists.length} artist{followedArtists.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 16 }}>
                {followedArtists.map(artist => (
                  <div key={artist.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', cursor: onArtistClick ? 'pointer' : 'default', transition: 'background 0.2s' }}
                    onClick={() => onArtistClick?.(artist)}
                    onMouseEnter={e => onArtistClick && ((e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.07)')}
                    onMouseLeave={e => onArtistClick && ((e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)')}
                  >
                    <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', background: '#1a1a1a', border: '2px solid rgba(255,107,157,0.3)', flexShrink: 0 }}>
                      {artist.thumbnail
                        ? <img src={artist.thumbnail} alt={artist.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🎤</div>
                      }
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', paddingInline: 4 }}>{artist.name}</div>
                    <button
                      onClick={() => { unfollowArtist(artist.name); showToast(`Unfollowed ${artist.name}`); }}
                      style={{ padding: '5px 14px', borderRadius: 999, background: 'rgba(255,107,157,0.1)', border: '1px solid rgba(255,107,157,0.3)', color: 'var(--pink)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s' }}
                      onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(255,80,80,0.15)'; (e.currentTarget).style.color = '#ff6b6b'; }}
                      onMouseLeave={e => { (e.currentTarget).style.background = 'rgba(255,107,157,0.1)'; (e.currentTarget).style.color = 'var(--pink)'; }}
                    >
                      ✓ Following
                    </button>
                  </div>
                ))}
              </div>
            </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        danger={true}
        icon={<Trash2 size={24} />}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
}
