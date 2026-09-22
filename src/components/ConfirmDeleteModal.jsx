import Modal from './Modal'
import Spinner from './Spinner'
import { getBaseName } from '../lib/filename'

export default function ConfirmDeleteModal({ track, onCancel, onConfirm, isDeleting, error }) {
  return (
    <Modal title="Delete track?" onClose={onCancel}>
      <p className="text-sm text-neutral-400">
        <span className="text-white">{getBaseName(track.name)}</span> will be moved to your
        Google Drive trash.
      </p>

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
          type="button"
          onClick={() => onConfirm(track)}
          disabled={isDeleting}
          className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60"
        >
          {isDeleting && <Spinner className="h-4 w-4" />}
          Delete
        </button>
      </div>
    </Modal>
  )
}
