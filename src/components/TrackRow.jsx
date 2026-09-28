import Spinner from './Spinner'
import { UNKNOWN_ARTIST } from '../lib/metadata'

export default function TrackRow({ track, isActive, isPlaying, isLoading, onPlay, onOpenActions }) {
  const subtitle = track.artist !== UNKNOWN_ARTIST ? track.artist : track.name

  return (
    <li className="flex items-center gap-3 border-b border-white/5 px-4 py-3 last:border-b-0">
      <button
        type="button"
        onClick={() => onPlay(track)}
        className={`relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full transition active:scale-95 ${
          isActive ? 'text-emerald-400' : 'text-white'
        } ${track.artUrl ? 'bg-neutral-800' : isActive ? 'bg-emerald-500/20' : 'bg-white/10'}`}
        aria-label={isActive && isPlaying ? 'Pause' : 'Play'}
      >
        {track.artUrl && <img src={track.artUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <span className={`relative ${track.artUrl ? 'drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]' : ''}`}>
          {isLoading ? (
            <Spinner className="h-4 w-4" />
          ) : isActive && isPlaying ? (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 5v14l12-7z" />
            </svg>
          )}
        </span>
      </button>

      <button type="button" onClick={() => onPlay(track)} className="min-w-0 flex-1 text-left">
        <p className={`truncate text-sm font-medium ${isActive ? 'text-emerald-400' : 'text-white'}`}>
          {track.displayTitle}
        </p>
        <p className="truncate text-xs text-neutral-500">{subtitle}</p>
      </button>

      <button
        type="button"
        onClick={() => onOpenActions(track)}
        className="shrink-0 rounded-lg p-2 text-neutral-400 transition hover:bg-white/5 hover:text-white"
        aria-label="More actions"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.75" />
          <circle cx="12" cy="12" r="1.75" />
          <circle cx="19" cy="12" r="1.75" />
        </svg>
      </button>
    </li>
  )
}
