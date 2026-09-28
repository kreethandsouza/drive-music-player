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

/** List non-trashed audio files in the user's Drive. */
export async function listAudioFiles(token) {
  const params = new URLSearchParams({
    q: "mimeType contains 'audio/' and trashed = false",
    fields: 'files(id,name,mimeType,modifiedTime)',
    pageSize: '1000',
    spaces: 'drive',
  })

  const res = await driveFetch(`${DRIVE_FILES_URL}?${params}`, token)
  const data = await res.json()
  return data.files || []
}

/** Rename a file, preserving nothing but what the caller passes in `name`. */
export async function renameFile(token, fileId, newName) {
  const res = await driveFetch(`${DRIVE_FILES_URL}/${fileId}`, token, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: newName }),
  })
  return res.json()
}

/** Move a file to Drive Trash. */
export async function trashFile(token, fileId) {
  const res = await driveFetch(`${DRIVE_FILES_URL}/${fileId}`, token, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trashed: true }),
  })
  return res.json()
}

/** Download the raw audio bytes for a file and return an object URL. */
export async function fetchAudioBlobUrl(token, fileId) {
  const res = await driveFetch(`${DRIVE_FILES_URL}/${fileId}?alt=media`, token)
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

/**
 * Download just the first `byteLength` bytes of a file. Audio tag metadata
 * (ID3v2, Vorbis comments, etc.) lives near the start of well-formed files,
 * so this avoids pulling the whole track just to read its tags.
 */
export async function fetchAudioHeadBytes(token, fileId, byteLength) {
  const res = await driveFetch(`${DRIVE_FILES_URL}/${fileId}?alt=media`, token, {
    headers: { Range: `bytes=0-${byteLength - 1}` },
  })
  return new Uint8Array(await res.arrayBuffer())
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

export { DriveApiError }
