# Drive Music Player

A clean, mobile-first web app that streams individual audio tracks directly
from Google Drive. Sign in with Google, tap a track to play it (with a
seekable progress bar), browse by Songs/Albums/Artists/Playlists with
search, rename or delete files (moves to Drive trash) right from the UI,
and keep listening after locking your iPhone screen. Playlists and manual
artist/album tags are stored in your Drive account itself, so they follow
you across devices and browser sessions.

Live app: https://kreethandsouza.github.io/drive-music-player/

## Tech stack

- React + Vite + Tailwind CSS
- Google Identity Services (GIS) for OAuth (implicit token flow — no
  client secret needed in the browser)
- Google Drive API v3 for listing, renaming, trashing, and streaming files
- HTML5 `<audio>` + the Media Session API for lock-screen playback controls
- `music-metadata` to read embedded ID3/Vorbis/etc. tags for Album/Artist
  browsing, with results cached in IndexedDB

## How it works

- **Auth**: `src/lib/useGoogleAuth.js` wraps
  `google.accounts.oauth2.initTokenClient` with scope
  `https://www.googleapis.com/auth/drive`. The access token is kept in
  memory + `sessionStorage` and silently renewed a few minutes before it
  expires.
- **Drive API**: `src/lib/drive.js` lists audio files
  (`mimeType contains 'audio/' and trashed = false`), renames files (PATCH
  `name`), and moves files to trash (PATCH `trashed: true`).
- **Playback**: `src/lib/useAudioPlayer.js` owns a single persistent
  `<audio>` element. Tapping a track fetches the file bytes with
  `?alt=media` and a Bearer token, turns them into a blob URL, and plays
  it — only one track streams at a time, with no auto-advance/queueing.
  `MediaMetadata`/`mediaSession` action handlers are set so iOS shows the
  track on the lock screen and playback continues when the phone locks.
- **Albums/Artists**: Google Drive's API has no concept of "album" or
  "artist" — it only returns file name/mimeType. `src/lib/metadata.js`
  fetches a small byte-range from the start of each file (where ID3v2/
  Vorbis-comment/etc. tags and embedded cover art live) and parses it with
  `music-metadata`, entirely client-side. Parsed tags (and a downscaled
  cover art thumbnail) are cached in IndexedDB per file id + `modifiedTime`,
  so this only happens once per file. `src/lib/useLibrary.js` groups tracks
  into Albums/Artists from these tags, falling back to "Unknown
  Artist"/"Unknown Album" when a file has no tags.
- **Manual tagging**: since not every file has clean tags, the "⋯" menu on
  a song lets you manually set its Artist/Album, which takes priority over
  parsed tags.
- **Playlists**: create/rename/delete playlists and add/remove songs via
  the "⋯" menu. Playlists just reference track ids — deleting a song from
  Drive removes it from any playlists automatically, without deleting the
  playlist itself.
- **Cross-device persistence**: Google Drive's API has nowhere to put
  "manual tags" or "playlists" — those are concepts this app invents, not
  something Drive stores natively. So on sign-in, `src/lib/metadataStore.js`
  finds (or creates) one small JSON file in your Drive
  (`drive-music-player-data.json`, tagged via a custom Drive file
  `properties` field so it's found reliably regardless of name/location)
  holding `{ overrides, playlists }`. `src/lib/useDriveMetadata.js` loads it
  on sign-in and writes it back (debounced) after every edit — so playlists
  and tags follow your Google account to any device/browser, not just
  IndexedDB in one browser. The embedded-tag cache (`metadataCache.js`,
  IndexedDB) is separate and device-local, since it's just a performance
  cache for data that's cheap to re-derive from the files themselves.
- **Seeking**: the player bar's progress bar is a real range input wired to
  the `<audio>` element's `currentTime`, so you can scrub forward/back
  while a track plays.
- **Search**: filters whatever list is currently visible (Songs, Albums,
  Artists, or Playlists) by name/artist/album, client-side.

## Local development

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:5173/drive-music-player/` (the
`/drive-music-player/` base matches the GitHub Pages path).

## Google Cloud setup

1. In [Google Cloud Console](https://console.cloud.google.com/), create/select
   a project and go to **APIs & Services → Credentials**.
2. Create an **OAuth 2.0 Client ID** of type **Web application**.
   - Authorized JavaScript origins: `http://localhost:5173` and
     `https://kreethandsouza.github.io`
   - No redirect URI is required (this app uses the token/implicit flow).
3. Enable the **Google Drive API** under **APIs & Services → Library** —
   this is a separate step from creating the OAuth client and is required
   for any Drive API calls to work.
4. On the **OAuth consent screen**, add the Google account(s) you'll sign
   in with as **Test users** if the app is in "Testing" publishing status.
5. Copy the **Client ID** (not the client secret — the secret is never
   used by this app) into `src/lib/config.js`, or set it via the
   `VITE_GOOGLE_CLIENT_ID` environment variable at build time.

⚠️ Never commit an OAuth **client secret** file to this repo. The
`client_secret_*.json` file Google gives you for a Web application client
is ignored by `.gitignore` — this app only ever needs the public Client ID.

## Deployment (GitHub Pages)

`.github/workflows/deploy.yml` builds and deploys the app to GitHub Pages
automatically on every push to `main`.

One-time setup in the GitHub repo:

1. Go to **Settings → Pages** and set **Source** to **GitHub Actions**.
2. (Optional) If you want to override the Client ID at build time instead
   of the hardcoded fallback in `src/lib/config.js`, add a repository
   **variable** (not secret, since it's public) named
   `VITE_GOOGLE_CLIENT_ID` under **Settings → Secrets and variables →
   Actions → Variables**.
3. Push to `main` — the workflow builds with `vite build` and publishes
   `dist/` to Pages.

## iOS lock-screen playback notes

- Playback must be started by a real user tap (the Play button) — Safari
  won't allow autoplay.
- Once playing, the audio keeps going when the screen locks as long as the
  browser tab stays open in the background (don't force-quit Safari).
- For the best experience, use **Add to Home Screen** from Safari's share
  sheet so the app behaves more like a native player.
