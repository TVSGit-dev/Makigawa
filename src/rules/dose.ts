/**
 * La dose, semaine après semaine (section 5, E.23).
 *
 * L'athlète l'a demandée en une phrase : *« combien de charge je dois faire par
 * jour ou par semaine pour évoluer lentement mais sûrement »*.
 *
 * **Aucune charge n'est calculée ici.** Les totaux sont des sommes de charges
 * quotidiennes d'intervals.icu, et l'objectif est un pourcentage de cette
 * somme — la même arithmétique que la fraîcheur, qui est une soustraction.
 */

import { mondayOf, shiftDayKey, type DayKey } from '../calendar/dates'
import type { DayRecord } from './types'
import { RAMP_SHARE } from './ramp'

/** Sur combien de semaines complètes l'objectif se calcule. */
export const DOSE_WEEKS = 3

export type Week = {
  /** Le lundi de la semaine. */
  monday: DayKey
  /** La charge portée, telle qu'intervals.icu l'a calculée jour par jour. */
  load: number
}

export type Dose = {
  /** Les semaines complètes précédentes, de la plus ancienne à la plus récente. */
  past: Week[]
  /** Ce que la semaine en cours a déjà porté. */
  banked: number
  /**
   * Ce qu'il serait raisonnable de porter cette semaine.
   *
   * `null` quand aucune semaine complète n'a été observée : l'app ne devine
   * pas un objectif à partir de rien.
   */
  target: number | null
  /** Ce qu'il reste à placer, jamais négatif : dépasser n'est pas une dette. */
  remaining: number
  /** Combien de jours restent dans la semaine, aujourd'hui compris. */
  daysLeft: number
}

/** La charge d'une semaine, additionnée jour par jour. */
function loadOfWeek(days: readonly DayRecord[], monday: DayKey): number {
  const end = shiftDayKey(monday, 7)
  return days
    .filter((day) => day.date >= monday && day.date < end && day.observedLoad !== null)
    .reduce((total, day) => total + (day.observedLoad ?? 0), 0)
}

export type DoseOptions = {
  days: readonly DayRecord[]
  today: DayKey
  /**
   * La forme monte-t-elle déjà au plafond (E.20) ?
   *
   * Si oui, l'objectif **tient** au lieu de monter : on ne progresse pas en
   * ajoutant à ce qui monte déjà, et cette règle-là gouverne aussi la dose.
   */
  hold?: boolean
}

export function doseOf({ days, today, hold = false }: DoseOptions): Dose {
  const week = mondayOf(today)

  const past: Week[] = []
  for (let back = DOSE_WEEKS; back >= 1; back -= 1) {
    const monday = shiftDayKey(week, -7 * back)
    past.push({ monday, load: loadOfWeek(days, monday) })
  }

  // Une semaine à zéro n'est pas une semaine observée : elle tirerait la
  // moyenne vers le bas sans rien dire de ce que l'athlète peut porter.
  const observed = past.filter((one) => one.load > 0)
  const average =
    observed.length > 0
      ? observed.reduce((total, one) => total + one.load, 0) / observed.length
      : null

  const banked = loadOfWeek(days, week)
  const target = average === null ? null : Math.round(average * (hold ? 1 : 1 + RAMP_SHARE))

  const end = shiftDayKey(week, 7)
  let daysLeft = 0
  for (let date = today; date < end; date = shiftDayKey(date, 1)) daysLeft += 1

  return {
    past,
    banked,
    target,
    // Dépasser l'objectif n'est pas une dette, et il ne reste alors rien à
    // placer : le zéro est un plancher, pas un reproche.
    remaining: target === null ? 0 : Math.max(0, target - banked),
    daysLeft,
  }
}

/**
 * Ce qu'il reste à placer, réparti sur les jours qui viennent.
 *
 * **Ce n'est pas un quota quotidien.** Une journée sans rien ne crée aucune
 * dette : le reste se redistribue simplement sur les jours restants, et le
 * chiffre baisse tout seul. Répartir n'est pas devoir (E.6).
 */
export function perDay(dose: Dose): number {
  if (dose.daysLeft <= 0) return 0
  return Math.round(dose.remaining / dose.daysLeft)
}
