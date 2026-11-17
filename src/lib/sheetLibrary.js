// Loads the song library from a Google Sheet maintained by the Drive
// account that owns the actual audio files. The sheet (shared "Anyone with
// the link can view") is this app's single source of truth for which
// songs exist and their Title/Composer — it's fetched as plain CSV with no
// Google sign-in required. Playback still streams the underlying file
// straight from Drive by id (see drive.js#fetchAudioBlobUrl), which only
// works once the signed-in account has read access to it.

import { normalizeForSearch } from './kannadaSearch'

const SHEET_ID = '1IKpxM3A1QRFT03218aUMsGqHqakThf2aK1FNNSV-FKk'

// Both tabs share the same columns (Song No, SONG, Title, COMPOSER, SONG
// LINK, ...) and are merged into one flat list — this app makes no
// distinction between "allotted" and "un-allotted" songs.
const SHEET_TABS = ['Allotted Songs', 'Un-Allotted Songs']

export const UNKNOWN_ARTIST = 'Unknown Composer'

function csvUrl(sheetName) {
  const params = new URLSearchParams({ tqx: 'out:csv', sheet: sheetName })
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?${params}`
}

/**
 * Minimal RFC4180 CSV parser (handles quoted fields, including embedded
 * commas, quotes, and newlines) — this sheet's export isn't available as
 * JSON without an API key, so we parse the public CSV export ourselves
 * rather than pull in a dependency for it.
 */
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

const DRIVE_LINK_RE = /\/file\/d\/([a-zA-Z0-9_-]+)/

function extractFileId(link) {
  const match = DRIVE_LINK_RE.exec(link || '')
  return match ? match[1] : null
}

// Columns are: Song No, SONG (rough English title), Title (native-script
// title — treated as authoritative), COMPOSER, SONG LINK, ...
function rowToTrack(row) {
  const [songNo, englishTitle, title, composer, link] = row
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

async function fetchSheetTab(sheetName) {
  const res = await fetch(csvUrl(sheetName))
  if (!res.ok) throw new Error(`Could not load the "${sheetName}" sheet (${res.status}).`)
  const rows = parseCsv(await res.text())
  // Row 0 is always skipped: it's a normal header on "Un-Allotted Songs",
  // but on "Allotted Songs" a chunk of early rows ended up pasted into one
  // giant row instead of one row per song — skip that too for now rather
  // than lose the rest of the (correctly structured) sheet.
  return rows.slice(1)
}

/** Fetch and merge the song library from every tab, deduped by Drive file id. */
export async function fetchSongLibrary() {
  const tabRows = await Promise.all(SHEET_TABS.map(fetchSheetTab))

  const byId = new Map()
  for (const rows of tabRows) {
    for (const row of rows) {
      const track = rowToTrack(row)
      if (track && !byId.has(track.id)) byId.set(track.id, track)
    }
  }

  return Array.from(byId.values()).sort((a, b) => a.displayTitle.localeCompare(b.displayTitle))
}
