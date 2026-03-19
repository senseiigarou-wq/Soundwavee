// ============================================================
// SOUNDWAVE — Confirm Dialog
// Beautiful animated bottom-sheet confirmation modal.
// Replaces the browser's native confirm() dialog.
// ============================================================
import React, { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  isOpen:      boolean;
  title:       string;
  message:     string;
  confirmText?: string;
  cancelText?:  string;
  danger?:      boolean;   // true = red confirm button
  icon?:        React.ReactNode;
  onConfirm:   () => void;
  onCancel:    () => void;
}

export function ConfirmDialog({
  isOpen, title, message,
  confirmText = 'Confirm', cancelText = 'Cancel',
  danger = false, icon,
  onConfirm, onCancel,
}: ConfirmDialogProps) {

  const cancelRef = useRef<HTMLButtonElement>(null);

  // Lock body scroll when open, restore when closed
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    setTimeout(() => cancelRef.current?.focus(), 50);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(6px)',
          animation: 'cd-fade 0.18s ease',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 301,
        background: '#181818',
        borderRadius: '24px 24px 0 0',
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '0 0 max(28px, env(safe-area-inset-bottom))',
        animation: 'cd-slide 0.26s cubic-bezier(0.16,1,0.3,1)',
        boxShadow: '0 -8px 48px rgba(0,0,0,0.6)',
        maxWidth: 520,
        margin: '0 auto',
      }}>

        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Icon */}
        {icon && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: danger ? 'rgba(255,80,80,0.12)' : 'rgba(255,255,255,0.06)',
              border: `1.5px solid ${danger ? 'rgba(255,80,80,0.25)' : 'rgba(255,255,255,0.1)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: danger ? '#ff6b6b' : 'var(--text-muted)',
            }}>
              {icon}
            </div>
          </div>
        )}

        {/* Text */}
        <div style={{ padding: icon ? '16px 24px 8px' : '24px 24px 8px', textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-0.3px' }}>
            {title}
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {message}
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={onConfirm}
            style={{
              width: '100%', padding: '15px',
              borderRadius: 16, border: 'none',
              background: danger
                ? 'linear-gradient(135deg, #ff4444, #cc2222)'
                : 'linear-gradient(135deg, #FF6B9D, #E05587)',
              color: '#fff', fontWeight: 700, fontSize: 15,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: danger
                ? '0 4px 20px rgba(255,68,68,0.35)'
                : '0 4px 20px rgba(255,107,157,0.35)',
              transition: 'transform 0.1s, opacity 0.1s',
            }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {confirmText}
          </button>
          <button
            ref={cancelRef}
            onClick={onCancel}
            style={{
              width: '100%', padding: '15px',
              borderRadius: 16,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text)', fontWeight: 600, fontSize: 15,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
          >
            {cancelText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes cd-fade  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes cd-slide { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </>
  );
}
