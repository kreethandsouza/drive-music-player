import { useMemo, useState } from 'react'
import Tabs from './Tabs'
import SearchBar from './SearchBar'
import TrackList from './TrackList'
import AlbumGrid from './AlbumGrid'
import ArtistList from './ArtistList'
import DetailHeader from './DetailHeader'
import { UNKNOWN_ARTIST } from '../lib/metadata'

const TABS = [
  { id: 'songs', label: 'Songs' },
  { id: 'albums', label: 'Albums' },
  { id: 'artists', label: 'Artists' },
]

function matchesQuery(track, query) {
  if (!query) return true
  return [track.displayTitle, track.artist, track.album, track.name].some((value) =>
    value?.toLowerCase().includes(query),
  )
}

function songCountLabel(count) {
  return `${count} song${count === 1 ? '' : 's'}`
}

export default function LibraryView({
  tracks,
  albums,
  artists,
  isLoading,
  error,
  currentTrack,
  isPlaying,
  loadingTrackId,
  onPlay,
  onRename,
  onEditTags,
  onDelete,
}) {
  const [activeTab, setActiveTab] = useState('songs')
  const [query, setQuery] = useState('')
  const [selectedAlbumName, setSelectedAlbumName] = useState(null)
  const [selectedArtistName, setSelectedArtistName] = useState(null)

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

  const trackListProps = { currentTrack, isPlaying, loadingTrackId, onPlay, onRename, onEditTags, onDelete }

  // Look albums/artists up by name (rather than holding a stale snapshot)
  // so editing a track's tags immediately updates any open detail view.
  const selectedAlbum = selectedAlbumName ? albums.find((a) => a.name === selectedAlbumName) : null
  const selectedArtist = selectedArtistName ? artists.find((a) => a.name === selectedArtistName) : null

  // Drill-down: viewing all songs within one album.
  if (selectedAlbumName) {
    const albumTracks = (selectedAlbum?.tracks || []).filter((t) => matchesQuery(t, q))
    return (
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
          countLabel={songCountLabel(albumTracks.length)}
          {...trackListProps}
        />
      </>
    )
  }

  // Drill-down: viewing all songs by one artist.
  if (selectedArtistName) {
    const artistTracks = (selectedArtist?.tracks || []).filter((t) => matchesQuery(t, q))
    return (
      <>
        <DetailHeader title={selectedArtistName} onBack={() => setSelectedArtistName(null)} />
        <TrackList
          tracks={artistTracks}
          isLoading={false}
          error={null}
          emptyMessage="No songs by this artist."
          countLabel={songCountLabel(artistTracks.length)}
          {...trackListProps}
        />
      </>
    )
  }

  return (
    <>
      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
      <SearchBar value={query} onChange={setQuery} placeholder={`Search ${activeTab}`} />

      {activeTab === 'songs' && (
        <TrackList
          tracks={filteredSongs}
          isLoading={isLoading}
          error={error}
          emptyMessage={q ? 'No matching songs.' : 'No audio files found in your Drive.'}
          countLabel={!isLoading && !error ? songCountLabel(filteredSongs.length) : null}
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
    </>
  )
}
