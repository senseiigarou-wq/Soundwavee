import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, ChevronRight, UserPlus, UserCheck, Disc3, Radio, BarChart3, ExternalLink } from 'lucide-react';
import { YouTubeService } from '@/services/youtube';
import { SpotifyClient, type SpotifyAlbum, type SpotifyPlaylist, type SpotifyStation } from '@/services/spotifyClient';
import { usePlayerStore } from '@/store/playStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useYouTubePlayer } from '@/hooks/useYoutubePlayer';
import { useToast } from '@/components/common/Toast';
import { SongCard } from '@/components/common/Songcard';
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

export function HomeView({ onArtistClick, onSeeAll }: { onArtistClick?: (artist: Artist) => void; onSeeAll?: (genre: Genre, label: string) => void }) {
  const [trending, setTrending] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeGenre, setActiveGenre] = useState<Genre>('all');
  const [newReleases, setNewReleases]     = useState<SpotifyAlbum[]>([]);
  const [featured, setFeatured]           = useState<SpotifyPlaylist[]>([]);
  const [radioStations, setRadioStations] = useState<SpotifyStation[]>([]);

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
    // Load Spotify sections in parallel (non-blocking)
    SpotifyClient.getNewReleases(10).then(setNewReleases).catch(() => {});
    SpotifyClient.getFeaturedPlaylists(8).then(setFeatured).catch(() => {});
    SpotifyClient.getRadioStations(8).then(setRadioStations).catch(() => {});
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
          <a
            href="#"
            className="section-link"
            onClick={e => { e.preventDefault(); const g = GENRES.find(x => x.id === activeGenre); onSeeAll?.(activeGenre, g?.label ?? 'Songs'); }}
          >See all <ChevronRight size={14} /></a>
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

      {/* ── New Releases (Albums & Singles) ── */}
      {newReleases.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Disc3 size={18} color="var(--pink)" />
              <h2 className="section-title">New Releases</h2>
            </div>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 4 }}>
              via Spotify
            </span>
          </div>
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
            {newReleases.map(album => (
              <a key={album.id} href={album.spotifyUrl} target="_blank" rel="noopener noreferrer"
                style={{ flexShrink: 0, width: 140, textDecoration: 'none', cursor: 'pointer' }}
              >
                <div style={{ width: 140, height: 140, borderRadius: 12, overflow: 'hidden', background: '#1a1a2a', marginBottom: 8, position: 'relative', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
                  {album.cover
                    ? <img src={album.cover} alt={album.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                      />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Disc3 size={40} color="rgba(255,255,255,0.2)" /></div>
                  }
                  <div style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.7)', borderRadius: 6, padding: '2px 7px', fontSize: 10, fontWeight: 700, color: album.type === 'single' ? '#1DB954' : 'var(--pink)', textTransform: 'uppercase' }}>
                    {album.type}
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{album.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{album.artists}</div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ── Featured Charts ── */}
      {featured.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={18} color="var(--pink)" />
              <h2 className="section-title">Featured Charts</h2>
            </div>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>via Spotify</span>
          </div>
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
            {featured.map(pl => (
              <a key={pl.id} href={pl.spotifyUrl} target="_blank" rel="noopener noreferrer"
                style={{ flexShrink: 0, width: 160, textDecoration: 'none' }}
              >
                <div style={{ width: 160, height: 160, borderRadius: 14, overflow: 'hidden', background: '#1a1a2a', marginBottom: 8, position: 'relative', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
                  {pl.cover
                    ? <img src={pl.cover} alt={pl.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                      />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BarChart3 size={40} color="rgba(255,255,255,0.2)" /></div>
                  }
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 8px 8px', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', display: 'flex', justifyContent: 'flex-end' }}>
                    <ExternalLink size={14} color="rgba(255,255,255,0.7)" />
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{pl.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pl.trackCount} tracks</div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ── Popular Radio ── */}
      {radioStations.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Radio size={18} color="var(--pink)" />
              <h2 className="section-title">Popular Radio</h2>
            </div>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>via Spotify</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 }}>
            {radioStations.map(station => (
              <div key={station.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 4px 8px', borderRadius: 14, transition: 'background 0.2s' }}
                onClick={() => { showToast(`Searching ${station.name} radio...`); }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
              >
                <div style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', background: '#1a1a2a', flexShrink: 0 }}>
                  {station.cover
                    ? <img src={station.cover} alt={station.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Radio size={28} color="rgba(255,255,255,0.2)" /></div>
                  }
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{station.name}</div>
              </div>
            ))}
          </div>
        </section>
      )}

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
