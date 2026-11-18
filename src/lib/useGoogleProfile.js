import { useEffect, useState } from 'react'

const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'

/**
 * Fetches the signed-in user's basic Google profile (name + photo) for the
 * Home tab's greeting — needs the profile/email scopes (see config.js).
 * Refetches whenever the token changes (sign-in, renewal) rather than
 * caching across sessions, since it's one small, cheap request.
 */
export function useGoogleProfile(token) {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    if (!token) {
      setProfile(null)
      return undefined
    }

    let cancelled = false

    fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((info) => {
        if (cancelled || !info) return
        setProfile({
          name: info.given_name || info.name || '',
          picture: info.picture || null,
        })
      })
      .catch(() => {
        // Non-critical — the Home tab just falls back to a generic greeting.
      })

    return () => {
      cancelled = true
    }
  }, [token])

  return profile
}
