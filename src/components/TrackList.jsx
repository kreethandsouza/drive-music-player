import Spinner from './Spinner'
import TrackRow from './TrackRow'

const ShuffleIcon = (
  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h3.3a4 4 0 0 1 3.2 1.6l6.6 8.8a4 4 0 0 0 3.2 1.6H21" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17.5 4 21 6l-3.5 2M3 18h3.3a4 4 0 0 0 3.2-1.6l1-1.3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17.5 20 21 18l-3.5-2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function TrackList({
  tracks,
  isLoading,
  error,
  currentTrack,
  isPlaying,
  loadingTrackId,
  onPlay,
  likedTrackIds,
  onToggleLike,
  onOpenActions,
  emptyMessage = 'No audio files found in your Drive.',
  countLabel,
  onShufflePlay,
}) {
  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-neutral-400">
        <Spinner className="h-6 w-6" />
        <p className="text-sm">Loading tracks from Drive…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    )
  }

  if (tracks.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center text-neutral-400">
        <p className="text-sm">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {(countLabel || onShufflePlay) && (
        <div className="flex items-center justify-between px-4 py-2">
          {countLabel && <p className="text-xs text-neutral-500">{countLabel}</p>}
          {onShufflePlay && (
            <button
              type="button"
              onClick={() => onShufflePlay(tracks)}
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-gold-400 transition hover:bg-white/5 active:scale-95"
            >
              {ShuffleIcon}
              Shuffle Play
            </button>
          )}
        </div>
      )}
      <ul>
        {tracks.map((track) => (
          <TrackRow
            key={track.id}
            track={track}
            isActive={currentTrack?.id === track.id}
            isPlaying={currentTrack?.id === track.id && isPlaying}
            isLoading={loadingTrackId === track.id}
            onPlay={onPlay}
            isLiked={likedTrackIds?.has(track.id)}
            onToggleLike={onToggleLike}
            onOpenActions={onOpenActions}
          />
        ))}
      </ul>
    </div>
  )
}
