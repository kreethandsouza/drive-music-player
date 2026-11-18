import { useState } from 'react'
import { createPortal } from 'react-dom'
import logo from '../assets/logo.png'

export default function Header({ onSignOut, onRefresh, isRefreshing }) {
  const [showAbout, setShowAbout] = useState(false)

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-brand-950/90 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2">
        <img src={logo} alt="" className="h-7 w-7 shrink-0" />
        <div className="leading-tight">
          <h1 className="text-base font-semibold text-white">Swarr</h1>
          <p className="text-[10px] text-stone-400">by Mandd Sobhann</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowAbout(true)}
          className="rounded-lg p-2 text-neutral-300 transition hover:bg-white/5"
          aria-label="About Swarr"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5" strokeLinecap="round" />
            <circle cx="12" cy="8" r="0.1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
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

      {showAbout &&
        createPortal(
          // Rendered via a portal straight to <body>, not nested inside
          // this sticky <header> — on iOS Safari a `position: fixed`
          // descendant of a `position: sticky` ancestor can get trapped
          // inside that ancestor's small box instead of covering the
          // full screen (a long-standing WebKit quirk); escaping via a
          // portal sidesteps it entirely.
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowAbout(false)}
          >
            <div
              className="max-h-[80vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-brand-900 p-5 shadow-xl ring-1 ring-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-4 text-lg font-semibold text-white">About Swarr</h2>
              <div className="space-y-2 text-sm text-stone-400">
                <p>© 2026 Swarr. Developed by kreethandsouza.</p>
                <p>
                  All rights to the songs in this catalog belong to their original creators and to Mandd Sobhann.
                  Swarr is only a streaming interface and claims no ownership over the music.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAbout(false)}
                className="mt-5 w-full rounded-xl bg-white/10 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 active:scale-[0.98]"
              >
                Close
              </button>
            </div>
          </div>,
          document.body,
        )}
    </header>
  )
}
