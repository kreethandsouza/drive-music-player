export default function PlaylistList({ playlists, onOpen, onCreate, emptyMessage }) {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="border-b border-white/10 px-4 py-2">
        <button
          type="button"
          onClick={onCreate}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-emerald-400 transition hover:bg-white/5"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          New playlist
        </button>
      </div>

      {playlists.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center text-neutral-400">
          <p className="text-sm">{emptyMessage}</p>
        </div>
      ) : (
        <ul>
          {playlists.map((playlist) => (
            <li key={playlist.id} className="border-b border-white/5 last:border-b-0">
              <button
                type="button"
                onClick={() => onOpen(playlist)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition active:bg-white/5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-lg">
                  🎧
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{playlist.name}</p>
                  <p className="text-xs text-neutral-500">
                    {playlist.tracks.length} track{playlist.tracks.length === 1 ? '' : 's'}
                  </p>
                </div>
                <svg className="h-4 w-4 shrink-0 text-neutral-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
