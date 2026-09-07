/**
 * Les trajets, marqués d'avance (section 5, E.17 révisé le 7 septembre 2026).
 *
 * L'app ne recommande plus comment aller au travail. C'est l'athlète qui
 * marque ses jours, et l'app en tient compte pour planifier autour :
 *
 * > *« On s'en fiche de mettre comment je vais au travail, puisqu'on n'est
 * > intéressé que par les résultats que la journée a donnés. »*
 *
 * La contradiction était dans le projet depuis le début — les trajets **ne se
 * posent pas, ils arrivent de Garmin**. Leur recommander un mode revenait à
 * prescrire ce que l'app observe.
 *
 * **Une marque par jour suffit** : l'aller et le retour se font d'office de la
 * même manière.
 */

import { parseDayKey, type DayKey } from '../calendar/dates'
import type { PlannedSession } from '../rules/types'
import { CANDIDATE_ID } from './place'

export type CommuteKind = 'chill' | 'hard' | 'aucun'

/** L'ordre dans lequel un tap fait défiler les marques. */
export const COMMUTE_CYCLE: readonly CommuteKind[] = ['chill', 'hard', 'aucun']

/**
 * Les charges d'un aller-retour, telles que l'athlète les a mesurées (E.13).
 *
 * Ce ne sont pas des estimations : 35 pour l'électrique, 115 pour le
 * musculaire — ce dernier fait à lui seul une journée chargée.
 */
export const COMMUTE_LOADS: Record<CommuteKind, number> = {
  chill: 35,
  hard: 115,
  aucun: 0,
}

export const COMMUTE_LABELS: Record<CommuteKind, string> = {
  chill: 'électrique',
  hard: 'musculaire',
  aucun: 'pas de trajet',
}

/** Une lettre, pour la pastille du calendrier. */
export const COMMUTE_MARKS: Record<CommuteKind, string> = {
  chill: 'É',
  hard: 'M',
  aucun: '—',
}

/**
 * Un jour de semaine.
 *
 * Ce sont des trajets domicile-travail : le week-end n'en porte pas par
 * défaut. C'est un défaut, pas une règle — un tap le contredit.
 */
export function isWorkday(date: DayKey): boolean {
  const day = parseDayKey(date)?.getDay()
  return day !== undefined && day >= 1 && day <= 5
}

/**
 * Ce qu'un jour porte quand l'athlète n'a rien marqué.
 *
 * Électrique en semaine, parce que c'est ce que le projet relève —
 * « majoritairement en vélo électrique ». Ne rien compter serait la pire des
 * approximations : ces trajets portent 60 à 100 % de la charge hebdomadaire, et
 * un plan qui les ignore planifie dans le vide.
 */
export function defaultCommute(date: DayKey): CommuteKind {
  return isWorkday(date) ? 'chill' : 'aucun'
}

/**
 * Le trajet marqué, tel que les règles le liront.
 *
 * `kind: 'autre'` : un trajet n'est **jamais** une séance, quelle que soit sa
 * charge. Sa charge, elle, compte toujours — c'est la règle critique du
 * projet, et c'est elle qui rend la journée chargée quand le trajet est
 * musculaire.
 */
export function asPlannedCommute(kind: CommuteKind, date: DayKey): PlannedSession | null {
  if (kind === 'aucun') return null
  return {
    id: `${CANDIDATE_ID}:trajet:${date}`,
    date,
    load: COMMUTE_LOADS[kind],
    kind: 'autre',
  }
}
