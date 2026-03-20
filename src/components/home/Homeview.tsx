import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, ChevronRight, UserPlus, UserCheck } from 'lucide-react';
import { YouTubeService } from '@/services/youtube';
import { usePlayerStore } from '@/store/playStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useYouTubePlayer } from '@/hooks/useYoutubePlayer';
import { useToast } from '@/components/common/Toast';
import { SongCard } from '@/components/common/Songcard';
import { AdBanner } from '@/components/common/AdBanner';
import type { Song, Artist, Genre } from '@/types';

const GENRES: { id: Genre; label: string; emoji: string }[] = [
  { id: 'all', label: 'All', emoji: '🎼' },
  { id: 'pop', label: 'Pop', emoji: '🎤' },
  { id: 'hiphop', label: 'Hip-Hop', emoji: '🎧' },
  { id: 'rnb', label: 'R&B', emoji: '🎶' },
  { id: 'phonk', label: 'Phonk', emoji: '⚡' },
  { id: 'indie', label: 'Indie', emoji: '🌙' },
  { id: 'opm', label: 'OPM', emoji: '🇵🇭' },
];

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-art" />
      <div className="skeleton skeleton-line-1" />
      <div className="skeleton skeleton-line-2" />
    </div>
  );
}

export function HomeView({ onArtistClick }: { onArtistClick?: (artist: Artist) => void }) {
  const [trending, setTrending] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeGenre, setActiveGenre] = useState<Genre>('all');

  const { currentSong, isPlaying } = usePlayerStore();
  const { likedSongs, followArtist, unfollowArtist, isFollowing, loadQueue } = useLibraryStore();
  const recentSongs = useLibraryStore(s => s.recentSongs);
  const { loadAndPlay } = useYouTubePlayer();
  const { showToast } = useToast();

  const loadTrending = useCallback(async (genre: Genre) => {
    setIsLoading(true);
    try {
      const songs = await YouTubeService.getTrending(genre);
      setTrending(songs);
    } catch { showToast('Failed to load songs', 'error'); }
    finally { setIsLoading(false); }
  }, [showToast]);

  useEffect(() => {
    loadTrending('all');
    YouTubeService.getPopularArtists(8).then(setArtists).catch(() => {});
  }, [loadTrending]);

  const handlePlay = useCallback((song: Song) => {
    // Load all currently visible trending songs as the queue so next/prev works
    const queue = trending.length > 0 ? trending : [song];
    const startIndex = Math.max(0, queue.findIndex(s => s.youtubeId === song.youtubeId));
    loadQueue(queue, startIndex);
    loadAndPlay(song);
    showToast(`Playing: ${song.title.slice(0, 28)}`);
  }, [trending, loadQueue, loadAndPlay, showToast]);

  const handleLike = useCallback((song: Song) => {
    const liked = useLibraryStore.getState().toggleLike(song);
    showToast(liked ? '♥ Added to Liked Songs' : '♡ Removed');
  }, [showToast]);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Good vibes 🎧</h1>
        <p className="page-subtitle">Discover what's trending right now</p>
      </div>

      {/* Genre tabs */}
      <div className="genre-tabs" style={{ marginBottom: 24 }}>
        {GENRES.map(g => (
          <button
            key={g.id}
            className={`genre-tab${activeGenre === g.id ? ' active' : ''}`}
            onClick={() => { setActiveGenre(g.id); loadTrending(g.id); }}
          >
            {g.emoji} {g.label}
          </button>
        ))}
        <button
          className="genre-tab refresh"
          onClick={() => loadTrending(activeGenre)}
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Trending */}
      <section style={{ marginBottom: 40 }}>
        <div className="section-header">
          <h2 className="section-title">Trending Songs</h2>
          <a href="#" className="section-link">See all <ChevronRight size={14} /></a>
        </div>
        <div className="songs-grid">
          {isLoading
            ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
            : trending.slice(0, 12).map(song => (
              <SongCard
                key={song.youtubeId}
                song={song}
                isActive={currentSong?.youtubeId === song.youtubeId}
                isPlaying={isPlaying && currentSong?.youtubeId === song.youtubeId}
                isLiked={likedSongs.some(s => s.youtubeId === song.youtubeId)}
                onPlay={handlePlay}
                onLike={handleLike}
              />
            ))
          }
        </div>
      </section>

      {/* Popular Artists */}
      {artists.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <div className="section-header">
            <h2 className="section-title">Popular Artists</h2>
          </div>
          <div className="artists-grid">
            {artists.slice(0, 8).map(artist => {
              const following = isFollowing(artist.name);
              return (
                <div key={artist.name} className="artist-card" style={{ cursor: 'default' }}>
                  <div className="artist-avatar" style={{ cursor: 'pointer' }} onClick={() => onArtistClick ? onArtistClick(artist) : showToast(`Searching for ${artist.name}`)}>
                    {artist.thumbnail
                      ? <img src={artist.thumbnail} alt={artist.name} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, background: '#1a1a1a' }}>🎤</div>
                    }
                    <div className="artist-avatar-ring" />
                  </div>
                  <div className="artist-name" style={{ cursor: 'pointer' }} onClick={() => onArtistClick ? onArtistClick(artist) : undefined}>{artist.name}</div>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (following) {
                        unfollowArtist(artist.name);
                        showToast(`Unfollowed ${artist.name}`);
                      } else {
                        followArtist(artist);
                        showToast(`Following ${artist.name} ✓`, 'success');
                      }
                    }}
                    style={{
                      marginTop: 6,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      padding: '5px 14px', borderRadius: 999,
                      background: following ? 'rgba(255,107,157,0.12)' : 'rgba(255,255,255,0.08)',
                      border: `1px solid ${following ? 'rgba(255,107,157,0.4)' : 'rgba(255,255,255,0.12)'}`,
                      color: following ? 'var(--pink)' : 'var(--text-sub)',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      fontFamily: 'inherit', transition: 'all 0.2s',
                    }}
                  >
                    {following
                      ? <><UserCheck size={11} /> Following</>
                      : <><UserPlus size={11} /> Follow</>
                    }
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Ad — in normal scroll flow, never inside conditionals */}
      <AdBanner slot="6203471608" style={{ marginBottom: 32 }} />

      {/* Recently Played */}
      {recentSongs.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <div className="section-header">
            <h2 className="section-title">Recently Played</h2>
          </div>
          {recentSongs.slice(0, 8).map((song, i) => (
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
        </section>
      )}
    </div>
  );
}
