import { useCallback, useEffect, useRef, useState } from 'react'
import Spinner from './Spinner'
import { UNKNOWN_ARTIST } from '../lib/sheetLibrary'

const CLOSE_ANIMATION_MS = 220
// How far (in px) the sheet needs to be dragged down before it counts as a
// "pull to dismiss" instead of snapping back open.
const CLOSE_DRAG_THRESHOLD = 120

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const ChevronDownIcon = (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const SkipPreviousIcon = (
  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
  </svg>
)
const SkipNextIcon = (
  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
  </svg>
)
const PlusIcon = (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
  </svg>
)

function HeartIcon({ filled }) {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        d="M12 21s-7.2-4.5-9.5-9A5.5 5.5 0 0 1 12 6.5 5.5 5.5 0 0 1 21.5 12c-2.3 4.5-9.5 9-9.5 9z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Rewind/forward 10s — a double-chevron icon (mirrored for "back") with a
// "10s" label stacked underneath, so nothing overlaps.
function SeekButton({ direction, onClick, disabled }) {
  const isBack = direction === 'back'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={isBack ? 'Rewind 10 seconds' : 'Forward 10 seconds'}
      className="flex h-12 w-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-full text-stone-300 transition hover:bg-white/5 hover:text-white active:scale-95 disabled:opacity-40"
    >
      <svg className={`h-5 w-5 ${isBack ? 'scale-x-[-1]' : ''}`} viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 6v12l8-6-8-6z" />
        <path d="M13 6v12l8-6-8-6z" />
      </svg>
      <span className="text-[10px] font-bold leading-none">10s</span>
    </button>
  )
}

/**
 * Full-screen "Now Playing" view, Spotify-style: the mini player bar's up
 * arrow (or swiping up on it) opens this; the chevron button here, or
 * swiping down on this sheet's drag handle, collapses it back. Both the
 * button and the gesture are kept since the small button can be fiddly to
 * hit reliably on some iPhones, where a missed tap near the top edge can
 * trigger iOS's own Control Center/notification gesture instead.
 */
export default function NowPlayingSheet({
  track,
  isPlaying,
  isLoading,
  progress,
  hasPrevious,
  hasNext,
  isLiked,
  onToggle,
  onSeek,
  onPrevious,
  onNext,
  onToggleLike,
  onAddToPlaylist,
  onClose,
}) {
  const [isMounted, setIsMounted] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragY, setDragY] = useState(0)
  const dragStartYRef = useRef(null)

  // Slide up on mount rather than appearing instantly.
  useEffect(() => {
    const id = requestAnimationFrame(() => setIsMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const close = useCallback(() => {
    setIsClosing(true)
    setTimeout(onClose, CLOSE_ANIMATION_MS)
  }, [onClose])

  if (!track) return null

  const duration = Number.isFinite(progress.duration) ? progress.duration : 0
  const pct = duration ? (progress.currentTime / duration) * 100 : 0

  const handleDragStart = (e) => {
    dragStartYRef.current = e.clientY
    setIsDragging(true)
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const handleDragMove = (e) => {
    if (dragStartYRef.current == null) return
    setDragY(Math.max(e.clientY - dragStartYRef.current, 0))
  }
  const handleDragEnd = () => {
    if (dragStartYRef.current == null) return
    dragStartYRef.current = null
    setIsDragging(false)
    if (dragY > CLOSE_DRAG_THRESHOLD) close()
    else setDragY(0)
  }

  const translateY = isClosing || !isMounted ? '100%' : `${dragY}px`

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col bg-brand-950"
      style={{
        transform: `translateY(${translateY})`,
        transition: isDragging ? 'none' : `transform ${CLOSE_ANIMATION_MS}ms ease-out`,
      }}
    >
      {/* Drag area covers the handle, close button, art, and title — all
          non-interactive except the button itself — so there's a large,
          easy-to-grab region for swipe-to-dismiss, not just a thin strip
          at the very top near the status bar/dynamic island. */}
      <div
        className="flex shrink-0 cursor-grab touch-none flex-col items-center gap-8 px-8 pb-6 pt-3 active:cursor-grabbing"
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
      >
        <div className="flex w-full shrink-0 flex-col items-center gap-3">
          <div className="h-1.5 w-10 shrink-0 rounded-full bg-white/20" />
          <button
            type="button"
            onClick={close}
            aria-label="Minimize player"
            className="self-start rounded-lg p-2 text-stone-400 transition hover:bg-white/5 hover:text-white"
          >
            {ChevronDownIcon}
          </button>
        </div>

        <div className="flex h-56 w-56 max-w-full items-center justify-center rounded-2xl bg-white/5 text-6xl shadow-2xl">
          🎵
        </div>

        <div className="w-full max-w-sm text-center">
          <p className="truncate text-xl font-semibold text-white">{track.displayTitle}</p>
          {track.artist && track.artist !== UNKNOWN_ARTIST && (
            <p className="mt-1 truncate text-sm text-stone-400">{track.artist}</p>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-8 pb-12">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={onToggleLike}
            aria-label={isLiked ? 'Remove from Pasand' : 'Add to Pasand'}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-white/5 active:scale-95 ${
              isLiked ? 'text-gold-400' : 'text-stone-300 hover:text-white'
            }`}
          >
            <HeartIcon filled={isLiked} />
          </button>
          <button
            type="button"
            onClick={onAddToPlaylist}
            aria-label="Add to playlist"
            className="flex h-10 w-10 items-center justify-center rounded-full text-stone-300 transition hover:bg-white/5 hover:text-white active:scale-95"
          >
            {PlusIcon}
          </button>
        </div>

        <div className="w-full max-w-sm">
          <div className="relative flex h-4 w-full items-center">
            <div className="absolute inset-x-0 h-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-gold-500" style={{ width: `${pct}%` }} />
            </div>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step="any"
              value={Math.min(progress.currentTime, duration || 0)}
              onChange={(e) => onSeek(Number(e.target.value))}
              disabled={!duration}
              aria-label="Seek"
              className="absolute inset-x-0 h-4 w-full cursor-pointer appearance-none bg-transparent accent-gold-500 disabled:cursor-default [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold-500"
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-neutral-500">
            <span>{formatTime(progress.currentTime)}</span>
            <span>{formatTime(progress.duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onPrevious}
            disabled={!hasPrevious}
            aria-label="Previous song"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-stone-300 transition hover:bg-white/5 hover:text-white active:scale-95 disabled:opacity-40"
          >
            {SkipPreviousIcon}
          </button>

          <SeekButton direction="back" onClick={() => onSeek(progress.currentTime - 10)} disabled={!duration} />

          <button
            type="button"
            onClick={onToggle}
            disabled={isLoading}
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gold-500 text-brand-950 transition active:scale-95 disabled:opacity-60"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <Spinner className="h-8 w-8" />
            ) : isPlaying ? (
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 5v14l12-7z" />
              </svg>
            )}
          </button>

          <SeekButton direction="forward" onClick={() => onSeek(progress.currentTime + 10)} disabled={!duration} />

          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext}
            aria-label="Next song"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-stone-300 transition hover:bg-white/5 hover:text-white active:scale-95 disabled:opacity-40"
          >
            {SkipNextIcon}
          </button>
        </div>

        <button
          type="button"
          onClick={close}
          className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-stone-400 transition hover:bg-white/5 hover:text-white active:scale-95"
        >
          {ChevronDownIcon}
          Minimize
        </button>
      </div>
    </div>
  )
}
