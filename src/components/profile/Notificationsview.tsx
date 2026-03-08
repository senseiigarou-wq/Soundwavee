// ============================================================
// SOUNDWAVE — Notifications Settings
// ============================================================
import { useState } from 'react';
import { ArrowLeft, Bell, BellOff } from 'lucide-react';
import { useToast } from '@/components/common/Toast';

interface NotificationsViewProps { onBack: () => void; }

const STORAGE_KEY = 'sw_notifications';

interface NotifSettings {
  allEnabled:        boolean;
  recommendations:   boolean;
  playlistUpdates:   boolean;
  friendActivity:    boolean;
  promotionalEmails: boolean;
  newReleases:       boolean;
  weeklyDigest:      boolean;
}

const DEFAULTS: NotifSettings = {
  allEnabled: true, recommendations: true, playlistUpdates: true,
  friendActivity: false, promotionalEmails: false,
  newReleases: true, weeklyDigest: true,
};

function load(): NotifSettings {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') }; }
  catch { return DEFAULTS; }
}

function Toggle({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button onClick={disabled ? undefined : onToggle} style={{
      width: 46, height: 26, borderRadius: 13, flexShrink: 0,
      background: on ? 'var(--pink)' : 'rgba(255,255,255,0.12)',
      border: 'none', cursor: disabled ? 'default' : 'pointer',
      position: 'relative', transition: 'background 0.25s',
      opacity: disabled ? 0.4 : 1,
    }}>
      <span style={{
        position: 'absolute', top: 3,
        left: on ? 23 : 3,
        width: 20, height: 20, borderRadius: '50%',
        background: '#fff', transition: 'left 0.25s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </button>
  );
}

interface RowProps {
  label: string; sub: string;
  value: boolean; onChange: () => void; disabled?: boolean;
}
function Row({ label, sub, value, onChange, disabled }: RowProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: disabled ? 'var(--text-muted)' : 'var(--text)' }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
      </div>
      <Toggle on={value} onToggle={onChange} disabled={disabled} />
    </div>
  );
}

export function NotificationsView({ onBack }: NotificationsViewProps) {
  const [s, setS] = useState<NotifSettings>(load);
  const { showToast } = useToast();

  const update = (key: keyof NotifSettings, val?: boolean) => {
    setS(prev => {
      const next = { ...prev, [key]: val ?? !prev[key] };
      // "all off" cascade
      if (key === 'allEnabled' && !next.allEnabled) {
        Object.keys(next).forEach(k => { if (k !== 'allEnabled') (next as any)[k] = false; });
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    showToast('Notification preferences saved ✓', 'success');
    setTimeout(onBack, 600);
  };

  const disabled = !s.allEnabled;

  const sections = [
    {
      title: 'Music',
      rows: [
        { key: 'recommendations',   label: 'Song Recommendations',  sub: 'New songs picked for you based on your taste' },
        { key: 'newReleases',       label: 'New Releases',          sub: 'When artists you follow drop new music' },
        { key: 'playlistUpdates',   label: 'Playlist Updates',      sub: 'Changes to playlists you follow or created' },
        { key: 'weeklyDigest',      label: 'Weekly Digest',         sub: 'A summary of your listening activity' },
      ],
    },
    {
      title: 'Social',
      rows: [
        { key: 'friendActivity',    label: 'Friend Activity',       sub: 'When friends listen or share music' },
      ],
    },
    {
      title: 'Emails',
      rows: [
        { key: 'promotionalEmails', label: 'Promotional Emails',    sub: 'Deals, offers and product news from Soundwave' },
      ],
    },
  ];

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text)', flexShrink: 0 }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>Notifications</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Control what alerts you receive</div>
        </div>
      </div>

      {/* Master toggle */}
      <div style={{ background: s.allEnabled ? 'rgba(255,107,157,0.08)' : 'var(--bg-card)', border: `1px solid ${s.allEnabled ? 'rgba(255,107,157,0.25)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 16, marginBottom: 20, overflow: 'hidden', transition: 'all 0.3s' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: s.allEnabled ? 'rgba(255,107,157,0.15)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
              {s.allEnabled ? <Bell size={18} color="var(--pink)" /> : <BellOff size={18} color="var(--text-muted)" />}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>All Notifications</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.allEnabled ? 'Notifications are on' : 'All notifications paused'}</div>
            </div>
          </div>
          <Toggle on={s.allEnabled} onToggle={() => update('allEnabled')} />
        </div>
      </div>

      {/* Per-category sections */}
      {sections.map(sec => (
        <div key={sec.title} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 }}>
            {sec.title}
          </div>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
            {sec.rows.map((r, i) => (
              <div key={r.key} style={{ borderBottom: i < sec.rows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <Row
                  label={r.label} sub={r.sub}
                  value={(s as any)[r.key]}
                  onChange={() => update(r.key as keyof NotifSettings)}
                  disabled={disabled}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Save */}
      <button onClick={handleSave} style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg,#FF6B9D,#E05587)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8, boxShadow: '0 4px 20px rgba(255,107,157,0.35)' }}>
        Save Preferences
      </button>
    </div>
  );
}