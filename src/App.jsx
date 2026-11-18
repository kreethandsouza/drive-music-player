import { useCallback, useMemo, useState } from 'react'
import Header from './components/Header'
import SignInScreen from './components/SignInScreen'
import LibraryView from './components/LibraryView'
import PlayerBar from './components/PlayerBar'
import NowPlayingSheet from './components/NowPlayingSheet'
import AddToPlaylistModal from './components/AddToPlaylistModal'
import Spinner from './components/Spinner'
import { useGoogleAuth } from './lib/useGoogleAuth'
import { useGoogleProfile } from './lib/useGoogleProfile'
import { useAudioPlayer } from './lib/useAudioPlayer'
import { useLibrary } from './lib/useLibrary'
import { useDriveMetadata } from './lib/useDriveMetadata'
import { PASAND_PLAYLIST_NAME } from './lib/metadataStore'
import { UNKNOWN_ARTIST } from './lib/sheetLibrary'

function App() {
  const auth = useGoogleAuth()
  const profile = useGoogleProfile(auth.token)
  const library = useLibrary(auth.token)
  const driveMeta = useDriveMetadata(auth.token)
  const player = useAudioPlayer(auth.token, library.tracksBySongNo, driveMeta.recordPlay)
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false)
  const [addToPlaylistTrackFromPlayer, setAddToPlaylistTrackFromPlayer] = useState(null)

  // Resolve each playlist's stored track ids against the live track list,
  // dropping any that no longer exist (e.g. removed from the spreadsheet).
  const tracksById = useMemo(() => Object.fromEntries(library.tracks.map((t) => [t.id, t])), [library.tracks])
  const playlists = useMemo(
    () =>
      driveMeta.playlists.map((playlist) => ({
        ...playlist,
        tracks: playlist.trackIds.map((id) => tracksById[id]).filter(Boolean),
      })),
    [driveMeta.playlists, tracksById],
  )

  // Home tab: resolve recently-played/most-played stats (stored by track
  // id in Drive metadata) against the live track list the same way
  // playlists are, so a song that's since vanished from the spreadsheet
  // just quietly drops out rather than showing a broken entry.
  const recentlyPlayed = useMemo(
    () => driveMeta.stats.recentlyPlayed.map((id) => tracksById[id]).filter(Boolean),
    [driveMeta.stats.recentlyPlayed, tracksById],
  )
  const mostPlayed = useMemo(() => {
    const entries = Object.entries(driveMeta.stats.plays)
      .map(([id, info]) => ({ track: tracksById[id], count: info.count }))
      .filter((e) => e.track)
    entries.sort((a, b) => b.count - a.count)
    return entries.slice(0, 10)
  }, [driveMeta.stats.plays, tracksById])
  const topComposer = useMemo(() => {
    const totals = new Map()
    for (const { track, count } of mostPlayed) {
      if (track.artist === UNKNOWN_ARTIST) continue
      totals.set(track.artist, (totals.get(track.artist) || 0) + count)
    }
    let best = null
    for (const [name, count] of totals) {
      if (!best || count > best.count) best = { name, count }
    }
    return best
  }, [mostPlayed])
  const totalPlays = useMemo(
    () => Object.values(driveMeta.stats.plays).reduce((sum, p) => sum + p.count, 0),
    [driveMeta.stats.plays],
  )

  const pasandPlaylist = useMemo(
    () => playlists.find((p) => p.name.toLowerCase() === PASAND_PLAYLIST_NAME.toLowerCase()) || null,
    [playlists],
  )
  const likedTrackIds = useMemo(() => new Set(pasandPlaylist?.trackIds || []), [pasandPlaylist])
  const toggleLike = useCallback(
    (trackId) => {
      if (!pasandPlaylist) return
      if (likedTrackIds.has(trackId)) driveMeta.removeTrackFromPlaylist(pasandPlaylist.id, trackId)
      else driveMeta.addTrackToPlaylist(pasandPlaylist.id, trackId)
    },
    [pasandPlaylist, likedTrackIds, driveMeta],
  )

  // Previous/Next in the player bar step by song number (the nearest
  // existing song number below/above the current one), independent of
  // whichever list is currently on screen.
  const currentSongNoIndex = useMemo(
    () =>
      player.currentTrack
        ? library.tracksBySongNo.findIndex((t) => t.id === player.currentTrack.id)
        : -1,
    [library.tracksBySongNo, player.currentTrack],
  )
  const previousTrack = currentSongNoIndex > 0 ? library.tracksBySongNo[currentSongNoIndex - 1] : null
  const nextTrack =
    currentSongNoIndex >= 0 && currentSongNoIndex < library.tracksBySongNo.length - 1
      ? library.tracksBySongNo[currentSongNoIndex + 1]
      : null

  // Covers both the initial GIS script load and the brief silent
  // sign-in-restore attempt on a cold start, so a returning user doesn't
  // see a flash of the sign-in screen before that attempt resolves.
  if ((!auth.isReady || auth.isRestoringSession) && !auth.error) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-brand-950">
        <Spinner className="h-6 w-6 text-stone-500" />
      </div>
    )
  }

  if (!auth.isSignedIn) {
    return (
      <SignInScreen
        onSignIn={auth.signIn}
        isSigningIn={auth.isSigningIn}
        isReady={auth.isReady}
        error={auth.error}
      />
    )
  }

  return (
    <div className="flex min-h-svh flex-col bg-brand-950">
      <Header onSignOut={auth.signOut} onRefresh={library.reload} isRefreshing={library.isLoading} />

      <LibraryView
        tracks={library.tracks}
        composers={library.composers}
        playlists={playlists}
        isLoading={library.isLoading}
        error={library.error}
        currentTrack={player.currentTrack}
        isPlaying={player.isPlaying}
        loadingTrackId={player.isLoading ? player.currentTrack?.id : null}
        onPlay={player.playTrack}
        likedTrackIds={likedTrackIds}
        onToggleLike={toggleLike}
        onCreatePlaylist={driveMeta.createPlaylist}
        onRenamePlaylist={driveMeta.renamePlaylist}
        onDeletePlaylist={driveMeta.deletePlaylist}
        onAddTrackToPlaylist={driveMeta.addTrackToPlaylist}
        onRemoveTrackFromPlaylist={driveMeta.removeTrackFromPlaylist}
        profile={profile}
        pasandPlaylist={pasandPlaylist}
        recentlyPlayed={recentlyPlayed}
        mostPlayed={mostPlayed}
        topComposer={topComposer}
        totalPlays={totalPlays}
      />

      {driveMeta.error && (
        <p className="border-t border-white/10 bg-red-500/10 px-4 py-2 text-center text-xs text-red-400">
          {driveMeta.error}
        </p>
      )}

      {player.error && (
        <p className="border-t border-white/10 bg-red-500/10 px-4 py-2 text-center text-xs text-red-400">
          {player.error}
        </p>
      )}

      <PlayerBar
        track={player.currentTrack}
        isPlaying={player.isPlaying}
        isLoading={player.isLoading}
        progress={player.progress}
        isLiked={Boolean(player.currentTrack && likedTrackIds.has(player.currentTrack.id))}
        onToggle={() => player.playTrack(player.currentTrack)}
        onToggleLike={() => player.currentTrack && toggleLike(player.currentTrack.id)}
        onSeek={player.seek}
        onExpand={() => setIsPlayerExpanded(true)}
      />

      {isPlayerExpanded && player.currentTrack && (
        <NowPlayingSheet
          track={player.currentTrack}
          isPlaying={player.isPlaying}
          isLoading={player.isLoading}
          progress={player.progress}
          hasPrevious={Boolean(previousTrack)}
          hasNext={Boolean(nextTrack)}
          isLiked={likedTrackIds.has(player.currentTrack.id)}
          onToggle={() => player.playTrack(player.currentTrack)}
          onSeek={player.seek}
          onPrevious={() => previousTrack && player.playTrack(previousTrack)}
          onNext={() => nextTrack && player.playTrack(nextTrack)}
          onToggleLike={() => toggleLike(player.currentTrack.id)}
          onAddToPlaylist={() => setAddToPlaylistTrackFromPlayer(player.currentTrack)}
          onClose={() => setIsPlayerExpanded(false)}
        />
      )}

      {addToPlaylistTrackFromPlayer && (
        <AddToPlaylistModal
          track={addToPlaylistTrackFromPlayer}
          playlists={playlists}
          onToggle={(playlistId, isMember) =>
            isMember
              ? driveMeta.removeTrackFromPlaylist(playlistId, addToPlaylistTrackFromPlayer.id)
              : driveMeta.addTrackToPlaylist(playlistId, addToPlaylistTrackFromPlayer.id)
          }
          onCreate={(name) => driveMeta.createPlaylist(name, [addToPlaylistTrackFromPlayer.id])}
          onClose={() => setAddToPlaylistTrackFromPlayer(null)}
        />
      )}
    </div>
  )
}

export default App
