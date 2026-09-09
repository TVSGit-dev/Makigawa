/**
 * Ce que l'athlète a refusé du plan (section 5, E.14).
 *
 * Deux choses seulement, parce qu'une proposition n'a que deux axes : la
 * famille qu'il a écartée, et le jour avant lequel il ne veut rien.
 *
 * **Rien de tout cela ne part dans intervals.icu.** Comme le démenti de nuit
 * (E.12), c'est un ressenti et non une mesure : le calendrier n'a pas à en
 * porter la trace. Et rien ne s'installe : un refus s'oublie au bout de
 * l'horizon, un report quand sa date passe, et les deux se défont d'un tap.
 */

import { shiftDayKey, type DayKey } from '../calendar/dates'
import { HORIZON_DAYS } from '../workouts/week'

const KEY = 'makigawa.plan'

export type PlanPreferences = {
  /** Les familles écartées, et le jour où elles l'ont été. */
  refused: Record<string, DayKey>
  /** Le plan ne commence pas avant ce jour. */
  notBefore: DayKey | null
}

const EMPTY: PlanPreferences = { refused: {}, notBefore: null }

function read(): PlanPreferences {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return EMPTY
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return EMPTY

    const shape = parsed as Partial<PlanPreferences>
    const refused: Record<string, DayKey> = {}
    for (const [key, day] of Object.entries(shape.refused ?? {})) {
      if (typeof day === 'string') refused[key] = day
    }
    return {
      refused,
      notBefore: typeof shape.notBefore === 'string' ? shape.notBefore : null,
    }
  } catch {
    // Navigation privée ou stockage bloqué : l'app propose comme au premier jour.
    return EMPTY
  }
}

function write(preferences: PlanPreferences): PlanPreferences {
  try {
    localStorage.setItem(KEY, JSON.stringify(preferences))
  } catch {
    // Rien à faire : l'app fonctionne sans mémoire, elle oublie simplement.
  }
  return preferences
}

export function loadPlanPreferences(): PlanPreferences {
  return read()
}

/**
 * « Pas celle-ci » : la famille est écartée, le jour ne l'est pas.
 *
 * Un second tap la remet, parce qu'on change d'avis — et parce qu'un refus
 * dont on ne peut pas revenir n'est plus un refus mais une punition.
 */
export function refuseFamily(key: string, today: DayKey): PlanPreferences {
  const current = read()
  const refused = { ...current.refused }
  if (key in refused) delete refused[key]
  else refused[key] = today
  return write({ ...current, refused })
}

/**
 * « Plus tard » : le plan ne commence pas avant ce jour-là.
 *
 * **Un plancher, pas un rendez-vous** (E.14, révisé le 9 septembre 2026). Le
 * jour choisi devient le premier jour acceptable et le plan repart de là ;
 * quand le E.2 dit oui la séance y tombe exactement, quand il dit non elle
 * glisse au premier jour suivant qui convient. Forcer le jour reviendrait à
 * poser une séance de qualité sur une journée que les règles refusent,
 * c'est-à-dire à faire taire le E.2 d'un tap.
 *
 * Le reste du plan se replace autour, parce qu'il est recalculé en entier
 * plutôt que rapiécé.
 */
export function postponePlanTo(day: DayKey): PlanPreferences {
  const current = read()
  return write({ ...current, notBefore: day })
}

/**
 * « Demain » : le geste d'un tap, sur le lendemain de la proposition.
 *
 * Il ne fait rien de plus que `postponePlanTo` sur le jour suivant — les deux
 * gestes du E.14 posent le même plancher et ne diffèrent que par le nombre de
 * taps.
 */
export function postponePlan(from: DayKey): PlanPreferences {
  return postponePlanTo(shiftDayKey(from, 1))
}

/** Le geste qui défait les deux. Rien ne s'installe. */
export function resetPlanPreferences(): PlanPreferences {
  return write(EMPTY)
}

/** Y a-t-il quelque chose à défaire ? */
export function hasPlanPreferences(preferences: PlanPreferences): boolean {
  return preferences.notBefore !== null || Object.keys(preferences.refused).length > 0
}

/**
 * Le ménage : un refus vaut l'horizon du plan, un report jusqu'à sa date.
 *
 * Sans lui, une famille écartée un mardi de septembre le resterait en
 * décembre, et l'app finirait par n'avoir plus rien à proposer sans que
 * personne sache pourquoi.
 */
export function forgetStalePreferences(today: DayKey): PlanPreferences {
  const current = read()
  const floor = shiftDayKey(today, -HORIZON_DAYS)
  const refused: Record<string, DayKey> = {}
  for (const [key, day] of Object.entries(current.refused)) {
    if (day > floor) refused[key] = day
  }
  return write({
    refused,
    notBefore: current.notBefore && current.notBefore > today ? current.notBefore : null,
  })
}

/** Les clés de famille écartées, sous la forme qu'attend `planWeek`. */
export function refusedKeys(preferences: PlanPreferences): string[] {
  return Object.keys(preferences.refused)
}
