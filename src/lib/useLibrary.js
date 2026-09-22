import { useCallback, useEffect, useMemo, useState } from 'react'
import { enrichTracksInBackground, UNKNOWN_ALBUM, UNKNOWN_ARTIST } from './metadata'
import { getAllOverrides, saveOverride } from './metadataCache'
import { getBaseName } from './filename'

function groupTracks(tracks) {
  const albumMap = new Map()
  const artistMap = new Map()

  for (const track of tracks) {
    if (!albumMap.has(track.album)) {
      albumMap.set(track.album, { name: track.album, artist: track.artist, artUrl: null, tracks: [] })
    }
    const album = albumMap.get(track.album)
    album.tracks.push(track)
    if (!album.artUrl && track.artUrl) album.artUrl = track.artUrl
    if (album.artist === UNKNOWN_ARTIST && track.artist !== UNKNOWN_ARTIST) album.artist = track.artist

    if (!artistMap.has(track.artist)) {
      artistMap.set(track.artist, { name: track.artist, tracks: [] })
    }
    artistMap.get(track.artist).tracks.push(track)
  }

  const sorted = (map, unknownLabel) =>
    Array.from(map.values()).sort((a, b) => {
      if (a.name === unknownLabel) return 1
      if (b.name === unknownLabel) return -1
      return a.name.localeCompare(b.name)
    })

  return { albums: sorted(albumMap, UNKNOWN_ALBUM), artists: sorted(artistMap, UNKNOWN_ARTIST) }
}

/**
 * Enriches Drive files with embedded audio tags (artist/album/title/cover
 * art), layers in any manual artist/album/title overrides (which always win
 * and persist across sessions), and derives Albums/Artists groupings.
 */
export function useLibrary(files, token) {
  const [tagsById, setTagsById] = useState({})
  const [overridesById, setOverridesById] = useState({})

  // Manual overrides aren't tied to a Drive session — load them once so
  // segregation persists across reloads and sign-outs.
  useEffect(() => {
    getAllOverrides().then(setOverridesById)
  }, [])

  // Only re-run the tag-parsing pass when the actual set of files (or their
  // Drive modifiedTime) changes — not on every unrelated re-render.
  const filesKey = useMemo(
    () => files.map((f) => `${f.id}:${f.modifiedTime}`).join('|'),
    [files],
  )

  useEffect(() => {
    if (!token || files.length === 0) return undefined
    let cancelled = false

    enrichTracksInBackground(token, files, (id, tags) => {
      if (cancelled) return
      setTagsById((prev) => ({ ...prev, [id]: tags }))
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filesKey, token])

  const setTrackOverride = useCallback(async (fileId, patch) => {
    const result = await saveOverride(fileId, patch)
    setOverridesById((prev) => {
      const next = { ...prev }
      if (result) next[fileId] = result
      else delete next[fileId]
      return next
    })
  }, [])

  const tracks = useMemo(
    () =>
      files.map((file) => {
        const tags = tagsById[file.id]
        const override = overridesById[file.id]
        return {
          ...file,
          displayTitle: override?.title || tags?.title || getBaseName(file.name),
          artist: override?.artist || tags?.artist || UNKNOWN_ARTIST,
          album: override?.album || tags?.album || UNKNOWN_ALBUM,
          artUrl: tags?.artUrl || null,
          hasOverride: Boolean(override),
        }
      }),
    [files, tagsById, overridesById],
  )

  const { albums, artists } = useMemo(() => groupTracks(tracks), [tracks])

  return { tracks, albums, artists, setTrackOverride }
}
