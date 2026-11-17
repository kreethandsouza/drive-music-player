# Drive Music Player

A clean, mobile-first web app that streams a shared catalog of audio tracks
directly from Google Drive. Sign in with Google, tap a track to play it
(with a seekable progress bar), browse by Songs/Composers/Playlists with
search (including by song number), and keep listening after locking your
iPhone screen. The song catalog itself (title, composer, and the Drive link
to the actual file) comes from a shared Google Sheet maintained by whoever
owns the audio files — this app is read-only against that content. Your own
playlists are stored in your own Drive account, so they follow you across
devices and browser sessions without needing any access to someone else's
files.

Live app: https://kreethandsouza.github.io/drive-music-player/

## Tech stack

- React + Vite + Tailwind CSS
- Google Identity Services (GIS) for OAuth (implicit token flow — no
  client secret needed in the browser)
- Google Drive API v3 for streaming files and for this app's own
  playlist-metadata file
- A public Google Sheet (CSV export, no auth needed) as the song catalog
- HTML5 `<audio>` + the Media Session API for lock-screen playback controls

## How it works

- **Auth**: `src/lib/useGoogleAuth.js` wraps
  `google.accounts.oauth2.initTokenClient` with scope
  `https://www.googleapis.com/auth/drive.readonly
  https://www.googleapis.com/auth/drive.file` — read-only access to stream
  shared audio files, plus the narrower "files this app created" scope for
  its own playlist-metadata file. The access token is kept in memory +
  `sessionStorage` and silently renewed a few minutes before it expires.
- **Song catalog**: Google Drive's API has no concept of "song number" or
  "composer," and this app doesn't own the audio files it plays, so there's
  no listing/parsing of a Drive folder at all. Instead, `src/lib/sheetLibrary.js`
  fetches a Google Sheet (shared "Anyone with the link can view") as plain
  CSV — no Google sign-in required for this part — containing Song
  No/Title/Composer/Drive-link columns across two tabs ("Allotted Songs" and
  "Un-Allotted Songs", merged with no distinction between them). The Drive
  file id is extracted from each row's link. `src/lib/useLibrary.js` groups
  the resulting tracks by composer, falling back to "Unknown Composer" when
  a row has none.
- **Playback**: `src/lib/useAudioPlayer.js` owns a single persistent
  `<audio>` element. Tapping a track fetches the file bytes by Drive file id
  with `?alt=media` and a Bearer token, turns them into a blob URL, and
  plays it — only one track streams at a time, with no auto-advance/queueing.
  This only works if the signed-in Google account has read access to that
  file (shared directly, or via a shared folder). `MediaMetadata`/
  `mediaSession` action handlers are set so iOS shows the track on the lock
  screen and playback continues when the phone locks.
- **Playlists**: create/rename/delete playlists and add/remove songs via
  the "⋯" menu. Playlists just reference track ids — a song disappearing
  from the spreadsheet removes it from any playlists automatically, without
  deleting the playlist itself.
- **Cross-device persistence**: Google Drive's API has nowhere to put
  "playlists" — that's a concept this app invents, not something Drive
  stores natively. So on sign-in, `src/lib/metadataStore.js` finds (or
  creates) one small JSON file in *your own* Drive
  (`drive-music-player-data.json`, tagged via a custom Drive file
  `properties` field so it's found reliably regardless of name/location)
  holding `{ playlists }`. `src/lib/useDriveMetadata.js` loads it on sign-in
  and writes it back (debounced) after every edit — so playlists follow
  your Google account to any device/browser. Because this file is created
  by and lives in your own Drive, it works regardless of what access you
  have to anyone else's shared content.
- **Seeking**: the player bar's progress bar is a real range input wired to
  the `<audio>` element's `currentTime`, so you can scrub forward/back
  while a track plays.
- **Search**: filters whatever list is currently visible (Songs, Composers,
  or Playlists) by title, composer, or song number, client-side.

## Sharing this with other people

Getting someone else set up to use this app against a shared catalog needs
two separate things, both outside this codebase:

1. **Drive sharing**: the account that owns the audio files needs to share
   the folder (or each individual file) with that person's Google account —
   Viewer access is enough, since this app never renames or deletes files.
2. **OAuth test users**: while this app's OAuth client is in "Testing"
   publishing status, Google blocks sign-in entirely for anyone not listed
   under **OAuth consent screen → Test users** in the Google Cloud project
   tied to `GOOGLE_CLIENT_ID` — this is separate from, and in addition to,
   Drive sharing.

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
