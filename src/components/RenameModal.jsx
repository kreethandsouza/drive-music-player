import { useState } from 'react'
import Modal from './Modal'
import Spinner from './Spinner'
import { getBaseName, getExtension } from '../lib/filename'

export default function RenameModal({ track, onCancel, onConfirm, isSaving, error }) {
  const extension = getExtension(track.name)
  const [value, setValue] = useState(getBaseName(track.name))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!value.trim() || isSaving) return
    onConfirm(track, value)
  }

  return (
    <Modal title="Rename track" onClose={onCancel}>
      <form onSubmit={handleSubmit}>
        <div className="flex items-center rounded-lg border border-white/10 bg-neutral-800 px-3 py-2">
          <input
            autoFocus
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none"
          />
          {extension && <span className="shrink-0 text-sm text-neutral-500">{extension}</span>}
        </div>

        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-300 transition hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!value.trim() || isSaving}
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
