// ============================================================
// SOUNDWAVE — Login / Sign-Up Page
// ============================================================

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getLockoutRemaining, getProgressiveDelay, isInIframe, validatePassword } from '@/services/authservice';
import { useToast } from '@/components/common/Toast';
import { ENV } from '@/config/env';
import { SoundwaveLogo } from '@/components/common/Soundwavelogo';

// ─── Types ───────────────────────────────────────────────────
type AuthMode = 'signin' | 'signup' | 'reset';

// ─── Lockout countdown ───────────────────────────────────────
function useLockout() {
  const [ms, setMs] = useState(getLockoutRemaining());
  useEffect(() => {
    if (ms <= 0) return;
    const id = window.setInterval(() => { const r = getLockoutRemaining(); setMs(r); if (r <= 0) window.clearInterval(id); }, 1000);
    return () => window.clearInterval(id);
  }, [ms > 0]);
  return ms;
}

// ─── Password strength ───────────────────────────────────────
function StrengthBar({ password }: { password: string }) {
  if (!password) return null;
  const errors = validatePassword(password);
  const score = 3 - errors.length;
  const label = score <= 0 ? 'Weak' : score === 1 ? 'Fair' : score === 2 ? 'Good' : 'Strong';
  const color = score <= 0 ? '#ff4444' : score === 1 ? '#f5a500' : score === 2 ? '#4caf50' : '#00c853';
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < score ? color : 'rgba(255,255,255,.1)', transition: 'all .3s' }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color, fontSize: 11, fontWeight: 600 }}>{label}</span>
        {errors.length > 0 && (
          <span style={{ color: '#535353', fontSize: 10 }}>Needs: {errors.join(' · ')}</span>
        )}
      </div>
    </div>
  );
}

// ─── Eye icon ────────────────────────────────────────────────
function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

// ─── Google logo ─────────────────────────────────────────────
const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const Spinner = () => (
  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.2)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'swSpin .7s linear infinite', flexShrink: 0 }} />
);

// ─── Styles ──────────────────────────────────────────────────
const C = {
  pink:     '#FF6B9D',
  pinkDark: '#E05587',
  card:     'rgba(18,18,18,.95)',
  border:   'rgba(255,255,255,.07)',
  input:    'rgba(255,255,255,.05)',
  inputFoc: 'rgba(255,107,157,.15)',
};

const S: Record<string, React.CSSProperties> = {
  page:      { background: '#000', fontFamily: "'DM Sans',-apple-system,sans-serif" },
  blob1:     { position: 'absolute', top: -120, left: -120, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,107,157,.22) 0%,transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none', animation: 'swFloat 8s ease-in-out infinite' },
  blob2:     { position: 'absolute', top: '40%', right: -150, width: 450, height: 450, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,85,135,.15) 0%,transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none', animation: 'swFloat 10s ease-in-out infinite reverse' },
  grid:      { position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px)', backgroundSize: '64px 64px', pointerEvents: 'none' },

  left:      { display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  logoRow:   { display: 'flex', alignItems: 'center', gap: 12 },
  logoIcon:  { width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  logoName:  { fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' },
  hero:      { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24 },
  badge:     { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 999, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: '#b3b3b3', fontSize: 13, width: 'fit-content' },
  badgeDot:  { width: 8, height: 8, borderRadius: '50%', background: '#FF6B9D', animation: 'swPulse 2s ease-in-out infinite' },
  h1:        { fontSize: 'clamp(42px,4vw,64px)', fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: '-2px', margin: 0 },
  accent:    { background: 'linear-gradient(135deg,#FF85B3,#E05587)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  sub:       { fontSize: 17, color: '#b3b3b3', lineHeight: 1.6, maxWidth: 420, margin: 0 },
  statsRow:  { display: 'flex', gap: 32 },
  statN:     { fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-1px', display: 'block' },
  statL:     { fontSize: 12, color: '#535353' },
  pills:     { display: 'flex', flexWrap: 'wrap', gap: 10 },
  pill:      { padding: '8px 16px', borderRadius: 999, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', color: '#fff', fontSize: 13, fontWeight: 500 },
  footer:    { color: '#535353', fontSize: 12 },
  divider:   { width: 1, background: 'linear-gradient(to bottom,transparent,rgba(255,255,255,.07),transparent)', margin: '60px 0', flexShrink: 0 },

  right:     { flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', position: 'relative' },
  box:       { width: '100%', maxWidth: 420 },
  card:      { background: C.card, border: `1px solid ${C.border}`, borderRadius: 'clamp(16px,3vw,24px)', padding: 'clamp(24px,4vw,40px) clamp(18px,4vw,36px)', backdropFilter: 'blur(20px)', boxShadow: '0 25px 60px rgba(0,0,0,.6)' },

  // Mode tabs
  tabs:      { display: 'flex', gap: 4, background: 'rgba(255,255,255,.04)', borderRadius: 12, padding: 4, marginBottom: 28 },
  tab:       { flex: 1, padding: '10px 0', borderRadius: 9, border: 'none', background: 'transparent', color: '#535353', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' },
  tabActive: { background: 'rgba(255,107,157,.15)', color: '#FF6B9D' },

  cardTitle: { fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.5px' },
  cardSub:   { fontSize: 13, color: '#b3b3b3', margin: '0 0 24px', lineHeight: 1.5 },

  // Form
  label:     { display: 'block', color: '#b3b3b3', fontSize: 12, fontWeight: 600, marginBottom: 6, letterSpacing: '.03em', textTransform: 'uppercase' },
  inputWrap: { position: 'relative', marginBottom: 16 },
  input:     { width: '100%', padding: '13px 16px', borderRadius: 12, background: C.input, border: `1px solid ${C.border}`, color: '#fff', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', transition: 'all .2s' },
  inputPw:   { width: '100%', padding: '13px 44px 13px 16px', borderRadius: 12, background: C.input, border: `1px solid ${C.border}`, color: '#fff', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', transition: 'all .2s' },
  eyeBtn:    { position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#535353', cursor: 'pointer', padding: 4, display: 'flex' },

  submitBtn: { width: '100%', padding: '15px', borderRadius: 14, background: `linear-gradient(135deg,${C.pink},${C.pinkDark})`, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', border: 'none', transition: 'all .2s', boxShadow: '0 4px 20px rgba(255,107,157,.3)', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 },
  gBtn:      { width: '100%', padding: '13px 20px', borderRadius: 14, background: '#fff', color: '#1a1a1a', fontWeight: 700, fontSize: 14, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all .2s', boxShadow: '0 2px 12px rgba(0,0,0,.3)', fontFamily: 'inherit' },

  orRow:     { display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' },
  orLine:    { flex: 1, height: 1, background: 'rgba(255,255,255,.08)' },
  orText:    { color: '#535353', fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase' },

  errBox:    { marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,67,67,.1)', border: '1px solid rgba(255,67,67,.25)', color: '#ff6b6b', fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-line' as const },
  lockBox:   { marginBottom: 16, padding: '13px 16px', borderRadius: 12, background: 'rgba(245,165,0,.08)', border: '1px solid rgba(245,165,0,.3)', color: '#f5a500', fontSize: 13, textAlign: 'center' },
  successBox:{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(76,175,80,.1)', border: '1px solid rgba(76,175,80,.3)', color: '#81c784', fontSize: 13, lineHeight: 1.5 },
  iframeBox: { marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,165,0,.08)', border: '1px solid rgba(255,165,0,.25)', color: '#ffaa00', fontSize: 12, lineHeight: 1.6, textAlign: 'center' },
  openTabBtn:{ marginTop: 8, padding: '7px 16px', borderRadius: 9, background: `linear-gradient(135deg,${C.pink},${C.pinkDark})`, color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', border: 'none', fontFamily: 'inherit' },

  forgotBtn: { background: 'none', border: 'none', color: C.pink, fontSize: 12, cursor: 'pointer', padding: 0, fontFamily: 'inherit', float: 'right' as const, marginTop: 6 },
  secRow:    { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 20, flexWrap: 'wrap' },
  secBadge:  { display: 'flex', alignItems: 'center', gap: 5, color: '#535353', fontSize: 11 },
  verifyNote:{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,107,157,.06)', border: '1px solid rgba(255,107,157,.15)', color: '#FF85B3', fontSize: 12, lineHeight: 1.6 },
};

const KF = `
@keyframes swFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-20px) scale(1.05)}}
@keyframes swPulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes swSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes swSpin{to{transform:rotate(360deg)}}

/* ─── Base (mobile-first) ─────────────────────────────────── */
.sw-page {
  /* Own scroll container — does NOT rely on body scrolling.
     This bypasses the global html/body/root overflow:hidden. */
  height: 100dvh;          /* dvh = dynamic viewport height (excludes browser chrome) */
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: scroll;      /* scroll not auto — forces scrollability on Android */
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  position: relative;
}
.sw-left {
  width: 100%;
  padding: 28px 20px 20px;
  justify-content: flex-start;
  gap: 20px;
}
.sw-hero { padding-top: 0 !important; }
.sw-right {
  width: 100%;
  padding: 0 20px 48px;
  overflow: visible;
}
.sw-divider { display: none; }

/* ─── Tablet (601–900px) ──────────────────────────────────── */
@media(min-width:601px) and (max-width:900px){
  .sw-left { padding: 36px 40px 24px; }
  .sw-right { padding: 0 40px 64px; }
}

/* ─── Desktop (901px+): side-by-side, only right scrolls ──── */
@media(min-width:901px){
  .sw-page  { height: 100vh; overflow: hidden; flex-direction: row; }
  .sw-left  { width: 50%; flex: 1; height: 100vh; overflow: hidden;
              position: sticky; top: 0; padding: 56px 64px;
              justify-content: space-between; gap: 0; }
  .sw-right { flex: 1; height: 100vh; overflow-y: auto;
              -webkit-overflow-scrolling: touch;
              padding: clamp(24px,4vw,48px) clamp(16px,4vw,48px) 48px; }
  .sw-divider { display: block; }
}

input:-webkit-autofill{-webkit-box-shadow:0 0 0 30px #1a1a1a inset!important;-webkit-text-fill-color:#fff!important;}
`;

// ─── Component ───────────────────────────────────────────────
export function LoginPage() {
  const { loginGoogle, loginEmail, registerEmail, sendPasswordReset, isLoading, error, clearError } = useAuthStore();
  const { showToast } = useToast();

  // (scroll handled by .sw-page container — no body class needed)

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // kept for registerEmail — derived from email
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);

  const lockMs = useLockout();
  const isLocked = lockMs > 0;
  const inIframe = isInIframe();
  const lockMins = Math.floor(lockMs / 60_000);
  const lockSecs = Math.ceil((lockMs % 60_000) / 1000);

  const isDomainError = error.includes('Authorized Domains') || error.includes('unauthorized-domain') || error.includes('Domain not authorized');

  useEffect(() => { clearError(); setSuccessMsg(''); }, [mode]);

  const inputStyle = (field: string) => ({
    ...S.input,
    borderColor: focusedField === field ? C.pink : C.border,
    background: focusedField === field ? C.inputFoc : C.input,
  });
  const pwStyle = (field: string) => ({
    ...S.inputPw,
    borderColor: focusedField === field ? C.pink : C.border,
    background: focusedField === field ? C.inputFoc : C.input,
  });

  // ── Submit handlers ─────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError(); setSuccessMsg('');
    try {
      await loginEmail(email, password);
      showToast('Welcome back! 🎧', 'success');
    } catch { /* error shown in UI */ }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError(); setSuccessMsg('');
    if (password !== confirmPw) {
      useAuthStore.setState({ error: 'Passwords do not match.' });
      return;
    }
    // Derive a display name from the email (e.g. "john.doe@..." → "John Doe")
    const derivedName = email
      .split('@')[0]
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      .trim() || 'User';
    try {
      await registerEmail(email, password, derivedName);
      setIsNewUser(true);
      showToast(`Welcome to Soundwave! 🎧`, 'success');
    } catch { /* error shown in UI */ }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError(); setSuccessMsg('');
    try {
      await sendPasswordReset(email);
      setSuccessMsg(`Password reset email sent to ${email}. Check your inbox.`);
    } catch (err) {
      useAuthStore.setState({ error: err instanceof Error ? err.message : 'Failed to send reset email.' });
    }
  };

  const handleGoogle = async () => {
    if (isLoading || isLocked) return;
    clearError();
    try {
      await loginGoogle();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
      if (!msg.includes('cancelled')) showToast(msg, 'error');
    }
  };

  const switchMode = (m: AuthMode) => {
    setMode(m); setEmail(''); setPassword(''); setConfirmPw('');
    setSuccessMsg(''); setIsNewUser(false);
  };

  return (
    <>
      <style>{KF}</style>
      <div style={S.page} className="sw-page">
        <div style={S.blob1}/><div style={S.blob2}/>
        <div style={S.grid}/>

        {/* ── Left hero ── */}
        <div className="sw-left" style={S.left}>
          <div style={S.logoRow}>
            <div style={S.logoIcon}><SoundwaveLogo size={30} /></div>
            <span style={S.logoName}>Soundwave</span>
          </div>
          <div style={S.hero} className="sw-hero">
            <div style={S.badge}><div style={S.badgeDot}/> Now streaming millions of tracks</div>
            <h1 style={S.h1}>Your music,<br/><span style={S.accent}>everywhere.</span></h1>
            <p style={S.sub}>Discover trending songs, build playlists, and enjoy music powered by YouTube all in one beautiful interface.</p>
            <div style={S.statsRow} className="sw-stats">
              {[['∞','Songs'],['100%','Free'],['HD','Quality']].map(([n,l]) => (
                <div key={l}><span style={S.statN}>{n}</span><span style={S.statL}>{l}</span></div>
              ))}
            </div>
            <div style={S.pills}>
                {['📈 Trending','💜 Liked Songs','🎧 Playlists','🔀 Smart Shuffle'].map(f => (
                <span key={f} style={S.pill}>{f}</span>
              ))}
            </div>
          </div>
          <p style={S.footer}>© 2026 Soundwave · Built by Soundwave Team</p>
        </div>

        <div className="sw-divider" style={S.divider}/>

        {/* ── Right panel ── */}
        <div style={S.right} className="sw-right">
          <div style={S.box}>
            <div style={{ ...S.card, animation: 'swSlideUp .5s ease' }}>

              {/* Tabs — Sign In / Sign Up */}
              {mode !== 'reset' && (
                <div style={S.tabs}>
                  {(['signin','signup'] as AuthMode[]).map(m => (
                    <button key={m} style={{ ...S.tab, ...(mode === m ? S.tabActive : {}) }}
                      onClick={() => switchMode(m)}>
                      {m === 'signin' ? 'Sign In' : 'Create Account'}
                    </button>
                  ))}
                </div>
              )}

              {/* Title */}
              <h2 style={S.cardTitle}>
                {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : 'Reset password'}
              </h2>
              <p style={S.cardSub}>
                {mode === 'signin' ? 'Sign in to access your music library'
                  : mode === 'signup' ? 'Join Soundwave and start listening'
                  : 'Enter your email and we\'ll send a reset link'}
              </p>

              {/* Iframe warning */}
              {inIframe && (
                <div style={S.iframeBox}>
                  <strong>Open in a new tab</strong> for Google Sign-In to work properly.
                  <br/>
                  <button style={S.openTabBtn} onClick={() => window.open(window.location.href, '_blank')}>
                    Open in New Tab ↗
                  </button>
                </div>
              )}

              {/* Lockout */}
              {isLocked && (
                <div style={S.lockBox}>🔒 Locked for {lockMins > 0 ? `${lockMins}m ` : ''}{lockSecs}s</div>
              )}

              {/* Domain error */}
              {isDomainError && (
                <div style={S.errBox}>
                  🚫 <strong>Domain not authorized in Firebase</strong>{'\n\n'}
                  Firebase Console → Authentication → Settings → Authorized Domains → Add:{'\n'}
                  <code style={{ background: 'rgba(255,255,255,.1)', padding: '2px 6px', borderRadius: 4, userSelect: 'all', fontFamily: 'monospace', fontSize: 12 }}>
                    {window.location.hostname}
                  </code>
                </div>
              )}

              {/* Other errors */}
              {error && !isDomainError && !isLocked && (
                <div style={S.errBox}>{error}</div>
              )}

              {/* Success */}
              {successMsg && <div style={S.successBox}>✅ {successMsg}</div>}

              {/* New user — email verification notice */}
              {isNewUser && (
                <div style={S.verifyNote}>
                  📧 <strong>Verify your email</strong><br/>
                  A verification link was sent to <strong>{email}</strong>. You can use the app now, but please verify your email soon.
                </div>
              )}

              {/* ══ SIGN IN form ══ */}
              {mode === 'signin' && (
                <form onSubmit={handleSignIn} autoComplete="on">
                  <label style={S.label}>Email</label>
                  <div style={S.inputWrap}>
                    <input type="email" name="email" autoComplete="email" required
                      placeholder="you@email.com"
                      value={email} onChange={e => setEmail(e.target.value)}
                      style={inputStyle('email')}
                      onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField('')}
                    />
                  </div>

                  <label style={S.label}>Password</label>
                  <div style={S.inputWrap}>
                    <input type={showPw ? 'text' : 'password'} name="password" autoComplete="current-password" required
                      placeholder="Your password"
                      value={password} onChange={e => setPassword(e.target.value)}
                      style={pwStyle('password')}
                      onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField('')}
                    />
                    <button type="button" style={S.eyeBtn} onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                      <EyeIcon visible={showPw} />
                    </button>
                  </div>

                  <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 20 }}>
                    <button type="button" style={S.forgotBtn} onClick={() => { clearError(); setMode('reset'); setSuccessMsg(''); }}>
                      Forgot password?
                    </button>
                  </div>

                  <button type="submit" style={{ ...S.submitBtn, ...(isLoading || isLocked ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }}
                    disabled={isLoading || isLocked}>
                    {isLoading ? <><Spinner /> Signing in…</> : 'Sign In'}
                  </button>
                </form>
              )}

              {/* ══ SIGN UP form ══ */}
              {mode === 'signup' && (
                <form onSubmit={handleSignUp} autoComplete="on">
                  <label style={S.label}>Email</label>
                  <div style={S.inputWrap}>
                    <input type="email" name="email" autoComplete="email" required
                      placeholder="you@email.com"
                      value={email} onChange={e => setEmail(e.target.value)}
                      style={inputStyle('email')}
                      onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField('')}
                    />
                  </div>

                  <label style={S.label}>Password</label>
                  <div style={S.inputWrap}>
                    <input type={showPw ? 'text' : 'password'} name="password" autoComplete="new-password" required
                      placeholder="Min 8 chars, 1 uppercase, 1 number"
                      value={password} onChange={e => setPassword(e.target.value)}
                      style={pwStyle('password')}
                      onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField('')}
                    />
                    <button type="button" style={S.eyeBtn} onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                      <EyeIcon visible={showPw} />
                    </button>
                    <StrengthBar password={password} />
                  </div>

                  <label style={S.label}>Confirm Password</label>
                  <div style={{ ...S.inputWrap, marginBottom: 24 }}>
                    <input type={showConfirmPw ? 'text' : 'password'} name="confirmPassword" autoComplete="new-password" required
                      placeholder="Repeat your password"
                      value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                      style={{
                        ...pwStyle('confirm'),
                        borderColor: confirmPw && confirmPw !== password ? '#ff4444' : focusedField === 'confirm' ? C.pink : C.border,
                      }}
                      onFocus={() => setFocusedField('confirm')} onBlur={() => setFocusedField('')}
                    />
                    <button type="button" style={S.eyeBtn} onClick={() => setShowConfirmPw(v => !v)} tabIndex={-1}>
                      <EyeIcon visible={showConfirmPw} />
                    </button>
                    {confirmPw && confirmPw !== password && (
                      <span style={{ color: '#ff6b6b', fontSize: 11, marginTop: 4, display: 'block' }}>Passwords don't match</span>
                    )}
                  </div>

                  <button type="submit" style={{ ...S.submitBtn, ...(isLoading ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }}
                    disabled={isLoading}>
                    {isLoading ? <><Spinner /> Creating account…</> : 'Create Account'}
                  </button>
                </form>
              )}

              {/* ══ RESET PASSWORD form ══ */}
              {mode === 'reset' && (
                <form onSubmit={handleReset}>
                  <label style={S.label}>Email Address</label>
                  <div style={{ ...S.inputWrap, marginBottom: 20 }}>
                    <input type="email" required placeholder="you@email.com"
                      value={email} onChange={e => setEmail(e.target.value)}
                      style={inputStyle('email')}
                      onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField('')}
                    />
                  </div>
                  <button type="submit" style={{ ...S.submitBtn, ...(isLoading ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }}
                    disabled={isLoading}>
                    {isLoading ? <><Spinner /> Sending…</> : 'Send Reset Link'}
                  </button>
                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <button type="button" style={{ ...S.forgotBtn, float: 'none' }}
                      onClick={() => switchMode('signin')}>
                      ← Back to Sign In
                    </button>
                  </div>
                </form>
              )}

              {/* Google Sign-In — shown on sign in and sign up */}
              {mode !== 'reset' && ENV.isFirebaseConfigured() && (
                <>
                  <div style={S.orRow}><div style={S.orLine}/><span style={S.orText}>or</span><div style={S.orLine}/></div>
                  <button style={{ ...S.gBtn, ...(isLoading || isLocked ? { opacity: 0.5, cursor: 'not-allowed' } : {}) }}
                    onClick={handleGoogle} disabled={isLoading || isLocked} type="button">
                    <GoogleLogo />
                    {mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
                  </button>
                </>
              )}

              {/* Security badges */}
              <div style={S.secRow}>
                <div style={S.secBadge}><span>🎵</span> Music Streaming</div>
                <span style={{ color: 'rgba(255,255,255,.1)' }}>·</span>
                <div style={S.secBadge}><span>🎶</span> Playlists</div>
                <span style={{ color: 'rgba(255,255,255,.1)' }}>·</span>
                <div style={S.secBadge}><span>🔊</span> Streaming</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
