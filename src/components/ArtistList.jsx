export default function ArtistList({ artists, onOpen, emptyMessage }) {
  if (artists.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center text-neutral-400">
        <p className="text-sm">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <ul className="flex-1 overflow-y-auto">
      {artists.map((artist) => (
        <li key={artist.name} className="border-b border-white/5 last:border-b-0">
          <button
            type="button"
            onClick={() => onOpen(artist)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition active:bg-white/5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg">
              🎤
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{artist.name}</p>
              <p className="text-xs text-neutral-500">
                {artist.tracks.length} track{artist.tracks.length === 1 ? '' : 's'}
              </p>
            </div>
            <svg className="h-4 w-4 shrink-0 text-neutral-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </li>
      ))}
    </ul>
  )
}
