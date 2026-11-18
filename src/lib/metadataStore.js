import { createMetadataFile, fetchFileText, findMetadataFile, writeMetadataFile } from './drive'

// How many distinct recently-played tracks the Home tab's "Recently
// played" row keeps — older ones just fall off the end.
export const RECENTLY_PLAYED_LIMIT = 15

export const EMPTY_METADATA = { version: 1, playlists: [], stats: { plays: {}, recentlyPlayed: [] } }

// Every account gets a "Pasand" ("favorites" in Konkani) playlist for free —
// it's just a regular playlist under the hood, guaranteed to exist as soon
// as this file is loaded or created, so the heart/like button always has
// somewhere to go.
export const PASAND_PLAYLIST_NAME = 'Pasand'

function normalize(data) {
  return {
    version: 1,
    playlists: Array.isArray(data?.playlists) ? data.playlists : [],
    stats: {
      plays: data?.stats?.plays && typeof data.stats.plays === 'object' ? data.stats.plays : {},
      recentlyPlayed: Array.isArray(data?.stats?.recentlyPlayed) ? data.stats.recentlyPlayed : [],
    },
  }
}

function ensurePasandPlaylist(data) {
  const exists = data.playlists.some((p) => p.name.toLowerCase() === PASAND_PLAYLIST_NAME.toLowerCase())
  if (exists) return data
  return {
    ...data,
    playlists: [
      ...data.playlists,
      {
        id: crypto.randomUUID(),
        name: PASAND_PLAYLIST_NAME,
        trackIds: [],
        createdAt: new Date().toISOString(),
      },
    ],
  }
}

/**
 * Find this app's metadata file in the user's Drive (playlists), or create
 * an empty one if this is the first time signing in. This is what makes
 * playlists follow the Google account across devices instead of living
 * only in this browser. Also guarantees the default "Pasand" playlist
 * exists, writing it back to Drive immediately if it was just added.
 */
export async function loadOrCreateMetadata(token) {
  const existing = await findMetadataFile(token)
  if (existing) {
    let data
    try {
      const text = await fetchFileText(token, existing.id)
      data = normalize(JSON.parse(text))
    } catch {
      // Corrupt/empty file — keep the file id but start fresh rather than crash.
      data = { ...EMPTY_METADATA }
    }
    const withPasand = ensurePasandPlaylist(data)
    if (withPasand !== data) await writeMetadataFile(token, existing.id, withPasand)
    return { fileId: existing.id, data: withPasand }
  }

  const initial = ensurePasandPlaylist({ ...EMPTY_METADATA })
  const created = await createMetadataFile(token, initial)
  return { fileId: created.id, data: initial }
}
