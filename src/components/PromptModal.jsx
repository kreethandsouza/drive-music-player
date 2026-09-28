import { useState } from 'react'
import Modal from './Modal'
import Spinner from './Spinner'

export default function PromptModal({
  title,
  label,
  placeholder,
  initialValue = '',
  confirmLabel = 'Save',
  onCancel,
  onConfirm,
  isSaving,
  error,
}) {
  const [value, setValue] = useState(initialValue)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!value.trim() || isSaving) return
    onConfirm(value.trim())
  }

  return (
    <Modal title={title} onClose={onCancel}>
      <form onSubmit={handleSubmit}>
        {label && <label className="mb-1 block text-xs text-neutral-400">{label}</label>}
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-600"
        />

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
            {confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  )
}
