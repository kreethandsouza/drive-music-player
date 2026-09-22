import { useCallback, useEffect, useRef, useState } from 'react'
import { GOOGLE_CLIENT_ID, GOOGLE_DRIVE_SCOPE } from './config'

const STORAGE_KEY = 'dmp_google_token'
const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'
// Renew a bit before the token actually expires so requests never race it.
const RENEW_MARGIN_MS = 5 * 60 * 1000

function loadStoredToken() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.token || !parsed?.expiresAt) return null
    if (parsed.expiresAt <= Date.now()) return null
    return parsed
  } catch {
    return null
  }
}

function storeToken(token, expiresAt) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token, expiresAt }))
}

function clearStoredToken() {
  sessionStorage.removeItem(STORAGE_KEY)
}

function loadGisScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve()
      return
    }
    const existing = document.querySelector(`script[src="${GIS_SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services')))
      return
    }
    const script = document.createElement('script')
    script.src = GIS_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'))
    document.head.appendChild(script)
  })
}

/**
 * Manages Google sign-in via Google Identity Services' token client and
 * keeps the Drive access token fresh for the lifetime of the tab.
 */
export function useGoogleAuth() {
  const [token, setToken] = useState(null)
  const [isReady, setIsReady] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState(null)

  const tokenClientRef = useRef(null)
  const renewTimerRef = useRef(null)
  const wantsSessionRef = useRef(false)

  const scheduleRenew = useCallback((expiresAt) => {
    clearTimeout(renewTimerRef.current)
    const delay = Math.max(expiresAt - Date.now() - RENEW_MARGIN_MS, 0)
    renewTimerRef.current = setTimeout(() => {
      if (wantsSessionRef.current) {
        tokenClientRef.current?.requestAccessToken({ prompt: '' })
      }
    }, delay)
  }, [])

  useEffect(() => {
    let cancelled = false

    loadGisScript()
      .then(() => {
        if (cancelled) return

        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: GOOGLE_DRIVE_SCOPE,
          callback: (response) => {
            setIsSigningIn(false)
            if (response.error) {
              // A silent renewal can fail if the Google session ended; treat
              // that as being signed out rather than surfacing a hard error.
              if (response.error !== 'access_denied' && response.error !== 'interaction_required') {
                setError(response.error_description || response.error)
              }
              wantsSessionRef.current = false
              setToken(null)
              clearStoredToken()
              return
            }
            const expiresAt = Date.now() + Number(response.expires_in) * 1000
            wantsSessionRef.current = true
            setError(null)
            setToken(response.access_token)
            storeToken(response.access_token, expiresAt)
            scheduleRenew(expiresAt)
          },
          error_callback: () => {
            setIsSigningIn(false)
          },
        })

        setIsReady(true)

        // Restore an existing session for this tab, if the token hasn't expired.
        const stored = loadStoredToken()
        if (stored) {
          wantsSessionRef.current = true
          setToken(stored.token)
          scheduleRenew(stored.expiresAt)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })

    return () => {
      cancelled = true
      clearTimeout(renewTimerRef.current)
    }
  }, [scheduleRenew])

  const signIn = useCallback(() => {
    if (!tokenClientRef.current) return
    setError(null)
    setIsSigningIn(true)
    // No explicit prompt: GIS shows the consent screen only the first time,
    // and silently reuses the existing grant on subsequent sign-ins.
    tokenClientRef.current.requestAccessToken()
  }, [])

  const signOut = useCallback(() => {
    wantsSessionRef.current = false
    clearTimeout(renewTimerRef.current)
    clearStoredToken()
    if (token && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(token, () => {})
    }
    setToken(null)
  }, [token])

  return {
    token,
    isSignedIn: Boolean(token),
    isReady,
    isSigningIn,
    error,
    signIn,
    signOut,
  }
}
