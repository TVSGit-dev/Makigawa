/**
 * Ce que les courbes cardiaques ont donné (E.21, élargi en E.29).
 *
 * Une courbe cardiaque ne change jamais : la relire à chaque ouverture serait
 * quatorze appels réseau pour un résultat identique. Le relevé d'une activité
 * est donc fait une fois, puis gardé dans le téléphone sous son identifiant.
 *
 * **La clé a changé au E.29**, quand le relevé est passé d'un nombre à trois.
 * Les anciens pics ne se convertissent pas — une seconde au-dessus de 175 ne
 * dit rien des deux autres bandes — donc ils sont abandonnés et l'app relit une
 * fois. Une demi-mesure fausserait la répartition sans qu'on le voie.
 *
 * Comme tout le reste du dossier, rien n'en part vers intervals.icu.
 */

import { NO_BANDS, type Bands } from '../rules/peak'

const KEY = 'makigawa.bandes'

/** Un mois : au-delà, une activité ne pèse plus sur aucune décision. */
const KEEP = 200

export type Peaks = Record<string, Bands>

/** Trois nombres finis, ou rien : un relevé partiel fausserait la répartition. */
function bandsFrom(value: unknown): Bands | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const record = value as Record<string, unknown>

  const read = (key: keyof Bands): number | null => {
    const seconds = record[key]
    return typeof seconds === 'number' && Number.isFinite(seconds) && seconds >= 0
      ? seconds
      : null
  }

  const easy = read('easy')
  const moderate = read('moderate')
  const hard = read('hard')
  if (easy === null || moderate === null || hard === null) return null
  return { easy, moderate, hard }
}

export function loadPeaks(): Peaks {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {}

    const clean: Peaks = {}
    for (const [id, value] of Object.entries(parsed)) {
      const bands = bandsFrom(value)
      if (bands) clean[id] = bands
    }
    return clean
  } catch {
    return {}
  }
}

/** Le relevé d'une activité, ou trois zéros quand elle n'en a pas. */
export function bandsOfActivity(peaks: Peaks, id: string | null): Bands {
  return (id ? peaks[id] : undefined) ?? NO_BANDS
}

/**
 * Retient les relevés mesurés, et oublie les plus anciens.
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
