import React, { useCallback, useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Repeat1, Heart, Volume2, VolumeX, ListPlus, Share2 } from 'lucide-react';
import { ShareModal } from '@/components/Social/ShareModal';
import { usePlayerStore } from '@/store/playStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useYouTubePlayer } from '@/hooks/useYoutubePlayer';
import { SoundwaveIcon } from '@/components/common/Soundwavelogo';
import { useToast } from '@/components/common/Toast';

function fmt(s: number) {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

export function NowPlayingBar() {
  const { currentSong, isPlaying, isShuffled, repeatMode, volume, isMuted, currentTime, duration, isReady, openFullPlayer, toggleShuffle, cycleRepeat, toggleMute, setVolume, openAddToPlaylist } = usePlayerStore();
  const { likedSongs, toggleLike } = useLibraryStore();
  const { toggle, next, previous, seekTo } = useYouTubePlayer();
  const { showToast } = useToast();
  const [showShare, setShowShare] = useState(false);

  const isLiked = currentSong ? likedSongs.some(s => s.youtubeId === currentSong.youtubeId) : false;
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleLike = useCallback(() => {
    if (!currentSong) return;
    const liked = toggleLike(currentSong);
    showToast(liked ? '♥ Added to Liked Songs' : '♡ Removed from Liked Songs');
  }, [currentSong, toggleLike, showToast]);

  return (
    <>
      <div className="player-bar">
        {/* Track info */}
        <div className="player-track">
          <div className="player-track-thumb" onClick={currentSong ? openFullPlayer : undefined}>
            {currentSong?.cover
              ? <img src={currentSong.cover} alt={currentSong.title} />
              : <div className="player-track-thumb-placeholder" style={{ background: '#1a1a1a' }}><SoundwaveIcon size={16} color="rgba(255,255,255,0.25)" /></div>
            }
          </div>
          <div className="player-track-info">
            {currentSong ? (
              <>
                <div className="player-track-title" onClick={openFullPlayer}>{currentSong.title}</div>
                <div className="player-track-artist">{currentSong.artist}</div>
              </>
            ) : (
              <>
                <div className="player-track-title" style={{ color: 'var(--text-muted)' }}>No song playing</div>
                <div className="player-track-artist">Search for music to start</div>
              </>
            )}
          </div>
          <button className={`icon-btn${isLiked ? ' active' : ''}`} onClick={handleLike} style={{ flexShrink: 0 }}>
            <Heart size={15} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Controls */}
        <div className="player-center">
          <div className="player-controls">
            <button className={`ctrl-btn${isShuffled ? ' active' : ''}`} onClick={() => { toggleShuffle(); showToast(isShuffled ? 'Shuffle off' : 'Shuffle on 🔀'); }}>
              <Shuffle size={15} />
            </button>
            <button className="ctrl-btn" onClick={previous} disabled={!isReady} style={!isReady ? { opacity: 0.3 } : {}}>
              <SkipBack size={18} fill="currentColor" />
            </button>
            <button className={`ctrl-play${isPlaying ? ' playing' : ''}`} onClick={toggle} disabled={!isReady} style={!isReady ? { opacity: 0.3 } : {}}>
              {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
            </button>
            <button className="ctrl-btn" onClick={next} disabled={!isReady} style={!isReady ? { opacity: 0.3 } : {}}>
              <SkipForward size={18} fill="currentColor" />
            </button>
            <button className={`ctrl-btn${repeatMode > 0 ? ' active' : ''}`} onClick={() => { cycleRepeat(); showToast(['Repeat off', 'Repeat all 🔁', 'Repeat one 🔂'][(repeatMode + 1) % 3]); }}>
              {repeatMode === 2 ? <Repeat1 size={15} /> : <Repeat size={15} />}
            </button>
          </div>
          <div className="player-progress">
            <span className="progress-time">{fmt(currentTime)}</span>
            <div className="progress-track" onClick={e => { const r = e.currentTarget.getBoundingClientRect(); seekTo(((e.clientX - r.left) / r.width) * 100); }}>
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="progress-time">{fmt(duration)}</span>
          </div>
        </div>

        {/* Volume + Add to Playlist + Share */}
        <div className="player-right">
          {currentSong && (
            <>
              <button className="ctrl-btn" onClick={() => openAddToPlaylist(currentSong)} title="Add to playlist" style={{ marginRight: 4 }}>
                <ListPlus size={16} />
              </button>
              <button className="ctrl-btn" onClick={() => setShowShare(true)} title="Share song" style={{ marginRight: 4 }}>
                <Share2 size={16} />
              </button>
            </>
          )}
          <div className="volume-wrap">
            <button className="ctrl-btn" onClick={toggleMute}>
              {isMuted > 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <input type="range" className="volume" min={0} max={100} value={isMuted > 0 ? 0 : volume} onChange={e => setVolume(parseInt(e.target.value))} />
          </div>
        </div>
      </div>

      {showShare && currentSong && (
        <ShareModal
          type="song"
          title={currentSong.title}
          artist={currentSong.artist}
          cover={currentSong.cover}
          youtubeId={currentSong.youtubeId}
          onClose={() => setShowShare(false)}
        />
      )}
    </>
  );
}

export function MobilePlayer() {
  const { currentSong, isPlaying, openFullPlayer, currentTime, duration, openAddToPlaylist } = usePlayerStore();
  const { likedSongs, toggleLike } = useLibraryStore();
  const { toggle, next, seekTo } = useYouTubePlayer();
  const [showShare, setShowShare] = useState(false);

  if (!currentSong) return null;
  const isLiked = likedSongs.some(s => s.youtubeId === currentSong.youtubeId);
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <div className="mobile-player" style={{ '--player-pct': `${pct}%` } as React.CSSProperties}>
        {/* Top row: thumb + info + controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
          <div className="mobile-player-thumb" style={{ borderRadius: 8, overflow: 'hidden', background: '#1a1a1a', flexShrink: 0 }} onClick={openFullPlayer}>
            {currentSong.cover
              ? <img src={currentSong.cover} alt={currentSong.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><SoundwaveIcon size={20} color="rgba(255,255,255,0.25)" /></div>
            }
          </div>
          <div className="mobile-player-info" onClick={openFullPlayer}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentSong.title}</div>
            <div style={{ fontSize: 11, color: 'var(--text-sub)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentSong.artist}</div>
          </div>
          <div className="mobile-player-controls">
            <button className="icon-btn" onClick={e => { e.stopPropagation(); openAddToPlaylist(currentSong); }} title="Add to playlist">
              <ListPlus size={16} />
            </button>
            <button className="icon-btn" onClick={e => { e.stopPropagation(); setShowShare(true); }} title="Share song">
              <Share2 size={16} />
            </button>
            <button className={`icon-btn${isLiked ? ' active' : ''}`} onClick={e => { e.stopPropagation(); toggleLike(currentSong); }}>
              <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
            </button>
            <button className="ctrl-play" style={{ width: 36, height: 36 }} onClick={e => { e.stopPropagation(); toggle(); }}>
              {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            </button>
            <button className="ctrl-btn" onClick={e => { e.stopPropagation(); next(); }}>
              <SkipForward size={18} />
            </button>
          </div>
        </div>

        {/* Progress row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', marginTop: 7 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', minWidth: 28, flexShrink: 0 }}>{fmt(currentTime)}</span>
          <div
            style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.12)', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
            onClick={e => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); seekTo(((e.clientX - r.left) / r.width) * 100); }}
          >
            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--pink)', borderRadius: 2, transition: 'width 0.5s linear' }} />
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', minWidth: 28, textAlign: 'right', flexShrink: 0 }}>{fmt(duration)}</span>
        </div>
      </div>

      {showShare && (
        <ShareModal
          type="song"
          title={currentSong.title}
          artist={currentSong.artist}
          cover={currentSong.cover}
          youtubeId={currentSong.youtubeId}
          onClose={() => setShowShare(false)}
        />
      )}
    </>
  );
}
