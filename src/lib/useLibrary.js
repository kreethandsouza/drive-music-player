import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchSongLibrary, UNKNOWN_ARTIST } from './sheetLibrary'

function groupByComposer(tracks) {
  const map = new Map()
  for (const track of tracks) {
    if (!map.has(track.artist)) map.set(track.artist, { name: track.artist, tracks: [] })
    map.get(track.artist).tracks.push(track)
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.name === UNKNOWN_ARTIST) return 1
    if (b.name === UNKNOWN_ARTIST) return -1
    return a.name.localeCompare(b.name)
  })
}

/**
 * Loads the song library from the shared Google Sheet (see sheetLibrary.js)
 * and groups tracks by composer. The sheet is the single source of truth
 * for which songs exist and their title/composer. It's shared with
 * specific accounts only, so loading needs the signed-in user's token —
 * nothing loads until `token` is set.
 */
export function useLibrary(token) {
  const [tracks, setTracks] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    if (!token) return undefined

    let cancelled = false
    setIsLoading(true)
    setError(null)

    fetchSongLibrary(token)
      .then((loaded) => {
        if (!cancelled) setTracks(loaded)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Failed to load the song list from the spreadsheet:', err)
        setError('Could not load the song list. Try refreshing.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, reloadToken])

  const reload = useCallback(() => setReloadToken((n) => n + 1), [])
  const composers = useMemo(() => groupByComposer(tracks), [tracks])

  // Sorted numerically by song number, for the player bar's Previous/Next
  // controls — "next"/"previous" means the next/previous *song number*,
  // not the next item in whatever list happens to be on screen. Tracks
  // with a missing/non-numeric song number are excluded, since they have
  // no defined position in this ordering.
  const tracksBySongNo = useMemo(
    () =>
      tracks
        .filter((t) => t.songNo && Number.isFinite(Number(t.songNo)))
        .slice()
        .sort((a, b) => Number(a.songNo) - Number(b.songNo)),
    [tracks],
  )

  return { tracks, composers, tracksBySongNo, isLoading, error, reload }
}
