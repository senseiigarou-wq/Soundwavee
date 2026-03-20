// ============================================================
// SOUNDWAVE — See All View
// Shows full paginated list of trending songs for a genre.
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Loader } from 'lucide-react';
import { YouTubeService } from '@/services/youtube';
import { useLibraryStore } from '@/store/libraryStore';
import { usePlayerStore } from '@/store/playStore';
import { useYouTubePlayer } from '@/hooks/useYoutubePlayer';
import { useToast } from '@/components/common/Toast';
import { SongCard } from '@/components/common/Songcard';
import type { Song, Genre } from '@/types';

interface SeeAllViewProps {
  genre: Genre;
  genreLabel: string;
  onBack: () => void;
}

export function SeeAllView({ genre, genreLabel, onBack }: SeeAllViewProps) {
  const [songs, setSongs]       = useState<Song[]>([]);
  const [loading, setLoading]   = useState(true);

  const { likedSongs, loadQueue } = useLibraryStore();
  const { currentSong, isPlaying } = usePlayerStore();
  const { loadAndPlay } = useYouTubePlayer();
  const { showToast } = useToast();

  useEffect(() => {
    setLoading(true);
    setSongs([]);
    YouTubeService.getTrending(genre, 24)
      .then(setSongs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [genre]);

  const handlePlay = useCallback((song: Song) => {
    if (songs.length > 0) {
      const idx = Math.max(0, songs.findIndex(s => s.youtubeId === song.youtubeId));
      loadQueue(songs, idx);
    }
    loadAndPlay(song);
    showToast(`Playing: ${song.title.slice(0, 28)}`);
  }, [songs, loadQueue, loadAndPlay, showToast]);

  const handleLike = useCallback((song: Song) => {
    const liked = useLibraryStore.getState().toggleLike(song);
    showToast(liked ? '♥ Added to Liked Songs' : '♡ Removed');
  }, [showToast]);

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={onBack}
            style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text)', flexShrink: 0 }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title">Trending {genreLabel}</h1>
            <p className="page-subtitle">{loading ? 'Loading…' : `${songs.length} songs`}</p>
          </div>
        </div>
      </div>

      {/* Song list */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 12, color: 'var(--text-muted)' }}>
          <Loader size={20} style={{ animation: 'sw-spin 0.8s linear infinite' }} />
          Loading songs…
        </div>
      ) : songs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          No songs found. Try another genre.
        </div>
      ) : (
        <div>
          {songs.map((song, i) => (
            <SongCard
              key={song.youtubeId}
              song={song}
              layout="row"
              index={i}
              isActive={currentSong?.youtubeId === song.youtubeId}
              isPlaying={isPlaying && currentSong?.youtubeId === song.youtubeId}
              isLiked={likedSongs.some(s => s.youtubeId === song.youtubeId)}
              onPlay={handlePlay}
              onLike={handleLike}
            />
          ))}
        </div>
      )}
      <style>{`@keyframes sw-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}