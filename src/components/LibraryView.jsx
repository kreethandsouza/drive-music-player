import { useMemo, useState } from 'react'
import Tabs from './Tabs'
import SearchBar from './SearchBar'
import TrackList from './TrackList'
import AlbumGrid from './AlbumGrid'
import ArtistList from './ArtistList'
import PlaylistList from './PlaylistList'
import DetailHeader from './DetailHeader'
import ActionSheet from './ActionSheet'
import AddToPlaylistModal from './AddToPlaylistModal'
import PromptModal from './PromptModal'
import { UNKNOWN_ARTIST } from '../lib/metadata'

const TABS = [
  { id: 'songs', label: 'Songs' },
  { id: 'albums', label: 'Albums' },
  { id: 'artists', label: 'Artists' },
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
const TagIcon = (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path
      d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3.24L4 3a1 1 0 0 0-1 1l.24 5.59a2 2 0 0 0 .59 1.41l9.58 9.58a2 2 0 0 0 2.83 0l4.35-4.35a2 2 0 0 0 0-2.82Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="7.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
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

function matchesQuery(track, query) {
  if (!query) return true
  return [track.displayTitle, track.artist, track.album, track.name].some((value) =>
    value?.toLowerCase().includes(query),
  )
}

function countLabelOf(count, noun = 'song') {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

export default function LibraryView({
  tracks,
  albums,
  artists,
  playlists,
  isLoading,
  error,
  currentTrack,
  isPlaying,
  loadingTrackId,
  onPlay,
  onRenameFile,
  onEditTags,
  onDeleteFile,
  onCreatePlaylist,
  onRenamePlaylist,
  onDeletePlaylist,
  onAddTrackToPlaylist,
  onRemoveTrackFromPlaylist,
}) {
  const [activeTab, setActiveTab] = useState('songs')
  const [query, setQuery] = useState('')
  const [selectedAlbumName, setSelectedAlbumName] = useState(null)
  const [selectedArtistName, setSelectedArtistName] = useState(null)
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null)

  const [actionsTrack, setActionsTrack] = useState(null)
  const [addToPlaylistTrack, setAddToPlaylistTrack] = useState(null)
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false)
  const [renamingPlaylist, setRenamingPlaylist] = useState(null)
  const [playlistMenuOpen, setPlaylistMenuOpen] = useState(false)

  const q = query.trim().toLowerCase()

  const filteredSongs = useMemo(() => tracks.filter((t) => matchesQuery(t, q)), [tracks, q])

  const filteredAlbums = useMemo(
    () => albums.filter((a) => !q || a.name.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q)),
    [albums, q],
  )

  const filteredArtists = useMemo(
    () => artists.filter((a) => !q || a.name.toLowerCase().includes(q)),
    [artists, q],
  )

  const filteredPlaylists = useMemo(
    () => playlists.filter((p) => !q || p.name.toLowerCase().includes(q)),
    [playlists, q],
  )

  // Look albums/artists/playlists up live (rather than holding a stale
  // snapshot) so editing tags or playlist membership updates any open
  // detail view immediately.
  const selectedAlbum = selectedAlbumName ? albums.find((a) => a.name === selectedAlbumName) : null
  const selectedArtist = selectedArtistName ? artists.find((a) => a.name === selectedArtistName) : null
  const selectedPlaylist = selectedPlaylistId ? playlists.find((p) => p.id === selectedPlaylistId) : null

  const trackListProps = {
    currentTrack,
    isPlaying,
    loadingTrackId,
    onPlay,
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
        { label: 'Rename file', icon: PencilIcon, onClick: () => onRenameFile(actionsTrack.track) },
        { label: 'Edit artist/album', icon: TagIcon, onClick: () => onEditTags(actionsTrack.track) },
        { label: 'Delete', icon: TrashIcon, danger: true, onClick: () => onDeleteFile(actionsTrack.track) },
      ]
    : []

  let content
  if (selectedAlbumName) {
    // Drill-down: viewing all songs within one album.
    const albumTracks = (selectedAlbum?.tracks || []).filter((t) => matchesQuery(t, q))
    content = (
      <>
        <DetailHeader
          title={selectedAlbumName}
          subtitle={selectedAlbum && selectedAlbum.artist !== UNKNOWN_ARTIST ? selectedAlbum.artist : undefined}
          artUrl={selectedAlbum?.artUrl}
          onBack={() => setSelectedAlbumName(null)}
        />
        <TrackList
          tracks={albumTracks}
          isLoading={false}
          error={null}
          emptyMessage="No songs in this album."
          countLabel={countLabelOf(albumTracks.length)}
          {...trackListProps}
        />
      </>
    )
  } else if (selectedArtistName) {
    // Drill-down: viewing all songs by one artist.
    const artistTracks = (selectedArtist?.tracks || []).filter((t) => matchesQuery(t, q))
    content = (
      <>
        <DetailHeader title={selectedArtistName} onBack={() => setSelectedArtistName(null)} />
        <TrackList
          tracks={artistTracks}
          isLoading={false}
          error={null}
          emptyMessage="No songs by this artist."
          countLabel={countLabelOf(artistTracks.length)}
          {...trackListProps}
        />
      </>
    )
  } else if (selectedPlaylistId) {
    // Drill-down: viewing one playlist's songs.
    const playlistTracks = (selectedPlaylist?.tracks || []).filter((t) => matchesQuery(t, q))
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
        <SearchBar value={query} onChange={setQuery} placeholder={`Search ${activeTab}`} />

        {activeTab === 'songs' && (
          <TrackList
            tracks={filteredSongs}
            isLoading={isLoading}
            error={error}
            emptyMessage={q ? 'No matching songs.' : 'No audio files found in your Drive.'}
            countLabel={!isLoading && !error ? countLabelOf(filteredSongs.length) : null}
            {...trackListProps}
          />
        )}

        {activeTab === 'albums' && (
          <AlbumGrid
            albums={filteredAlbums}
            onOpen={(album) => setSelectedAlbumName(album.name)}
            emptyMessage={q ? 'No matching albums.' : 'No albums found yet.'}
          />
        )}

        {activeTab === 'artists' && (
          <ArtistList
            artists={filteredArtists}
            onOpen={(artist) => setSelectedArtistName(artist.name)}
            emptyMessage={q ? 'No matching artists.' : 'No artists found yet.'}
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
