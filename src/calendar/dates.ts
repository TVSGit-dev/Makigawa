/**
 * Manipulation de dates pour la vue calendrier.
 *
 * Tout est en heure locale du téléphone : intervals.icu renvoie des dates
 * déjà locales (`start_date_local`), et l'athlète raisonne en jours vécus,
 * pas en UTC.
 */

/** Une date au format `AAAA-MM-JJ`, sans heure ni fuseau. */
export type DayKey = string

const DAY_KEY = /^(\d{4})-(\d{2})-(\d{2})/

/** Minuit local du jour de `date`, débarrassé de l'heure. */
function atMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function addDays(date: Date, days: number): Date {
  const shifted = atMidnight(date)
  shifted.setDate(shifted.getDate() + days)
  return shifted
}

export function toDayKey(date: Date): DayKey {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Le jour d'un événement. L'API peut renvoyer `2026-09-08` comme
 * `2026-09-08T00:00:00` : seule la partie date nous intéresse.
 */
export function dayKeyOf(startDateLocal: string | null): DayKey | null {
  if (!startDateLocal) return null
  const match = DAY_KEY.exec(startDateLocal)
  return match ? match[0] : null
}

/** « lundi 8 septembre ». Renvoie la clé brute si elle est illisible. */
export function formatDay(key: DayKey): string {
  const match = DAY_KEY.exec(key)
  if (!match) return key
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return date.toLocaleDateString('fr-BE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

/** « 45 min », « 1 h », « 1 h 15 ». */
export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60)
  if (minutes < 1) return '< 1 min'
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest} min`
  if (rest === 0) return `${hours} h`
  return `${hours} h ${String(rest).padStart(2, '0')}`
}
