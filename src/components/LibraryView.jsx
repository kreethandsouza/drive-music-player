import { useMemo, useState } from 'react'
import { normalizeForSearch } from '../lib/kannadaSearch'
import Tabs from './Tabs'
import SearchBar from './SearchBar'
import HomeView from './HomeView'
import TrackList from './TrackList'
import ArtistList from './ArtistList'
import PlaylistList from './PlaylistList'
import DetailHeader from './DetailHeader'
import ActionSheet from './ActionSheet'
import AddToPlaylistModal from './AddToPlaylistModal'
import PromptModal from './PromptModal'

const TABS = [
  { id: 'home', label: 'Home' },
  { id: 'songs', label: 'Songs' },
  { id: 'composers', label: 'Composers' },
  { id: 'playlists', label: 'Playlists' },
]

const PlusIcon = (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
  </svg>
)
const MinusIcon = (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14" strokeLinecap="round" />
  </svg>
)
const PencilIcon = (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const TrashIcon = (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path
      d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0-1 14a1 1 0 01-1 1H7a1 1 0 01-1-1L5 6h14z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

function matchesQuery(track, query, normalizedQuery) {
  if (!query) return true
  if ([track.displayTitle, track.artist, track.songNo].some((value) => value?.toLowerCase().includes(query))) {
    return true
  }
  // Fall back to a loose phonetic match, so typing an English guess at the
  // Kannada title's pronunciation (e.g. "anthrali" for ಅಂತ್ರಾಳಿಂ) still
  // finds it — see kannadaSearch.js.
  if (!normalizedQuery) return false
  return [track.titleSearchKey, track.artistSearchKey, track.songNoSearchKey].some((key) =>
    key?.includes(normalizedQuery),
  )
}

function countLabelOf(count, noun = 'song') {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

export default function LibraryView({
  tracks,
  composers,
  playlists,
  isLoading,
  error,
  currentTrack,
  isPlaying,
  loadingTrackId,
  onPlay,
  likedTrackIds,
  onToggleLike,
  onCreatePlaylist,
  onRenamePlaylist,
  onDeletePlaylist,
  onAddTrackToPlaylist,
  onRemoveTrackFromPlaylist,
  profile,
  pasandPlaylist,
  recentlyPlayed,
  mostPlayed,
  topComposer,
  totalPlays,
}) {
  const [activeTab, setActiveTab] = useState('home')
  const [query, setQuery] = useState('')
  const [selectedComposerName, setSelectedComposerName] = useState(null)
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null)

  const [actionsTrack, setActionsTrack] = useState(null)
  const [addToPlaylistTrack, setAddToPlaylistTrack] = useState(null)
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false)
  const [renamingPlaylist, setRenamingPlaylist] = useState(null)
  const [playlistMenuOpen, setPlaylistMenuOpen] = useState(false)

  const q = query.trim().toLowerCase()
  const nq = useMemo(() => normalizeForSearch(query), [query])

  const filteredSongs = useMemo(() => tracks.filter((t) => matchesQuery(t, q, nq)), [tracks, q, nq])

  const filteredComposers = useMemo(
    () => composers.filter((a) => !q || a.name.toLowerCase().includes(q)),
    [composers, q],
  )

  const filteredPlaylists = useMemo(
    () => playlists.filter((p) => !q || p.name.toLowerCase().includes(q)),
    [playlists, q],
  )

  // Look composers/playlists up live (rather than holding a stale
  // snapshot) so playlist membership changes update any open detail view
  // immediately.
  const selectedComposer = selectedComposerName ? composers.find((a) => a.name === selectedComposerName) : null
  const selectedPlaylist = selectedPlaylistId ? playlists.find((p) => p.id === selectedPlaylistId) : null

  const trackListProps = {
    currentTrack,
    isPlaying,
    loadingTrackId,
    onPlay,
    likedTrackIds,
    onToggleLike,
    onOpenActions: (track) => setActionsTrack({ track, playlistId: selectedPlaylist?.id ?? null }),
  }

  const actionsList = actionsTrack
    ? [
        ...(actionsTrack.playlistId
          ? [
              {
                label: 'Remove from this playlist',
                icon: MinusIcon,
                onClick: () => onRemoveTrackFromPlaylist(actionsTrack.playlistId, actionsTrack.track.id),
              },
            ]
          : []),
        { label: 'Add to playlist', icon: PlusIcon, onClick: () => setAddToPlaylistTrack(actionsTrack.track) },
      ]
    : []

  let content
  if (selectedComposerName) {
    // Drill-down: viewing all songs by one composer.
    const composerTracks = (selectedComposer?.tracks || []).filter((t) => matchesQuery(t, q, nq))
    content = (
      <>
        <DetailHeader title={selectedComposerName} onBack={() => setSelectedComposerName(null)} />
        <TrackList
          tracks={composerTracks}
          isLoading={false}
          error={null}
          emptyMessage="No songs by this composer."
          countLabel={countLabelOf(composerTracks.length)}
          {...trackListProps}
        />
      </>
    )
  } else if (selectedPlaylistId) {
    // Drill-down: viewing one playlist's songs.
    const playlistTracks = (selectedPlaylist?.tracks || []).filter((t) => matchesQuery(t, q, nq))
    content = (
      <>
        <DetailHeader
          title={selectedPlaylist?.name || 'Playlist'}
          onBack={() => setSelectedPlaylistId(null)}
          onMenu={() => setPlaylistMenuOpen(true)}
        />
        <TrackList
          tracks={playlistTracks}
          isLoading={false}
          error={null}
          emptyMessage="No songs in this playlist yet. Add some from the Songs tab."
          countLabel={countLabelOf(playlistTracks.length)}
          {...trackListProps}
        />
        {playlistMenuOpen && selectedPlaylist && (
          <ActionSheet
            title={selectedPlaylist.name}
            actions={[
              { label: 'Rename playlist', icon: PencilIcon, onClick: () => setRenamingPlaylist(selectedPlaylist) },
              {
                label: 'Delete playlist',
                icon: TrashIcon,
                danger: true,
                onClick: () => {
                  if (window.confirm(`Delete playlist "${selectedPlaylist.name}"? This won't delete the songs.`)) {
                    onDeletePlaylist(selectedPlaylist.id)
                    setSelectedPlaylistId(null)
                  }
                },
              },
            ]}
            onClose={() => setPlaylistMenuOpen(false)}
          />
        )}
        {renamingPlaylist && (
          <PromptModal
            title="Rename playlist"
            initialValue={renamingPlaylist.name}
            confirmLabel="Save"
            onCancel={() => setRenamingPlaylist(null)}
            onConfirm={(name) => {
              onRenamePlaylist(renamingPlaylist.id, name)
              setRenamingPlaylist(null)
            }}
          />
        )}
      </>
    )
  } else {
    content = (
      <>
        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
        {activeTab !== 'home' && <SearchBar value={query} onChange={setQuery} placeholder={`Search ${activeTab}`} />}

        {activeTab === 'home' && (
          <HomeView
            profile={profile}
            pasandPlaylist={pasandPlaylist}
            recentlyPlayed={recentlyPlayed}
            mostPlayed={mostPlayed}
            topComposer={topComposer}
            totalPlays={totalPlays}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            loadingTrackId={loadingTrackId}
            onPlay={onPlay}
            likedTrackIds={likedTrackIds}
            onToggleLike={onToggleLike}
            onOpenPasand={() => pasandPlaylist && setSelectedPlaylistId(pasandPlaylist.id)}
            onOpenActions={(track) => setActionsTrack({ track, playlistId: null })}
          />
        )}

        {activeTab === 'songs' && (
          <TrackList
            tracks={filteredSongs}
            isLoading={isLoading}
            error={error}
            emptyMessage={q ? 'No matching songs.' : 'No songs found.'}
            countLabel={!isLoading && !error ? countLabelOf(filteredSongs.length) : null}
            {...trackListProps}
          />
        )}

        {activeTab === 'composers' && (
          <ArtistList
            artists={filteredComposers}
            onOpen={(composer) => setSelectedComposerName(composer.name)}
            emptyMessage={q ? 'No matching composers.' : 'No composers found yet.'}
          />
        )}

        {activeTab === 'playlists' && (
          <PlaylistList
            playlists={filteredPlaylists}
            onOpen={(playlist) => setSelectedPlaylistId(playlist.id)}
            onCreate={() => setIsCreatingPlaylist(true)}
            emptyMessage={q ? 'No matching playlists.' : 'No playlists yet. Create one to get started.'}
          />
        )}
      </>
    )
  }

  return (
    <>
      {content}

      {actionsTrack && (
        <ActionSheet title={actionsTrack.track.displayTitle} actions={actionsList} onClose={() => setActionsTrack(null)} />
      )}

      {addToPlaylistTrack && (
        <AddToPlaylistModal
          track={addToPlaylistTrack}
          playlists={playlists}
          onToggle={(playlistId, isMember) =>
            isMember
              ? onRemoveTrackFromPlaylist(playlistId, addToPlaylistTrack.id)
              : onAddTrackToPlaylist(playlistId, addToPlaylistTrack.id)
          }
          onCreate={(name) => onCreatePlaylist(name, [addToPlaylistTrack.id])}
          onClose={() => setAddToPlaylistTrack(null)}
        />
      )}

      {isCreatingPlaylist && (
        <PromptModal
          title="New playlist"
          placeholder="Playlist name"
          confirmLabel="Create"
          onCancel={() => setIsCreatingPlaylist(false)}
          onConfirm={(name) => {
            const playlist = onCreatePlaylist(name)
            setIsCreatingPlaylist(false)
            if (playlist) setSelectedPlaylistId(playlist.id)
          }}
        />
      )}
    </>
  )
}
