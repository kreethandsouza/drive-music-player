import { createMetadataFile, fetchFileText, findMetadataFile } from './drive'

export const EMPTY_METADATA = { version: 1, overrides: {}, playlists: [] }

function normalize(data) {
  return {
    version: 1,
    overrides: data && typeof data.overrides === 'object' ? data.overrides : {},
    playlists: Array.isArray(data?.playlists) ? data.playlists : [],
  }
}

/**
 * Find this app's metadata file in the user's Drive (playlists + manual
 * artist/album overrides), or create an empty one if this is the first
 * time signing in. This is what makes playlists/tags follow the Google
 * account across devices instead of living only in this browser.
 */
export async function loadOrCreateMetadata(token) {
  const existing = await findMetadataFile(token)
  if (existing) {
    try {
      const text = await fetchFileText(token, existing.id)
      return { fileId: existing.id, data: normalize(JSON.parse(text)) }
    } catch {
      // Corrupt/empty file — keep the file id but start fresh rather than crash.
      return { fileId: existing.id, data: { ...EMPTY_METADATA } }
    }
  }

  const created = await createMetadataFile(token, EMPTY_METADATA)
  return { fileId: created.id, data: { ...EMPTY_METADATA } }
}
