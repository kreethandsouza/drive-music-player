// Small IndexedDB-backed cache for parsed track tags (artist/album/title +
// a downscaled cover art thumbnail). Keyed by Drive file id, invalidated
// whenever the file's modifiedTime changes. This is purely a per-device
// performance optimization for re-parsing embedded audio tags — it does
// NOT hold user-authored data. Manual overrides and playlists are stored
// in Drive itself (see metadataStore.js / useDriveMetadata.js) so they
// follow the account across devices.

const DB_NAME = 'dmp-metadata'
const TAGS_STORE = 'tracks'
const DB_VERSION = 2

let dbPromise = null

function openDb() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB unavailable'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(TAGS_STORE)) {
        db.createObjectStore(TAGS_STORE, { keyPath: 'id' })
      }
      // A legacy 'overrides' store may exist from an older version of this
      // app; it's simply left unused now that overrides live in Drive.
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

/** Look up cached tags for a file, only returning them if still fresh. */
export async function getCachedTags(fileId, modifiedTime) {
  try {
    const db = await openDb()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(TAGS_STORE, 'readonly')
      const req = tx.objectStore(TAGS_STORE).get(fileId)
      req.onsuccess = () => {
        const record = req.result
        if (record && record.modifiedTime === modifiedTime) resolve(record)
        else resolve(null)
      }
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null
  }
}

/** Persist parsed tags for a file, replacing any stale entry. */
export async function setCachedTags(record) {
  try {
    const db = await openDb()
    await new Promise((resolve, reject) => {
      const tx = db.transaction(TAGS_STORE, 'readwrite')
      tx.objectStore(TAGS_STORE).put(record)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // Caching is a best-effort optimization; ignore failures (e.g. private browsing).
  }
}
