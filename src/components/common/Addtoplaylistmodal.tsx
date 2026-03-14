// ============================================================
// SOUNDWAVE — Add to Playlist Modal
// Bottom-sheet modal: pick a playlist to add the current song.
// Triggered globally via playerStore.openAddToPlaylist(song).
// ============================================================
import React, { useEffect, useRef, useState } from 'react';
import { X, Plus, Check, Music, ListPlus } from 'lucide-react';
import { usePlayerStore } from '@/store/playStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useToast } from '@/components/common/Toast';

export function AddToPlaylistModal() {
  const { addToPlaylistSong, closeAddToPlaylist } = usePlayerStore();
  const { playlists, addToPlaylist, createPlaylist } = useLibraryStore();
  const { showToast } = useToast();

  const [creating, setCreating]   = useState(false);
  const [newName, setNewName]     = useState('');
  const [nameErr, setNameErr]     = useState('');
  const [justAdded, setJustAdded] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const song = addToPlaylistSong;

  // Focus input when create form opens
  useEffect(() => {
    if (creating) setTimeout(() => inputRef.current?.focus(), 50);
  }, [creating]);

  // Close on Escape
  useEffect(() => {
    if (!song) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAddToPlaylist(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [song, closeAddToPlaylist]);

  // Reset state when modal opens for a new song
  useEffect(() => {
    if (song) { setCreating(false); setNewName(''); setNameErr(''); setJustAdded(new Set()); }
  }, [song?.youtubeId]);

  if (!song) return null;

  const handleAdd = (playlistId: string, playlistName: string) => {
    const success = addToPlaylist(playlistId, song);
    if (success) {
      setJustAdded(prev => new Set([...prev, playlistId]));
      showToast(`Added to "${playlistName}" ✓`, 'success');
    } else {
      showToast(`Already in "${playlistName}"`, 'error');
    }
  };

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) { setNameErr('Name cannot be empty.'); return; }
    if (trimmed.length > 50) { setNameErr('Max 50 characters.'); return; }
    const ok = createPlaylist(trimmed);
    if (!ok) { setNameErr('Name already exists or invalid.'); return; }
    // Auto-add song to newly created playlist
    const created = useLibraryStore.getState().playlists.find(p => p.name.toLowerCase() === trimmed.toLowerCase());
    if (created) {
      addToPlaylist(created.id, song);
      setJustAdded(prev => new Set([...prev, created.id]));
      showToast(`Created "${trimmed}" and added song ✓`, 'success');
    }
    setNewName(''); setNameErr(''); setCreating(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={closeAddToPlaylist}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)',
          animation: 'atp-fade-in 0.2s ease',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 201,
        background: '#141414',
        borderRadius: '20px 20px 0 0',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '0 0 max(24px, env(safe-area-inset-bottom))',
        animation: 'atp-slide-up 0.28s cubic-bezier(0.16,1,0.3,1)',
        maxHeight: '80dvh',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 16px' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Add to Playlist</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {song.title}
            </div>
          </div>
          <button
            onClick={closeAddToPlaylist}
            style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0 }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable playlist list */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 16px' }}>

          {/* Create new playlist row */}
          {creating ? (
            <div style={{ marginBottom: 12, background: 'rgba(255,107,157,0.07)', border: '1px solid rgba(255,107,157,0.2)', borderRadius: 14, padding: '12px 14px' }}>
              <input
                ref={inputRef}
                value={newName}
                onChange={e => { setNewName(e.target.value); setNameErr(''); }}
                onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false); }}
                placeholder="Playlist name…"
                maxLength={50}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.06)', border: `1px solid ${nameErr ? '#ff4444' : 'rgba(255,255,255,0.12)'}`,
                  borderRadius: 10, color: '#fff', fontSize: 14, padding: '9px 12px',
                  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                }}
              />
              {nameErr && <div style={{ fontSize: 11, color: '#ff6b6b', marginTop: 5 }}>{nameErr}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button
                  onClick={() => { setCreating(false); setNewName(''); setNameErr(''); }}
                  style={{ flex: 1, padding: '9px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >Cancel</button>
                <button
                  onClick={handleCreate}
                  style={{ flex: 2, padding: '9px', borderRadius: 10, background: 'linear-gradient(135deg,#FF6B9D,#E05587)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                >Create & Add</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 14px', borderRadius: 14, marginBottom: 8,
                background: 'rgba(255,107,157,0.06)', border: '1.5px dashed rgba(255,107,157,0.3)',
                color: 'var(--pink)', cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(255,107,157,0.1)'; (e.currentTarget).style.borderColor = 'var(--pink)'; }}
              onMouseLeave={e => { (e.currentTarget).style.background = 'rgba(255,107,157,0.06)'; (e.currentTarget).style.borderColor = 'rgba(255,107,157,0.3)'; }}
            >
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(255,107,157,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Plus size={20} />
              </div>
              <span style={{ fontWeight: 700, fontSize: 14 }}>New Playlist</span>
            </button>
          )}

          {/* Existing playlists */}
          {playlists.length === 0 && !creating && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              No playlists yet. Create one above!
            </div>
          )}

          {playlists.map(pl => {
            const alreadyIn  = pl.songs.some(s => s.youtubeId === song.youtubeId);
            const wasJustAdded = justAdded.has(pl.id);
            const cover      = pl.songs.find(s => s.cover)?.cover;

            return (
              <button
                key={pl.id}
                onClick={() => !alreadyIn && handleAdd(pl.id, pl.name)}
                disabled={alreadyIn}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                  padding: '10px 14px', borderRadius: 14, marginBottom: 6,
                  background: alreadyIn ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${wasJustAdded ? 'rgba(255,107,157,0.35)' : 'rgba(255,255,255,0.06)'}`,
                  cursor: alreadyIn ? 'default' : 'pointer',
                  fontFamily: 'inherit', textAlign: 'left',
                  transition: 'all 0.2s',
                  opacity: alreadyIn ? 0.6 : 1,
                }}
                onMouseEnter={e => { if (!alreadyIn) (e.currentTarget).style.background = 'rgba(255,255,255,0.09)'; }}
                onMouseLeave={e => { if (!alreadyIn) (e.currentTarget).style.background = 'rgba(255,255,255,0.05)'; }}
              >
                {/* Playlist art */}
                <div style={{ width: 42, height: 42, borderRadius: 10, overflow: 'hidden', background: '#1a1a2a', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {cover
                    ? <img src={cover} alt={pl.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <Music size={18} color="rgba(255,255,255,0.25)" />}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pl.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{pl.songs.length} song{pl.songs.length !== 1 ? 's' : ''}</div>
                </div>

                {/* Status icon */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: alreadyIn ? 'rgba(255,107,157,0.15)' : 'rgba(255,255,255,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {alreadyIn
                    ? <Check size={13} color="var(--pink)" />
                    : <Plus size={14} color="rgba(255,255,255,0.5)" />}
                </div>
              </button>
            );
          })}

          <div style={{ height: 8 }} />
        </div>
      </div>

      <style>{`
        @keyframes atp-fade-in  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes atp-slide-up { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </>
  );
}