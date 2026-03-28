import { SoundwaveIcon } from "@/components/common/Soundwavelogo";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search as SearchIcon, X, Loader, ListPlus, Youtube, Music } from 'lucide-react';
import { YouTubeService } from '@/services/youtube';
import { JamendoService, type JamendoTrack } from '@/services/jamendoService';
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

type SearchTab = 'youtube' | 'jamendo';

function JamendoCard({ track, isActive, isPlaying, onPlay }: {
  track: JamendoTrack;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: (song: Song) => void;
}) {
  const song = JamendoService.toSong(track);
  return (
    <div
      onClick={() => onPlay(song)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
        borderRadius: 12, marginBottom: 4, cursor: 'pointer',
        background: isActive ? 'rgba(29,185,84,0.08)' : 'transparent',
        border: `1px solid ${isActive ? 'rgba(29,185,84,0.2)' : 'transparent'}`,
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => { if (!isActive) (e.currentTarget.style.background = 'rgba(255,255,255,0.05)'); }}
      onMouseLeave={e => { if (!isActive) (e.currentTarget.style.background = 'transparent'); }}
    >
      {/* Cover */}
      <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: '#1a1a2a', flexShrink: 0 }}>
        {track.cover
          ? <img src={track.cover} alt={track.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Music size={16} color="rgba(255,255,255,0.2)" />
            </div>
        }
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: isActive ? '#1DB954' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {isPlaying && isActive ? '▶ ' : ''}{track.title}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
          {track.artist}
          {track.albumName && ` · ${track.albumName}`}
        </div>
      </div>

      {/* Duration + CC badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {track.tags && (
          <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(29,185,84,0.12)', color: '#1DB954', fontWeight: 700 }}>
            FREE
          </span>
        )}
        {track.duration > 0 && (
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
            {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}
          </span>
        )}
      </div>
    </div>
  );
}

export function SearchView({ onArtistClick }: { onArtistClick?: (artist: import('@/types').Artist) => void }) {
  const [query,       setQuery]       = useState('');
  const [tab,         setTab]         = useState<SearchTab>('youtube');
  const [ytResults,   setYtResults]   = useState<Song[]>([]);
  const [jmResults,   setJmResults]   = useState<JamendoTrack[]>([]);
  const [jmTrending,  setJmTrending]  = useState<JamendoTrack[]>([]);
  const [recommended, setRecommended] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searched,    setSearched]    = useState(false);
  const debounceRef = useRef<number | null>(null);

  const { currentSong, isPlaying, pendingPlaylist, setPendingPlaylist, openAddToPlaylist } = usePlayerStore();
  const { likedSongs, loadQueue } = useLibraryStore();
  const { loadAndPlay } = useYouTubePlayer();
  const { showToast }   = useToast();

  useEffect(() => {
    YouTubeService.getRecommended(6).then(setRecommended).catch(() => {});
    JamendoService.getTrending('', 12).then(setJmTrending).catch(() => {});
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setYtResults([]); setJmResults([]); setSearched(false); return; }
    const v = RateLimiter.validateSearchQuery(q);
    if (!v.valid) { showToast(v.error ?? 'Invalid query', 'error'); return; }
    setIsSearching(true); setSearched(true);
    try {
      // Search both in parallel
      const [ytSongs, jmTracks] = await Promise.allSettled([
        YouTubeService.search(v.sanitized),
        JamendoService.search(v.sanitized, 10),
      ]);
      setYtResults(ytSongs.status === 'fulfilled' ? ytSongs.value : []);
      setJmResults(jmTracks.status === 'fulfilled' ? jmTracks.value : []);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Search failed', 'error');
    } finally { setIsSearching(false); }
  }, [showToast]);

  const handleInput = (value: string) => {
    setQuery(value);
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => doSearch(value), 600);
  };

  const handlePlayYT = useCallback((song: Song) => {
    const queue = ytResults.length > 0 ? ytResults : recommended.length > 0 ? recommended : [song];
    loadQueue(queue, Math.max(0, queue.findIndex(s => s.youtubeId === song.youtubeId)));
    loadAndPlay(song);
    showToast(`Playing: ${song.title.slice(0, 28)}`);
  }, [ytResults, recommended, loadQueue, loadAndPlay, showToast]);

  const handlePlayJamendo = useCallback((song: Song) => {
    const queue = (searched ? jmResults : jmTrending).map(t => JamendoService.toSong(t));
    loadQueue(queue, Math.max(0, queue.findIndex(s => s.youtubeId === song.youtubeId)));
    loadAndPlay(song);
    showToast(`Playing: ${song.title.slice(0, 28)}`);
  }, [jmResults, jmTrending, searched, loadQueue, loadAndPlay, showToast]);

  const handleLike = useCallback((song: Song) => {
    const liked = useLibraryStore.getState().toggleLike(song);
    showToast(liked ? '♥ Added to Liked Songs' : '♡ Removed');
  }, [showToast]);

  const displayJmTracks = searched ? jmResults : jmTrending;

  return (
    <div>
      {/* Pending playlist banner */}
      {pendingPlaylist && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, padding:'10px 16px', marginBottom:12, background:'linear-gradient(135deg,rgba(255,107,157,0.15),rgba(224,85,135,0.08))', border:'1px solid rgba(255,107,157,0.3)', borderRadius:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:'rgba(255,107,157,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <ListPlus size={16} color="var(--pink)" />
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--pink)' }}>Adding to playlist</div>
              <div style={{ fontSize:13, fontWeight:600, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{pendingPlaylist.name}</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
            <div style={{ fontSize:11, color:'var(--text-muted)' }}>Tap + on any song</div>
            <button onClick={() => setPendingPlaylist(null)} style={{ width:28, height:28, borderRadius:'50%', background:'rgba(255,255,255,0.08)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-muted)' }}>
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Search bar */}
      <div className="search-bar-wrap">
        <div className="search-bar">
          <SearchIcon className="search-bar-icon" />
          <input
            type="text" value={query}
            onChange={e => handleInput(e.target.value)}
            placeholder="Artists, songs, or podcasts..."
            maxLength={200} autoComplete="off"
          />
          {query && (
            <button className="search-bar-clear" onClick={() => { setQuery(''); setYtResults([]); setJmResults([]); setSearched(false); }}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Source tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:16 }}>
        <button onClick={() => setTab('youtube')} style={{ flex:1, padding:'9px', borderRadius:10, border:`1.5px solid ${tab==='youtube' ? 'rgba(255,0,0,0.4)' : 'rgba(255,255,255,0.08)'}`, background: tab==='youtube' ? 'rgba(255,0,0,0.08)' : 'rgba(255,255,255,0.03)', color: tab==='youtube' ? '#ff4444' : 'var(--text-muted)', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
          <Youtube size={14} /> Wave
          {searched && ytResults.length > 0 && <span style={{ fontSize:10, background:'rgba(255,0,0,0.15)', padding:'1px 6px', borderRadius:10 }}>{ytResults.length}</span>}
        </button>
        <button onClick={() => setTab('jamendo')} style={{ flex:1, padding:'9px', borderRadius:10, border:`1.5px solid ${tab==='jamendo' ? 'rgba(29,185,84,0.4)' : 'rgba(255,255,255,0.08)'}`, background: tab==='jamendo' ? 'rgba(29,185,84,0.08)' : 'rgba(255,255,255,0.03)', color: tab==='jamendo' ? '#1DB954' : 'var(--text-muted)', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
          <Music size={14} /> Jamendo
          {searched && jmResults.length > 0 && <span style={{ fontSize:10, background:'rgba(29,185,84,0.15)', padding:'1px 6px', borderRadius:10 }}>{jmResults.length}</span>}
          <span style={{ fontSize:9, background:'rgba(29,185,84,0.1)', color:'#1DB954', padding:'1px 5px', borderRadius:4, fontWeight:700 }}>FREE</span>
        </button>
      </div>

      {/* Loading */}
      {isSearching && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'64px 0', gap:12, color:'var(--text-muted)' }}>
          <Loader size={18} style={{ animation:'spin 1s linear infinite' }} />
          <span style={{ fontSize:14 }}>Searching...</span>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {!isSearching && (
        <>
          {/* ── YOUTUBE TAB ── */}
          {tab === 'youtube' && (
            <>
              {searched && ytResults.length > 0 && (
                <section style={{ marginBottom:40 }}>
                  <h2 className="section-title" style={{ marginBottom:16 }}>
                    YouTube · "<span style={{ color:'var(--pink)' }}>{query}</span>"
                  </h2>
                  {ytResults.map((song, i) => (
                    <SongCard key={song.youtubeId} song={song} layout="row" index={i}
                      isActive={currentSong?.youtubeId === song.youtubeId}
                      isPlaying={isPlaying && currentSong?.youtubeId === song.youtubeId}
                      isLiked={likedSongs.some(s => s.youtubeId === song.youtubeId)}
                      onPlay={handlePlayYT} onLike={handleLike}
                    />
                  ))}
                </section>
              )}
              {searched && ytResults.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon"><SoundwaveIcon size={36} color="var(--text-muted)" /></div>
                  <div className="empty-state-title">No YouTube results</div>
                  <div className="empty-state-sub">Try Jamendo for free music</div>
                </div>
              )}
              {!searched && recommended.length > 0 && (
                <section style={{ marginBottom:40 }}>
                  <h2 className="section-title" style={{ marginBottom:16 }}>Recommended for you</h2>
                  <div className="songs-grid songs-grid-sm">
                    {recommended.map(song => (
                      <SongCard key={song.youtubeId} song={song}
                        isActive={currentSong?.youtubeId === song.youtubeId}
                        isPlaying={isPlaying && currentSong?.youtubeId === song.youtubeId}
                        isLiked={likedSongs.some(s => s.youtubeId === song.youtubeId)}
                        onPlay={handlePlayYT} onLike={handleLike}
                      />
                    ))}
                  </div>
                </section>
              )}
              {!searched && (
                <section>
                  <h2 className="section-title" style={{ marginBottom:16 }}>Browse Categories</h2>
                  <div className="browse-grid">
                    {BROWSE.map(cat => (
                      <button key={cat.label} className="browse-card"
                        style={{ background:`linear-gradient(135deg,${cat.from},${cat.to})` }}
                        onClick={() => handleInput(cat.label)}
                      >
                        <div className="browse-card-emoji">{cat.emoji}</div>
                        <div className="browse-card-label">{cat.label}</div>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {/* ── JAMENDO TAB ── */}
          {tab === 'jamendo' && (
            <>
              {/* Info banner */}
              <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px', borderRadius:12, background:'rgba(29,185,84,0.06)', border:'1px solid rgba(29,185,84,0.15)', marginBottom:16 }}>
                <Music size={14} color="#1DB954" style={{ marginTop:2, flexShrink:0 }} />
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)', lineHeight:1.5 }}>
                  <strong style={{ color:'#1DB954' }}>Jamendo</strong> — Free & legal music under Creative Commons.
                  Full songs, no ads, can be saved for offline use.
                </div>
              </div>

              {searched && jmResults.length > 0 && (
                <section style={{ marginBottom:40 }}>
                  <h2 className="section-title" style={{ marginBottom:16 }}>
                    Jamendo · "<span style={{ color:'#1DB954' }}>{query}</span>"
                  </h2>
                  {jmResults.map(track => (
                    <JamendoCard key={track.jamendoId} track={track}
                      isActive={currentSong?.youtubeId === track.youtubeId}
                      isPlaying={isPlaying && currentSong?.youtubeId === track.youtubeId}
                      onPlay={handlePlayJamendo}
                    />
                  ))}
                </section>
              )}
              {searched && jmResults.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon"><Music size={36} color="var(--text-muted)" /></div>
                  <div className="empty-state-title">No Jamendo results</div>
                  <div className="empty-state-sub">Try a different search term</div>
                </div>
              )}
              {!searched && displayJmTracks.length > 0 && (
                <section style={{ marginBottom:40 }}>
                  <h2 className="section-title" style={{ marginBottom:16 }}>🔥 Trending on Jamendo</h2>
                  {displayJmTracks.map(track => (
                    <JamendoCard key={track.jamendoId} track={track}
                      isActive={currentSong?.youtubeId === track.youtubeId}
                      isPlaying={isPlaying && currentSong?.youtubeId === track.youtubeId}
                      onPlay={handlePlayJamendo}
                    />
                  ))}
                </section>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
