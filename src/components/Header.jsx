export default function Header({ onSignOut, onRefresh, isRefreshing }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-neutral-950/90 px-4 py-3 backdrop-blur">
      <h1 className="text-base font-semibold text-white">Drive Music Player</h1>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="rounded-lg p-2 text-neutral-300 transition hover:bg-white/5 disabled:opacity-50"
          aria-label="Refresh"
        >
          <svg
            className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20 11A8 8 0 006.34 6.34M4 13a8 8 0 0013.66 4.66" strokeLinecap="round" />
            <path d="M4 4v5h5M20 20v-5h-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onSignOut}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-300 transition hover:bg-white/5"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
