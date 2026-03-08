// ============================================================
// SOUNDWAVE — Edit Profile Screen
// Avatar: upload your own photo OR pick a DiceBear avatar
// ============================================================
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowLeft, Camera, Check, X, Loader, AlertCircle, RefreshCw, Upload, Smile } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/common/Toast';

interface EditProfileViewProps { onBack: () => void; }

// ── DiceBear config ────────────────────────────────────────
const DICEBEAR_STYLES = [
  { id: 'adventurer',        label: 'Adventurer' },
  { id: 'adventurer-neutral',label: 'Neutral'    },
  { id: 'avataaars',         label: 'Avataaars'  },
  { id: 'big-smile',         label: 'Big Smile'  },
  { id: 'bottts',            label: 'Bottts'     },
  { id: 'lorelei',           label: 'Lorelei'    },
  { id: 'micah',             label: 'Micah'      },
  { id: 'notionists',        label: 'Notionists' },
  { id: 'open-peeps',        label: 'Open Peeps' },
  { id: 'personas',          label: 'Personas'   },
  { id: 'pixel-art',         label: 'Pixel Art'  },
  { id: 'rings',             label: 'Rings'      },
];

const GRID_SEEDS = ['alpha','beta','gamma','delta','epsilon','zeta','eta','theta','iota','kappa','lambda','mu'];

function dicebearUrl(style: string, seed: string) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&size=80`;
}

// ── Image compression ──────────────────────────────────────
const MAX_SIZE_MB = 2;
const ALLOWED_TYPES = ['image/jpeg','image/png','image/webp','image/gif'];

function compressImage(file: File, maxDim = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

// ── Avatar tab type ────────────────────────────────────────
type AvatarTab = 'upload' | 'dicebear';

export function EditProfileView({ onBack }: EditProfileViewProps) {
  const { user, updateProfileData, isLoading } = useAuthStore();
  const { showToast } = useToast();

  const [name, setName]           = useState(user?.name ?? '');
  const [preview, setPreview]     = useState<string | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [nameError, setNameError]   = useState('');
  const [saved, setSaved]         = useState(false);
  const [avatarTab, setAvatarTab] = useState<AvatarTab>('upload');

  // DiceBear state
  const [dbStyle, setDbStyle]     = useState(DICEBEAR_STYLES[0].id);
  const [dbSeeds, setDbSeeds]     = useState<string[]>(GRID_SEEDS);
  const [dbSelected, setDbSelected] = useState<string | null>(null); // chosen dicebear URL
  const [dbLoading, setDbLoading]  = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const currentAvatar = preview ?? dbSelected ?? user?.picture ?? '';
  const initials = name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase() || 'U';
  const hasChanges = name !== user?.name || preview !== null || dbSelected !== null;

  // ── Shuffle DiceBear seeds ────────────────────────────────
  const shuffle = () => {
    setDbLoading(true);
    const newSeeds = Array.from({ length: 12 }, () =>
      Math.random().toString(36).slice(2, 10)
    );
    setDbSeeds(newSeeds);
    setTimeout(() => setDbLoading(false), 400);
  };

  // ── Photo upload ──────────────────────────────────────────
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError('');
    if (!ALLOWED_TYPES.includes(file.type)) { setPhotoError('Use JPG, PNG, WebP or GIF.'); return; }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) { setPhotoError(`Image must be under ${MAX_SIZE_MB}MB.`); return; }
    try {
      const compressed = await compressImage(file, 256);
      setPreview(compressed);
      setDbSelected(null); // clear dicebear if photo chosen
    } catch { setPhotoError('Could not process image. Try another.'); }
    e.target.value = '';
  }, []);

  // ── Pick DiceBear avatar ──────────────────────────────────
  const pickDiceBear = (seed: string) => {
    const url = dicebearUrl(dbStyle, seed);
    setDbSelected(url);
    setPreview(null); // clear upload if dicebear chosen
  };

  // ── Save ──────────────────────────────────────────────────
  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed)         { setNameError('Name cannot be empty.'); return; }
    if (trimmed.length < 2) { setNameError('Name must be at least 2 characters.'); return; }
    if (trimmed.length > 50){ setNameError('Name must be under 50 characters.'); return; }
    setNameError('');
    try {
      const pictureToSave = preview ?? dbSelected ?? undefined;
      await updateProfileData(trimmed, pictureToSave);
      setSaved(true);
      showToast('Profile updated! ✓', 'success');
      setTimeout(() => { setSaved(false); onBack(); }, 900);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed.', 'error');
    }
  };

  // ─────────────────────────────────────────────────────────
  return (
    <div style={{ paddingBottom: 32 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <button onClick={onBack} style={{ width:38, height:38, borderRadius:10, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text)', flexShrink:0 }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:'#fff', letterSpacing:'-0.3px' }}>Edit Profile</div>
          <div style={{ fontSize:12, color:'var(--text-muted)' }}>Update your name and avatar</div>
        </div>
      </div>

      {/* ── Current avatar preview ── */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:24 }}>
        <div style={{ position:'relative', width:88, height:88 }}>
          <div style={{
            width:88, height:88, borderRadius:'50%',
            border: `3px solid ${hasChanges ? 'var(--pink)' : 'rgba(255,107,157,0.3)'}`,
            overflow:'hidden', background:'rgba(255,107,157,0.1)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow: hasChanges ? '0 0 28px rgba(255,107,157,0.45)' : '0 0 16px rgba(255,107,157,0.2)',
            transition:'all 0.3s',
          }}>
            {currentAvatar
              ? <img src={currentAvatar} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <span style={{ fontSize:28, fontWeight:800, color:'var(--pink)' }}>{initials}</span>}
          </div>
          {/* Camera badge — opens file picker */}
          <button onClick={() => fileRef.current?.click()} style={{ position:'absolute', bottom:0, right:0, width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#FF6B9D,#E05587)', border:'2px solid var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <Camera size={13} color="#fff" />
          </button>
        </div>
        {(preview || dbSelected) && (
          <button onClick={() => { setPreview(null); setDbSelected(null); }} style={{ marginTop:8, fontSize:12, color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
            <X size={12} /> Remove
          </button>
        )}
      </div>

      {/* ── Avatar picker tabs ── */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10, paddingLeft:2 }}>Choose Avatar</div>
        <div style={{ display:'flex', gap:8, marginBottom:14 }}>
          {([
            { id:'upload',   icon:<Upload size={14} />,  label:'Upload Photo' },
            { id:'dicebear', icon:<Smile size={14} />,   label:'DiceBear' },
          ] as { id: AvatarTab; icon: React.ReactNode; label: string }[]).map(tab => (
            <button key={tab.id} onClick={() => setAvatarTab(tab.id)} style={{
              flex:1, padding:'10px 8px', borderRadius:12, cursor:'pointer', fontFamily:'inherit',
              border: `1.5px solid ${avatarTab===tab.id ? 'var(--pink)' : 'rgba(255,255,255,0.07)'}`,
              background: avatarTab===tab.id ? 'rgba(255,107,157,0.1)' : 'var(--bg-card)',
              color: avatarTab===tab.id ? 'var(--pink)' : 'var(--text-sub)',
              fontWeight:600, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
              transition:'all 0.2s',
            }}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {/* Upload tab */}
        {avatarTab === 'upload' && (
          <div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFileChange} />
            <button onClick={() => fileRef.current?.click()} style={{
              width:'100%', padding:'14px', borderRadius:14, cursor:'pointer', fontFamily:'inherit',
              border:'2px dashed rgba(255,107,157,0.3)', background:'rgba(255,107,157,0.04)',
              color:'var(--pink)', fontWeight:600, fontSize:14,
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              transition:'all 0.2s',
            }}
              onMouseEnter={e => { (e.currentTarget).style.borderColor='var(--pink)'; (e.currentTarget).style.background='rgba(255,107,157,0.08)'; }}
              onMouseLeave={e => { (e.currentTarget).style.borderColor='rgba(255,107,157,0.3)'; (e.currentTarget).style.background='rgba(255,107,157,0.04)'; }}
            >
              <Upload size={16} />
              {preview ? 'Change Photo' : 'Upload Photo'}
            </button>
            {photoError && (
              <div style={{ fontSize:12, color:'#ff6b6b', marginTop:8, display:'flex', alignItems:'center', gap:5 }}>
                <AlertCircle size={12} />{photoError}
              </div>
            )}
            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:7, textAlign:'center' }}>
              JPG, PNG, WebP or GIF · Max {MAX_SIZE_MB}MB
            </div>
          </div>
        )}

        {/* DiceBear tab */}
        {avatarTab === 'dicebear' && (
          <div>
            {/* Style selector */}
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:7 }}>Style</div>
              <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4, scrollbarWidth:'none' }}>
                {DICEBEAR_STYLES.map(s => (
                  <button key={s.id} onClick={() => { setDbStyle(s.id); setDbSelected(null); }} style={{
                    padding:'6px 12px', borderRadius:20, cursor:'pointer', fontFamily:'inherit',
                    border: `1.5px solid ${dbStyle===s.id ? 'var(--pink)' : 'rgba(255,255,255,0.08)'}`,
                    background: dbStyle===s.id ? 'rgba(255,107,157,0.12)' : 'var(--bg-card)',
                    color: dbStyle===s.id ? 'var(--pink)' : 'var(--text-muted)',
                    fontSize:12, fontWeight:600, whiteSpace:'nowrap', flexShrink:0,
                    transition:'all 0.2s',
                  }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Avatar grid */}
            <div style={{ position:'relative' }}>
              <div style={{
                display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10,
                opacity: dbLoading ? 0.4 : 1, transition:'opacity 0.3s',
              }}>
                {dbSeeds.map(seed => {
                  const url = dicebearUrl(dbStyle, seed);
                  const isSelected = dbSelected === url;
                  return (
                    <button key={seed} onClick={() => pickDiceBear(seed)} style={{
                      width:'100%', aspectRatio:'1', borderRadius:14, overflow:'hidden', cursor:'pointer',
                      border: `2.5px solid ${isSelected ? 'var(--pink)' : 'rgba(255,255,255,0.07)'}`,
                      background: isSelected ? 'rgba(255,107,157,0.1)' : 'rgba(255,255,255,0.04)',
                      padding:0, position:'relative',
                      boxShadow: isSelected ? '0 0 14px rgba(255,107,157,0.4)' : 'none',
                      transform: isSelected ? 'scale(1.06)' : 'scale(1)',
                      transition:'all 0.2s',
                    }}>
                      <img
                        src={url}
                        alt={seed}
                        style={{ width:'100%', height:'100%', objectFit:'cover' }}
                        loading="lazy"
                      />
                      {isSelected && (
                        <div style={{ position:'absolute', top:4, right:4, width:18, height:18, borderRadius:'50%', background:'var(--pink)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <Check size={11} color="#fff" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {dbLoading && (
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Loader size={22} color="var(--pink)" style={{ animation:'sw-spin 0.8s linear infinite' }} />
                </div>
              )}
            </div>

            {/* Shuffle */}
            <button onClick={shuffle} style={{
              width:'100%', marginTop:12, padding:'10px', borderRadius:12,
              background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
              color:'var(--text-sub)', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit',
              display:'flex', alignItems:'center', justifyContent:'center', gap:7,
              transition:'background 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background='rgba(255,255,255,0.09)')}
              onMouseLeave={e => (e.currentTarget.style.background='rgba(255,255,255,0.05)')}
            >
              <RefreshCw size={14} /> Shuffle More
            </button>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:7, textAlign:'center' }}>
              Powered by <a href="https://dicebear.com" target="_blank" rel="noopener noreferrer" style={{ color:'var(--pink)', textDecoration:'none' }}>DiceBear</a> · CC0 Licensed
            </div>
          </div>
        )}
      </div>

      {/* ── Name field ── */}
      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
          <label style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:'0.08em', textTransform:'uppercase' }}>Display Name</label>
          <span style={{ fontSize:11, color: name.length > 45 ? '#ff6b6b' : 'var(--text-muted)' }}>{name.length}/50</span>
        </div>
        <input
          type="text"
          value={name}
          onChange={e => { setName(e.target.value); setNameError(''); }}
          maxLength={50}
          placeholder="Your display name"
          style={{
            width:'100%', padding:'12px 14px',
            background:'rgba(255,255,255,0.06)',
            border: `1px solid ${nameError ? '#ff4444' : name !== user?.name ? 'var(--pink)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius:12, color:'#fff', fontSize:15, fontFamily:'inherit', outline:'none', boxSizing:'border-box', transition:'border-color 0.2s',
          }}
          onFocus={e => { if (!nameError) e.target.style.borderColor='var(--pink)'; }}
          onBlur={e => { if (!nameError && name === user?.name) e.target.style.borderColor='rgba(255,255,255,0.1)'; }}
        />
        {nameError && <div style={{ fontSize:12, color:'#ff6b6b', marginTop:5, display:'flex', alignItems:'center', gap:5 }}><AlertCircle size={12}/>{nameError}</div>}
      </div>

      {/* ── Email (read-only) ── */}
      <div style={{ marginBottom:24 }}>
        <label style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:'0.08em', textTransform:'uppercase', display:'block', marginBottom:7 }}>Email</label>
        <div style={{ padding:'12px 14px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, color:'var(--text-muted)', fontSize:14 }}>
          {user?.email}
        </div>
        <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:5 }}>To change email, use Firebase Auth settings.</div>
      </div>

      {/* ── Actions ── */}
      <div style={{ display:'flex', gap:10 }}>
        <button onClick={onBack} style={{ flex:1, padding:'13px', borderRadius:13, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:'var(--text)', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges || isLoading}
          style={{
            flex:2, padding:'13px', borderRadius:13, border:'none',
            background: hasChanges && !isLoading ? 'linear-gradient(135deg,#FF6B9D,#E05587)' : 'rgba(255,255,255,0.08)',
            color: hasChanges ? '#fff' : 'var(--text-muted)',
            fontWeight:700, fontSize:14, cursor: hasChanges && !isLoading ? 'pointer' : 'not-allowed',
            fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            boxShadow: hasChanges ? '0 4px 20px rgba(255,107,157,0.35)' : 'none',
            transition:'all 0.2s',
          }}
        >
          {isLoading
            ? <><span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'sw-spin 0.7s linear infinite' }} />Saving…</>
            : saved
              ? <><Check size={15} />Saved!</>
              : 'Save Changes'}
        </button>
      </div>

      <style>{`@keyframes sw-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}