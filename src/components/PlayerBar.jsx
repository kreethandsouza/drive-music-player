import Spinner from './Spinner'
import { getBaseName } from '../lib/filename'
import { UNKNOWN_ARTIST } from '../lib/metadata'

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function PlayerBar({ track, isPlaying, isLoading, progress, onToggle, onSeek }) {
  if (!track) return null

  const duration = Number.isFinite(progress.duration) ? progress.duration : 0
  const pct = duration ? (progress.currentTime / duration) * 100 : 0

  return (
    <div className="sticky bottom-0 z-10 border-t border-white/10 bg-neutral-900/95 px-4 py-3 backdrop-blur">
      <div className="relative mb-2 flex h-4 w-full items-center">
        <div className="absolute inset-x-0 h-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
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
          className="absolute inset-x-0 h-4 w-full cursor-pointer appearance-none bg-transparent accent-emerald-500 disabled:cursor-default [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500"
        />
      </div>
      <div className="flex items-center gap-3">
        {track.artUrl ? (
          <img src={track.artUrl} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/10 text-lg">🎵</div>
        )}

        <button
          type="button"
          onClick={onToggle}
          disabled={isLoading}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-neutral-950 transition active:scale-95 disabled:opacity-60"
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

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{track.displayTitle || getBaseName(track.name)}</p>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            {track.artist && track.artist !== UNKNOWN_ARTIST && <p className="truncate">{track.artist}</p>}
            <p className="shrink-0">
              {formatTime(progress.currentTime)} / {formatTime(progress.duration)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
