const HomeIcon = (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const SongsIcon = (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
)
const ComposersIcon = (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const PlaylistsIcon = (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 14v-2a8 8 0 0 1 16 0v2" strokeLinecap="round" />
    <rect x="2" y="14" width="5" height="7" rx="2" />
    <rect x="17" y="14" width="5" height="7" rx="2" />
  </svg>
)

const TABS = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'songs', label: 'Songs', icon: SongsIcon },
  { id: 'composers', label: 'Composers', icon: ComposersIcon },
  { id: 'playlists', label: 'Playlists', icon: PlaylistsIcon },
]

/**
 * Persistent bottom navigation, Spotify-style — always visible (even
 * inside a composer/playlist detail view), with the mini player (when a
 * track is loaded) stacking directly above it rather than overlapping it.
 */
export default function BottomNav({ active, onChange }) {
  return (
    <nav className="flex shrink-0 border-t border-white/10 bg-brand-950/95 backdrop-blur">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition active:scale-95 ${
            active === tab.id ? 'text-gold-400' : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
