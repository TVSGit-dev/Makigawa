/**
 * La semaine de décharge (section 5, E.18).
 *
 * Le rythme 2:1 est arrêté depuis le 5 septembre (C.0, décision 7) et décrit
 * en C.4 — mais **l'app ne l'a jamais proposé**. Une règle spécifiée que rien
 * n'applique n'est pas une règle.
 *
 * Ce module ne fait que compter des semaines. Ce qu'une décharge change au
 * plan est décidé ailleurs : le mode passe en prudent, et le E.16 vise la
 * moitié du temps de travail tenu.
 */

import { mondayOf, shiftDayKey, type DayKey } from '../calendar/dates'
import type { Completion } from './done'
import type { Intent } from './intent'

/** Deux semaines de charge, puis une allégée. */
export const LOADING_WEEKS = 2

/**
 * Une semaine de charge : celle qui a porté **au moins une séance de qualité
 * tenue** (E.15).
 *
 * Ce n'est pas le tonnage qui compte, ce sont les semaines d'entraînement. Le
 * tonnage dirait n'importe quoi : les trajets portent 60 à 100 % de la charge
 * hebdomadaire de l'athlète, donc une semaine passée à seulement rouler au
 * travail pèserait autant qu'une semaine de travail dur.
 */
export function heldInWeek(completions: readonly Completion[], week: DayKey): boolean {
  const end = shiftDayKey(week, 7)
  return completions.some(
    (one) => one.outcome === 'tenue' && one.date >= week && one.date < end,
  )
}

export type UnloadOptions = {
  completions: readonly Completion[]
  today: DayKey
  /** Les lundis des semaines déjà passées en décharge. */
  unloaded: ReadonlySet<DayKey>
}

/**
 * Faut-il proposer une décharge cette semaine ?
 *
 * Deux conditions. Les deux semaines précédentes ont porté du travail — et
 * **une semaine de décharge acceptée n'en est jamais une**, sans quoi le cycle
 * se mordrait la queue dès la première. Et la semaine en cours n'a encore rien
 * porté : proposer d'alléger un mercredi où deux séances sont déjà faites
 * n'allègerait rien.
 */
export function shouldUnload({ completions, today, unloaded }: UnloadOptions): boolean {
  const week = mondayOf(today)
  if (heldInWeek(completions, week)) return false

  for (let back = 1; back <= LOADING_WEEKS; back += 1) {
    const previous = shiftDayKey(week, -7 * back)
    if (unloaded.has(previous)) return false
    if (!heldInWeek(completions, previous)) return false
  }

  return true
}

/**
 * Le mode d'une semaine de décharge.
 *
 * Prudent : une seule séance de qualité, ce que le C.4 demande. Le reste — la
 * moitié du volume, l'intensité inchangée — se joue sur le niveau du E.16.
 */
export function intentAfterUnload(intent: Intent, unloading: boolean): Intent {
  return unloading ? 'prudent' : intent
}
