// ============================================================
// SOUNDWAVE — PWA Install Banner
// Works on: Android Chrome, Samsung Internet, Edge, Desktop Chrome/Edge
// iOS Safari: shows manual "Add to Home Screen" instructions
// ============================================================
import React, { useState, useEffect } from 'react';
import { X, Download, Share, Plus } from 'lucide-react';
import { SoundwaveLogo } from '@/components/common/Soundwavelogo';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'sw_pwa_dismissed';
const INSTALL_KEY   = 'sw_pwa_installed';

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}
function isInStandaloneMode() {
  return ('standalone' in window.navigator && (window.navigator as any).standalone) ||
    window.matchMedia('(display-mode: standalone)').matches;
}
function wasDismissedRecently() {
  const ts = localStorage.getItem(DISMISSED_KEY);
  if (!ts) return false;
  return Date.now() - Number(ts) < 1000 * 60 * 60 * 24 * 3; // 3 days
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner]         = useState(false);
  const [showIOS, setShowIOS]               = useState(false);
  const [installing, setInstalling]         = useState(false);
  const [installed, setInstalled]           = useState(false);

  useEffect(() => {
    // Already installed or dismissed recently → hide
    if (isInStandaloneMode()) return;
    if (localStorage.getItem(INSTALL_KEY)) return;
    if (wasDismissedRecently()) return;

    if (isIOS()) {
      // Show iOS instructions after a short delay
      const t = setTimeout(() => setShowIOS(true), 3000);
      return () => clearTimeout(t);
    }

    // Android / Desktop Chrome / Edge
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 3000);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Detect successful install
    window.addEventListener('appinstalled', () => {
      localStorage.setItem(INSTALL_KEY, '1');
      setInstalled(true);
      setShowBanner(false);
      setTimeout(() => setInstalled(false), 3000);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setShowBanner(false);
    setShowIOS(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setInstalling(false);
    if (outcome === 'accepted') {
      setShowBanner(false);
      localStorage.setItem(INSTALL_KEY, '1');
    } else {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  // ── Installed toast ──────────────────────────────────────
  if (installed) return (
    <div style={{
      position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
      background: '#1ED760', color: '#000', padding: '12px 20px', borderRadius: 12,
      fontSize: 14, fontWeight: 700, zIndex: 9999, boxShadow: '0 8px 24px rgba(30,215,96,0.4)',
      animation: 'sw-install-pop 0.3s cubic-bezier(0.16,1,0.3,1)',
      whiteSpace: 'nowrap',
    }}>
      ✓ Soundwave installed!
    </div>
  );

  // ── Android / Desktop banner ─────────────────────────────
  if (showBanner) return (
    <div style={{
      position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
      width: 'min(400px, calc(100vw - 32px))',
      background: 'rgba(18,18,18,0.98)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 20,
      padding: '16px 16px 16px 16px',
      zIndex: 9999,
      boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
      backdropFilter: 'blur(24px)',
      animation: 'sw-install-up 0.35s cubic-bezier(0.16,1,0.3,1)',
      fontFamily: "'DM Sans', -apple-system, sans-serif",
    }}>
      {/* Dismiss */}
      <button onClick={dismiss} style={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', color: '#b3b3b3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <X size={14} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, overflow: 'hidden', flexShrink: 0 }}>
          <SoundwaveLogo size={52} withBackground={true} />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>Install Soundwave</div>
          <div style={{ fontSize: 12, color: '#b3b3b3', marginTop: 2 }}>Add to your home screen for the best experience</div>
        </div>
      </div>

      {/* Feature pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {['Works offline', 'No browser bar', 'Instant launch', 'Fullscreen'].map(f => (
          <span key={f} style={{ fontSize: 11, fontWeight: 600, color: '#7ed0ec', background: 'rgba(126,208,236,0.1)', border: '1px solid rgba(126,208,236,0.2)', padding: '3px 9px', borderRadius: 20 }}>
            {f}
          </span>
        ))}
      </div>

      <button
        onClick={handleInstall}
        disabled={installing}
        style={{
          width: '100%', padding: '13px', borderRadius: 14,
          background: 'linear-gradient(135deg, #7ed0ec, #16ADE1)',
          border: 'none', color: '#fff', fontWeight: 700, fontSize: 15,
          cursor: installing ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 8, opacity: installing ? 0.7 : 1,
          boxShadow: '0 4px 20px rgba(22,173,225,0.4)',
          transition: 'opacity 0.2s',
        }}
      >
        {installing
          ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'sw-install-spin 0.7s linear infinite' }} /> Installing…</>
          : <><Download size={17} /> Install App</>}
      </button>
      <style>{`
        @keyframes sw-install-up   { from{opacity:0;transform:translateX(-50%) translateY(20px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes sw-install-pop  { from{opacity:0;transform:translateX(-50%) scale(0.8)} to{opacity:1;transform:translateX(-50%) scale(1)} }
        @keyframes sw-install-spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );

  // ── iOS Safari instructions ──────────────────────────────
  if (showIOS) return (
    <div style={{
      position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
      width: 'min(360px, calc(100vw - 32px))',
      background: 'rgba(18,18,18,0.98)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 20,
      padding: '18px 18px 20px',
      zIndex: 9999,
      boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
      backdropFilter: 'blur(24px)',
      animation: 'sw-install-up 0.35s cubic-bezier(0.16,1,0.3,1)',
      fontFamily: "'DM Sans', -apple-system, sans-serif",
    }}>
      {/* Arrow pointing down to Safari toolbar */}
      <div style={{ position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '10px solid rgba(18,18,18,0.98)' }} />

      <button onClick={dismiss} style={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', color: '#b3b3b3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <X size={14} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
          <SoundwaveLogo size={44} withBackground={true} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Install Soundwave</div>
          <div style={{ fontSize: 12, color: '#b3b3b3', marginTop: 1 }}>Add to your iPhone home screen</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { num: 1, icon: <Share size={16} color="#7ed0ec" />, text: <>Tap the <strong style={{ color: '#7ed0ec' }}>Share</strong> button <span style={{ fontSize: 16 }}>⬆️</span> at the bottom of Safari</> },
          { num: 2, icon: <Plus size={16} color="#7ed0ec" />, text: <>Scroll down and tap <strong style={{ color: '#7ed0ec' }}>"Add to Home Screen"</strong></> },
          { num: 3, icon: <span style={{ fontSize: 14 }}>✓</span>, text: <>Tap <strong style={{ color: '#7ed0ec' }}>"Add"</strong> in the top right — done!</> },
        ].map(({ num, icon, text }) => (
          <div key={num} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(126,208,236,0.12)', border: '1px solid rgba(126,208,236,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#7ed0ec', fontWeight: 700, fontSize: 12 }}>
              {num}
            </div>
            <div style={{ fontSize: 13, color: '#e0e0e0', lineHeight: 1.4 }}>{text}</div>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes sw-install-up { from{opacity:0;transform:translateX(-50%) translateY(20px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
      `}</style>
    </div>
  );

  return null;
}