// ─────────────────────────────────────────────
// Shared Utility Functions
// ─────────────────────────────────────────────

/**
 * Escapes single-quote characters for safe SQL string embedding.
 * NOTE: All user input must pass through this before being placed
 * inside a SQL string literal.
 */
export function escapeSql(str) {
  if (!str) return ''
  return str.replace(/'/g, "''")
}

/**
 * Converts Arabic-Indic (٠١٢…) and Persian-Indic (۰۱۲…) digits
 * to standard Latin digits so barcode/price fields parse correctly.
 */
export function normalizeDigits(str) {
  if (!str) return ''
  const arabicDigits  = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  let res = str.toString()
  for (let i = 0; i < 10; i++) {
    res = res
      .replace(new RegExp(arabicDigits[i],  'g'), i)
      .replace(new RegExp(persianDigits[i], 'g'), i)
  }
  return res
}

/**
 * Plays an audio feedback tone using the Web Audio API.
 * 100% offline — no external sound files required.
 * @param {'success'|'chime'|'error'} type
 */
export function playSound(type) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()

    if (type === 'success') {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      gain.gain.setValueAtTime(0.05, ctx.currentTime)
      osc.start()
      osc.stop(ctx.currentTime + 0.08)

    } else if (type === 'chime') {
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()
      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)
      osc1.frequency.setValueAtTime(1200, ctx.currentTime)
      osc2.frequency.setValueAtTime(1500, ctx.currentTime)
      gain.gain.setValueAtTime(0.06, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      osc1.start()
      osc2.start()
      osc1.stop(ctx.currentTime + 0.35)
      osc2.stop(ctx.currentTime + 0.35)

    } else if (type === 'error') {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(150, ctx.currentTime)
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
      osc.start()
      osc.stop(ctx.currentTime + 0.3)
    }
  } catch (e) {
    // Silently ignore — browser autoplay policy may block this
  }
}

/**
 * Parses a localized locale date string (containing Arabic-indic digits or
 * standard English digits) or ISO timestamp into a standard JS Date object.
 * Supporting formats like "19/7/2026 12:01:59 PM", "١٩‏/٧‏/٢٠٢٦ ١٢:٠١:٥٩ ص", "2026-07-19 12:01:59".
 */
export function parseLocaleDateString(str) {
  if (!str) return new Date(0)
  let clean = normalizeDigits(str.toString())
  clean = clean.replace(/[\u200e\u200f]/g, '') // Remove RTL/LTR marks
  
  const dateMatch = clean.match(/(\d+)[\/\-](\d+)[\/\-](\d+)/)
  if (!dateMatch) return new Date(0)

  let day, month, year
  if (dateMatch[1].length === 4) {
    year = parseInt(dateMatch[1], 10)
    month = parseInt(dateMatch[2], 10) - 1
    day = parseInt(dateMatch[3], 10)
  } else {
    day = parseInt(dateMatch[1], 10)
    month = parseInt(dateMatch[2], 10) - 1
    year = parseInt(dateMatch[3], 10)
  }

  let hours = 0, minutes = 0, seconds = 0
  const timeMatch = clean.match(/(\d+):(\d+):?(\d+)?/)
  if (timeMatch) {
    hours = parseInt(timeMatch[1], 10)
    minutes = parseInt(timeMatch[2], 10)
    if (timeMatch[3]) seconds = parseInt(timeMatch[3], 10)
  }

  const isPM = clean.includes('م') || clean.toLowerCase().includes('pm')
  const isAM = clean.includes('ص') || clean.toLowerCase().includes('am')
  if (isPM && hours < 12) hours += 12
  if (isAM && hours === 12) hours = 0

  return new Date(year, month, day, hours, minutes, seconds)
}
