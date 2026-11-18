// Thin wrapper around the Google Drive API v3 endpoints this app needs.

const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files'

class DriveApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'DriveApiError'
    this.status = status
  }
}

async function driveFetch(url, token, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (!res.ok) {
    let message = `Drive API request failed (${res.status})`
    try {
      const body = await res.json()
      message = body?.error?.message || message
    } catch {
      // ignore body parse errors
    }
    throw new DriveApiError(message, res.status)
  }

  return res
}

/** Download the raw audio bytes for a file and return an object URL. */
export async function fetchAudioBlobUrl(token, fileId) {
  const res = await driveFetch(`${DRIVE_FILES_URL}/${fileId}?alt=media`, token)
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files'

/**
 * Find this app's metadata JSON file (playlists + manual tag overrides),
 * tagged via a custom Drive file property rather than relying on its name.
 */
export async function findMetadataFile(token) {
  const params = new URLSearchParams({
    q: "properties has { key='dmpFileType' and value='metadata' } and trashed = false",
    fields: 'files(id,name)',
    spaces: 'drive',
  })
  const res = await driveFetch(`${DRIVE_FILES_URL}?${params}`, token)
  const data = await res.json()
  return data.files?.[0] || null
}

/** Read a file's contents as text (used for the small metadata JSON file). */
export async function fetchFileText(token, fileId) {
  const res = await driveFetch(`${DRIVE_FILES_URL}/${fileId}?alt=media`, token)
  return res.text()
}

/** Create the metadata JSON file with initial contents, tagged for lookup. */
export async function createMetadataFile(token, data) {
  const boundary = 'dmp-boundary-' + Math.random().toString(36).slice(2)
  const metadata = {
    name: 'drive-music-player-data.json',
    mimeType: 'application/json',
    properties: { dmpFileType: 'metadata' },
  }
  const body =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    `${JSON.stringify(data)}\r\n` +
    `--${boundary}--`

  const res = await driveFetch(`${DRIVE_UPLOAD_URL}?uploadType=multipart&fields=id,name`, token, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  })
  return res.json()
}

/** Overwrite the metadata file's contents. */
export async function writeMetadataFile(token, fileId, data) {
  await driveFetch(`${DRIVE_UPLOAD_URL}/${fileId}?uploadType=media`, token, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify(data),
  })
}

const SHEETS_VALUES_URL = 'https://sheets.googleapis.com/v4/spreadsheets'

/**
 * Read a tab's cell values as rows of strings, via the Sheets API rather
 * than the public CSV export — needed because the catalog sheet is shared
 * with specific accounts only, not "anyone with the link," so it has to be
 * read with the signed-in user's own access.
 */
export async function fetchSheetValues(token, spreadsheetId, sheetName) {
  const range = encodeURIComponent(sheetName)
  const res = await driveFetch(`${SHEETS_VALUES_URL}/${spreadsheetId}/values/${range}`, token)
  const data = await res.json()
  return data.values || []
}

export { DriveApiError }
