import { useState } from 'react';
import { X, Music, ListMusic } from 'lucide-react';

interface ShareModalProps {
  type:        'song' | 'playlist';
  title:       string;
  artist?:     string;
  cover?:      string;
  token?:      string;
  youtubeId?:  string;
  onClose:     () => void;
}

const BASE = 'https://soundwavee.pages.dev';

// Platform share configs
const platforms = [
  {
    id: 'facebook',
    label: 'Facebook',
    color: '#1877F2',
    bg: 'rgba(24,119,242,0.12)',
    border: 'rgba(24,119,242,0.3)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    getUrl: (url: string, text: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
  },
  {
    id: 'twitter',
    label: 'X (Twitter)',
    color: '#fff',
    bg: 'rgba(255,255,255,0.08)',
    border: 'rgba(255,255,255,0.2)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    getUrl: (url: string, text: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    color: '#25D366',
    bg: 'rgba(37,211,102,0.12)',
    border: 'rgba(37,211,102,0.3)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    getUrl: (url: string, text: string) =>
      `https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`,
  },
  {
    id: 'instagram',
    label: 'Instagram',
    color: '#E1306C',
    bg: 'rgba(225,48,108,0.12)',
    border: 'rgba(225,48,108,0.3)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
    // Instagram doesn't support direct link sharing — copy link instead
    getUrl: null as null | ((url: string, text: string) => string),
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    color: '#fff',
    bg: 'rgba(255,255,255,0.06)',
    border: 'rgba(255,255,255,0.15)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.77 1.52V6.76a4.85 4.85 0 01-1-.07z"/>
      </svg>
    ),
    // TikTok doesn't support direct link sharing — copy link instead
    getUrl: null as null | ((url: string, text: string) => string),
  },
];

export function ShareModal({ type, title, artist, cover, token, youtubeId, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [copiedFor, setCopiedFor] = useState<string | null>(null);

  const shareUrl = type === 'playlist'
    ? `${BASE}/playlist/${token}`
    : `${BASE}/song/${youtubeId}`;

  const shareText = type === 'song'
    ? `🎵 Listen to "${title}" by ${artist} on Soundwave`
    : `🎶 Check out the playlist "${title}" on Soundwave`;

  const copyToClipboard = async () => {
    try { await navigator.clipboard.writeText(shareUrl); }
    catch {
      const el = document.createElement('textarea');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
  };

  const handleCopy = async () => {
    await copyToClipboard();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlatform = async (platform: typeof platforms[0]) => {
    if (platform.getUrl) {
      // Direct share URL — open in new tab
      window.open(platform.getUrl(shareUrl, shareText), '_blank', 'noopener,noreferrer,width=600,height=600');
    } else {
      // Instagram / TikTok — copy link and show hint
      await copyToClipboard();
      setCopiedFor(platform.id);
      setTimeout(() => setCopiedFor(null), 3000);
    }
  };

  const nativeShare = async () => {
    if (!navigator.share) return;
    await navigator.share({ title: `${title} on Soundwave`, text: shareText, url: shareUrl });
  };

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:400, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)' }} />
      <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:401, background:'#181818', borderRadius:'24px 24px 0 0', border:'1px solid rgba(255,255,255,0.08)', paddingBottom:`max(28px, env(safe-area-inset-bottom))`, animation:'sm-slide 0.28s cubic-bezier(0.16,1,0.3,1)', maxWidth:540, margin:'0 auto' }}>

        {/* Handle */}
        <div style={{ display:'flex', justifyContent:'center', padding:'14px 0 0' }}>
          <div style={{ width:36, height:4, borderRadius:2, background:'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px 12px' }}>
          <div style={{ fontSize:17, fontWeight:800, color:'#fff' }}>Share</div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, background:'rgba(255,255,255,0.07)', border:'none', color:'rgba(255,255,255,0.6)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={16} />
          </button>
        </div>

        {/* Preview */}
        <div style={{ margin:'0 20px 20px', padding:'14px', borderRadius:16, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:52, height:52, borderRadius:10, overflow:'hidden', background:'#1a1a2a', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
            {cover
              ? <img src={cover} alt={title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : type === 'song' ? <Music size={22} color="var(--pink)" /> : <ListMusic size={22} color="var(--pink)" />
            }
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{title}</div>
            {artist && <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginTop:2 }}>{artist}</div>}
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.25)', marginTop:3 }}>soundwavee.pages.dev</div>
          </div>
        </div>

        {/* Platform buttons */}
        <div style={{ padding:'0 20px 16px' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.4)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:12 }}>Share to</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
            {platforms.map(p => (
              <button key={p.id} onClick={() => handlePlatform(p)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, padding:'10px 4px', borderRadius:14, background: copiedFor===p.id ? 'rgba(29,185,84,0.15)' : p.bg, border:`1px solid ${copiedFor===p.id ? 'rgba(29,185,84,0.4)' : p.border}`, cursor:'pointer', transition:'all 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <span style={{ color: copiedFor===p.id ? '#1DB954' : p.color }}>
                  {copiedFor===p.id
                    ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1DB954" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    : p.icon
                  }
                </span>
                <span style={{ fontSize:9, fontWeight:700, color: copiedFor===p.id ? '#1DB954' : 'rgba(255,255,255,0.5)', textAlign:'center', lineHeight:1.2 }}>
                  {copiedFor===p.id ? 'Copied!' : p.label}
                </span>
              </button>
            ))}
          </div>

          {/* Hint for Instagram/TikTok */}
          {copiedFor && (
            <div style={{ marginTop:10, padding:'8px 12px', borderRadius:10, background:'rgba(29,185,84,0.08)', border:'1px solid rgba(29,185,84,0.2)', fontSize:12, color:'rgba(255,255,255,0.6)', textAlign:'center' }}>
              Link copied! Open {copiedFor === 'instagram' ? 'Instagram' : 'TikTok'} and paste in your bio or story 🔗
            </div>
          )}
        </div>

        {/* Copy link */}
        <div style={{ padding:'0 20px 0' }}>
          <div style={{ display:'flex', gap:8, alignItems:'center', padding:'12px 14px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12 }}>
            <div style={{ flex:1, fontSize:12, color:'rgba(255,255,255,0.5)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:'monospace' }}>{shareUrl}</div>
            <button onClick={handleCopy} style={{ padding:'6px 14px', borderRadius:8, border:'none', cursor:'pointer', background: copied ? 'rgba(29,185,84,0.2)' : 'rgba(255,107,157,0.15)', color: copied ? '#1DB954' : 'var(--pink)', fontWeight:700, fontSize:12, fontFamily:'inherit', display:'flex', alignItems:'center', gap:5, flexShrink:0, transition:'all 0.2s' }}>
              {copied
                ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Copied!</>
                : <><Copy16 /> Copy</>
              }
            </button>
          </div>
        </div>

        {/* Native share */}
        {Boolean(navigator.share) && (
          <div style={{ padding:'12px 20px 0' }}>
            <button onClick={nativeShare} style={{ width:'100%', padding:'13px', borderRadius:14, border:'none', background:'linear-gradient(135deg,#FF6B9D,#E05587)', color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 4px 20px rgba(255,107,157,0.3)' }}>
              <MoreShare /> More options…
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes sm-slide{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </>
  );
}

function Copy16() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
    </svg>
  );
}

function MoreShare() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  );
}