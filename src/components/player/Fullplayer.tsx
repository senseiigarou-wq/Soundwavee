import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Heart, Volume2, ChevronDown, X, ListPlus, Mic } from 'lucide-react';
import { usePlayerStore } from '@/store/playStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useYouTubePlayer } from '@/hooks/useYoutubePlayer';
import { useToast } from '@/components/common/Toast';
import { SoundwaveIcon } from '@/components/common/Soundwavelogo';
import { LyricsView } from './LyricsView';

function fmt(s: number) {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

type Tab = 'player' | 'lyrics';

export function FullPlayer() {
  const { currentSong, isPlaying, isShuffled, repeatMode, currentTime, duration, isFullPlayerOpen, isReady, closeFullPlayer, toggleShuffle, cycleRepeat, setVolume, volume, openAddToPlaylist } = usePlayerStore();
  const { likedSongs, toggleLike } = useLibraryStore();
  const { toggle, next, previous, seekTo } = useYouTubePlayer();
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>('player');

  if (!isFullPlayerOpen) return null;

  const isLiked = currentSong ? likedSongs.some(s => s.youtubeId === currentSong.youtubeId) : false;
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const accentStyle = currentSong
    ? { background: `linear-gradient(160deg, hsl(${currentSong.youtubeId.charCodeAt(0) % 360}, 40%, 15%) 0%, #0d0d0d 55%)` }
    : { background: '#111' };

  return (
    <div className="full-player-backdrop" onClick={closeFullPlayer}>
      <div className="full-player-panel" style={{ ...accentStyle, display:'flex', flexDirection:'column', height:'100%' }} onClick={e => e.stopPropagation()}>
        <div className="full-player-handle" />

        {/* Header */}
        <div className="full-player-header" style={{ flexShrink:0 }}>
          <button className="icon-btn" onClick={closeFullPlayer}><ChevronDown size={22} /></button>
          <span className="full-player-label">
            {tab === 'lyrics' ? 'Lyrics' : 'Now Playing'}
          </span>
          <button
            onClick={closeFullPlayer}
            style={{ width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'rgba(255,255,255,0.7)', transition:'background 0.15s', flexShrink:0 }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.18)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{ display:'flex', gap:4, padding:'0 20px 12px', flexShrink:0 }}>
          <button onClick={() => setTab('player')} style={{ flex:1, padding:'8px', borderRadius:10, border:`1.5px solid ${tab==='player' ? 'rgba(255,255,255,0.2)' : 'transparent'}`, background: tab==='player' ? 'rgba(255,255,255,0.08)' : 'transparent', color: tab==='player' ? '#fff' : 'rgba(255,255,255,0.4)', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}>
            Now Playing
          </button>
          <button onClick={() => setTab('lyrics')} style={{ flex:1, padding:'8px', borderRadius:10, border:`1.5px solid ${tab==='lyrics' ? 'rgba(255,107,157,0.4)' : 'transparent'}`, background: tab==='lyrics' ? 'rgba(255,107,157,0.1)' : 'transparent', color: tab==='lyrics' ? 'var(--pink)' : 'rgba(255,255,255,0.4)', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
            <Mic size={13} /> Lyrics
          </button>
        </div>

        {/* ── LYRICS TAB ── */}
        {tab === 'lyrics' && currentSong && (
          <>
            {/* Mini song info */}
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'0 20px 12px', flexShrink:0 }}>
              <div style={{ width:44, height:44, borderRadius:10, overflow:'hidden', background:'#1a1a2a', flexShrink:0 }}>
                {currentSong.cover
                  ? <img src={currentSong.cover} alt={currentSong.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <SoundwaveIcon size={20} color="rgba(255,255,255,0.2)" />
                }
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:700, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{currentSong.title}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>{currentSong.artist}</div>
              </div>
            </div>

            {/* Lyrics scroll area */}
            <LyricsView
              song={currentSong}
              currentTime={currentTime}
              isPlaying={isPlaying}
            />

            {/* Mini progress bar at bottom */}
            <div style={{ padding:'12px 20px', flexShrink:0 }}>
              <div style={{ height:3, borderRadius:2, background:'rgba(255,255,255,0.1)', cursor:'pointer', overflow:'hidden' }}
                onClick={e => { const r = e.currentTarget.getBoundingClientRect(); seekTo(((e.clientX - r.left) / r.width) * 100); }}
              >
                <div style={{ width:`${pct}%`, height:'100%', background:'var(--pink)', borderRadius:2, transition:'width 0.5s linear' }} />
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:5, fontSize:11, color:'rgba(255,255,255,0.4)' }}>
                <span>{fmt(currentTime)}</span>
                <span>{fmt(duration)}</span>
              </div>
              {/* Mini controls */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:20, marginTop:12 }}>
                <button className="full-ctrl-btn" onClick={previous} disabled={!isReady} style={!isReady ? { opacity:0.3 } : {}}>
                  <SkipBack size={24} fill="currentColor" />
                </button>
                <button className="full-ctrl-play" onClick={toggle} disabled={!isReady} style={!isReady ? { opacity:0.3 } : {}}>
                  {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" style={{ marginLeft:2 }} />}
                </button>
                <button className="full-ctrl-btn" onClick={next} disabled={!isReady} style={!isReady ? { opacity:0.3 } : {}}>
                  <SkipForward size={24} fill="currentColor" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── PLAYER TAB ── */}
        {(tab === 'player' || !currentSong) && (
          <>
            {/* Artwork */}
            <div className={`full-player-art${isPlaying ? ' playing' : ''}`} style={{ flexShrink:0 }}>
              {currentSong?.cover
                ? <img src={currentSong.cover} alt={currentSong.title} />
                : <div className="full-player-art-placeholder"><SoundwaveIcon size={48} color="rgba(255,255,255,0.2)" /></div>
              }
            </div>

            {/* Info + Like */}
            <div className="full-player-info" style={{ flexShrink:0 }}>
              <div>
                <div className="full-player-track-title">{currentSong?.title ?? 'No song'}</div>
                <div className="full-player-track-artist">{currentSong?.artist ?? ''}</div>
              </div>
              <button
                className={`full-ctrl-btn${isLiked ? ' active' : ''}`}
                onClick={() => { if (!currentSong) return; const l = toggleLike(currentSong); showToast(l ? '♥ Liked!' : '♡ Removed'); }}
              >
                <Heart size={24} fill={isLiked ? 'currentColor' : 'none'} />
              </button>
              <button
                className="full-ctrl-btn"
                onClick={() => { if (currentSong) openAddToPlaylist(currentSong); }}
                title="Add to playlist"
              >
                <ListPlus size={22} />
              </button>
            </div>

            {/* Progress */}
            <div className="full-player-progress" style={{ flexShrink:0 }}>
              <div className="full-player-progress-track" onClick={e => { const r = e.currentTarget.getBoundingClientRect(); seekTo(((e.clientX - r.left) / r.width) * 100); }}>
                <div className="full-player-progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="full-player-times">
                <span>{fmt(currentTime)}</span>
                <span>{fmt(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="full-player-controls" style={{ flexShrink:0 }}>
              <button className={`full-ctrl-btn${isShuffled ? ' active' : ''}`} onClick={() => { toggleShuffle(); showToast(isShuffled ? 'Shuffle off' : 'Shuffle on 🔀'); }}>
                <Shuffle size={20} />
              </button>
              <button className="full-ctrl-btn" onClick={previous} disabled={!isReady} style={!isReady ? { opacity:0.3 } : {}}>
                <SkipBack size={28} fill="currentColor" />
              </button>
              <button className="full-ctrl-play" onClick={toggle} disabled={!isReady} style={!isReady ? { opacity:0.3 } : {}}>
                {isPlaying ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" style={{ marginLeft:2 }} />}
              </button>
              <button className="full-ctrl-btn" onClick={next} disabled={!isReady} style={!isReady ? { opacity:0.3 } : {}}>
                <SkipForward size={28} fill="currentColor" />
              </button>
              <button className={`full-ctrl-btn${repeatMode > 0 ? ' active' : ''}`} onClick={cycleRepeat}>
                {repeatMode === 2 ? <Repeat1 size={20} /> : <Repeat size={20} />}
              </button>
            </div>

            {/* Volume */}
            <div className="full-volume-row" style={{ display:'flex', alignItems:'center', gap:10, padding:'0 0 4px', flexShrink:0 }}>
              <Volume2 size={16} style={{ color:'var(--text-muted)', flexShrink:0 }} />
              <input type="range" min={0} max={100} value={volume} onChange={e => setVolume(parseInt(e.target.value))} style={{ flex:1 }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
