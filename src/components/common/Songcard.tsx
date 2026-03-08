import { useState } from 'react';
import { Play, Heart } from 'lucide-react';
import { SoundwaveIcon } from '@/components/common/Soundwavelogo';
import type { Song } from '@/types';

interface SongCardProps {
  song: Song;
  isActive?: boolean;
  isPlaying?: boolean;
  onPlay: (song: Song) => void;
  onLike?: (song: Song) => void;
  isLiked?: boolean;
  showArtist?: boolean;
  layout?: 'card' | 'row';
  index?: number;
}

function coverBg(id: string) {
  const colors = ['#1a1035','#0d2137','#1a2a10','#2a1010','#10252a','#251020','#1a1a2a'];
  return colors[id.charCodeAt(0) % colors.length];
}

export function SongCard({ song, isActive, isPlaying, onPlay, onLike, isLiked, showArtist = true, layout = 'card', index }: SongCardProps) {
  const [imgErr, setImgErr] = useState(false);
  const hasCover = song.cover && !imgErr;

  if (layout === 'row') {
    return (
      <div className={`song-row${isActive ? ' active' : ''}`} onClick={() => onPlay(song)}>
        <div className="song-row-num">
          {isActive && isPlaying ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 14, justifyContent: 'center' }}>
              <span className="eq-1" style={{ width: 3, background: 'var(--pink)', borderRadius: 2, display: 'block' }} />
              <span className="eq-2" style={{ width: 3, background: 'var(--pink)', borderRadius: 2, display: 'block' }} />
              <span className="eq-3" style={{ width: 3, background: 'var(--pink)', borderRadius: 2, display: 'block' }} />
            </div>
          ) : (
            <span>{index !== undefined ? index + 1 : ''}</span>
          )}
        </div>
        <div className="song-row-thumb">
          {hasCover
            ? <img src={song.cover} alt={song.title} onError={() => setImgErr(true)} />
            : <div className="song-row-thumb-placeholder" style={{ background: coverBg(song.youtubeId) }}><SoundwaveIcon size={16} color="rgba(255,255,255,0.3)" /></div>
          }
        </div>
        <div className="song-row-info">
          <div className={`song-row-title${isActive ? ' active' : ''}`}>{song.title}</div>
          {showArtist && <div className="song-row-artist">{song.artist}</div>}
        </div>
        {onLike && (
          <div className="song-row-actions">
            <button className={`icon-btn${isLiked ? ' active' : ''}`} onClick={e => { e.stopPropagation(); onLike(song); }}>
              <Heart size={15} fill={isLiked ? 'currentColor' : 'none'} />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`song-card${isActive ? ' active' : ''}`} onClick={() => onPlay(song)}>
      <div className="song-card-art">
        {hasCover
          ? <img src={song.cover} alt={song.title} onError={() => setImgErr(true)} />
          : <div className="song-card-art-placeholder" style={{ background: coverBg(song.youtubeId) }}><SoundwaveIcon size={16} color="rgba(255,255,255,0.3)" /></div>
        }
        <div className="song-card-overlay">
          <div className="song-card-play-btn">
            <Play size={18} fill="white" color="white" />
          </div>
        </div>
        {isActive && isPlaying && (
          <div className="song-card-eq">
            <span className="eq-1" style={{ width: 3, background: 'var(--pink)', borderRadius: 2 }} />
            <span className="eq-2" style={{ width: 3, background: 'var(--pink)', borderRadius: 2 }} />
            <span className="eq-3" style={{ width: 3, background: 'var(--pink)', borderRadius: 2 }} />
          </div>
        )}
      </div>
      <div className="song-card-info">
        <div className={`song-card-title${isActive ? ' active' : ''}`}>{song.title}</div>
        {showArtist && <div className="song-card-artist">{song.artist}</div>}
      </div>
    </div>
  );
}