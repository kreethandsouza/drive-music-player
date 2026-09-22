import Spinner from './Spinner'
import { UNKNOWN_ARTIST } from '../lib/metadata'

export default function TrackRow({ track, isActive, isPlaying, isLoading, onPlay, onRename, onEditTags, onDelete }) {
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
        onClick={() => onRename(track)}
        className="shrink-0 rounded-lg p-2 text-neutral-400 transition hover:bg-white/5 hover:text-white"
        aria-label="Rename"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => onEditTags(track)}
        className={`shrink-0 rounded-lg p-2 transition hover:bg-white/5 hover:text-white ${
          track.hasOverride ? 'text-emerald-400' : 'text-neutral-400'
        }`}
        aria-label="Edit artist/album"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3.24L4 3a1 1 0 0 0-1 1l.24 5.59a2 2 0 0 0 .59 1.41l9.58 9.58a2 2 0 0 0 2.83 0l4.35-4.35a2 2 0 0 0 0-2.82Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="7.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => onDelete(track)}
        className="shrink-0 rounded-lg p-2 text-neutral-400 transition hover:bg-red-500/10 hover:text-red-400"
        aria-label="Delete"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0-1 14a1 1 0 01-1 1H7a1 1 0 01-1-1L5 6h14z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </li>
  )
}
