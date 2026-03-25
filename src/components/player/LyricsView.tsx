// ============================================================
// SOUNDWAVE — Lyrics View
// Synced scrolling lyrics like Spotify — highlights current line,
// auto-scrolls to keep it centered.
// ============================================================
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, MicOff, Loader } from 'lucide-react';
import { fetchLyrics, getActiveLine, type LyricsResult } from '@/services/lyricsService';
import type { Song } from '@/types';

interface LyricsViewProps {
  song:        Song;
  currentTime: number;
  isPlaying:   boolean;
}

export function LyricsView({ song, currentTime, isPlaying }: LyricsViewProps) {
  const [lyrics,   setLyrics]   = useState<LyricsResult | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeLine, setActiveLine] = useState(0);
  const [userScrolled, setUserScrolled] = useState(false);

  const scrollRef   = useRef<HTMLDivElement>(null);
  const lineRefs    = useRef<(HTMLDivElement | null)[]>([]);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch lyrics when song changes
  useEffect(() => {
    setLyrics(null);
    setLoading(true);
    setNotFound(false);
    setActiveLine(0);
    setUserScrolled(false);

    fetchLyrics(song.title, song.artist).then(result => {
      if (result) {
        setLyrics(result);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    });
  }, [song.youtubeId]);

  // Update active line as song plays
  useEffect(() => {
    if (!lyrics?.hasSynced) return;
    const idx = getActiveLine(lyrics.synced, currentTime);
    setActiveLine(idx);
  }, [currentTime, lyrics]);

  // Auto-scroll to active line (unless user manually scrolled)
  useEffect(() => {
    if (userScrolled) return;
    const el = lineRefs.current[activeLine];
    if (el && scrollRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLine, userScrolled]);

  // Detect user scroll — pause auto-scroll for 4 seconds
  const handleScroll = useCallback(() => {
    setUserScrolled(true);
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => setUserScrolled(false), 4000);
  }, []);

  useEffect(() => {
    return () => { if (scrollTimer.current) clearTimeout(scrollTimer.current); };
  }, []);

  // ── Loading ──
  if (loading) {
    return (
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, color:'rgba(255,255,255,0.4)' }}>
        <Loader size={24} style={{ animation:'lv-spin 0.8s linear infinite' }} />
        <span style={{ fontSize:13 }}>Loading lyrics…</span>
        <style>{`@keyframes lv-spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ── Not found ──
  if (notFound || !lyrics) {
    return (
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, color:'rgba(255,255,255,0.3)', padding:'0 24px', textAlign:'center' }}>
        <MicOff size={36} style={{ opacity:0.4 }} />
        <div style={{ fontSize:15, fontWeight:700, color:'rgba(255,255,255,0.5)' }}>No lyrics found</div>
        <div style={{ fontSize:12, lineHeight:1.6 }}>
          Lyrics for "{song.title}" are not available yet.
        </div>
      </div>
    );
  }

  // ── Plain lyrics (no timestamps) ──
  if (!lyrics.hasSynced) {
    return (
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{ flex:1, overflowY:'auto', padding:'16px 20px 40px', scrollbarWidth:'none' }}
      >
        <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:16, display:'flex', alignItems:'center', gap:6 }}>
          <Mic size={12} /> Lyrics
        </div>
        {lyrics.plain.split('\n').map((line, i) => (
          <div key={i} style={{ fontSize:15, lineHeight:1.9, color: line ? 'rgba(255,255,255,0.85)' : 'transparent', minHeight:24, userSelect:'text' }}>
            {line || '·'}
          </div>
        ))}
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.2)', marginTop:20, textAlign:'center' }}>
          Lyrics · lrclib.net
        </div>
      </div>
    );
  }

  // ── Synced lyrics ──
  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      style={{ flex:1, overflowY:'auto', padding:'24px 20px 60px', scrollbarWidth:'none', position:'relative' }}
    >
      {/* Top fade */}
      <div style={{ position:'sticky', top:0, left:0, right:0, height:40, background:'linear-gradient(to bottom, rgba(13,13,13,0.9), transparent)', zIndex:2, pointerEvents:'none', marginBottom:-40 }} />

      {lyrics.synced.map((line, i) => {
        const isActive   = i === activeLine;
        const isPast     = i < activeLine;
        const isUpcoming = i > activeLine;

        return (
          <div
            key={i}
            ref={el => { lineRefs.current[i] = el; }}
            style={{
              fontSize:   isActive ? 22 : 18,
              fontWeight: isActive ? 800 : 600,
              lineHeight: 1.4,
              marginBottom: 18,
              cursor: 'pointer',
              color: isActive
                ? '#fff'
                : isPast
                  ? 'rgba(255,255,255,0.35)'
                  : 'rgba(255,255,255,0.5)',
              transform:  isActive ? 'scale(1.02)' : 'scale(1)',
              transformOrigin: 'left center',
              transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
              textShadow: isActive ? '0 0 30px rgba(255,255,255,0.3)' : 'none',
              userSelect: 'text',
            }}
          >
            {line.text}
          </div>
        );
      })}

      {/* Bottom fade */}
      <div style={{ position:'sticky', bottom:0, left:0, right:0, height:60, background:'linear-gradient(to top, rgba(13,13,13,0.9), transparent)', pointerEvents:'none', marginTop:-60 }} />

      <div style={{ fontSize:11, color:'rgba(255,255,255,0.2)', marginTop:20, textAlign:'center' }}>
        Lyrics · lrclib.net
      </div>
    </div>
  );
}
