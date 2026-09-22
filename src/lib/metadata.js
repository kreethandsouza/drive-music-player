import { parseBuffer } from 'music-metadata'
import { fetchAudioHeadBytes } from './drive'
import { getCachedTags, setCachedTags } from './metadataCache'

export const UNKNOWN_ARTIST = 'Unknown Artist'
export const UNKNOWN_ALBUM = 'Unknown Album'

// ID3v2/Vorbis/etc. tags (including embedded cover art) live near the start
// of the file for well-formed audio files, so we only need to read a
// leading slice rather than the whole track.
const HEAD_BYTES = 1.5 * 1024 * 1024
const THUMB_SIZE = 200
const THUMB_QUALITY = 0.75

async function makeThumbnail(picture) {
  if (!picture?.data?.length) return null
  try {
    const blob = new Blob([picture.data], { type: picture.format || 'image/jpeg' })
    const bitmap = await createImageBitmap(blob)
    const size = THUMB_SIZE
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size

    // Cover-crop to a square so thumbnails line up neatly in the album grid.
    const scale = Math.max(size / bitmap.width, size / bitmap.height)
    const drawWidth = bitmap.width * scale
    const drawHeight = bitmap.height * scale
    const ctx = canvas.getContext('2d')
    ctx.drawImage(bitmap, (size - drawWidth) / 2, (size - drawHeight) / 2, drawWidth, drawHeight)
    bitmap.close?.()

    return canvas.toDataURL('image/jpeg', THUMB_QUALITY)
  } catch {
    return null
  }
}

/**
 * Extract artist/album/title/cover-art tags for a Drive audio file,
 * using a per-file IndexedDB cache keyed on modifiedTime so repeat visits
 * don't re-download or re-parse anything.
 */
export async function getTrackTags(token, file) {
  const cached = await getCachedTags(file.id, file.modifiedTime)
  if (cached) return cached

  const record = {
    id: file.id,
    modifiedTime: file.modifiedTime,
    title: null,
    artist: null,
    album: null,
    artUrl: null,
  }

  try {
    const bytes = await fetchAudioHeadBytes(token, file.id, HEAD_BYTES)
    const { common } = await parseBuffer(bytes, file.mimeType, { skipCovers: false })
    record.title = common.title || null
    record.artist = common.artist || common.albumartist || null
    record.album = common.album || null
    record.artUrl = await makeThumbnail(common.picture?.[0])
  } catch {
    // Untagged, unsupported, or truncated file — fall back to Unknown buckets.
  }

  await setCachedTags(record)
  return record
}

/** Run `getTrackTags` over a list of files with a small concurrency cap. */
export async function enrichTracksInBackground(token, files, onEach, concurrency = 4) {
  let index = 0
  async function worker() {
    while (index < files.length) {
      const file = files[index++]
      const tags = await getTrackTags(token, file)
      onEach(file.id, tags)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, files.length) }, worker))
}
