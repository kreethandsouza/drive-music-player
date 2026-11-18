// Loads the song library ("Song Library 2.0") from a Google Sheet
// maintained by the Drive account that owns the actual audio files. Unlike
// the original catalog sheet, this one is shared with specific Google
// accounts only (not "anyone with the link"), so it's read with the
// signed-in user's own access via the Sheets API rather than as a public,
// unauthenticated CSV export. Playback still streams the underlying file
// straight from Drive by id (see drive.js#fetchAudioBlobUrl), which only
// works once the signed-in account also has read access to that file.

import { fetchSheetValues } from './drive'
import { normalizeForSearch } from './kannadaSearch'

const SHEET_ID = '1Yj01pv5baKcHwX7hLkc2E4mn7IHJtpov197R0cKccJ4'
const SHEET_TAB = 'Mangalorean Songs'

export const UNKNOWN_ARTIST = 'Unknown Composer'

const DRIVE_LINK_RE = /\/file\/d\/([a-zA-Z0-9_-]+)/

function extractFileId(link) {
  const match = DRIVE_LINK_RE.exec(link || '')
  return match ? match[1] : null
}

// Columns: Song Code, SONG (rough English title), Title (native-script
// title — treated as authoritative), LYRICIST, COMPOSER, ALBUM, OWNERSHIP,
// BOOK, SONG LINK, LYRICS LINK, GENRE, SCALE. A row with no extractable
// Drive file id (blank, or a placeholder like "Voice"/"-" for a song not
// recorded yet) or no title at all is skipped rather than shown unplayable.
function rowToTrack(row) {
  const [songNo, englishTitle, title, , composer, , , , link] = row
  const id = extractFileId(link)
  const displayTitle = (title || englishTitle || '').trim()
  if (!id || !displayTitle) return null

  const trimmedSongNo = (songNo || '').trim()
  const trimmedArtist = composer?.trim() || UNKNOWN_ARTIST

  return {
    id,
    songNo: trimmedSongNo,
    displayTitle,
    artist: trimmedArtist,
    // Precomputed once here (rather than per keystroke) so typing an
    // English guess at the Kannada title's pronunciation, e.g. "anthrali"
    // for ಅಂತ್ರಾಳಿಂ, still finds it — see kannadaSearch.js.
    titleSearchKey: normalizeForSearch(displayTitle),
    artistSearchKey: normalizeForSearch(trimmedArtist),
    songNoSearchKey: normalizeForSearch(trimmedSongNo),
  }
}

/** Fetch the song library, deduped by Drive file id (a song can end up with
 * more than one row pointing at the same file — e.g. an accidental
 * duplicate row — and only the first is kept). */
export async function fetchSongLibrary(token) {
  const rows = await fetchSheetValues(token, SHEET_ID, SHEET_TAB)
  const dataRows = rows.slice(1) // row 0 is the header

  const byId = new Map()
  for (const row of dataRows) {
    const track = rowToTrack(row)
    if (track && !byId.has(track.id)) byId.set(track.id, track)
  }

  return Array.from(byId.values()).sort((a, b) => a.displayTitle.localeCompare(b.displayTitle))
}
