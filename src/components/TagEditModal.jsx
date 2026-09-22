import { useState } from 'react'
import Modal from './Modal'
import Spinner from './Spinner'
import { UNKNOWN_ALBUM, UNKNOWN_ARTIST } from '../lib/metadata'

export default function TagEditModal({ track, onCancel, onConfirm, isSaving, error }) {
  const [artist, setArtist] = useState(track.artist !== UNKNOWN_ARTIST ? track.artist : '')
  const [album, setAlbum] = useState(track.album !== UNKNOWN_ALBUM ? track.album : '')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isSaving) return
    onConfirm(track, { artist: artist.trim(), album: album.trim() })
  }

  return (
    <Modal title="Edit song info" onClose={onCancel}>
      <p className="mb-3 text-xs text-neutral-500">
        Manually assign this song to an artist or album. This is saved on this device and
        overrides the file's own tags.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-neutral-400">Artist</label>
          <input
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder={UNKNOWN_ARTIST}
            className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-600"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-400">Album</label>
          <input
            type="text"
            value={album}
            onChange={(e) => setAlbum(e.target.value)}
            placeholder={UNKNOWN_ALBUM}
            className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-600"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-300 transition hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-neutral-950 transition disabled:opacity-60"
          >
            {isSaving && <Spinner className="h-4 w-4" />}
            Save
          </button>
        </div>
      </form>
    </Modal>
  )
}
