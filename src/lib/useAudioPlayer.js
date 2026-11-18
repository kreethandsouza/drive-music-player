import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchAudioBlobUrl } from './drive'

// Not every browser supports every Media Session action; some throw a
// TypeError for action types they don't recognize.
function setActionHandlerSafe(action, handler) {
  try {
    navigator.mediaSession.setActionHandler(action, handler)
  } catch {
    // Unsupported action type — ignore.
  }
}

// Tells the OS the current playback position/duration so the iOS lock
// screen and Control Center can render (and let you drag) a real scrubber,
// not just a play/pause button.
function updatePositionState(audio) {
  if (!('mediaSession' in navigator) || typeof navigator.mediaSession.setPositionState !== 'function') return
  if (!Number.isFinite(audio.duration) || audio.duration <= 0) return
  try {
    navigator.mediaSession.setPositionState({
      duration: audio.duration,
      playbackRate: audio.playbackRate || 1,
      position: Math.min(audio.currentTime, audio.duration),
    })
  } catch {
    // Can throw if position momentarily exceeds duration; safe to ignore.
  }
}

// Note: the Media Session API has no "like"/favorite action in its spec —
// only play, pause, seek*, previoustrack, and nexttrack — so a heart
// button can't be added to the iOS lock screen/Control Center itself.
function setMediaSession(track, audio, { onPrevious, onNext } = {}) {
  if (!('mediaSession' in navigator)) return

  navigator.mediaSession.metadata = new MediaMetadata({
    title: track?.displayTitle || '',
    artist: track?.artist || 'Drive Music Player',
  })

  setActionHandlerSafe('play', () => audio.play())
  setActionHandlerSafe('pause', () => audio.pause())
  // null unregisters the handler, which is also how you tell the OS to
  // grey out/hide that control — used here when there's nothing to skip to.
  setActionHandlerSafe('previoustrack', onPrevious || null)
  setActionHandlerSafe('nexttrack', onNext || null)
  setActionHandlerSafe('seekbackward', (details) => {
    audio.currentTime = Math.max(audio.currentTime - (details.seekOffset || 10), 0)
    updatePositionState(audio)
  })
  setActionHandlerSafe('seekforward', (details) => {
    audio.currentTime = Math.min(audio.currentTime + (details.seekOffset || 10), audio.duration || Infinity)
    updatePositionState(audio)
  })
  // This is what makes the lock screen/Control Center scrubber draggable.
  setActionHandlerSafe('seekto', (details) => {
    if (details.seekTime == null) return
    if (details.fastSeek && typeof audio.fastSeek === 'function') {
      audio.fastSeek(details.seekTime)
    } else {
      audio.currentTime = details.seekTime
    }
    updatePositionState(audio)
  })

  updatePositionState(audio)
}

// A track only counts as "played" (for the Home tab's stats) once it's
// been listened to for this long, or reaches its natural end if shorter —
// otherwise an accidental tap/instant skip would inflate the count.
const PLAY_COUNT_THRESHOLD_SECONDS = 10

/**
 * Owns a single persistent <audio> element so exactly one track can stream
 * at a time, wires it up to the Media Session API for lock-screen controls,
 * and keeps playing across screen lock as long as the tab stays open.
 *
 * `autoplayTracks` is the song-number-ordered track list used to pick what
 * plays next when a track finishes on its own: the next higher song
 * number, wrapping back to the first track after the last one.
 *
 * `onPlayCounted(trackId)` fires once per track play, past the threshold
 * above.
 */
export function useAudioPlayer(token, autoplayTracks = [], onPlayCounted) {
  // Plain DOM handle — intentionally a ref (not state), since it's an
  // imperative escape hatch that we mutate directly (src, play/pause, etc).
  const audioRef = useRef(null)
  const blobUrlRef = useRef(null)
  const [currentTrack, setCurrentTrack] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState({ currentTime: 0, duration: 0 })

  // Refs so the 'ended' handler (registered once, see below) always sees
  // the latest track/list/playTrack without re-registering the listener.
  const currentTrackRef = useRef(null)
  useEffect(() => {
    currentTrackRef.current = currentTrack
  }, [currentTrack])

  const autoplayTracksRef = useRef(autoplayTracks)
  useEffect(() => {
    autoplayTracksRef.current = autoplayTracks
  }, [autoplayTracks])

  const onPlayCountedRef = useRef(onPlayCounted)
  useEffect(() => {
    onPlayCountedRef.current = onPlayCounted
  }, [onPlayCounted])

  // Reset to false whenever a new track starts (see playTrack); set to
  // true the first time this play crosses the threshold above.
  const hasCountedPlayRef = useRef(false)

  const playTrackRef = useRef(null)

  // Audio for the next track in song-number order, fetched ahead of time
  // (see playTrack) so autoplay-on-ended can swap to it instantly. This
  // matters because iOS Safari throttles/pauses background network
  // fetches once the screen locks — without a prefetch, autoplay would
  // advance the lock screen to the next track but its audio fetch would
  // stall silently until the phone is unlocked.
  const prefetchRef = useRef({ trackId: null, blobUrl: null })

  const revokeBlobUrl = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
  }, [])

  const clearPrefetch = useCallback(() => {
    if (prefetchRef.current.blobUrl) URL.revokeObjectURL(prefetchRef.current.blobUrl)
    prefetchRef.current = { trackId: null, blobUrl: null }
  }, [])

  useEffect(() => {
    if (typeof Audio === 'undefined') return undefined

    const audio = new Audio()
    // Helps iOS Safari treat this as a resumable playback session.
    audio.preload = 'auto'
    audioRef.current = audio

    const onPlay = () => {
      setIsPlaying(true)
      updatePositionState(audio)
    }
    const onPause = () => {
      setIsPlaying(false)
      updatePositionState(audio)
    }
    const onEnded = () => {
      setIsPlaying(false)
      const finished = currentTrackRef.current
      // A track shorter than the threshold would otherwise never count.
      if (finished && !hasCountedPlayRef.current) {
        hasCountedPlayRef.current = true
        onPlayCountedRef.current?.(finished.id)
      }
      // Autoplay: advance to the next higher song number, wrapping back to
      // the first track after the last one.
      const list = autoplayTracksRef.current
      if (!finished || list.length === 0) return
      const index = list.findIndex((t) => t.id === finished.id)
      if (index === -1) return
      const next = list[(index + 1) % list.length]
      playTrackRef.current?.(next)
    }
    const onTimeUpdate = () => {
      setProgress({ currentTime: audio.currentTime, duration: audio.duration || 0 })
      updatePositionState(audio)
      if (!hasCountedPlayRef.current && audio.currentTime >= PLAY_COUNT_THRESHOLD_SECONDS) {
        hasCountedPlayRef.current = true
        if (currentTrackRef.current) onPlayCountedRef.current?.(currentTrackRef.current.id)
      }
    }
    const onError = () => {
      setError('Playback failed. The file may no longer be available.')
      setIsLoading(false)
      setIsPlaying(false)
    }

    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onTimeUpdate)
    audio.addEventListener('seeked', onTimeUpdate)
    audio.addEventListener('error', onError)

    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onTimeUpdate)
      audio.removeEventListener('seeked', onTimeUpdate)
      audio.removeEventListener('error', onError)
      audio.pause()
      audioRef.current = null
    }
  }, [])

  const playTrack = useCallback(
    async (track) => {
      const audio = audioRef.current
      if (!audio || !token) return

      // Tapping the already-loaded track just toggles play/pause.
      if (currentTrack?.id === track.id) {
        if (audio.paused) await audio.play().catch(() => {})
        else audio.pause()
        return
      }

      setError(null)
      setIsLoading(true)
      setCurrentTrack(track)
      hasCountedPlayRef.current = false
      audio.pause()

      try {
        let blobUrl
        if (prefetchRef.current.trackId === track.id && prefetchRef.current.blobUrl) {
          blobUrl = prefetchRef.current.blobUrl
          prefetchRef.current = { trackId: null, blobUrl: null }
        } else {
          blobUrl = await fetchAudioBlobUrl(token, track.id)
        }
        revokeBlobUrl()
        blobUrlRef.current = blobUrl
        audio.src = blobUrl

        // Lock screen/Control Center Previous/Next: step by song number,
        // same as the in-app player bar — no wraparound here, unlike the
        // autoplay-on-ended case above.
        const list = autoplayTracksRef.current
        const index = list.findIndex((t) => t.id === track.id)
        const onPrevious = index > 0 ? () => playTrackRef.current?.(list[index - 1]) : null
        const onNext = index >= 0 && index < list.length - 1 ? () => playTrackRef.current?.(list[index + 1]) : null
        setMediaSession(track, audio, { onPrevious, onNext })

        await audio.play()

        // Prefetch the next track's audio now, while still foregrounded —
        // see the prefetchRef comment above.
        if (index !== -1 && list.length > 1) {
          const upcoming = list[(index + 1) % list.length]
          if (upcoming && upcoming.id !== track.id && prefetchRef.current.trackId !== upcoming.id) {
            clearPrefetch()
            prefetchRef.current = { trackId: upcoming.id, blobUrl: null }
            fetchAudioBlobUrl(token, upcoming.id)
              .then((url) => {
                if (prefetchRef.current.trackId === upcoming.id) prefetchRef.current.blobUrl = url
                else URL.revokeObjectURL(url) // a different track started before this resolved
              })
              .catch(() => {
                if (prefetchRef.current.trackId === upcoming.id) prefetchRef.current = { trackId: null, blobUrl: null }
              })
          }
        }
      } catch {
        setError('Could not load this track from Drive.')
        setCurrentTrack(null)
      } finally {
        setIsLoading(false)
      }
    },
    [currentTrack, token, revokeBlobUrl, clearPrefetch],
  )

  useEffect(() => {
    playTrackRef.current = playTrack
  }, [playTrack])

  const seek = useCallback((time) => {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(time)) return
    audio.currentTime = Math.min(Math.max(time, 0), audio.duration || time)
    setProgress((prev) => ({ ...prev, currentTime: audio.currentTime }))
    updatePositionState(audio)
  }, [])

  useEffect(() => () => revokeBlobUrl(), [revokeBlobUrl])
  useEffect(() => () => clearPrefetch(), [clearPrefetch])

  return { currentTrack, isLoading, isPlaying, error, progress, playTrack, seek }
}
