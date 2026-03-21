// ============================================================
// SOUNDWAVE — App Update Banner
// Shows a subtle bottom banner when a new version is available
// ============================================================
import React from 'react';
import { RefreshCw, X } from 'lucide-react';

interface UpdateBannerProps {
  onUpdate: () => void;
  onDismiss: () => void;
}

export function UpdateBanner({ onUpdate, onDismiss }: UpdateBannerProps) {
  return (
    <>
      <div style={{
        position: 'fixed',
        bottom: 'calc(var(--nav-h, 60px) + env(safe-area-inset-bottom) + 8px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
        border: '1px solid rgba(126,208,236,0.3)',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(126,208,236,0.1)',
        minWidth: 280,
        maxWidth: 'calc(100vw - 32px)',
        animation: 'ub-slide 0.4s cubic-bezier(0.16,1,0.3,1)',
        backdropFilter: 'blur(20px)',
      }}>
        {/* Icon */}
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: 'rgba(126,208,236,0.12)',
          border: '1px solid rgba(126,208,236,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <RefreshCw size={16} color="#7ed0ec" style={{ animation: 'ub-spin 2s linear infinite' }} />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 1 }}>
            New version available
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
            Tap update to get the latest features
          </div>
        </div>

        {/* Update button */}
        <button
          onClick={onUpdate}
          style={{
            padding: '7px 14px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #7ed0ec, #5ab8d8)',
            color: '#000', fontWeight: 700, fontSize: 12,
            cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
            transition: 'transform 0.15s, opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          Update
        </button>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          style={{
            width: 28, height: 28, borderRadius: 8, border: 'none',
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'background 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
        >
          <X size={14} />
        </button>
      </div>

      <style>{`
        @keyframes ub-slide {
          from { transform: translateX(-50%) translateY(20px); opacity: 0; }
          to   { transform: translateX(-50%) translateY(0);    opacity: 1; }
        }
        @keyframes ub-spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}