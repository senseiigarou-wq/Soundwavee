// ============================================================
// SOUNDWAVE — Lyrics Service
// Uses lrclib.net — free, no API key required.
// Returns plain text lyrics OR synced LRC lyrics with timestamps.
// ============================================================

export interface LyricLine {
  time:  number;   // seconds
  text:  string;
}

export interface LyricsResult {
  synced:      LyricLine[];   // [] if no timestamps
  plain:       string;        // fallback plain text
  hasSynced:   boolean;
  source:      string;
}

// In-memory cache per session
const _cache = new Map<string, LyricsResult | null>();

function parseLRC(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];
  for (const line of lrc.split('\n')) {
    const match = line.match(/^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
    if (!match) continue;
    const min  = parseInt(match[1]);
    const sec  = parseInt(match[2]);
    const ms   = parseInt(match[3].padEnd(3, '0'));
    const text = match[4].trim();
    lines.push({ time: min * 60 + sec + ms / 1000, text });
  }
  return lines.filter(l => l.text.length > 0);
}

export async function fetchLyrics(
  title: string,
  artist: string
): Promise<LyricsResult | null> {
  const key = `${title}::${artist}`.toLowerCase();
  if (_cache.has(key)) return _cache.get(key) ?? null;

  try {
    // Clean up title — remove "(Official Video)", "(Lyrics)", etc.
    const cleanTitle  = title.replace(/\(.*?\)|\[.*?\]/g, '').trim();
    const cleanArtist = artist.replace(/\(.*?\)|\[.*?\]/g, '').trim();

    const q = encodeURIComponent(`${cleanTitle} ${cleanArtist}`);
    const res = await fetch(
      `https://lrclib.net/api/search?q=${q}`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!res.ok) { _cache.set(key, null); return null; }

    const results = await res.json() as Array<{
      syncedLyrics?: string;
      plainLyrics?:  string;
      trackName:     string;
      artistName:    string;
    }>;

    if (!results?.length) { _cache.set(key, null); return null; }

    // Pick best match — prefer synced lyrics
    const withSynced = results.find(r => r.syncedLyrics);
    const withPlain  = results.find(r => r.plainLyrics);
    const best       = withSynced ?? withPlain ?? results[0];

    if (!best.syncedLyrics && !best.plainLyrics) {
      _cache.set(key, null);
      return null;
    }

    const synced  = best.syncedLyrics ? parseLRC(best.syncedLyrics) : [];
    const plain   = best.plainLyrics ?? best.syncedLyrics ?? '';

    const result: LyricsResult = {
      synced,
      plain,
      hasSynced: synced.length > 0,
      source: 'lrclib.net',
    };

    _cache.set(key, result);
    return result;
  } catch {
    _cache.set(key, null);
    return null;
  }
}

/** Given synced lyrics + current playback time, return active line index */
export function getActiveLine(lines: LyricLine[], currentTime: number): number {
  let active = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= currentTime) active = i;
    else break;
  }
  return active;
}
