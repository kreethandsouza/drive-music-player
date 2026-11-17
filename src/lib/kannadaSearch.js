// Loose Kannada→Latin transliteration for search purposes only. Song
// titles in this app's catalog are written in Kannada script, but people
// search by typing a rough English spelling (e.g. "anthrali" for
// ಅಂತ್ರಾಳಿಂ). This is NOT a linguistically accurate transliteration — it
// deliberately throws away vowel length, aspiration, and retroflex/dental
// distinctions (which most people don't type consistently anyway) so a
// loose English guess still matches.

const INDEPENDENT_VOWELS = {
  'ಅ': 'a', 'ಆ': 'a', 'ಇ': 'i', 'ಈ': 'i', 'ಉ': 'u', 'ಊ': 'u',
  'ಋ': 'ru', 'ೠ': 'ru', 'ಌ': 'lu', 'ೡ': 'lu',
  'ಎ': 'e', 'ಏ': 'e', 'ಐ': 'ai', 'ಒ': 'o', 'ಓ': 'o', 'ಔ': 'au',
}

// These are combining marks (not valid bare object-key identifiers), so
// every key here is quoted.
const VOWEL_SIGNS = {
  'ಾ': 'a', 'ಿ': 'i', 'ೀ': 'i', 'ು': 'u', 'ೂ': 'u', 'ೃ': 'ru',
  'ೆ': 'e', 'ೇ': 'e', 'ೈ': 'ai', 'ೊ': 'o', 'ೋ': 'o', 'ೌ': 'au',
}

// Aspiration, retroflex/dental, and sibilant distinctions are collapsed to
// a single romanization each, since those are the distinctions people are
// least likely to type consistently.
const CONSONANTS = {
  'ಕ': 'k', 'ಖ': 'k', 'ಗ': 'g', 'ಘ': 'g', 'ಙ': 'n',
  'ಚ': 'ch', 'ಛ': 'ch', 'ಜ': 'j', 'ಝ': 'j', 'ಞ': 'n',
  'ಟ': 't', 'ಠ': 't', 'ಡ': 'd', 'ಢ': 'd', 'ಣ': 'n',
  'ತ': 't', 'ಥ': 't', 'ದ': 'd', 'ಧ': 'd', 'ನ': 'n',
  'ಪ': 'p', 'ಫ': 'p', 'ಬ': 'b', 'ಭ': 'b', 'ಮ': 'm',
  'ಯ': 'y', 'ರ': 'r', 'ಱ': 'r', 'ಲ': 'l', 'ಳ': 'l', 'ೞ': 'l',
  'ವ': 'v', 'ಶ': 's', 'ಷ': 's', 'ಸ': 's', 'ಹ': 'h',
}

const VIRAMA = '್'
const ANUSVARA = 'ಂ'
const VISARGA = 'ಃ'
const NUKTA = '಼'

/**
 * Walks Kannada-script text and emits a loose Latin spelling. Characters
 * this map doesn't know about (Latin letters, digits, spaces, punctuation)
 * pass through unchanged — which also means this function is safe to call
 * on plain English search queries; it's a no-op for them.
 */
function transliterate(text) {
  let out = ''
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]

    if (CONSONANTS[ch]) {
      const next = text[i + 1]
      if (next === VIRAMA) {
        out += CONSONANTS[ch] // no vowel sound
        i++
      } else if (next === NUKTA) {
        out += CONSONANTS[ch] + 'a'
        i++
      } else if (VOWEL_SIGNS[next]) {
        out += CONSONANTS[ch] + VOWEL_SIGNS[next]
        i++
      } else {
        out += CONSONANTS[ch] + 'a' // inherent vowel
      }
      continue
    }

    if (INDEPENDENT_VOWELS[ch]) {
      out += INDEPENDENT_VOWELS[ch]
      continue
    }

    if (ch === ANUSVARA) {
      out += 'n'
      continue
    }
    if (ch === VISARGA) {
      out += 'h'
      continue
    }
    if (ch === NUKTA || ch === VIRAMA) continue // stray combining marks

    out += ch
  }
  return out
}

/**
 * Normalizes a (possibly transliterated) string into a loose phonetic key
 * for fuzzy search: collapses long/short vowel spelling, aspirated
 * consonants, sibilant variants, and repeated letters, so e.g. "anthrali"
 * and the title's own transliteration both normalize to something that
 * lines up even though neither is a precise transliteration.
 */
export function normalizeForSearch(text) {
  let s = transliterate(text || '').toLowerCase()
  s = s.replace(/[^a-z0-9]/g, '')
  s = s.replace(/a{2,}/g, 'a').replace(/i{2,}/g, 'i').replace(/u{2,}/g, 'u').replace(/e{2,}/g, 'e').replace(/o{2,}/g, 'o')
  s = s.replace(/chh/g, 'ch')
  s = s.replace(/([kgtdpb])h/g, '$1')
  s = s.replace(/sh/g, 's')
  s = s.replace(/w/g, 'v')
  s = s.replace(/([a-z])\1+/g, '$1')
  return s
}
