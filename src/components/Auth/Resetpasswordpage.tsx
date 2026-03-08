// ============================================================
// SOUNDWAVE — Custom Password Reset Page
// Handles Firebase ?mode=resetPassword&oobCode=... URLs
// Matches the exact Soundwave dark aesthetic
// ============================================================
import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowRight, Loader } from 'lucide-react';
import { verifyResetCode, confirmPasswordResetWithCode } from '@/services/authservice';
import { SoundwaveLogo } from '@/components/common/Soundwavelogo';

type Stage = 'verifying' | 'ready' | 'success' | 'expired' | 'error';

interface ResetPasswordPageProps {
  oobCode: string;
}

function Bar({ password }: { password: string }) {
  const checks = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^a-zA-Z0-9]/.test(password)];
  const score = checks.filter(Boolean).length;
  const colors = ['', '#ff4444', '#ffaa00', '#88cc00', '#1ED760'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {checks.map((ok, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < score ? colors[score] : 'rgba(255,255,255,0.1)', transition: 'all 0.3s' }} />
        ))}
      </div>
      <span style={{ fontSize: 11, color: colors[score], fontWeight: 600 }}>{labels[score]}</span>
    </div>
  );
}

export function ResetPasswordPage({ oobCode }: ResetPasswordPageProps) {
  const [stage, setStage]   = useState<Stage>('verifying');
  const [email, setEmail]   = useState('');
  const [pw, setPw]         = useState('');
  const [conf, setConf]     = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);

  // Verify the code on mount
  useEffect(() => {
    if (!oobCode) { setStage('expired'); return; }
    verifyResetCode(oobCode)
      .then(em => { setEmail(em); setStage('ready'); })
      .catch(() => setStage('expired'));
  }, [oobCode]);

  const handleSubmit = async () => {
    setError('');
    if (!pw)             { setError('Enter a new password.'); return; }
    if (pw !== conf)     { setError('Passwords do not match.'); return; }
    if (pw.length < 8)   { setError('Password must be at least 8 characters.'); return; }
    if (!/[A-Z]/.test(pw)) { setError('Must include at least one uppercase letter.'); return; }
    if (!/[0-9]/.test(pw)) { setError('Must include at least one number.'); return; }
    setSaving(true);
    try {
      await confirmPasswordResetWithCode(oobCode, pw);
      setStage('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed. The link may have expired.');
      setSaving(false);
    }
  };

  const inputBase: React.CSSProperties = {
    width: '100%', padding: '13px 44px 13px 44px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, color: '#fff', fontSize: 15,
    fontFamily: "'DM Sans', -apple-system, sans-serif",
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', -apple-system, sans-serif",
      position: 'relative', overflow: 'hidden', padding: '20px 16px',
    }}>
      {/* Background blobs */}
      <div style={{ position: 'absolute', top: -150, left: -150, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,107,157,.18) 0%,transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(224,85,135,.12) 0%,transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      {/* Grid */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px)', backgroundSize: '64px 64px', pointerEvents: 'none' }} />

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 420, position: 'relative', zIndex: 1,
        animation: 'sw-rp-up 0.4s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, justifyContent: 'center' }}>
          <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SoundwaveLogo size={44} withBackground={true} />
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>Soundwave</span>
        </div>

        <div style={{ background: 'rgba(18,18,18,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '36px 32px', backdropFilter: 'blur(24px)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>

          {/* ── Verifying ── */}
          {stage === 'verifying' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,107,157,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Loader size={24} color="var(--pink,#FF6B9D)" style={{ animation: 'sw-rp-spin 1s linear infinite' }} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Verifying your link…</div>
              <div style={{ fontSize: 13, color: '#535353' }}>Just a moment</div>
            </div>
          )}

          {/* ── Expired / invalid ── */}
          {(stage === 'expired' || stage === 'error') && (
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,60,60,0.1)', border: '1px solid rgba(255,60,60,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <AlertCircle size={28} color="#ff6b6b" />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.4px', marginBottom: 10 }}>Link Expired</div>
              <div style={{ fontSize: 14, color: '#b3b3b3', lineHeight: 1.6, marginBottom: 28 }}>
                This password reset link has expired or already been used. Request a new one from the sign-in page.
              </div>
              <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 14, background: 'linear-gradient(135deg,#FF6B9D,#E05587)', color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 4px 20px rgba(255,107,157,0.35)' }}>
                Back to Sign In <ArrowRight size={16} />
              </a>
            </div>
          )}

          {/* ── Ready — show form ── */}
          {stage === 'ready' && (
            <>
              {/* Header */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,107,157,0.1)', border: '1px solid rgba(255,107,157,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  <Lock size={22} color="#FF6B9D" />
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: 8 }}>
                  Reset your password
                </div>
                <div style={{ fontSize: 14, color: '#b3b3b3', lineHeight: 1.5 }}>
                  Creating a new password for<br />
                  <span style={{ color: '#FF6B9D', fontWeight: 600 }}>{email}</span>
                </div>
              </div>

              {/* New password */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#535353', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} color="#535353" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={pw} onChange={e => setPw(e.target.value)}
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    style={inputBase}
                    onFocus={e => (e.target.style.borderColor = '#FF6B9D')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  />
                  <button onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#535353', padding: 4 }}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <Bar password={pw} />
              </div>

              {/* Confirm password */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#535353', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} color="#535353" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    type={showConf ? 'text' : 'password'}
                    value={conf} onChange={e => setConf(e.target.value)}
                    placeholder="Repeat your password"
                    style={{ ...inputBase, borderColor: conf && pw !== conf ? '#ff4444' : conf && pw === conf ? '#1ED760' : 'rgba(255,255,255,0.1)' }}
                    onFocus={e => { if (!conf || pw === conf) e.target.style.borderColor = '#FF6B9D'; }}
                    onBlur={e => { e.target.style.borderColor = conf && pw !== conf ? '#ff4444' : conf && pw === conf ? '#1ED760' : 'rgba(255,255,255,0.1)'; }}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  />
                  <button onClick={() => setShowConf(v => !v)} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#535353', padding: 4 }}>
                    {showConf ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {conf && pw !== conf && (
                  <div style={{ fontSize: 12, color: '#ff6b6b', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <AlertCircle size={12} /> Passwords don't match
                  </div>
                )}
                {conf && pw === conf && pw && (
                  <div style={{ fontSize: 12, color: '#1ED760', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <CheckCircle size={12} /> Passwords match
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div style={{ marginBottom: 16, padding: '11px 14px', borderRadius: 10, background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)', color: '#ff6b6b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={saving}
                style={{
                  width: '100%', padding: '15px', borderRadius: 14,
                  background: 'linear-gradient(135deg,#FF6B9D,#E05587)',
                  border: 'none', color: '#fff', fontWeight: 700, fontSize: 15,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: '0 4px 24px rgba(255,107,157,0.4)',
                  transition: 'all 0.2s', opacity: saving ? 0.7 : 1,
                }}
                onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 32px rgba(255,107,157,0.6)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 24px rgba(255,107,157,0.4)'; }}
              >
                {saving
                  ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'sw-rp-spin 0.7s linear infinite' }} /> Saving…</>
                  : <><Lock size={16} /> Set New Password</>}
              </button>

              <div style={{ textAlign: 'center', marginTop: 18 }}>
                <a href="/" style={{ fontSize: 13, color: '#535353', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => ((e.target as HTMLElement).style.color = '#FF6B9D')}
                  onMouseLeave={e => ((e.target as HTMLElement).style.color = '#535353')}
                >← Back to Sign In</a>
              </div>
            </>
          )}

          {/* ── Success ── */}
          {stage === 'success' && (
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(30,215,96,0.1)', border: '1px solid rgba(30,215,96,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', animation: 'sw-rp-pop 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
                <CheckCircle size={32} color="#1ED760" />
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: 10 }}>
                Password Updated!
              </div>
              <div style={{ fontSize: 14, color: '#b3b3b3', lineHeight: 1.6, marginBottom: 28 }}>
                Your password has been reset successfully.<br />You can now sign in with your new password.
              </div>
              <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 14, background: 'linear-gradient(135deg,#FF6B9D,#E05587)', color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 4px 20px rgba(255,107,157,0.4)' }}>
                Sign In Now <ArrowRight size={16} />
              </a>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 20, color: '#2a2a2a', fontSize: 11 }}>
          🔒 Secured by Firebase Authentication
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes sw-rp-up   { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes sw-rp-spin { to { transform:rotate(360deg); } }
        @keyframes sw-rp-pop  { 0%{transform:scale(0.6);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        input::placeholder { color: #535353; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 30px #1a1a1a inset !important; -webkit-text-fill-color: #fff !important; }
      `}</style>
    </div>
  );
}