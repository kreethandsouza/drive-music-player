import Spinner from './Spinner'

export default function SignInScreen({ onSignIn, isSigningIn, isReady, error }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-neutral-950 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-3xl">
        🎵
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-white">Drive Music Player</h1>
        <p className="mt-2 max-w-xs text-sm text-neutral-400">
          Sign in with Google to stream and manage the audio files in your Drive.
        </p>
      </div>

      <button
        type="button"
        onClick={onSignIn}
        disabled={!isReady || isSigningIn}
        className="flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-medium text-neutral-900 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSigningIn ? (
          <Spinner className="h-5 w-5" />
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 01-2.4 3.63v3h3.88c2.27-2.09 3.54-5.17 3.54-8.87z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.11 0-5.75-2.1-6.69-4.93H1.3v3.09A12 12 0 0012 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.31 14.33A7.2 7.2 0 014.91 12c0-.81.14-1.6.4-2.33V6.58H1.3A12 12 0 000 12c0 1.94.46 3.77 1.3 5.42z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.3 6.58l4.01 3.09C6.25 6.85 8.89 4.75 12 4.75z"
            />
          </svg>
        )}
        Sign in with Google
      </button>

      {error && <p className="max-w-xs text-sm text-red-400">{error}</p>}
    </div>
  )
}
