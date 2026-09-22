import { UNKNOWN_ARTIST } from '../lib/metadata'

function AlbumArt({ artUrl }) {
  if (artUrl) return <img src={artUrl} alt="" className="aspect-square w-full rounded-lg object-cover" />
  return (
    <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-white/5 text-2xl">🎵</div>
  )
}

export default function AlbumGrid({ albums, onOpen, emptyMessage }) {
  if (albums.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center text-neutral-400">
        <p className="text-sm">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid flex-1 auto-rows-min grid-cols-2 gap-4 overflow-y-auto p-4 sm:grid-cols-3">
      {albums.map((album) => (
        <button
          key={album.name}
          type="button"
          onClick={() => onOpen(album)}
          className="text-left transition active:scale-[0.97]"
        >
          <AlbumArt artUrl={album.artUrl} />
          <p className="mt-2 truncate text-sm font-medium text-white">{album.name}</p>
          <p className="truncate text-xs text-neutral-500">
            {album.artist !== UNKNOWN_ARTIST ? album.artist : `${album.tracks.length} track${album.tracks.length === 1 ? '' : 's'}`}
          </p>
        </button>
      ))}
    </div>
  )
}
