// ============================================================
// SOUNDWAVE — Appearance Settings
// ============================================================
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sun, Moon, Monitor, Type, Zap } from 'lucide-react';
import { useToast } from '@/components/common/Toast';
import { SoundwaveLogo } from '@/components/common/Soundwavelogo';

interface AppearanceViewProps { onBack: () => void; }

const STORAGE_KEY = 'sw_appearance';

type ThemeMode = 'dark' | 'light' | 'system';
type FontSize  = 'small' | 'medium' | 'large';

interface AppearanceSettings {
  theme:      ThemeMode;
  fontSize:   FontSize;
  animations: boolean;
  compactMode: boolean;
}

const DEFAULTS: AppearanceSettings = {
  theme: 'dark', fontSize: 'medium', animations: true, compactMode: false,
};

function load(): AppearanceSettings {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') }; }
  catch { return DEFAULTS; }
}

function applyTheme(theme: ThemeMode) {
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const root = document.documentElement;
  if (isDark) {
    root.style.setProperty('--bg',           '#000000');
    root.style.setProperty('--bg-elevated',  '#121212');
    root.style.setProperty('--bg-highlight', '#1a1a1a');
    root.style.setProperty('--bg-card',      '#181818');
    root.style.setProperty('--bg-hover',     '#282828');
    root.style.setProperty('--text',         '#ffffff');
    root.style.setProperty('--text-sub',     '#b3b3b3');
    root.style.setProperty('--text-muted',   '#535353');
    root.style.setProperty('--border',       'rgba(255,255,255,0.07)');
  } else {
    root.style.setProperty('--bg',           '#f0f0f0');
    root.style.setProperty('--bg-elevated',  '#e4e4e4');
    root.style.setProperty('--bg-highlight', '#d8d8d8');
    root.style.setProperty('--bg-card',      '#e8e8e8');
    root.style.setProperty('--bg-hover',     '#d0d0d0');
    root.style.setProperty('--text',         '#0a0a0a');
    root.style.setProperty('--text-sub',     '#444444');
    root.style.setProperty('--text-muted',   '#888888');
    root.style.setProperty('--border',       'rgba(0,0,0,0.08)');
  }
}

function applyFontSize(size: FontSize) {
  const map = { small: '13px', medium: '15px', large: '17px' };
  document.documentElement.style.fontSize = map[size];
}

function applyAnimations(on: boolean) {
  document.documentElement.style.setProperty('--transition', on ? '0.2s ease' : '0s');
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} style={{
      width: 46, height: 26, borderRadius: 13, flexShrink: 0,
      background: on ? 'var(--pink)' : 'rgba(255,255,255,0.12)',
      border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.25s',
    }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
    </button>
  );
}

export function AppearanceView({ onBack }: AppearanceViewProps) {
  const [s, setS] = useState<AppearanceSettings>(load);
  const { showToast } = useToast();

  // Apply on mount
  useEffect(() => { applyTheme(s.theme); applyFontSize(s.fontSize); applyAnimations(s.animations); }, []);

  const update = <K extends keyof AppearanceSettings>(key: K, val: AppearanceSettings[K]) => {
    setS(prev => {
      const next = { ...prev, [key]: val };
      if (key === 'theme')      applyTheme(val as ThemeMode);
      if (key === 'fontSize')   applyFontSize(val as FontSize);
      if (key === 'animations') applyAnimations(val as boolean);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const themes: { id: ThemeMode; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'dark',   label: 'Dark',   icon: <Moon size={18} />,    desc: 'Easy on the eyes at night' },
    { id: 'light',  label: 'Light',  icon: <Sun size={18} />,     desc: 'Bright and crisp' },
    { id: 'system', label: 'System', icon: <Monitor size={18} />, desc: 'Follows your device setting' },
  ];

  const fontSizes: { id: FontSize; label: string; preview: string }[] = [
    { id: 'small',  label: 'Small',  preview: 'Aa' },
    { id: 'medium', label: 'Medium', preview: 'Aa' },
    { id: 'large',  label: 'Large',  preview: 'Aa' },
  ];

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text)', flexShrink: 0 }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>Appearance</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Customize how Soundwave looks</div>
        </div>
      </div>

      {/* Theme */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>Theme</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {themes.map(t => (
            <button key={t.id} onClick={() => update('theme', t.id)} style={{
              padding: '16px 10px', borderRadius: 14, border: `2px solid ${s.theme === t.id ? 'var(--pink)' : 'rgba(255,255,255,0.07)'}`,
              background: s.theme === t.id ? 'rgba(255,107,157,0.1)' : 'var(--bg-card)',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              boxShadow: s.theme === t.id ? '0 0 16px rgba(255,107,157,0.2)' : 'none',
            }}>
              <span style={{ color: s.theme === t.id ? 'var(--pink)' : 'var(--text-muted)' }}>{t.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: s.theme === t.id ? 'var(--pink)' : 'var(--text)' }}>{t.label}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.3 }}>{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Font size */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Type size={12} /> Text Size</div>
        </div>
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', display: 'flex' }}>
          {fontSizes.map((f, i) => (
            <button key={f.id} onClick={() => update('fontSize', f.id)} style={{
              flex: 1, padding: '16px 8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: s.fontSize === f.id ? 'rgba(255,107,157,0.12)' : 'transparent',
              borderRight: i < fontSizes.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              transition: 'background 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            }}>
              <span style={{
                fontSize: f.id === 'small' ? 14 : f.id === 'medium' ? 18 : 24,
                fontWeight: 700,
                color: s.fontSize === f.id ? 'var(--pink)' : 'var(--text-sub)',
                transition: 'all 0.2s',
              }}>{f.preview}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: s.fontSize === f.id ? 'var(--pink)' : 'var(--text-muted)' }}>{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>Display</div>
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { key: 'animations' as const, icon: <Zap size={16} color="var(--pink)" />, label: 'UI Animations', sub: 'Smooth transitions and effects' },
            { key: 'compactMode' as const, icon: <Type size={16} color="var(--pink)" />, label: 'Compact Mode', sub: 'Tighter spacing to see more content' },
          ].map((row, i, arr) => (
            <div key={row.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,107,157,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{row.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{row.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{row.sub}</div>
                </div>
              </div>
              <Toggle on={s[row.key] as boolean} onToggle={() => update(row.key, !s[row.key] as any)} />
            </div>
          ))}
        </div>
      </div>

      {/* Preview card */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '16px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Preview</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#0d1b2e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><SoundwaveLogo size={32} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Sample Song Title</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Artist Name</div>
          </div>
        </div>
      </div>

      <button onClick={() => { showToast('Appearance settings applied ✓', 'success'); setTimeout(onBack, 600); }} style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg,#FF6B9D,#E05587)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(255,107,157,0.35)' }}>
        Save Appearance
      </button>
    </div>
  );
}