// Small IndexedDB-backed cache for:
//  - parsed track tags (artist/album/title + a downscaled cover art
//    thumbnail), keyed by Drive file id and invalidated whenever the
//    file's modifiedTime changes.
//  - user overrides (manually assigned artist/album/title), which take
//    priority over parsed tags and persist across sessions until cleared.

const DB_NAME = 'dmp-metadata'
const TAGS_STORE = 'tracks'
const OVERRIDES_STORE = 'overrides'
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
      if (!db.objectStoreNames.contains(OVERRIDES_STORE)) {
        db.createObjectStore(OVERRIDES_STORE, { keyPath: 'id' })
      }
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

/** Load every manual artist/album/title override, keyed by file id. */
export async function getAllOverrides() {
  try {
    const db = await openDb()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(OVERRIDES_STORE, 'readonly')
      const req = tx.objectStore(OVERRIDES_STORE).getAll()
      req.onsuccess = () => {
        const map = {}
        for (const record of req.result) map[record.id] = record
        resolve(map)
      }
      req.onerror = () => reject(req.error)
    })
  } catch {
    return {}
  }
}

/**
 * Merge a manual { artist, album, title } patch into a file's stored
 * override, dropping empty fields. If nothing is left set, the override is
 * deleted entirely (reverting to parsed tags / Unknown buckets).
 * Resolves with the final override record, or null if it was cleared.
 */
export async function saveOverride(fileId, patch) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OVERRIDES_STORE, 'readwrite')
    const store = tx.objectStore(OVERRIDES_STORE)
    let result = null

    const getReq = store.get(fileId)
    getReq.onsuccess = () => {
      const merged = { ...getReq.result, id: fileId, ...patch }
      for (const key of ['artist', 'album', 'title']) {
        if (!merged[key]) delete merged[key]
      }
      if (merged.artist || merged.album || merged.title) {
        store.put(merged)
        result = merged
      } else {
        store.delete(fileId)
      }
    }

    tx.oncomplete = () => resolve(result)
    tx.onerror = () => reject(tx.error)
  })
}
