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

function setMediaSession(track, audio) {
  if (!('mediaSession' in navigator)) return

  navigator.mediaSession.metadata = new MediaMetadata({
    title: track?.displayTitle || '',
    artist: track?.artist || 'Drive Music Player',
  })

  setActionHandlerSafe('play', () => audio.play())
  setActionHandlerSafe('pause', () => audio.pause())
  // Manual-play-only app: no queue to advance, so skip previous/next handlers.
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

/**
 * Owns a single persistent <audio> element so exactly one track can stream
 * at a time, wires it up to the Media Session API for lock-screen controls,
 * and keeps playing across screen lock as long as the tab stays open.
 *
 * `autoplayTracks` is the song-number-ordered track list used to pick what
 * plays next when a track finishes on its own: the next higher song
 * number, wrapping back to the first track after the last one.
 */
export function useAudioPlayer(token, autoplayTracks = []) {
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

  const playTrackRef = useRef(null)

  const revokeBlobUrl = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
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
      // Autoplay: advance to the next higher song number, wrapping back to
      // the first track after the last one.
      const list = autoplayTracksRef.current
      const finished = currentTrackRef.current
      if (!finished || list.length === 0) return
      const index = list.findIndex((t) => t.id === finished.id)
      if (index === -1) return
      const next = list[(index + 1) % list.length]
      playTrackRef.current?.(next)
    }
    const onTimeUpdate = () => {
      setProgress({ currentTime: audio.currentTime, duration: audio.duration || 0 })
      updatePositionState(audio)
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
      audio.pause()

      try {
        const blobUrl = await fetchAudioBlobUrl(token, track.id)
        revokeBlobUrl()
        blobUrlRef.current = blobUrl
        audio.src = blobUrl
        setMediaSession(track, audio)
        await audio.play()
      } catch {
        setError('Could not load this track from Drive.')
        setCurrentTrack(null)
      } finally {
        setIsLoading(false)
      }
    },
    [currentTrack, token, revokeBlobUrl],
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

  return { currentTrack, isLoading, isPlaying, error, progress, playTrack, seek }
}
