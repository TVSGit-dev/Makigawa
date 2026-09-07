/**
 * Les pics déjà mesurés (E.21).
 *
 * Une courbe cardiaque ne change jamais : la relire à chaque ouverture serait
 * quatorze appels réseau pour un résultat identique. Le pic d'une activité est
 * donc mesuré une fois, puis gardé dans le téléphone sous son identifiant.
 *
 * Comme tout le reste du dossier, rien n'en part vers intervals.icu.
 */

const KEY = 'makigawa.pics'

/** Un mois : au-delà, une activité ne pèse plus sur aucune décision. */
const KEEP = 200

export type Peaks = Record<string, number>

export function loadPeaks(): Peaks {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {}

    const clean: Peaks = {}
    for (const [id, seconds] of Object.entries(parsed)) {
      if (typeof seconds === 'number' && Number.isFinite(seconds)) clean[id] = seconds
    }
    return clean
  } catch {
    return {}
  }
}

/**
 * Retient les pics mesurés, et oublie les plus anciens.
 *
 * Le ménage se fait au nombre d'entrées plutôt qu'à la date : un pic n'en
 * porte pas, et l'ordre d'insertion suffit — les plus récents sont les
 * derniers écrits.
 */
export function savePeaks(measured: Peaks): Peaks {
  const merged = { ...loadPeaks(), ...measured }
  const ids = Object.keys(merged)
  const kept = ids.length > KEEP ? ids.slice(ids.length - KEEP) : ids
  const trimmed = Object.fromEntries(kept.map((id) => [id, merged[id]!]))

  try {
    localStorage.setItem(KEY, JSON.stringify(trimmed))
  } catch {
    // Rien à faire : l'app remesurera à la prochaine ouverture.
  }
  return trimmed
}
