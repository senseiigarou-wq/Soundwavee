# 🎵 Soundwave — React TypeScript Music Player

A Spotify-inspired music player built with React, TypeScript, Vite, Tailwind CSS, Zustand, and the YouTube Data API v3.

---

## ✨ Features

- 🔐 **Google OAuth Login** — Sign in with your Gmail account
- 🎵 **YouTube-powered playback** — Full YouTube IFrame API integration
- 🔥 **Trending Songs** — Browse by genre (Pop, Phonk, R&B, Hip-Hop, OPM, Indie)
- 🔍 **Search** — Real-time music search with debouncing
- ❤️ **Liked Songs** — Like/unlike tracks, stored persistently
- 📚 **Library** — Create and manage playlists, view history
- 🔀 **Shuffle & Repeat** — Full playback controls
- 🛡️ **Rate Limiting** — Token bucket algorithm protects your API quota
- 📱 **Fully Responsive** — Desktop sidebar + mobile bottom nav
- 💾 **Persistent Storage** — All data saved to localStorage

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your API keys:

```env
VITE_YOUTUBE_API_KEY=your_youtube_api_key_here
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 3. Run in development

```bash
npm run dev
```

### 4. Build for production

```bash
npm run build
```

---

## 🔑 Getting API Keys

### YouTube Data API v3

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **YouTube Data API v3**
4. Go to **Credentials → Create Credentials → API Key**
5. **Restrict the key**: Application restrictions → HTTP referrers, add your domain
6. **API restrictions**: Restrict to YouTube Data API v3
7. Copy the key to `VITE_YOUTUBE_API_KEY`

### Google OAuth 2.0 (for Gmail login)

1. In the same Google Cloud Console project
2. Go to **Credentials → Create Credentials → OAuth 2.0 Client ID**
3. Application type: **Web Application**
4. Authorized JavaScript origins:
   - `http://localhost:5173` (development)
   - `https://yourdomain.com` (production)
5. Copy the Client ID to `VITE_GOOGLE_CLIENT_ID`

> **Note:** If you skip Google OAuth setup, the app runs in **Demo Mode** with a demo user — great for testing!

---

## 🛡️ Security Features

### Rate Limiting
- **Token Bucket Algorithm** — Prevents API quota exhaustion
- Default: 30 requests per minute per action type
- Configurable via `.env` (`VITE_RATE_LIMIT_MAX_REQUESTS`, `VITE_RATE_LIMIT_WINDOW_MS`)
- Separate buckets for: search, trending, artists, auth

### Input Validation
- All search queries are sanitized (strips control chars, XSS patterns, SQL injection attempts)
- Playlist names validated and sanitized
- Max query length: 200 characters
- Max playlist name: 60 characters

### Environment Variables
- All sensitive keys in `.env` (never committed to git)
- Single `src/config/env.ts` — the only place `import.meta.env` is accessed
- `.env` is in `.gitignore` by default

---

## 📁 Project Structure

```
soundwave/
├── .env.example          # ← Copy to .env and fill in keys
├── src/
│   ├── config/
│   │   └── env.ts        # ← All env vars accessed here only
│   ├── types/
│   │   └── index.ts      # TypeScript interfaces
│   ├── services/
│   │   ├── youtube.ts    # YouTube API calls + caching
│   │   ├── rateLimiter.ts # Token bucket rate limiter
│   │   └── storage.ts    # localStorage wrapper
│   ├── store/
│   │   ├── authStore.ts  # Auth state (Zustand)
│   │   ├── playerStore.ts # Player state (Zustand)
│   │   └── libraryStore.ts # Library state (Zustand)
│   ├── hooks/
│   │   └── useYouTubePlayer.ts # YouTube IFrame hook
│   └── components/
│       ├── Auth/LoginPage.tsx
│       ├── Layout/  (Sidebar, BottomNav, AppLayout)
│       ├── Player/  (NowPlayingBar, FullPlayer)
│       ├── Home/HomeView.tsx
│       ├── Search/SearchView.tsx
│       ├── Library/LibraryView.tsx
│       └── Common/  (Toast, SongCard)
```

---

## 🎨 Tech Stack

| Tool | Purpose |
|------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool |
| Tailwind CSS | Styling |
| Zustand | State management |
| @react-oauth/google | Google OAuth |
| lucide-react | Icons |
| YouTube IFrame API | Music playback |

---

## ⚠️ Important Notes

- YouTube playback requires videos to allow embedding. Some videos may be blocked.
- The YouTube Data API has a **daily quota of 10,000 units** (free tier). Rate limiting helps preserve this.
- Never commit your `.env` file — always use `.env.example` as the template.
- For production, restrict your YouTube API key to your specific domain.
