import { useCallback, useEffect, useRef, useState } from 'react'
import { writeMetadataFile } from './drive'
import { EMPTY_METADATA, loadOrCreateMetadata } from './metadataStore'

const SAVE_DEBOUNCE_MS = 800

/**
 * Loads this app's Drive-hosted metadata file (manual artist/album
 * overrides + playlists) on sign-in, and keeps it in sync: every mutation
 * updates local state immediately and writes back to Drive shortly after
 * (debounced), so playlists/tags follow the Google account across
 * devices and browser sessions instead of living only in this browser.
 */
export function useDriveMetadata(token) {
  const [data, setData] = useState(EMPTY_METADATA)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const fileIdRef = useRef(null)
  const dataRef = useRef(data)
  const saveTimerRef = useRef(null)

  useEffect(() => {
    dataRef.current = data
  }, [data])

  useEffect(() => {
    if (!token) {
      fileIdRef.current = null
      setData(EMPTY_METADATA)
      return undefined
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    loadOrCreateMetadata(token)
      .then(({ fileId, data: loaded }) => {
        if (cancelled) return
        fileIdRef.current = fileId
        setData(loaded)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Failed to load Drive metadata:', err)
        setError("Could not load your saved playlists/tags from Drive.")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const flush = useCallback(() => {
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = null
    const fileId = fileIdRef.current
    if (!fileId || !token) return
    writeMetadataFile(token, fileId, dataRef.current).catch((err) => {
      console.error('Failed to save metadata to Drive:', err)
      setError('Could not save your changes to Drive. Try again.')
    })
  }, [token])

  const scheduleSave = useCallback(() => {
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(flush, SAVE_DEBOUNCE_MS)
  }, [flush])

  // Best-effort: save immediately before the tab closes rather than losing
  // whatever was still waiting in the debounce window.
  useEffect(() => {
    const handler = () => {
      if (saveTimerRef.current) flush()
    }
    window.addEventListener('pagehide', handler)
    return () => window.removeEventListener('pagehide', handler)
  }, [flush])

  const mutate = useCallback(
    (updater) => {
      setData((prev) => {
        const next = updater(prev)
        dataRef.current = next
        return next
      })
      scheduleSave()
    },
    [scheduleSave],
  )

  const setTrackOverride = useCallback(
    (fileId, patch) => {
      mutate((prev) => {
        const merged = { ...prev.overrides[fileId], ...patch }
        for (const key of ['artist', 'album', 'title']) {
          if (!merged[key]) delete merged[key]
        }
        const overrides = { ...prev.overrides }
        if (merged.artist || merged.album || merged.title) overrides[fileId] = merged
        else delete overrides[fileId]
        return { ...prev, overrides }
      })
    },
    [mutate],
  )

  const createPlaylist = useCallback(
    (name, trackIds = []) => {
      const playlist = {
        id: crypto.randomUUID(),
        name: name.trim(),
        trackIds: [...trackIds],
        createdAt: new Date().toISOString(),
      }
      mutate((prev) => ({ ...prev, playlists: [...prev.playlists, playlist] }))
      return playlist
    },
    [mutate],
  )

  const renamePlaylist = useCallback(
    (playlistId, name) => {
      mutate((prev) => ({
        ...prev,
        playlists: prev.playlists.map((p) => (p.id === playlistId ? { ...p, name: name.trim() } : p)),
      }))
    },
    [mutate],
  )

  const deletePlaylist = useCallback(
    (playlistId) => {
      mutate((prev) => ({ ...prev, playlists: prev.playlists.filter((p) => p.id !== playlistId) }))
    },
    [mutate],
  )

  const addTrackToPlaylist = useCallback(
    (playlistId, trackId) => {
      mutate((prev) => ({
        ...prev,
        playlists: prev.playlists.map((p) =>
          p.id === playlistId && !p.trackIds.includes(trackId)
            ? { ...p, trackIds: [...p.trackIds, trackId] }
            : p,
        ),
      }))
    },
    [mutate],
  )

  const removeTrackFromPlaylist = useCallback(
    (playlistId, trackId) => {
      mutate((prev) => ({
        ...prev,
        playlists: prev.playlists.map((p) =>
          p.id === playlistId ? { ...p, trackIds: p.trackIds.filter((id) => id !== trackId) } : p,
        ),
      }))
    },
    [mutate],
  )

  return {
    overrides: data.overrides,
    playlists: data.playlists,
    isLoading,
    error,
    setTrackOverride,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
  }
}
