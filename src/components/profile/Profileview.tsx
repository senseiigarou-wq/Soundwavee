// ============================================================
// SOUNDWAVE — Profile View (mobile)
// ============================================================
import React, { useState, useEffect } from 'react';
import { LogOut, Music, Heart, List, User, ChevronRight, Shield, Bell, Palette, ZoomIn, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useToast } from '@/components/common/Toast';
import { EditProfileView } from './Editprofileview';
import { NotificationsView } from './Notificationsview';
import { AppearanceView } from './Appearanceview';
import { PrivacySecurityView } from './Privacysecurityview';
import { PrivacyPolicyPage } from '@/components/Legal/PrivacyPolicyPage';

// ── Inline Avatar Viewer ───────────────────────────────────
function AvatarViewer({ src, name, onClose }: { src: string; name: string; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)', animation: 'av-fade 0.2s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <div style={{ position: 'relative', animation: 'av-pop 0.3s cubic-bezier(0.16,1,0.3,1)' }} onClick={e => e.stopPropagation()}>
          <div style={{ width: 240, height: 240, borderRadius: '50%', overflow: 'hidden', border: '4px solid rgba(255,107,157,0.6)', boxShadow: '0 0 60px rgba(255,107,157,0.4)', background: '#1a1a2a' }}>
            <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: '2px solid rgba(255,107,157,0.3)', animation: 'av-ring 2s ease-in-out infinite' }} />
        </div>
        <div style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>{name}</div>
        <button onClick={onClose} style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={20} />
        </button>
      </div>
      <style>{`
        @keyframes av-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes av-pop  { from { transform: scale(0.5); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        @keyframes av-ring { 0%,100% { transform: scale(1); opacity: 0.5 } 50% { transform: scale(1.08); opacity: 1 } }
      `}</style>
    </>
  );
}

type Screen = 'main' | 'edit-profile' | 'notifications' | 'appearance' | 'privacy' | 'privacy-policy';

interface ProfileViewProps {
  initialScreen?: string;
  onScreenClear?: () => void;
}

export function ProfileView({ initialScreen, onScreenClear }: ProfileViewProps) {
  const { user, logout } = useAuthStore();
  const { likedSongs, playlists, songs } = useLibraryStore();
  const { showToast } = useToast();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [screen, setScreen] = useState<Screen>((initialScreen as Screen) ?? 'main');
  const [showAvatarViewer, setShowAvatarViewer] = useState(false);

  // If parent updates initialScreen (desktop nav), sync to it
  useEffect(() => {
    if (initialScreen) { setScreen(initialScreen as Screen); onScreenClear?.(); }
  }, [initialScreen]);

  // ── Sub-screens ─────────────────────────────────────────
  if (screen === 'edit-profile')  return <EditProfileView onBack={() => setScreen('main')} />;
  if (screen === 'notifications') return <NotificationsView onBack={() => setScreen('main')} />;
  if (screen === 'appearance')    return <AppearanceView onBack={() => setScreen('main')} />;
  if (screen === 'privacy')       return <PrivacySecurityView onBack={() => setScreen('main')} />;
  if (screen === 'privacy-policy') return <PrivacyPolicyPage onBack={() => setScreen('main')} />;

  // ── Main profile screen ──────────────────────────────────
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      showToast('Failed to sign out', 'error');
      setLoggingOut(false);
    }
  };

  const avatar  = user?.picture;
  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  const stats = [
    { icon: Music, label: 'Songs',     value: songs.length },
    { icon: Heart, label: 'Liked',     value: likedSongs.length },
    { icon: List,  label: 'Playlists', value: playlists.length },
  ];

  const menuItems = [
    { icon: User,    label: 'Edit Profile',       sub: 'Name, photo',    action: () => setScreen('edit-profile') },
    { icon: Bell,    label: 'Notifications',      sub: 'Manage alerts',  action: () => setScreen('notifications') },
    { icon: Palette, label: 'Appearance',         sub: 'Theme, display', action: () => setScreen('appearance') },
    { icon: Shield,  label: 'Privacy & Security', sub: 'Data, account',  action: () => setScreen('privacy') },
  ];

  const legalItems = [
    { icon: Shield, label: 'Privacy Policy', sub: 'How we use your data', action: () => setScreen('privacy-policy') },
  ];

  return (
    <div style={{ paddingBottom: 32 }}>

      {/* ── Hero card ── */}
      <div style={{
        background: 'linear-gradient(160deg, rgba(255,107,157,0.15) 0%, rgba(18,18,18,0) 60%)',
        borderRadius: 20, padding: '32px 20px 24px', marginBottom: 20,
        textAlign: 'center', border: '1px solid rgba(255,107,157,0.1)',
      }}>
        <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 14px' }}>
          {/* Animated ring when has avatar */}
          {avatar && (
            <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', background: 'conic-gradient(from 0deg, #FF6B9D, #7ed0ec, #FF6B9D)', animation: 'pv-spin 4s linear infinite', opacity: 0.7 }} />
          )}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            border: '3px solid #000',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #FF6B9D, #E05587)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 800, color: '#fff',
            cursor: avatar ? 'pointer' : 'default',
            position: 'relative', zIndex: 1,
            transition: 'transform 0.2s',
          }}
            onClick={() => avatar ? setShowAvatarViewer(true) : setScreen('edit-profile')}
            onMouseEnter={e => { if (avatar) (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.05)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; }}
          >
            {avatar
              ? <img src={avatar} alt={user?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials}
            {avatar && (
              <div className="pv-view-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', transition: 'background 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,0,0,0.45)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,0,0,0)'; }}
              >
                <ZoomIn size={20} color="#fff" style={{ opacity: 0, transition: 'opacity 0.2s' }} />
              </div>
            )}
          </div>
        </div>
        <style>{`
          @keyframes pv-spin { to { transform: rotate(360deg); } }
          .pv-view-overlay:hover svg { opacity: 1 !important; }
        `}</style>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.4px', marginBottom: 4 }}>
          {user?.name ?? 'User'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user?.email ?? ''}</div>

        {/* Stats */}
        <div style={{ display: 'flex', marginTop: 20, borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.04)' }}>
          {stats.map(({ label, value }, i) => (
            <div key={label} style={{ flex: 1, padding: '14px 8px', textAlign: 'center', borderRight: i < stats.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Account menu ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>
          Account
        </div>
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
          {menuItems.map(({ icon: Icon, label, sub, action }, i) => (
            <button key={label} onClick={action} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', background: 'none', border: 'none',
              borderBottom: i < menuItems.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,107,157,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={17} color="var(--pink)" />
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{sub}</div>
              </div>
              <ChevronRight size={16} color="var(--text-muted)" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Legal ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 2 }}>Legal</div>
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          {legalItems.map(({ icon: Icon, label, sub, action }, i) => (
            <button key={label} onClick={action} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'none', border: 'none', borderBottom: i < legalItems.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,107,157,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={17} color="var(--pink)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{sub}</div>
              </div>
              <ChevronRight size={16} color="var(--text-muted)" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Sign out ── */}
      {!showConfirm ? (
        <button onClick={() => setShowConfirm(true)} style={{
          width: '100%', padding: '15px', borderRadius: 14,
          background: 'rgba(255,60,60,0.08)', border: '1px solid rgba(255,60,60,0.2)',
          color: '#ff6b6b', fontWeight: 700, fontSize: 15, cursor: 'pointer',
          fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <LogOut size={18} /> Sign Out
        </button>
      ) : (
        <div style={{ background: 'rgba(255,60,60,0.06)', border: '1px solid rgba(255,60,60,0.2)', borderRadius: 16, padding: '20px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Sign out of Soundwave?</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>Your library is saved to your account.</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowConfirm(false)} style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
            <button onClick={handleLogout} disabled={loggingOut} style={{ flex: 1, padding: '12px', borderRadius: 12, background: '#c0392b', border: 'none', color: '#fff', fontWeight: 700, fontSize: 14, cursor: loggingOut ? 'not-allowed' : 'pointer', opacity: loggingOut ? 0.6 : 1, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loggingOut ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'sw-spin 0.7s linear infinite' }} /> : <LogOut size={15} />}
              Sign Out
            </button>
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 28, color: 'var(--text-muted)', fontSize: 11 }}>
        Soundwave v1.0 · Secured by Firebase ·{' '}
        <button onClick={() => setScreen('privacy-policy')} style={{ background: 'none', border: 'none', color: 'var(--pink)', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', padding: 0 }}>
          Privacy Policy
        </button>
      </div>
      <style>{`@keyframes sw-spin{to{transform:rotate(360deg)}}`}</style>

      {/* Avatar full-screen viewer */}
      {showAvatarViewer && avatar && (
        <AvatarViewer src={avatar} name={user?.name ?? 'Profile Photo'} onClose={() => setShowAvatarViewer(false)} />
      )}
    </div>
  );
}
