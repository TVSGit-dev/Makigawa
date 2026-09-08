/**
 * La variabilité cardiaque (section 5, E.30).
 *
 * **Les cinq conditions du E.2 regardent toutes en arrière** : la veille,
 * l'avant-veille, la fraîcheur — elle-même en retard, puisqu'elle se calcule
 * sur des charges déjà encaissées — le quota de la semaine, la charge du jour.
 * Aucune ne regarde comment le corps va ce matin. Le seul signal du jour est le
 * démenti de nuit du E.12, et c'est un tap.
 *
 * Garmin pousse la variabilité nocturne vers intervals.icu avec le sommeil, et
 * elle arrive dans la réponse de `/wellness` que l'app lit déjà chaque jour.
 * Comme la FTP estimée du E.24 : aucun appel supplémentaire.
 *
 * **Rien n'est calculé qui ne soit mesuré.** Un logarithme, une moyenne, un
 * écart-type, une comparaison — la même arithmétique que la fraîcheur, qui est
 * une soustraction.
 */

import type { Wellness } from '../api/intervals'
import { shiftDayKey, type DayKey } from '../calendar/dates'

/** La fenêtre de la moyenne glissante : la normale du moment. */
export const VARIABILITY_WINDOW = 7

/**
 * Combien de nuits doivent figurer dans une fenêtre de sept pour que sa
 * moyenne veuille dire quelque chose.
 *
 * Une montre saute des nuits — batterie vide, nuit sans montre. Exiger les
 * sept rendrait la mesure inutilisable ; en accepter deux la rendrait fausse.
 */
export const VARIABILITY_MIN_NIGHTS = 4

/** Sur combien de moyennes glissantes la ligne de base se calcule. */
export const VARIABILITY_REFERENCE = 28

/** Combien il en faut au minimum pour qu'un écart-type veuille dire quelque chose. */
export const VARIABILITY_MIN_REFERENCE = 14

/**
 * Le plus petit changement qui vaille la peine d'être noté, en écarts-types.
 *
 * La moitié d'un écart-type : c'est le seuil de la littérature, et il est
 * volontairement bas — on cherche à écarter une séance dure un jour où le corps
 * n'est pas prêt, pas à établir une preuve.
 */
export const VARIABILITY_SWC = 0.5

/**
 * Combien de nuits il faut avoir mesurées avant que la base tienne.
 *
 * Six pour amorcer la première moyenne glissante, puis quatorze moyennes.
 */
export const VARIABILITY_NIGHTS_NEEDED = VARIABILITY_WINDOW - 1 + VARIABILITY_MIN_REFERENCE

export type Variability = {
  /** La moyenne glissante du jour, en logarithme. `null` faute de nuits. */
  today: number | null
  /** La ligne de base : la moyenne des moyennes glissantes précédentes. */
  baseline: number | null
  /** Le plancher : la ligne de base moins une demi-mesure de dispersion. */
  floor: number | null
  /** Vrai quand la moyenne du jour passe sous le plancher. */
  low: boolean
  /** Combien de nuits ont été mesurées sur la fenêtre lue. */
  nights: number
  /** Combien il en manque avant que la base tienne. Zéro quand elle tient. */
  missing: number
}

/** Ce qu'on sait avant d'avoir lu quoi que ce soit. */
export const NO_VARIABILITY: Variability = {
  today: null,
  baseline: null,
  floor: null,
  low: false,
  nights: 0,
  missing: VARIABILITY_NIGHTS_NEEDED,
}

/**
 * Les nuits mesurées, par date.
 *
 * Le **logarithme naturel** du rMSSD : la mesure est asymétrique, son
 * logarithme ne l'est pas, et c'est la forme sous laquelle la littérature la
 * traite. Une valeur nulle ou négative n'a pas de logarithme et n'est pas une
 * mesure : elle est écartée.
 */
function nightsOf(wellness: readonly Wellness[], upTo: DayKey): Map<DayKey, number> {
  const nights = new Map<DayKey, number>()
  for (const day of wellness) {
    if (day.date === null || day.date > upTo) continue
    if (day.hrv === null || day.hrv <= 0) continue
    nights.set(day.date, Math.log(day.hrv))
  }
  return nights
}

/** La moyenne glissante finissant ce jour-là, ou `null` s'il manque des nuits. */
function rollingAt(nights: Map<DayKey, number>, date: DayKey): number | null {
  const values: number[] = []
  for (let back = 0; back < VARIABILITY_WINDOW; back += 1) {
    const value = nights.get(shiftDayKey(date, -back))
    if (value !== undefined) values.push(value)
  }
  if (values.length < VARIABILITY_MIN_NIGHTS) return null
  return values.reduce((total, one) => total + one, 0) / values.length
}

/** L'écart-type d'une population, pas d'un échantillon : on a tous les jours. */
function deviationOf(values: readonly number[], mean: number): number {
  const variance =
    values.reduce((total, one) => total + (one - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

/**
 * Où en est la variabilité aujourd'hui, par rapport à la normale de l'athlète.
 *
 * La ligne de base **exclut le jour même** : comparer une valeur à une moyenne
 * qui la contient l'amortit, et c'est précisément le jour qu'on veut juger.
 */
export function variabilityOf(
  wellness: readonly Wellness[],
  today: DayKey,
): Variability {
  const nights = nightsOf(wellness, today)
  if (nights.size === 0) return NO_VARIABILITY

  const current = rollingAt(nights, today)

  const reference: number[] = []
  for (let back = 1; back <= VARIABILITY_REFERENCE; back += 1) {
    const rolling = rollingAt(nights, shiftDayKey(today, -back))
    if (rolling !== null) reference.push(rolling)
  }

  const missing = Math.max(0, VARIABILITY_NIGHTS_NEEDED - nights.size)

  if (current === null || reference.length < VARIABILITY_MIN_REFERENCE) {
    return { ...NO_VARIABILITY, today: current, nights: nights.size, missing: Math.max(1, missing) }
  }

  const baseline = reference.reduce((total, one) => total + one, 0) / reference.length
  const floor = baseline - VARIABILITY_SWC * deviationOf(reference, baseline)

  return {
    today: current,
    baseline,
    floor,
    // **Elle ne parle qu'au-dessous.** Une variabilité au-dessus de la normale
    // ne donne aucune permission supplémentaire : le plan ne devient pas plus
    // ambitieux parce qu'une nuit a été bonne (E.20).
    low: current < floor,
    nights: nights.size,
    missing: 0,
  }
}

/**
 * L'écart à la normale, en pourcentage de rMSSD.
 *
 * Les logarithmes ne se lisent pas ; leur différence, repassée en exponentielle,
 * donne le rapport entre les deux mesures. C'est un affichage, rien ne s'en
 * déduit.
 */
export function driftOf(variability: Variability): number | null {
  if (variability.today === null || variability.baseline === null) return null
  return Math.round((Math.exp(variability.today - variability.baseline) - 1) * 100)
}
