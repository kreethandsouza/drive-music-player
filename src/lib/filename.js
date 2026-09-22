/** Return the extension of a filename including the leading dot, e.g. ".mp3". */
export function getExtension(name) {
  const match = /\.[^.\\/]+$/.exec(name || '')
  return match ? match[0] : ''
}

/** Strip the extension off a filename. */
export function getBaseName(name) {
  const ext = getExtension(name)
  return ext ? name.slice(0, -ext.length) : name
}

/**
 * Given the original filename and a user-entered new name, make sure the
 * original audio extension is preserved even if the user didn't type it.
 */
export function withPreservedExtension(originalName, newName) {
  const trimmed = (newName || '').trim()
  const originalExt = getExtension(originalName)
  if (!originalExt) return trimmed

  const newExt = getExtension(trimmed)
  if (newExt.toLowerCase() === originalExt.toLowerCase()) return trimmed
  return `${trimmed}${originalExt}`
}
