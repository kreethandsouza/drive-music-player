import { UNKNOWN_ARTIST } from '../lib/sheetLibrary'
import TrackRow from './TrackRow'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 5) return 'Good night'
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

// A deterministic color per track id, so the same song always gets the
// same "cover" tile color across sessions — there's no real album art.
function colorForId(id) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return `hsl(${hash % 360} 45% 22%)`
}

function Avatar({ profile }) {
  if (profile?.picture) {
    return (
      <img
        src={profile.picture}
        alt=""
        referrerPolicy="no-referrer"
        className="h-10 w-10 shrink-0 rounded-full object-cover"
      />
    )
  }
  const initial = profile?.name?.trim()?.[0]?.toUpperCase()
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-500 text-sm font-semibold text-brand-950">
      {initial || '🎵'}
    </div>
  )
}

function TrackTile({ track, isActive, isPlaying, onPlay }) {
  return (
    <button
      type="button"
      onClick={() => onPlay(track)}
      className="flex w-32 shrink-0 flex-col items-start gap-2 text-left active:scale-[0.98]"
    >
      <div
        className="flex h-32 w-32 items-center justify-center rounded-xl text-3xl shadow-lg"
        style={{ backgroundColor: colorForId(track.id) }}
      >
        {isActive && isPlaying ? '🔊' : '🎵'}
      </div>
      <div className="w-full">
        <p className={`truncate text-sm font-medium ${isActive ? 'text-gold-400' : 'text-white'}`}>
          {track.displayTitle}
        </p>
        {track.artist !== UNKNOWN_ARTIST && <p className="truncate text-xs text-neutral-500">{track.artist}</p>}
      </div>
    </button>
  )
}

function JumpBackInTile({ icon, iconClassName, title, subtitle, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-[220px] shrink-0 items-center gap-3 overflow-hidden rounded-xl bg-brand-900 pr-4 text-left shadow active:scale-[0.98]"
    >
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center text-xl ${iconClassName}`}>{icon}</div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">{title}</p>
        <p className="truncate text-xs text-neutral-400">{subtitle}</p>
      </div>
    </button>
  )
}

/**
 * The Home tab: a Spotify-style landing screen with a greeting, quick
 * shortcuts, and personal listening stats (recently/most played, top
 * composer) — all derived from this account's own Drive metadata file, so
 * it's private to the signed-in user, same as their playlists.
 */
export default function HomeView({
  profile,
  pasandPlaylist,
  recentlyPlayed,
  mostPlayed,
  topComposer,
  totalPlays,
  currentTrack,
  isPlaying,
  loadingTrackId,
  onPlay,
  likedTrackIds,
  onToggleLike,
  onOpenPasand,
  onOpenActions,
}) {
  const firstName = profile?.name?.trim()
  const continueTrack = recentlyPlayed[0]
  const hasJumpBackIn = Boolean(pasandPlaylist) || Boolean(continueTrack)
  const isEmpty = recentlyPlayed.length === 0 && mostPlayed.length === 0

  return (
    <div className="flex-1 overflow-y-auto pb-6">
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="min-w-0">
          <p className="truncate text-xl font-semibold text-white">
            {getGreeting()}
            {firstName ? `, ${firstName}` : ''}
          </p>
          {totalPlays > 0 && (
            <p className="mt-0.5 text-xs text-stone-400">
              {totalPlays} song{totalPlays === 1 ? '' : 's'} streamed so far
            </p>
          )}
        </div>
        <Avatar profile={profile} />
      </div>

      {hasJumpBackIn && (
        <div className="mt-6 flex gap-3 overflow-x-auto px-4 pb-1">
          {pasandPlaylist && (
            <JumpBackInTile
              icon="❤️"
              iconClassName="bg-brand-700 text-red-400"
              title="Pasand"
              subtitle={`${pasandPlaylist.tracks.length} liked song${pasandPlaylist.tracks.length === 1 ? '' : 's'}`}
              onClick={onOpenPasand}
            />
          )}
          {continueTrack && (
            <JumpBackInTile
              icon="🎵"
              iconClassName=""
              title={continueTrack.displayTitle}
              subtitle="Continue listening"
              onClick={() => onPlay(continueTrack)}
            />
          )}
        </div>
      )}

      {recentlyPlayed.length > 0 && (
        <section className="mt-8">
          <h2 className="px-4 text-sm font-semibold text-white">Recently played</h2>
          <div className="mt-3 flex gap-4 overflow-x-auto px-4 pb-1">
            {recentlyPlayed.map((track) => (
              <TrackTile
                key={track.id}
                track={track}
                isActive={currentTrack?.id === track.id}
                isPlaying={currentTrack?.id === track.id && isPlaying}
                onPlay={onPlay}
              />
            ))}
          </div>
        </section>
      )}

      {topComposer && (
        <p className="mt-8 px-4 text-sm text-stone-400">
          You've been loving <span className="font-semibold text-gold-400">{topComposer.name}</span> lately
        </p>
      )}

      {mostPlayed.length > 0 && (
        <section className="mt-6">
          <h2 className="px-4 text-sm font-semibold text-white">Most played</h2>
          <ul className="mt-2">
            {mostPlayed.map(({ track }) => (
              <TrackRow
                key={track.id}
                track={track}
                isActive={currentTrack?.id === track.id}
                isPlaying={currentTrack?.id === track.id && isPlaying}
                isLoading={loadingTrackId === track.id}
                onPlay={onPlay}
                isLiked={likedTrackIds?.has(track.id)}
                onToggleLike={onToggleLike}
                onOpenActions={onOpenActions}
              />
            ))}
          </ul>
        </section>
      )}

      {isEmpty && (
        <div className="mt-10 px-6 text-center text-sm text-neutral-400">
          <p>Play a few songs and this screen will fill up with your recently played and most played tracks.</p>
        </div>
      )}
    </div>
  )
}
