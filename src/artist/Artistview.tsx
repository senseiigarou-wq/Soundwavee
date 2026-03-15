// ============================================================
// SOUNDWAVE — Artist Profile Page
// redeploy
// Shows artist banner, songs, follow button, related artists.
// ============================================================
import React, { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, UserPlus, UserCheck, Play, Shuffle } from 'lucide-react';
import { YouTubeService } from '@/services/youtube';
import { useLibraryStore } from '@/store/libraryStore';
import { usePlayerStore } from '@/store/playStore';
import { useYouTubePlayer } from '@/hooks/useYoutubePlayer';
import { useToast } from '@/components/common/Toast';
import { SongCard } from '@/components/common/Songcard';
import { SoundwaveIcon } from '@/components/common/Soundwavelogo';
import type { Artist, Song } from '@/types';

interface ArtistViewProps {
  artist: Artist;
  onBack: () => void;
  onArtistClick: (artist: Artist) => void;
}

export function ArtistView({ artist, onBack, onArtistClick }: ArtistViewProps) {
  const [songs, setSongs]               = useState<Song[]>([]);
  const [related, setRelated]           = useState<Artist[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(true);
  const [imgErr, setImgErr]             = useState(false);

  const { followArtist, unfollowArtist, isFollowing, likedSongs } = useLibraryStore();
  const { currentSong, isPlaying } = usePlayerStore();
  const { loadAndPlay } = useYouTubePlayer();
  const { showToast } = useToast();
  const following = isFollowing(artist.name);

  useEffect(() => {
    setLoadingSongs(true);
    setSongs([]); setRelated([]); setImgErr(false);
    Promise.all([
      YouTubeService.getArtistSongs(artist.name, artist.channelId, 10),
      YouTubeService.getRelatedArtists(artist.name, 6),
    ]).then(([s, r]) => { setSongs(s); setRelated(r); })
      .catch(() => {})
      .finally(() => setLoadingSongs(false));
  }, [artist.name, artist.channelId]);

  const handlePlay = useCallback((song: Song) => {
    useLibraryStore.getState().addSong(song);
    loadAndPlay(song);
    showToast(`Playing: ${song.title.slice(0, 28)}`);
  }, [loadAndPlay, showToast]);

  const handlePlayAll = () => {
    if (!songs.length) return;
    songs.forEach(s => useLibraryStore.getState().addSong(s));
    loadAndPlay(songs[0]);
    showToast(`Playing ${artist.name}`);
  };

  const handleShuffle = () => {
    if (!songs.length) return;
    const rand = songs[Math.floor(Math.random() * songs.length)];
    songs.forEach(s => useLibraryStore.getState().addSong(s));
    loadAndPlay(rand);
    showToast(`Shuffling ${artist.name} 🔀`);
  };

  const handleFollow = () => {
    if (following) { unfollowArtist(artist.name); showToast(`Unfollowed ${artist.name}`); }
    else { followArtist(artist); showToast(`Following ${artist.name} ✓`, 'success'); }
  };

  const hasCover = artist.thumbnail && !imgErr;

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* ── Banner / Hero ── */}
      <div style={{ position: 'relative', height: 260, marginBottom: 0, overflow: 'hidden', borderRadius: '0 0 24px 24px', marginLeft: -24, marginRight: -24 }}>
        {hasCover && (
          <img src={artist.thumbnail} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(28px) brightness(0.45) saturate(1.4)', transform: 'scale(1.1)' }} />
        )}
        {!hasCover && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1a0d2e, #0d1a2a)' }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.88) 100%)' }} />

        <button onClick={onBack} style={{ position: 'absolute', top: 16, left: 24, zIndex: 10, width: 38, height: 38, borderRadius: 12, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', backdropFilter: 'blur(8px)' }}>
          <ArrowLeft size={18} />
        </button>

        <div style={{ position: 'absolute', bottom: 20, left: 24, right: 24, display: 'flex', alignItems: 'flex-end', gap: 18 }}>
          <div style={{ width: 90, height: 90, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.3)', overflow: 'hidden', background: '#1a1a2a', flexShrink: 0, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            {hasCover
              ? <img src={artist.thumbnail} alt={artist.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgErr(true)} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🎤</div>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>Artist</div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.1, marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{artist.name}</h1>
            <button onClick={handleFollow} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 18px', borderRadius: 999, fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', border: `1.5px solid ${following ? 'rgba(255,107,157,0.5)' : 'rgba(255,255,255,0.4)'}`, background: following ? 'rgba(255,107,157,0.15)' : 'rgba(255,255,255,0.1)', color: following ? 'var(--pink)' : '#fff', backdropFilter: 'blur(8px)' }}>
              {following ? <><UserCheck size={13} /> Following</> : <><UserPlus size={13} /> Follow</>}
            </button>
          </div>
        </div>
      </div>

      {/* ── Play / Shuffle ── */}
      <div style={{ display: 'flex', gap: 12, padding: '20px 0 8px' }}>
        <button onClick={handlePlayAll} disabled={!songs.length} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 14, background: 'linear-gradient(135deg,#FF6B9D,#E05587)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 14, cursor: songs.length ? 'pointer' : 'not-allowed', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(255,107,157,0.35)', opacity: songs.length ? 1 : 0.4 }}>
          <Play size={15} fill="white" /> Play All
        </button>
        <button onClick={handleShuffle} disabled={!songs.length} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text)', fontWeight: 700, fontSize: 14, cursor: songs.length ? 'pointer' : 'not-allowed', fontFamily: 'inherit', opacity: songs.length ? 1 : 0.4 }}>
          <Shuffle size={15} /> Shuffle
        </button>
      </div>

      {/* ── Popular Songs ── */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 12, letterSpacing: '-0.3px' }}>Popular Songs</h2>
        {loadingSongs ? (
          Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton-card" style={{ height: 64, borderRadius: 12, marginBottom: 8 }} />)
        ) : songs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
            <SoundwaveIcon size={32} color="var(--text-muted)" />
            <div style={{ marginTop: 12, fontSize: 14 }}>No songs found for this artist</div>
          </div>
        ) : songs.map((song, i) => (
          <SongCard key={song.youtubeId} song={song} layout="row" index={i}
            isActive={currentSong?.youtubeId === song.youtubeId}
            isPlaying={isPlaying && currentSong?.youtubeId === song.youtubeId}
            isLiked={likedSongs.some(s => s.youtubeId === song.youtubeId)}
            onPlay={handlePlay}
            onLike={s => { const liked = useLibraryStore.getState().toggleLike(s); showToast(liked ? '♥ Added to Liked Songs' : '♡ Removed'); }}
          />
        ))}
      </div>

      {/* ── Fans Also Like ── */}
      {related.length > 0 && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 14, letterSpacing: '-0.3px' }}>Fans Also Like</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 }}>
            {related.map(rel => (
              <div key={rel.name} onClick={() => onArtistClick(rel)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '14px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.07)'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'}
              >
                <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', background: '#1a1a2a', border: '2px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
                  {rel.thumbnail
                    ? <img src={rel.thumbnail} alt={rel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🎤</div>
                  }
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{rel.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Artist</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
