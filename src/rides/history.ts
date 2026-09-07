/**
 * Ce que l'historique dit (section 5, E.23).
 *
 * **Aucune charge n'est estimée ici.** Quand l'app doit dire ce qu'une sortie
 * ou une séance va coûter, elle ne calcule pas : elle regarde ce que les
 * sorties comparables de l'athlète ont réellement pesé, tel qu'intervals.icu
 * l'a calculé.
 *
 * Une formule donnerait un nombre plausible ; ses propres sorties donnent le
 * vrai, avec son terrain, son vélo et son vent. Et quand rien de comparable
 * n'existe, l'app ne dit rien plutôt qu'un chiffre inventé.
 */

import { averageWattsOf, type Activity } from '../api/intervals'
import { isCommute, namedLikeCommute } from '../rules/context'

export type LoadRange = {
  low: number
  high: number
  /** Sur combien de sorties la fourchette est lue. */
  count: number
}

/** Un quart de la valeur visée, jamais moins d'un plancher. */
function toleranceFor(value: number, floor: number): number {
  return Math.max(floor, value * 0.25)
}

/**
 * Ce qui n'apprend rien sur une séance : les trajets.
 *
 * Un aller-retour de dix-sept kilomètres ne dit rien d'une sortie de
 * cinquante, et l'électrique ne dit rien du tout.
 */
function isTraining(activity: Activity): boolean {
  return !isCommute(activity.type) && !namedLikeCommute(activity.name)
}

/** Les sorties comparables : ni trajet, ni distance trop éloignée. */
function comparable(activities: readonly Activity[], km: number): Activity[] {
  const tolerance = toleranceFor(km, 5)
  return activities
    .filter(isTraining)
    .filter((activity) => activity.distance !== null)
    .filter((activity) => Math.abs(activity.distance! / 1000 - km) <= tolerance)
}

/**
 * Ce que ses séances d'une durée comparable ont pesé.
 *
 * Sert aux séances d'intérieur, qui ne se pensent pas en distance : une heure
 * de Zwift est une heure de Zwift, quel que soit le nombre de kilomètres
 * virtuels qu'elle affiche.
 */
export function loadForDuration(
  activities: readonly Activity[],
  minutes: number,
  types: readonly string[] = ['VirtualRide'],
): LoadRange | null {
  const tolerance = toleranceFor(minutes, 10) * 60
  const seconds = minutes * 60

  const loads = activities
    .filter(isTraining)
    .filter((activity) => activity.type !== null && types.includes(activity.type))
    .filter((activity) => activity.movingTime !== null && activity.trainingLoad !== null)
    .filter((activity) => Math.abs(activity.movingTime! - seconds) <= tolerance)
    .map((activity) => activity.trainingLoad!)
    .sort((a, b) => a - b)

  if (loads.length === 0) return null
  return { low: Math.round(loads[0]!), high: Math.round(loads[loads.length - 1]!), count: loads.length }
}

/**
 * Ce que ses sorties de cette distance ont pesé.
 *
 * Les trajets sont écartés : un aller-retour de dix-sept kilomètres n'apprend
 * rien sur une sortie de cinquante, et l'électrique n'apprend rien du tout.
 *
 * `null` quand rien de comparable n'existe. L'app ne dit rien plutôt qu'un
 * chiffre inventé — c'est la règle du projet, et la seule réponse honnête.
 */
export function loadForDistance(
  activities: readonly Activity[],
  km: number,
): LoadRange | null {
  const loads = comparable(activities, km)
    .filter((activity) => activity.trainingLoad !== null)
    .map((activity) => activity.trainingLoad!)
    .sort((a, b) => a - b)

  if (loads.length === 0) return null

  return {
    low: Math.round(loads[0]!),
    high: Math.round(loads[loads.length - 1]!),
    count: loads.length,
  }
}

/**
 * L'allure réellement tenue sur ces sorties, en watts.
 *
 * Elle sert de contrepoint à l'allure proposée : si l'app dit 180 W et que ses
 * sorties comparables tournent à 150, c'est l'app qui se trompe de cible.
 */
export function pastWattsFor(activities: readonly Activity[], km: number): number | null {
  const watts = comparable(activities, km)
    .map(averageWattsOf)
    .filter((value): value is number => value !== null && value > 0)

  if (watts.length === 0) return null
  return Math.round(watts.reduce((total, one) => total + one, 0) / watts.length)
}
