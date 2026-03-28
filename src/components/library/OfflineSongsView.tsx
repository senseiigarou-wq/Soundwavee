// ============================================================
// SOUNDWAVE — Offline Songs Library
// Shows all Jamendo songs the user has cached for offline use.
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { WifiOff, Trash2, Play, Pause, Music, Download } from 'lucide-react';
import {
  getOfflineSongs,
  removeSongFromOffline,
  getOfflineCacheSize,
} from '@/services/offlineService';
import { usePlayerStore } from '@/store/playStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useYouTubePlayer } from '@/hooks/useYoutubePlayer';
import { useToast } from '@/components/common/Toast';
import type { Song } from '@/types';

export function OfflineSongsView() {
  const [songs,      setSongs]      = useState<Song[]>([]);
  const [cacheSize,  setCacheSize]  = useState('');
  const [removing,   setRemoving]   = useState<string | null>(null);

  const { currentSong, isPlaying } = usePlayerStore();
  const { loadQueue }              = useLibraryStore();
  const { loadAndPlay }            = useYouTubePlayer();
  const { showToast }              = useToast();

  const refresh = useCallback(() => {
    setSongs(getOfflineSongs());
    getOfflineCacheSize().then(setCacheSize);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handlePlay = useCallback((song: Song, index: number) => {
    loadQueue(songs, index);
    loadAndPlay(song);
    showToast(`▶ ${song.title.slice(0, 28)}`);
  }, [songs, loadQueue, loadAndPlay, showToast]);

  const handleRemove = async (song: Song) => {
    setRemoving(song.youtubeId);
    await removeSongFromOffline(song.youtubeId);
    refresh();
    showToast('Removed from offline');
    setRemoving(null);
  };

  const handlePlayAll = () => {
    if (!songs.length) return;
    loadQueue(songs, 0);
    loadAndPlay(songs[0]);
    showToast(`Playing ${songs.length} offline songs`);
  };

  if (songs.length === 0) {
    return (
      <div style={{ textAlign:'center', padding:'48px 24px', color:'rgba(255,255,255,0.4)' }}>
        <WifiOff size={40} style={{ marginBottom:14, opacity:0.3 }} />
        <div style={{ fontSize:16, fontWeight:700, color:'rgba(255,255,255,0.6)', marginBottom:8 }}>
          No offline songs yet
        </div>
        <div style={{ fontSize:13, lineHeight:1.7 }}>
          Go to <strong style={{ color:'var(--pink)' }}>Search → Jamendo</strong> tab and
          tap the <Download size={11} style={{ verticalAlign:'middle' }} /> button on any
          song to save it for offline playback.
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.5)' }}>
            {songs.length} songs · {cacheSize}
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={handlePlayAll} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:999, background:'var(--pink)', border:'none', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
            <Play size={13} fill="currentColor" /> Play All
          </button>
        </div>
      </div>

      {/* Song list */}
      {songs.map((song, i) => {
        const isActive  = currentSong?.youtubeId === song.youtubeId;
        const isThisPlaying = isActive && isPlaying;

        return (
          <div key={song.youtubeId}
            style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:12, marginBottom:4, background: isActive ? 'rgba(29,185,84,0.08)' : 'transparent', border:`1px solid ${isActive ? 'rgba(29,185,84,0.2)' : 'transparent'}`, transition:'all 0.2s', cursor:'pointer' }}
            onClick={() => handlePlay(song, i)}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
          >
            {/* Index */}
            <div style={{ width:24, textAlign:'center', flexShrink:0 }}>
              {isThisPlaying
                ? <div style={{ display:'flex', gap:2, alignItems:'flex-end', justifyContent:'center', height:16 }}>
                    {[1,2,3].map(b => <div key={b} style={{ width:3, background:'#1DB954', borderRadius:2, animation:`eq${b} 0.8s ease-in-out infinite alternate`, height:`${8+b*3}px` }} />)}
                  </div>
                : <span style={{ fontSize:12, color: isActive ? '#1DB954' : 'rgba(255,255,255,0.3)', fontWeight:600 }}>{i+1}</span>
              }
            </div>

            {/* Cover */}
            <div style={{ width:44, height:44, borderRadius:8, overflow:'hidden', background:'#1a1a2a', flexShrink:0 }}>
              {song.cover
                ? <img src={song.cover} alt={song.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}><Music size={16} color="rgba(255,255,255,0.2)" /></div>
              }
            </div>

            {/* Info */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:14, fontWeight:600, color: isActive ? '#1DB954' : '#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{song.title}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:1, display:'flex', alignItems:'center', gap:6 }}>
                {song.artist}
                <span style={{ fontSize:9, padding:'1px 5px', borderRadius:4, background:'rgba(29,185,84,0.12)', color:'#1DB954', fontWeight:700 }}>OFFLINE</span>
              </div>
            </div>

            {/* Play / pause */}
            <div style={{ color:'rgba(255,255,255,0.3)', flexShrink:0 }}>
              {isThisPlaying ? <Pause size={14} /> : <Play size={14} />}
            </div>

            {/* Remove */}
            <button onClick={e => { e.stopPropagation(); handleRemove(song); }}
              disabled={removing === song.youtubeId}
              style={{ width:28, height:28, borderRadius:8, background:'rgba(255,80,80,0.07)', border:'1px solid rgba(255,80,80,0.15)', color:'rgba(255,100,100,0.7)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.18)'; e.currentTarget.style.color = '#ff6b6b'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.07)'; e.currentTarget.style.color = 'rgba(255,100,100,0.7)'; }}
            >
              {removing === song.youtubeId
                ? <div style={{ width:10, height:10, border:'2px solid rgba(255,100,100,0.3)', borderTopColor:'#ff6b6b', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
                : <Trash2 size={12} />
              }
            </button>
          </div>
        );
      })}

      <style>{`
        @keyframes eq1{from{height:6px}to{height:14px}}
        @keyframes eq2{from{height:10px}to{height:6px}}
        @keyframes eq3{from{height:4px}to{height:12px}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}