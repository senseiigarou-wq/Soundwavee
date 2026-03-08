// ============================================================
// SOUNDWAVE — Sidebar Profile Panel (desktop)
// Slides up from the bottom of the sidebar when user clicks
// their name/avatar. Contains quick-access profile actions.
// ============================================================
import { useEffect, useRef } from 'react';
import {
  X, User, Bell, Palette, Shield, LogOut, ChevronRight,
  Music, Heart, List,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLibraryStore } from '@/store/libraryStore';

interface SidebarProfilePanelProps {
  onClose: () => void;
  onNavigate: (screen: 'edit-profile' | 'notifications' | 'appearance' | 'privacy') => void;
}

export function SidebarProfilePanel({ onClose, onNavigate }: SidebarProfilePanelProps) {
  const { user, logout } = useAuthStore();
  const { likedSongs, playlists, songs } = useLibraryStore();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const avatar = user?.picture;
  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  const stats = [
    { icon: Music, label: 'Songs',     value: songs.length },
    { icon: Heart, label: 'Liked',     value: likedSongs.length },
    { icon: List,  label: 'Playlists', value: playlists.length },
  ];

  const menuItems = [
    { icon: User,    label: 'Edit Profile',       screen: 'edit-profile'  as const },
    { icon: Bell,    label: 'Notifications',      screen: 'notifications' as const },
    { icon: Palette, label: 'Appearance',         screen: 'appearance'    as const },
    { icon: Shield,  label: 'Privacy & Security', screen: 'privacy'       as const },
  ];

  return (
    <>
      {/* Backdrop */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 45,
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
        animation: 'sw-panel-fade 0.2s ease',
      }} onClick={onClose} />

      {/* Panel — positioned above the sidebar user row */}
      <div ref={panelRef} style={{
        position: 'fixed',
        bottom: 72,   // just above the user row
        left: 8,
        width: 256,
        zIndex: 46,
        background: 'rgba(22,22,22,0.98)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: '0 16px 48px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(255,255,255,0.05)',
        backdropFilter: 'blur(24px)',
        animation: 'sw-panel-up 0.25s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 16px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          {/* Avatar */}
          <div style={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            border: '2px solid rgba(255,107,157,0.5)',
            overflow: 'hidden',
            background: 'linear-gradient(135deg,#FF6B9D,#E05587)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 800, color: '#fff',
            boxShadow: '0 0 16px rgba(255,107,157,0.25)',
          }}>
            {avatar
              ? <img src={avatar} alt={user?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name ?? 'User'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0 }}>
            <X size={14} />
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {stats.map(({ label, value }, i) => (
            <div key={label} style={{
              flex: 1, padding: '10px 6px', textAlign: 'center',
              borderRight: i < stats.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
            }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>{value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1, fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Menu items */}
        <div style={{ padding: '6px 0' }}>
          {menuItems.map(({ icon: Icon, label, screen }) => (
            <button key={screen}
              onClick={() => { onNavigate(screen); onClose(); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 14px', background: 'none', border: 'none',
                cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,107,157,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={14} color="var(--pink)" />
              </div>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text)', textAlign: 'left' }}>{label}</span>
              <ChevronRight size={13} color="var(--text-muted)" />
            </button>
          ))}
        </div>

        {/* Sign out */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '6px 0 6px' }}>
          <button
            onClick={() => { logout(); onClose(); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 14px', background: 'none', border: 'none',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,60,60,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,60,60,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <LogOut size={14} color="#ff6b6b" />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#ff6b6b' }}>Sign Out</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes sw-panel-up   { from { opacity:0; transform:translateY(12px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes sw-panel-fade { from { opacity:0; } to { opacity:1; } }
      `}</style>
    </>
  );
}