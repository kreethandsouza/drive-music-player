import { useCallback, useEffect, useState } from 'react'
import Header from './components/Header'
import SignInScreen from './components/SignInScreen'
import LibraryView from './components/LibraryView'
import PlayerBar from './components/PlayerBar'
import RenameModal from './components/RenameModal'
import TagEditModal from './components/TagEditModal'
import ConfirmDeleteModal from './components/ConfirmDeleteModal'
import Spinner from './components/Spinner'
import { useGoogleAuth } from './lib/useGoogleAuth'
import { useAudioPlayer } from './lib/useAudioPlayer'
import { useLibrary } from './lib/useLibrary'
import { listAudioFiles, renameFile, trashFile } from './lib/drive'
import { withPreservedExtension } from './lib/filename'

function App() {
  const auth = useGoogleAuth()
  const player = useAudioPlayer(auth.token)

  const [tracks, setTracks] = useState([])
  const library = useLibrary(tracks, auth.token)
  const [isLoadingTracks, setIsLoadingTracks] = useState(false)
  const [loadError, setLoadError] = useState(null)

  const [renamingTrack, setRenamingTrack] = useState(null)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameError, setRenameError] = useState(null)

  const [deletingTrack, setDeletingTrack] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const [editingTagsTrack, setEditingTagsTrack] = useState(null)
  const [isSavingTags, setIsSavingTags] = useState(false)
  const [tagsError, setTagsError] = useState(null)

  const loadTracks = useCallback(async () => {
    if (!auth.token) return
    setIsLoadingTracks(true)
    setLoadError(null)
    try {
      const files = await listAudioFiles(auth.token)
      setTracks(files)
    } catch (err) {
      console.error('Failed to load Drive files:', err)
      setLoadError(
        `Could not load your Drive files. ${err?.message || ''} Try refreshing.`.trim(),
      )
    } finally {
      setIsLoadingTracks(false)
    }
  }, [auth.token])

  useEffect(() => {
    if (auth.isSignedIn) loadTracks()
    else setTracks([])
  }, [auth.isSignedIn, loadTracks])

  const handleRename = async (track, newName) => {
    const finalName = withPreservedExtension(track.name, newName)
    setIsRenaming(true)
    setRenameError(null)
    try {
      await renameFile(auth.token, track.id, finalName)
      setTracks((prev) => prev.map((t) => (t.id === track.id ? { ...t, name: finalName } : t)))
      setRenamingTrack(null)
    } catch {
      setRenameError('Rename failed. Please try again.')
    } finally {
      setIsRenaming(false)
    }
  }

  const handleSaveTags = async (track, patch) => {
    setIsSavingTags(true)
    setTagsError(null)
    try {
      await library.setTrackOverride(track.id, patch)
      setEditingTagsTrack(null)
    } catch {
      setTagsError('Could not save. Please try again.')
    } finally {
      setIsSavingTags(false)
    }
  }

  const handleDelete = async (track) => {
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await trashFile(auth.token, track.id)
      player.stopIfActive(track.id)
      setTracks((prev) => prev.filter((t) => t.id !== track.id))
      setDeletingTrack(null)
    } catch {
      setDeleteError('Delete failed. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!auth.isReady && !auth.error) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-neutral-950">
        <Spinner className="h-6 w-6 text-neutral-500" />
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
    <div className="flex min-h-svh flex-col bg-neutral-950">
      <Header onSignOut={auth.signOut} onRefresh={loadTracks} isRefreshing={isLoadingTracks} />

      <LibraryView
        tracks={library.tracks}
        albums={library.albums}
        artists={library.artists}
        isLoading={isLoadingTracks}
        error={loadError}
        currentTrack={player.currentTrack}
        isPlaying={player.isPlaying}
        loadingTrackId={player.isLoading ? player.currentTrack?.id : null}
        onPlay={player.playTrack}
        onRename={(track) => {
          setRenameError(null)
          setRenamingTrack(track)
        }}
        onEditTags={(track) => {
          setTagsError(null)
          setEditingTagsTrack(track)
        }}
        onDelete={(track) => {
          setDeleteError(null)
          setDeletingTrack(track)
        }}
      />

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
        onToggle={() => player.playTrack(player.currentTrack)}
      />

      {renamingTrack && (
        <RenameModal
          track={renamingTrack}
          isSaving={isRenaming}
          error={renameError}
          onCancel={() => setRenamingTrack(null)}
          onConfirm={handleRename}
        />
      )}

      {editingTagsTrack && (
        <TagEditModal
          track={editingTagsTrack}
          isSaving={isSavingTags}
          error={tagsError}
          onCancel={() => setEditingTagsTrack(null)}
          onConfirm={handleSaveTags}
        />
      )}

      {deletingTrack && (
        <ConfirmDeleteModal
          track={deletingTrack}
          isDeleting={isDeleting}
          error={deleteError}
          onCancel={() => setDeletingTrack(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}

export default App
