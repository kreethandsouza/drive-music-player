// Google API configuration.
//
// The OAuth Client ID is public information for browser-based (GIS) apps —
// it is safe to ship in client-side code. NEVER put a client *secret* here;
// this app uses the implicit/token flow, which never needs one.
export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '25844589881-minvi03kqof67t585q05t23cdh4aa1rh.apps.googleusercontent.com'

// Full Drive scope is required so the app can rename and trash files,
// not just read them.
export const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive'
