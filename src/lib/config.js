// Google API configuration.
//
// The OAuth Client ID is public information for browser-based (GIS) apps —
// it is safe to ship in client-side code. NEVER put a client *secret* here;
// this app uses the implicit/token flow, which never needs one.
export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '25844589881-minvi03kqof67t585q05t23cdh4aa1rh.apps.googleusercontent.com'

// This app only ever reads other people's files (streaming shared audio) and
// creates/updates one small file of its own (playlists) — so it needs
// read-only access to the user's whole Drive, plus the narrower "files this
// app created" scope for its own metadata file, rather than full read/write
// access to everything.
export const GOOGLE_DRIVE_SCOPE =
  'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file'
