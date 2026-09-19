/**
 * Ce que ses jambes produisent sur ses trajets (section 5, E.33).
 *
 * Le vélo électrique porte un capteur de puissance depuis le 18 septembre 2026.
 * Ces trajets étaient jusque-là une boîte noire : une charge venue du cardio, et
 * rien sur ce qu'il y mettait lui-même. Le capteur ouvre la boîte.
 *
 * **Rien n'est fusionné ici, et c'est tout le sujet.** La puissance dit ce que
 * les jambes ont produit, le cardio ce que ça a coûté ; les additionner
 * fabriquerait une charge maison, que le projet interdit depuis sa première
 * ligne. Les deux nombres côte à côte disent la vérité — leur somme ne dirait
 * rien.
 *
 * Les moyennes lues sont des moyennes **arithmétiques**, jamais des normalisées,
 * et elles ne se comparent qu'entre elles. La règle critique le demande
 * explicitement : toujours préciser laquelle.
 */

import { averageWattsOf, isAssisted, type Activity } from '../api/intervals'
import { dayKeyOf, shiftDayKey, type DayKey } from '../calendar/dates'
import { looksLikeCommute } from '../rules/context'

/** Ce qu'on regarde en arrière : la même fenêtre que les trois bandes (E.29). */
export const LEGS_DAYS = 14

export type LegsReading = {
  /** La moyenne des puissances moyennes mesurées, en watts. */
  watts: number
  /** Sur combien de trajets elle est lue. Un seul ne fait pas une habitude. */
  count: number
}

export type Legs = {
  /** Les trajets assistés : ses jambes, le moteur faisant le reste. */
  assisted: LegsReading | null
  /** Les trajets musculaires : ses jambes seules. */
  unassisted: LegsReading | null
  /** La fenêtre lue, en jours. */
  days: number
}

function averageOf(watts: readonly number[]): LegsReading | null {
  if (watts.length === 0) return null
  const total = watts.reduce((sum, one) => sum + one, 0)
  return { watts: Math.round(total / watts.length), count: watts.length }
}

/**
 * Ce que les trajets des derniers jours ont mesuré, assisté d'un côté,
 * musculaire de l'autre.
 *
 * **Les deux colonnes ne se mélangent jamais.** C'est le même trajet, le même
 * dénivelé, le même homme — et deux nombres qui ne veulent pas dire la même
 * chose. Les ranger ensemble serait exactement l'erreur que le E.33 nomme.
 *
 * Un trajet sans capteur ne compte pas : `averageWattsOf` rend `null`, et une
 * estimation ne vaut pas une mesure. C'est pourquoi la fourchette peut rester
 * vide alors qu'il a roulé — l'app préfère ne rien dire à dire 369 W.
 */
export function legsOn(
  activities: readonly Activity[],
  today: DayKey,
  days: number = LEGS_DAYS,
): Legs {
  const floor = shiftDayKey(today, -days)

  const commutes = activities
    .filter((activity) => looksLikeCommute(activity.type, activity.name))
    .filter((activity) => {
      const date = dayKeyOf(activity.startDateLocal)
      return date !== null && date > floor && date <= today
    })

  const measured = (assisted: boolean): number[] =>
    commutes
      .filter((activity) => isAssisted(activity) === assisted)
      .map(averageWattsOf)
      .filter((watts): watts is number => watts !== null && watts > 0)

  return {
    assisted: averageOf(measured(true)),
    unassisted: averageOf(measured(false)),
    days,
  }
}

/**
 * La part que ses jambes fournissent en électrique, rapportée au musculaire.
 *
 * C'est une division entre deux nombres mesurés, pas un coefficient inventé :
 * elle n'entre dans aucune règle et ne corrige aucune charge. Elle existe parce
 * que c'est la seule chose que la juxtaposition apprend — et parce qu'elle
 * retombe, par un chemin indépendant, sur le « à peu près moitié moins » dont le
 * E.32 tire ses trois degrés.
 *
 * `null` tant qu'il manque un des deux côtés : un rapport à un seul terme n'en
 * est pas un.
 */
export function assistedShare(legs: Legs): number | null {
  if (!legs.assisted || !legs.unassisted) return null
  if (legs.unassisted.watts <= 0) return null
  return Math.round((legs.assisted.watts / legs.unassisted.watts) * 100)
}
