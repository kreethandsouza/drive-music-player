// A deterministic "cover" color per track id, so the same song always
// gets the same colored tile across the mini player, the Now Playing
// sheet, and the Home tab — there's no real album art to show instead.
export function colorForId(id) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return `hsl(${hash % 360} 45% 22%)`
}
