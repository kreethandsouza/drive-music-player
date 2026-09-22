export default function DetailHeader({ title, subtitle, artUrl, onBack }) {
  return (
    <div className="flex items-center gap-3 border-b border-white/10 px-3 py-3">
      <button
        type="button"
        onClick={onBack}
        className="shrink-0 rounded-lg p-2 text-neutral-300 transition hover:bg-white/5 hover:text-white"
        aria-label="Back"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {artUrl && <img src={artUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />}

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">{title}</p>
        {subtitle && <p className="truncate text-xs text-neutral-500">{subtitle}</p>}
      </div>
    </div>
  )
}
