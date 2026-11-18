import { PASAND_PLAYLIST_NAME } from '../lib/metadataStore'

const HeartIcon = (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 21s-7.2-4.5-9.5-9A5.5 5.5 0 0 1 12 6.5 5.5 5.5 0 0 1 21.5 12c-2.3 4.5-9.5 9-9.5 9z" />
  </svg>
)

export default function PlaylistList({ playlists, onOpen, onCreate, emptyMessage }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="border-b border-white/10 px-4 py-2">
        <button
          type="button"
          onClick={onCreate}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-gold-400 transition hover:bg-white/5"
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
          {playlists.map((playlist) => {
            const isPasand = playlist.name.toLowerCase() === PASAND_PLAYLIST_NAME.toLowerCase()
            return (
            <li key={playlist.id} className="border-b border-white/5 last:border-b-0">
              <button
                type="button"
                onClick={() => onOpen(playlist)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition active:bg-white/5"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg ${
                    isPasand ? 'bg-brand-700 text-red-400' : 'bg-white/10'
                  }`}
                >
                  {isPasand ? HeartIcon : '🎧'}
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
            )
          })}
        </ul>
      )}
    </div>
  )
}
