export default function ActionSheet({ title, actions, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-6 sm:items-center sm:pb-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-neutral-900 shadow-xl ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <p className="truncate border-b border-white/10 px-4 py-3 text-sm font-medium text-neutral-400">
            {title}
          </p>
        )}
        <ul>
          {actions.map((action) => (
            <li key={action.label}>
              <button
                type="button"
                onClick={() => {
                  onClose()
                  action.onClick()
                }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium transition active:bg-white/5 ${
                  action.danger ? 'text-red-400' : 'text-white'
                }`}
              >
                {action.icon}
                {action.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
