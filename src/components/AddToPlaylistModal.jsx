import { useState } from 'react'
import Modal from './Modal'
import Spinner from './Spinner'

function CheckIcon({ checked }) {
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
        checked ? 'border-emerald-500 bg-emerald-500 text-neutral-950' : 'border-white/20 text-transparent'
      }`}
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

export default function AddToPlaylistModal({ track, playlists, onToggle, onCreate, onClose }) {
  const [newName, setNewName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newName.trim() || isCreating) return
    setIsCreating(true)
    try {
      await onCreate(newName.trim())
      setNewName('')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Modal title="Add to playlist" onClose={onClose}>
      {playlists.length > 0 && (
        <ul className="mb-3 max-h-56 overflow-y-auto rounded-lg border border-white/10">
          {playlists.map((playlist) => {
            const isMember = playlist.trackIds.includes(track.id)
            return (
              <li key={playlist.id} className="border-b border-white/10 last:border-b-0">
                <button
                  type="button"
                  onClick={() => onToggle(playlist.id, isMember)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition active:bg-white/5"
                >
                  <CheckIcon checked={isMember} />
                  <span className="min-w-0 flex-1 truncate text-sm text-white">{playlist.name}</span>
                  <span className="shrink-0 text-xs text-neutral-500">{playlist.trackIds.length}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New playlist name"
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-600"
        />
        <button
          type="submit"
          disabled={!newName.trim() || isCreating}
          className="flex shrink-0 items-center gap-1 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-neutral-950 transition disabled:opacity-60"
        >
          {isCreating && <Spinner className="h-4 w-4" />}
          Create
        </button>
      </form>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-300 transition hover:bg-white/5"
        >
          Done
        </button>
      </div>
    </Modal>
  )
}
