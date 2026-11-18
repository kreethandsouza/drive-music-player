import { useRef } from 'react'
import Spinner from './Spinner'
import { UNKNOWN_ARTIST } from '../lib/sheetLibrary'
import { colorForId } from '../lib/trackColor'

// How far (in px) an upward swipe on the bar needs to travel before it
// counts as "expand" rather than just a tap on one of the bar's buttons.
const SWIPE_UP_THRESHOLD = 40

function HeartIcon({ filled }) {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <path
        d="M12 21s-7.2-4.5-9.5-9A5.5 5.5 0 0 1 12 6.5 5.5 5.5 0 0 1 21.5 12c-2.3 4.5-9.5 9-9.5 9z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * The mini player: deliberately minimal (art, title, like, play/pause) —
 * Previous/Next and ±10s live only in the full-screen Now Playing view,
 * reached by tapping the art/title, swiping up, or the ⋯ handled there.
 */
export default function PlayerBar({ track, isPlaying, isLoading, progress, isLiked, onToggle, onToggleLike, onSeek, onExpand }) {
  const dragStartYRef = useRef(null)

  if (!track) return null

  const duration = Number.isFinite(progress.duration) ? progress.duration : 0
  const pct = duration ? (progress.currentTime / duration) * 100 : 0

  // Swiping up on the bar also expands it — tapping the art/title does
  // too, but on some iPhones a quick tap near the top edge can be eaten
  // by iOS's own Control Center/notification gesture instead.
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
      // Not `sticky` — the app shell (#root) is now a fixed, non-scrolling
      // flex column (see index.css), so there's no scrolling ancestor for
      // `sticky` to stick within; it was computing against the collapsed
      // <body> instead and snapping to the top of the screen. Plain flex
      // placement already keeps this right above the bottom nav.
      className="shrink-0 border-t border-white/10 bg-brand-900/95 backdrop-blur"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        dragStartYRef.current = null
      }}
    >
      {/* A slim progress line, with a taller invisible hit area on top of
          it so it's still easy to grab and scrub despite looking thin. */}
      <div className="relative h-[3px] w-full bg-white/10">
        <div className="absolute inset-y-0 left-0 bg-gold-500" style={{ width: `${pct}%` }} />
        <input
          type="range"
          min={0}
          max={duration || 0}
          step="any"
          value={Math.min(progress.currentTime, duration || 0)}
          onChange={(e) => onSeek(Number(e.target.value))}
          disabled={!duration}
          aria-label="Seek"
          className="absolute inset-x-0 -top-2 h-5 w-full cursor-pointer appearance-none bg-transparent opacity-0 disabled:cursor-default"
        />
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
        <button type="button" onClick={onExpand} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-xl shadow-md"
            style={{ backgroundColor: colorForId(track.id) }}
          >
            {isPlaying ? '🔊' : '🎵'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-white">{track.displayTitle}</p>
            {track.artist && track.artist !== UNKNOWN_ARTIST && (
              <p className="truncate text-xs text-neutral-400">{track.artist}</p>
            )}
          </div>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleLike()
          }}
          aria-label={isLiked ? 'Remove from Pasand' : 'Add to Pasand'}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition active:scale-95 ${
            isLiked ? 'text-gold-400' : 'text-stone-400 hover:text-white'
          }`}
        >
          <HeartIcon filled={isLiked} />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggle()
          }}
          disabled={isLoading}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold-500 text-brand-950 shadow-md transition active:scale-95 disabled:opacity-60"
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
      </div>
    </div>
  )
}
