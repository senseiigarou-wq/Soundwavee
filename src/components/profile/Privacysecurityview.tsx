// ============================================================
// SOUNDWAVE — Privacy & Security Settings
// ============================================================
import { useState } from 'react';
import { ArrowLeft, Lock, ShieldCheck, Trash2, Eye, EyeOff, AlertCircle, CheckCircle, Monitor, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/common/Toast';

interface PrivacySecurityViewProps { onBack: () => void; }

type Section = 'main' | 'change-password' | 'delete-account' | 'login-activity';

// ── Password strength ─────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#ff4444', '#ffaa00', '#88cc00', '#1ED760'];
  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {checks.map((ok, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < score ? colors[score] : 'rgba(255,255,255,0.1)', transition: 'all 0.3s' }} />
        ))}
      </div>
      <div style={{ fontSize: 11, color: colors[score], fontWeight: 600 }}>{labels[score]}</div>
    </div>
  );
}

function PwInput({ value, onChange, placeholder, showToggle = true }: { value: string; onChange: (v: string) => void; placeholder: string; showToggle?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <Lock size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', padding: '12px 42px 12px 38px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 11, color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
        onFocus={e => e.target.style.borderColor = 'var(--pink)'}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
      />
      {showToggle && (
        <button onClick={() => setShow(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      )}
    </div>
  );
}

// ── Mock login activity ───────────────────────────────────────
const MOCK_LOGINS = [
  { device: 'Chrome on Windows', location: 'Manila, PH',    time: 'Just now',    icon: '💻', current: true },
  { device: 'Soundwave Android', location: 'Davao, PH',     time: '2 hours ago', icon: '📱', current: false },
  { device: 'Safari on iPhone',  location: 'Cebu, PH',      time: 'Yesterday',   icon: '📱', current: false },
  { device: 'Firefox on Linux',  location: 'Singapore, SG', time: '3 days ago',  icon: '💻', current: false },
];

export function PrivacySecurityView({ onBack }: PrivacySecurityViewProps) {
  const { user, isLoading, changeUserPassword, deleteUserAccount, logout } = useAuthStore();
  const { showToast } = useToast();
  const [section, setSection] = useState<Section>('main');

  // ── Change Password state ─────────────────────────────────
  const [curPw, setCurPw]       = useState('');
  const [newPw, setNewPw]       = useState('');
  const [confPw, setConfPw]     = useState('');
  const [pwError, setPwError]   = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  // ── Delete Account state ──────────────────────────────────
  const [delPw, setDelPw]           = useState('');
  const [delConfirm, setDelConfirm] = useState('');
  const [delStep, setDelStep]       = useState(1);

  // ── Is Google user (no password) ─────────────────────────
  const isGoogleUser = user?.picture?.includes('googleusercontent') || !user?.email?.includes('@') === false && !curPw;

  const handleChangePassword = async () => {
    setPwError('');
    if (!curPw) { setPwError('Enter your current password.'); return; }
    if (!newPw)  { setPwError('Enter a new password.'); return; }
    if (newPw !== confPw) { setPwError('New passwords do not match.'); return; }
    if (newPw === curPw) { setPwError('New password must differ from current.'); return; }
    try {
      await changeUserPassword(curPw, newPw);
      setPwSuccess(true);
      showToast('Password changed successfully ✓', 'success');
      setTimeout(() => { setPwSuccess(false); setCurPw(''); setNewPw(''); setConfPw(''); setSection('main'); }, 1200);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Failed to change password.');
    }
  };

  const handleDeleteAccount = async () => {
    if (delConfirm !== 'DELETE') { showToast('Type DELETE to confirm', 'error'); return; }
    try {
      await deleteUserAccount(delPw || undefined);
      showToast('Account deleted. Goodbye 👋');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete account.', 'error');
    }
  };

  // ── Sub-screens ───────────────────────────────────────────
  if (section === 'change-password') return (
    <div style={{ paddingBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => setSection('main')} style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text)', flexShrink: 0 }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Change Password</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Choose a strong new password</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>Current Password</label>
          <PwInput value={curPw} onChange={setCurPw} placeholder="Your current password" />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>New Password</label>
          <PwInput value={newPw} onChange={setNewPw} placeholder="Min 8 chars, 1 uppercase, 1 number" />
          <PasswordStrength password={newPw} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>Confirm New Password</label>
          <PwInput value={confPw} onChange={setConfPw} placeholder="Repeat new password" />
          {confPw && newPw !== confPw && <div style={{ fontSize: 11, color: '#ff6b6b', marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}><AlertCircle size={12} />Passwords don't match</div>}
          {confPw && newPw === confPw && newPw && <div style={{ fontSize: 11, color: '#1ED760', marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}><CheckCircle size={12} />Passwords match</div>}
        </div>
      </div>
      {pwError && <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)', color: '#ff6b6b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}><AlertCircle size={14} />{pwError}</div>}
      {pwSuccess && <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(30,215,96,0.1)', border: '1px solid rgba(30,215,96,0.2)', color: '#1ED760', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle size={14} />Password changed successfully!</div>}
      <button onClick={handleChangePassword} disabled={isLoading || pwSuccess} style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg,#FF6B9D,#E05587)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 15, cursor: isLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginTop: 20, opacity: isLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 20px rgba(255,107,157,0.35)' }}>
        {isLoading ? <><span style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'sw-ps-spin 0.7s linear infinite' }} />Saving…</> : <><Lock size={16} />Update Password</>}
      </button>
      <style>{`@keyframes sw-ps-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (section === 'login-activity') return (
    <div style={{ paddingBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => setSection('main')} style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text)', flexShrink: 0 }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Login Activity</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Recent devices and sessions</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {MOCK_LOGINS.map((l, i) => (
          <div key={i} style={{ background: l.current ? 'rgba(255,107,157,0.08)' : 'var(--bg-card)', border: `1px solid ${l.current ? 'rgba(255,107,157,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 24, flexShrink: 0 }}>{l.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                {l.device}
                {l.current && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--pink)', background: 'rgba(255,107,157,0.15)', padding: '2px 7px', borderRadius: 20 }}>Current</span>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Monitor size={10} />{l.location}
                <span style={{ opacity: 0.4 }}>·</span>
                <Clock size={10} />{l.time}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
        Don't recognize a device? Change your password immediately.
      </div>
    </div>
  );

  if (section === 'delete-account') return (
    <div style={{ paddingBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => { setSection('main'); setDelStep(1); setDelPw(''); setDelConfirm(''); }} style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text)', flexShrink: 0 }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#ff6b6b' }}>Delete Account</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>This action cannot be undone</div>
        </div>
      </div>

      {delStep === 1 && (
        <>
          <div style={{ background: 'rgba(255,60,60,0.07)', border: '1px solid rgba(255,60,60,0.2)', borderRadius: 16, padding: '20px', marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 12 }}>⚠️ Before you delete</div>
            {['All your playlists will be permanently deleted', 'Your liked songs and history will be lost', 'Your profile and account data will be erased', 'You cannot recover this account after deletion'].map((w, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                <span style={{ color: '#ff6b6b', fontSize: 14, marginTop: 1, flexShrink: 0 }}>✕</span>
                <span style={{ fontSize: 13, color: '#b3b3b3' }}>{w}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setSection('main')} style={{ flex: 1, padding: '13px', borderRadius: 13, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={() => setDelStep(2)} style={{ flex: 1, padding: '13px', borderRadius: 13, background: 'rgba(255,60,60,0.15)', border: '1px solid rgba(255,60,60,0.3)', color: '#ff6b6b', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Continue</button>
          </div>
        </>
      )}

      {delStep === 2 && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>Password (if email account)</label>
              <PwInput value={delPw} onChange={setDelPw} placeholder="Your current password" />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>Google sign-in users can leave this blank.</div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#ff6b6b', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>Type DELETE to confirm</label>
              <input
                value={delConfirm} onChange={e => setDelConfirm(e.target.value)}
                placeholder='Type "DELETE"'
                style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,60,60,0.05)', border: `1px solid ${delConfirm === 'DELETE' ? '#ff4444' : 'rgba(255,60,60,0.2)'}`, borderRadius: 11, color: delConfirm === 'DELETE' ? '#ff6b6b' : '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', letterSpacing: delConfirm === 'DELETE' ? '0.1em' : 'normal', fontWeight: delConfirm === 'DELETE' ? 700 : 400 }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setDelStep(1)} style={{ flex: 1, padding: '13px', borderRadius: 13, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Back</button>
            <button onClick={handleDeleteAccount} disabled={isLoading || delConfirm !== 'DELETE'} style={{ flex: 1, padding: '13px', borderRadius: 13, background: delConfirm === 'DELETE' ? '#c0392b' : 'rgba(255,60,60,0.1)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 14, cursor: delConfirm !== 'DELETE' || isLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: isLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {isLoading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'sw-ps-spin 0.7s linear infinite' }} /> : <Trash2 size={15} />}
              Delete Forever
            </button>
          </div>
        </>
      )}
      <style>{`@keyframes sw-ps-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── Main screen ───────────────────────────────────────────
  const menuRows = [
    { icon: Lock,        label: 'Change Password',        sub: 'Update your account password',       action: () => setSection('change-password'), danger: false },
    { icon: ShieldCheck, label: 'Two-Factor Auth',        sub: 'Managed via Firebase Console',        action: () => showToast('Configure 2FA in Firebase Console'), danger: false },
    { icon: Monitor,     label: 'Login Activity',         sub: 'See recent devices and sessions',     action: () => setSection('login-activity'), danger: false },
    { icon: Trash2,      label: 'Delete Account',         sub: 'Permanently remove your account',     action: () => setSection('delete-account'), danger: true },
  ];

  return (
    <div style={{ paddingBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text)', flexShrink: 0 }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>Privacy & Security</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Keep your account safe</div>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
        {menuRows.map(({ icon: Icon, label, sub, action, danger }, i) => (
          <button key={label} onClick={action} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'none', border: 'none', borderBottom: i < menuRows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = danger ? 'rgba(255,60,60,0.06)' : 'rgba(255,255,255,0.04)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: danger ? 'rgba(255,60,60,0.1)' : 'rgba(255,107,157,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={17} color={danger ? '#ff6b6b' : 'var(--pink)'} />
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: danger ? '#ff6b6b' : 'var(--text)' }}>{label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{sub}</div>
            </div>
            <ArrowLeft size={16} color="var(--text-muted)" style={{ transform: 'rotate(180deg)' }} />
          </button>
        ))}
      </div>
    </div>
  );
}