import { SoundwaveIcon } from "@/components/common/Soundwavelogo";
import { useState, useEffect, useCallback, useRef } from 'react';
import { Search as SearchIcon, X, Loader } from 'lucide-react';
import { YouTubeService } from '@/services/youtube';
import { usePlayerStore } from '@/store/playStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useYouTubePlayer } from '@/hooks/useYoutubePlayer';
import { useToast } from '@/components/common/Toast';
import { SongCard } from '@/components/common/Songcard';
import { RateLimiter } from '@/services/ratelimiter';
import type { Song } from '@/types';

const BROWSE = [
  { label: 'Pop', emoji: '🎤', from: '#1a1035', to: '#2a1545' },
  { label: 'Hip-Hop', emoji: '🎧', from: '#0d2137', to: '#0d1a2a' },
  { label: 'R&B', emoji: '🎶', from: '#2a1a00', to: '#1a1200' },
  { label: 'Phonk', emoji: '⚡', from: '#2a0d0d', to: '#1a0808' },
  { label: 'Indie', emoji: '⚡', from: '#0d2010', to: '#0a1a0d' },
  { label: 'OPM', emoji: '🇵🇭', from: '#0d1a2a', to: '#061018' },
];

export function SearchView() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [recommended, setRecommended] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<number | null>(null);

  const { currentSong, isPlaying } = usePlayerStore();
  const { likedSongs, addSong } = useLibraryStore();
  const { loadAndPlay } = useYouTubePlayer();
  const { showToast } = useToast();

  useEffect(() => {
    YouTubeService.getRecommended(6).then(setRecommended).catch(() => {});
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    const v = RateLimiter.validateSearchQuery(q);
    if (!v.valid) { showToast(v.error ?? 'Invalid query', 'error'); return; }
    setIsSearching(true); setSearched(true);
    try {
      const songs = await YouTubeService.search(v.sanitized);
      setResults(songs);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Search failed', 'error');
    } finally { setIsSearching(false); }
  }, [showToast]);

  const handleInput = (value: string) => {
    setQuery(value);
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => doSearch(value), 600);
  };

  const handlePlay = useCallback((song: Song) => {
    addSong(song); loadAndPlay(song);
    showToast(`Playing: ${song.title.slice(0, 28)}`);
  }, [addSong, loadAndPlay, showToast]);

  const handleLike = useCallback((song: Song) => {
    const liked = useLibraryStore.getState().toggleLike(song);
    showToast(liked ? '♥ Added to Liked Songs' : '♡ Removed');
  }, [showToast]);

  return (
    <div>
      {/* Search bar */}
      <div className="search-bar-wrap">
        <div className="search-bar">
          <SearchIcon className="search-bar-icon" />
          <input
            type="text"
            value={query}
            onChange={e => handleInput(e.target.value)}
            placeholder="Artists, songs, or podcasts..."
            maxLength={200}
            autoComplete="off"
          />
          {query && (
            <button className="search-bar-clear" onClick={() => { setQuery(''); setResults([]); setSearched(false); }}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {isSearching && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: 12, color: 'var(--text-muted)' }}>
          <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 14 }}>Searching...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Results */}
      {!isSearching && searched && results.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <h2 className="section-title" style={{ marginBottom: 16 }}>
            Results for "<span style={{ color: 'var(--pink)' }}>{query}</span>"
          </h2>
          {results.map((song, i) => (
            <SongCard key={song.youtubeId} song={song} layout="row" index={i}
              isActive={currentSong?.youtubeId === song.youtubeId}
              isPlaying={isPlaying && currentSong?.youtubeId === song.youtubeId}
              isLiked={likedSongs.some(s => s.youtubeId === song.youtubeId)}
              onPlay={handlePlay} onLike={handleLike}
            />
          ))}
        </section>
      )}

      {/* No results */}
      {!isSearching && searched && results.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon"><SoundwaveIcon size={36} color="var(--text-muted)" /></div>
          <div className="empty-state-title">No results found</div>
          <div className="empty-state-sub">Try a different search term</div>
        </div>
      )}

      {/* Recommended */}
      {!searched && recommended.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <h2 className="section-title" style={{ marginBottom: 16 }}>Recommended for you</h2>
          <div className="songs-grid songs-grid-sm">
            {recommended.map(song => (
              <SongCard key={song.youtubeId} song={song}
                isActive={currentSong?.youtubeId === song.youtubeId}
                isPlaying={isPlaying && currentSong?.youtubeId === song.youtubeId}
                isLiked={likedSongs.some(s => s.youtubeId === song.youtubeId)}
                onPlay={handlePlay} onLike={handleLike}
              />
            ))}
          </div>
        </section>
      )}

      {/* Browse */}
      {!searched && (
        <section>
          <h2 className="section-title" style={{ marginBottom: 16 }}>Browse Categories</h2>
          <div className="browse-grid">
            {BROWSE.map(cat => (
              <button
                key={cat.label}
                className="browse-card"
                style={{ background: `linear-gradient(135deg, ${cat.from}, ${cat.to})` }}
                onClick={() => handleInput(cat.label)}
              >
                <div className="browse-card-emoji">{cat.emoji}</div>
                <div className="browse-card-label">{cat.label}</div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}