/**
 * Le vocabulaire des règles d'adaptation.
 *
 * Spécifié dans `docs/section-5-regles-adaptation.md`. Aucun type ici ne
 * décrit une action : le moteur produit des propositions, l'athlète confirme
 * (E.7).
 */

import type { DayKey } from '../calendar/dates'

export type { DayKey }

/** Le niveau d'une charge sur l'échelle à cinq degrés du E.1. */
export type LoadLevel = 0 | 1 | 2 | 3 | 4

/** Le poids d'une journée, tel que le reste des règles le nomme. */
export type DayWeight = 'legere' | 'moyenne' | 'chargee'

/**
 * Ce qu'une séance demande au corps — distinct de son niveau de charge.
 *
 * Le niveau dit **si** une séance est de qualité ; la nature dit **quelles**
 * règles d'espacement s'y appliquent. Une séance de force et une séance
 * d'endurance de même charge ne se placent pas de la même façon (E.4).
 */
export type SessionKind = 'endurance' | 'force' | 'autre'

/**
 * Une séance planifiée dans le calendrier intervals.icu.
 *
 * `load` peut manquer : une note ou une séance sans structure n'en porte pas.
 * Une séance sans charge connue n'est jamais traitée comme une séance de
 * qualité — on ne suppose pas ce qu'on ne sait pas.
 */
export type PlannedSession = {
  id: string
  date: DayKey
  load: number | null
  kind: SessionKind
}

/**
 * Une journée, observée ou à venir.
 *
 * `observedLoad` vaut `null` tant que la journée n'a pas eu lieu : son poids
 * se déduit alors des séances qui y sont planifiées.
 */
export type DayRecord = {
  date: DayKey
  observedLoad: number | null
  /** Secondes cumulées au-dessus du seuil de pic. */
  peakSeconds: number
}
