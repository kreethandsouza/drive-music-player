import Spinner from './Spinner'
import TrackRow from './TrackRow'

export default function TrackList({
  tracks,
  isLoading,
  error,
  currentTrack,
  isPlaying,
  loadingTrackId,
  onPlay,
  onOpenActions,
  emptyMessage = 'No audio files found in your Drive.',
  countLabel,
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
    <div className="flex flex-1 flex-col overflow-y-auto">
      {countLabel && <p className="px-4 py-2 text-xs text-neutral-500">{countLabel}</p>}
      <ul>
        {tracks.map((track) => (
          <TrackRow
            key={track.id}
            track={track}
            isActive={currentTrack?.id === track.id}
            isPlaying={currentTrack?.id === track.id && isPlaying}
            isLoading={loadingTrackId === track.id}
            onPlay={onPlay}
            onOpenActions={onOpenActions}
          />
        ))}
      </ul>
    </div>
  )
}
