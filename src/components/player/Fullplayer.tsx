import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Heart, Volume2, ChevronDown, X } from 'lucide-react';
import { usePlayerStore } from '@/store/playStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useYouTubePlayer } from '@/hooks/useYoutubePlayer';
import { useToast } from '@/components/common/Toast';
import { SoundwaveIcon } from '@/components/common/Soundwavelogo';

function fmt(s: number) {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

export function FullPlayer() {
  const { currentSong, isPlaying, isShuffled, repeatMode, currentTime, duration, isFullPlayerOpen, isReady, closeFullPlayer, toggleShuffle, cycleRepeat, setVolume, volume, setCurrentSong } = usePlayerStore();
  const { likedSongs, toggleLike } = useLibraryStore();
  const { toggle, next, previous, seekTo } = useYouTubePlayer();
  const { showToast } = useToast();

  if (!isFullPlayerOpen) return null;

  const isLiked = currentSong ? likedSongs.some(s => s.youtubeId === currentSong.youtubeId) : false;
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const accentStyle = currentSong
    ? { background: `linear-gradient(160deg, hsl(${currentSong.youtubeId.charCodeAt(0) % 360}, 40%, 15%) 0%, #0d0d0d 55%)` }
    : { background: '#111' };

  return (
    <div className="full-player-backdrop" onClick={closeFullPlayer}>
      <div className="full-player-panel" style={accentStyle} onClick={e => e.stopPropagation()}>
        <div className="full-player-handle" />
        <div className="full-player-header">
          <button className="icon-btn" onClick={closeFullPlayer}><ChevronDown size={22} /></button>
          <span className="full-player-label">Now Playing</span>
          <button
            onClick={() => { closeFullPlayer(); setCurrentSong(null); }}
            title="Close player"
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(255,255,255,0.7)',
              transition: 'background 0.15s, color 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.18)'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)'; }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Artwork */}
        <div className={`full-player-art${isPlaying ? ' playing' : ''}`}>
          {currentSong?.cover
            ? <img src={currentSong.cover} alt={currentSong.title} />
            : <div className="full-player-art-placeholder"><SoundwaveIcon size={48} color="rgba(255,255,255,0.2)" /></div>
          }
        </div>

        {/* Info + Like */}
        <div className="full-player-info">
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
        </div>

        {/* Progress */}
        <div className="full-player-progress">
          <div className="full-player-progress-track" onClick={e => { const r = e.currentTarget.getBoundingClientRect(); seekTo(((e.clientX - r.left) / r.width) * 100); }}>
            <div className="full-player-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="full-player-times">
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="full-player-controls">
          <button className={`full-ctrl-btn${isShuffled ? ' active' : ''}`} onClick={() => { toggleShuffle(); showToast(isShuffled ? 'Shuffle off' : 'Shuffle on 🔀'); }}>
            <Shuffle size={20} />
          </button>
          <button className="full-ctrl-btn" onClick={previous} disabled={!isReady} style={!isReady ? { opacity: 0.3 } : {}}>
            <SkipBack size={28} fill="currentColor" />
          </button>
          <button className="full-ctrl-play" onClick={toggle} disabled={!isReady} style={!isReady ? { opacity: 0.3 } : {}}>
            {isPlaying ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" style={{ marginLeft: 2 }} />}
          </button>
          <button className="full-ctrl-btn" onClick={next} disabled={!isReady} style={!isReady ? { opacity: 0.3 } : {}}>
            <SkipForward size={28} fill="currentColor" />
          </button>
          <button className={`full-ctrl-btn${repeatMode > 0 ? ' active' : ''}`} onClick={cycleRepeat}>
            {repeatMode === 2 ? <Repeat1 size={20} /> : <Repeat size={20} />}
          </button>
        </div>

        {/* Volume */}
        <div className="full-volume-row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 0 4px' }}>
          <Volume2 size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input type="range" min={0} max={100} value={volume} onChange={e => setVolume(parseInt(e.target.value))} style={{ flex: 1 }} />
        </div>
      </div>
    </div>
  );
}