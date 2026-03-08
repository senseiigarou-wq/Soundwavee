import { useState } from 'react';
import { Home, Search, Library, Heart, Plus, Trash2, Music, Settings, type LucideIcon } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useToast } from '@/components/common/Toast';
import { RateLimiter } from '@/services/ratelimiter';
import { SoundwaveLogo } from '@/components/common/Soundwavelogo';
import type { View } from '@/types';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  onUserClick: () => void;
}

const navItems: { view: View; label: string; icon: LucideIcon }[] = [
  { view: 'home', label: 'Home', icon: Home },
  { view: 'search', label: 'Search', icon: Search },
  { view: 'library', label: 'Your Library', icon: Library },
  { view: 'liked', label: 'Liked Songs', icon: Heart },
];

export function Sidebar({ currentView, onViewChange, onUserClick }: SidebarProps) {
  const { user } = useAuthStore();
  const { playlists, createPlaylist, deletePlaylist } = useLibraryStore();
  const { showToast } = useToast();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleCreate = () => {
    const v = RateLimiter.validatePlaylistName(newPlaylistName);
    if (!v.valid) { showToast(v.error ?? 'Invalid name', 'error'); return; }
    const ok = createPlaylist(newPlaylistName.trim());
    if (ok) { showToast('Playlist created! 🎧', 'success'); setNewPlaylistName(''); setShowInput(false); }
    else showToast('Name already exists', 'warning');
  };

  return (
    <aside className="app-sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon"><SoundwaveLogo size={30} withBackground={true} /></div>
        <span className="sidebar-logo-name">Soundwave</span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navItems.map(({ view, label, icon: Icon }) => (
          <button
            key={view}
            className={`nav-item${currentView === view ? ' active' : ''}`}
            onClick={() => onViewChange(view)}
            title={label}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Playlists */}
      <div className="sidebar-section-label">
        <span>Playlists</span>
        <button onClick={() => setShowInput(v => !v)} title="Create playlist">
          <Plus size={14} />
        </button>
      </div>

      {showInput && (
        <div className="playlist-input-wrap">
          <div className="playlist-input">
            <input
              autoFocus
              value={newPlaylistName}
              onChange={e => setNewPlaylistName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Playlist name..."
              maxLength={60}
            />
            <button className="btn-add" onClick={handleCreate}>Add</button>
          </div>
        </div>
      )}

      <div className="sidebar-playlists">
        {playlists.length === 0 ? (
          <p style={{ padding: '4px 12px', fontSize: 12, color: 'var(--text-muted)' }}>No playlists yet</p>
        ) : playlists.map(pl => (
          <div key={pl.id} className="sidebar-playlist-item" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.2s', position: 'relative' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div className="sidebar-playlist-thumb"><Music size={12} color="var(--pink)" /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pl.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{pl.songs.length} songs</div>
            </div>
            <button
              style={{ padding: 4, borderRadius: 6, color: 'var(--text-muted)', opacity: 0, transition: 'opacity 0.2s' }}
              onClick={e => { e.stopPropagation(); deletePlaylist(pl.id); showToast('Playlist deleted'); }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; (e.currentTarget as HTMLButtonElement).style.color = '#ff4444'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0'; }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      {/* User */}
      {user && (
        <div
          className="sidebar-user"
          onClick={onUserClick}
          title="Account settings"
          style={{ cursor: 'pointer', transition: 'background 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div className="sidebar-user-avatar">
            {user.picture
              ? <img src={user.picture} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : user.name[0]}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
            <div className="sidebar-user-email" style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
          </div>
          <Settings size={15} color="var(--text-muted)" style={{ flexShrink: 0, opacity: 0.6 }} />
        </div>
      )}
    </aside>
  );
}