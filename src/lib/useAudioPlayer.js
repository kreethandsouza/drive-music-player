import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchAudioBlobUrl } from './drive'

function setMediaSession(track, audio) {
  if (!('mediaSession' in navigator)) return

  navigator.mediaSession.metadata = new MediaMetadata({
    title: track?.name || '',
    artist: 'Drive Music Player',
  })

  navigator.mediaSession.setActionHandler('play', () => audio.play())
  navigator.mediaSession.setActionHandler('pause', () => audio.pause())
  // Manual-play-only app: no queue to advance, so skip previous/next handlers.
  navigator.mediaSession.setActionHandler('seekbackward', (details) => {
    audio.currentTime = Math.max(audio.currentTime - (details.seekOffset || 10), 0)
  })
  navigator.mediaSession.setActionHandler('seekforward', (details) => {
    audio.currentTime = Math.min(
      audio.currentTime + (details.seekOffset || 10),
      audio.duration || Infinity,
    )
  })
}

/**
 * Owns a single persistent <audio> element so exactly one track can stream
 * at a time, wires it up to the Media Session API for lock-screen controls,
 * and keeps playing across screen lock as long as the tab stays open.
 */
export function useAudioPlayer(token) {
  // Plain DOM handle — intentionally a ref (not state), since it's an
  // imperative escape hatch that we mutate directly (src, play/pause, etc).
  const audioRef = useRef(null)
  const blobUrlRef = useRef(null)
  const [currentTrack, setCurrentTrack] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState({ currentTime: 0, duration: 0 })

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

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnded = () => setIsPlaying(false)
    const onTimeUpdate = () =>
      setProgress({ currentTime: audio.currentTime, duration: audio.duration || 0 })
    const onError = () => {
      setError('Playback failed. The file may no longer be available.')
      setIsLoading(false)
      setIsPlaying(false)
    }

    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('error', onError)

    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('timeupdate', onTimeUpdate)
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

  const stopIfActive = useCallback(
    (fileId) => {
      if (currentTrack?.id !== fileId) return
      const audio = audioRef.current
      audio?.pause()
      if (audio) audio.src = ''
      revokeBlobUrl()
      setCurrentTrack(null)
      setIsPlaying(false)
      if ('mediaSession' in navigator) navigator.mediaSession.metadata = null
    },
    [currentTrack, revokeBlobUrl],
  )

  useEffect(() => () => revokeBlobUrl(), [revokeBlobUrl])

  return { currentTrack, isLoading, isPlaying, error, progress, playTrack, stopIfActive }
}
