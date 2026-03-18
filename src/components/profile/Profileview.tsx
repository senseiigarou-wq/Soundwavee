// ============================================================
// SOUNDWAVE — Profile View (mobile)
// ============================================================
import React, { useState } from 'react';
import { LogOut, Music, Heart, List, User, ChevronRight, Shield, Bell, Palette } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useToast } from '@/components/common/Toast';
import { EditProfileView } from './Editprofileview';
import { NotificationsView } from './Notificationsview';
import { AppearanceView } from './Appearanceview';
import { PrivacySecurityView } from './Privacysecurityview';
import { PrivacyPolicyPage } from '@/components/Legal/PrivacyPolicyPage';

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

  // If parent updates initialScreen (desktop nav), sync to it
  React.useEffect(() => {
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
        <div style={{
          width: 80, height: 80, borderRadius: '50%', margin: '0 auto 14px',
          border: '3px solid rgba(255,107,157,0.5)', overflow: 'hidden',
          background: 'linear-gradient(135deg, #FF6B9D, #E05587)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, fontWeight: 800, color: '#fff',
          boxShadow: '0 0 24px rgba(255,107,157,0.3)',
          cursor: 'pointer',
        }} onClick={() => setScreen('edit-profile')}>
          {avatar
            ? <img src={avatar} alt={user?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : initials}
        </div>
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
    </div>
  );
}
