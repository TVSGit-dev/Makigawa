/**
 * Les jours de trajet, marqués par l'athlète (section 5, E.17 révisé).
 *
 * Une marque par jour : électrique, musculaire, ou rien. Elle **ne part pas
 * dans intervals.icu** (E.19) — c'est une intention, pas une mesure, et ce qui
 * a réellement été fait arrivera de Garmin.
 *
 * Seules les **exceptions au défaut** sont retenues. Le stockage reste petit,
 * et le jour où le défaut change, les semaines déjà marquées suivent.
 */

import { shiftDayKey, type DayKey } from '../calendar/dates'
import { COMMUTE_CYCLE, defaultCommute, type CommuteKind } from '../actions/commute'

const KEY = 'makigawa.trajets'

/** Un mois en arrière suffit : au-delà, ce sont les activités qui parlent. */
const KEEP_DAYS = 30

export type CommuteMarks = Record<DayKey, CommuteKind>

function isKind(value: unknown): value is CommuteKind {
  return value === 'chill' || value === 'hard' || value === 'aucun'
}

export function loadCommutes(): CommuteMarks {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {}

    const clean: CommuteMarks = {}
    for (const [date, kind] of Object.entries(parsed)) {
      if (isKind(kind)) clean[date] = kind
    }
    return clean
  } catch {
    return {}
  }
}

function save(marks: CommuteMarks): CommuteMarks {
  try {
    localStorage.setItem(KEY, JSON.stringify(marks))
  } catch {
    // Rien à faire : l'app fonctionne sans mémoire, elle repart du défaut.
  }
  return marks
}

/** Ce que porte un jour : ce qui est marqué, sinon le défaut. */
export function commuteOn(marks: CommuteMarks, date: DayKey): CommuteKind {
  return marks[date] ?? defaultCommute(date)
}

/** Un tap fait défiler électrique → musculaire → rien → électrique. */
export function cycleCommute(date: DayKey): CommuteMarks {
  const marks = loadCommutes()
  const current = commuteOn(marks, date)
  const next = COMMUTE_CYCLE[(COMMUTE_CYCLE.indexOf(current) + 1) % COMMUTE_CYCLE.length]!
  return save({ ...marks, [date]: next })
}

/** Le ménage : une marque passée n'apprend plus rien à personne. */
export function forgetOldCommutes(today: DayKey): CommuteMarks {
  const floor = shiftDayKey(today, -KEEP_DAYS)
  const marks = loadCommutes()
  const kept: CommuteMarks = {}
  for (const [date, kind] of Object.entries(marks)) {
    if (date >= floor) kept[date] = kind
  }
  return save(kept)
}
