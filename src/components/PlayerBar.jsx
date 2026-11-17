import { useRef } from 'react'
import Spinner from './Spinner'
import { UNKNOWN_ARTIST } from '../lib/sheetLibrary'

// How far (in px) an upward swipe on the bar needs to travel before it
// counts as "expand" rather than just a tap on one of the bar's buttons.
const SWIPE_UP_THRESHOLD = 40

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const SkipPreviousIcon = (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
  </svg>
)
const SkipNextIcon = (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
  </svg>
)
const ChevronUpIcon = (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m6 15 6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

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
      className="flex h-9 w-9 shrink-0 flex-col items-center justify-center gap-0.5 rounded-full text-stone-300 transition hover:bg-white/5 hover:text-white active:scale-95 disabled:opacity-40"
    >
      <svg className={`h-3.5 w-3.5 ${isBack ? 'scale-x-[-1]' : ''}`} viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 6v12l8-6-8-6z" />
        <path d="M13 6v12l8-6-8-6z" />
      </svg>
      <span className="text-[8px] font-bold leading-none">10s</span>
    </button>
  )
}

export default function PlayerBar({
  track,
  isPlaying,
  isLoading,
  progress,
  hasPrevious,
  hasNext,
  onToggle,
  onSeek,
  onPrevious,
  onNext,
  onExpand,
}) {
  const dragStartYRef = useRef(null)

  if (!track) return null

  const duration = Number.isFinite(progress.duration) ? progress.duration : 0
  const pct = duration ? (progress.currentTime / duration) * 100 : 0

  // Swiping up on the bar (from anywhere, including the arrow button)
  // also expands it — some iPhones render the arrow button too small/
  // near the edge to tap reliably, and swiping up there otherwise just
  // triggers iOS's own Control Center/notification gesture instead.
  const handlePointerDown = (e) => {
    dragStartYRef.current = e.clientY
  }
  const handlePointerUp = (e) => {
    if (dragStartYRef.current == null) return
    const deltaY = dragStartYRef.current - e.clientY
    dragStartYRef.current = null
    if (deltaY > SWIPE_UP_THRESHOLD) onExpand()
  }

  return (
    <div
      className="sticky bottom-0 z-10 border-t border-white/10 bg-brand-900/95 px-4 py-3 backdrop-blur"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        dragStartYRef.current = null
      }}
    >
      <div className="relative mb-2 flex h-4 w-full items-center">
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
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!hasPrevious}
          aria-label="Previous song"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-stone-300 transition hover:bg-white/5 hover:text-white active:scale-95 disabled:opacity-40"
        >
          {SkipPreviousIcon}
        </button>

        <SeekButton direction="back" onClick={() => onSeek(progress.currentTime - 10)} disabled={!duration} />

        <button
          type="button"
          onClick={onToggle}
          disabled={isLoading}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-500 text-brand-950 transition active:scale-95 disabled:opacity-60"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isLoading ? (
            <Spinner className="h-5 w-5" />
          ) : isPlaying ? (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
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
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-stone-300 transition hover:bg-white/5 hover:text-white active:scale-95 disabled:opacity-40"
        >
          {SkipNextIcon}
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{track.displayTitle}</p>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            {track.artist && track.artist !== UNKNOWN_ARTIST && <p className="truncate">{track.artist}</p>}
            <p className="shrink-0">
              {formatTime(progress.currentTime)} / {formatTime(progress.duration)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onExpand}
          aria-label="Expand player"
          className="shrink-0 rounded-lg p-1.5 text-stone-400 transition hover:bg-white/5 hover:text-white active:scale-95"
        >
          {ChevronUpIcon}
        </button>
      </div>
    </div>
  )
}
