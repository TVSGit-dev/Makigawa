/**
 * Ce que l'athlète a répondu à une proposition de décharge (E.18).
 *
 * Une clé par semaine, le lundi. Comme le démenti de nuit et les refus de
 * plan, **rien ne part dans intervals.icu** : c'est une décision
 * d'organisation, et le calendrier n'a pas à en porter la trace.
 */

import { shiftDayKey, type DayKey } from '../calendar/dates'

const KEY = 'makigawa.decharges'

/** Acceptée, ou écartée. Écartée ne se repropose pas la même semaine. */
export type UnloadChoice = 'acceptee' | 'ecartee'

/** Au-delà, une réponse ne concerne plus le cycle en cours. */
const KEEP_WEEKS = 8

export function loadUnloadChoices(): Record<DayKey, UnloadChoice> {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {}

    const clean: Record<DayKey, UnloadChoice> = {}
    for (const [week, choice] of Object.entries(parsed)) {
      if (choice === 'acceptee' || choice === 'ecartee') clean[week] = choice
    }
    return clean
  } catch {
    return {}
  }
}

function save(choices: Record<DayKey, UnloadChoice>): Record<DayKey, UnloadChoice> {
  try {
    localStorage.setItem(KEY, JSON.stringify(choices))
  } catch {
    // Rien à faire : l'app fonctionne sans mémoire, elle oublie simplement.
  }
  return choices
}

/** Un tap répond, un autre revient dessus : une décharge se refuse aussi. */
export function answerUnload(week: DayKey, choice: UnloadChoice | null) {
  const choices = { ...loadUnloadChoices() }
  if (choice === null) delete choices[week]
  else choices[week] = choice
  return save(choices)
}

/** Les semaines réellement passées en décharge — celles que le cycle saute. */
export function unloadedWeeks(choices: Record<DayKey, UnloadChoice>): Set<DayKey> {
  return new Set(Object.keys(choices).filter((week) => choices[week] === 'acceptee'))
}

/** Le ménage : huit semaines suffisent à couvrir deux cycles. */
export function forgetOldUnloads(today: DayKey): Record<DayKey, UnloadChoice> {
  const floor = shiftDayKey(today, -7 * KEEP_WEEKS)
  const choices = loadUnloadChoices()
  const kept: Record<DayKey, UnloadChoice> = {}
  for (const [week, choice] of Object.entries(choices)) {
    if (week >= floor) kept[week] = choice
  }
  return save(kept)
}
