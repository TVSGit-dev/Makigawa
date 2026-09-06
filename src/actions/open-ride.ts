/**
 * La sortie ouverte (section 5, E.8).
 *
 * Une séance extérieure sans structure, qui ne porte qu'une **charge visée**.
 * Dehors, le terrain et la météo décident de l'intensité ; prescrire des blocs
 * de puissance sur une route vallonnée revient à prescrire ce qu'on ne
 * contrôle pas.
 *
 * C'est la seule chose que Makigawa crée au lieu de recopier, et la frontière
 * tient quand même : **une sortie ouverte n'a pas de contenu**. Ni bloc, ni
 * zone, ni ordre. L'app pose une intention, elle ne compose pas une séance.
 */

import { createEvent, type ApiOutcome } from '../api/intervals'
import type { Credentials } from '../storage/credentials'
import type { DayKey } from '../calendar/dates'
import type { PlannedSession } from '../rules/types'
import { CANDIDATE_ID } from './place'

export type OpenRideTarget = {
  load: number
  /** Ce que cette charge vaut, en termes que l'athlète reconnaît. */
  hint: string
}

/**
 * Les charges proposées.
 *
 * **Ancrées sur des relevés réels**, pas sur une grille théorique : les
 * repères de 115 et de 140 viennent des journées que l'athlète a mesurées
 * lui-même le 6 septembre. Ce n'est pas un calcul de charge maison — l'app
 * n'estime rien, elle relaie un objectif qu'il choisit.
 */
export const OPEN_RIDE_TARGETS: readonly OpenRideTarget[] = [
  { load: 40, hint: 'une heure tranquille' },
  { load: 75, hint: 'une heure et demie sans forcer' },
  { load: 115, hint: 'l’équivalent d’un aller-retour musculaire' },
  { load: 140, hint: 'la sortie de 35 km' },
  { load: 200, hint: 'la sortie de 50 km' },
  { load: 270, hint: 'au-delà de 60 km' },
]

/**
 * Ce qu'on pose quand il n'y a pas de structure.
 *
 * Les styles de l'athlète, relevés le 6 septembre : la sortie longue dehors où
 * le terrain commande, la Zwift libre où c'est l'envie, et ses deux trajets —
 * qu'il veut pouvoir poser d'avance, parce qu'un aller-retour connu change ce
 * que la journée peut encore porter (E.13).
 *
 * La distinction n'est pas cosmétique : elle décide du type d'activité, donc de
 * la façon dont intervals.icu et les règles le lisent. Un `EBikeRide` n'est
 * jamais une séance ; un `Ride` peut l'être.
 */
export type Where = 'dehors' | 'zwift' | 'chill' | 'hard'

export const RIDE_TYPES: Record<Where, string> = {
  dehors: 'Ride',
  zwift: 'VirtualRide',
  chill: 'EBikeRide',
  hard: 'Ride',
}

const RIDE_NAMES: Record<Where, string> = {
  dehors: 'Sortie longue',
  zwift: 'Zwift libre',
  chill: 'Chill Commute',
  hard: 'Hard Commute',
}

export function rideLabel(where: Where): string {
  return RIDE_NAMES[where]
}

/**
 * Les charges des trajets, telles que l'athlète les a mesurées.
 *
 * Un aller-retour électrique tourne entre 30 et 40, un aller-retour musculaire
 * entre 110 et 120. Ce ne sont pas des estimations : ce sont ses relevés.
 */
export const COMMUTE_TARGETS: Record<'chill' | 'hard', readonly OpenRideTarget[]> = {
  chill: [
    { load: 18, hint: 'un aller, ou un retour' },
    { load: 35, hint: 'aller-retour' },
  ],
  hard: [
    { load: 58, hint: 'un aller, ou un retour' },
    { load: 115, hint: 'aller-retour — ça fait une journée chargée' },
  ],
}

/** Les charges proposées pour ce style. */
export function targetsFor(where: Where): readonly OpenRideTarget[] {
  if (where === 'chill' || where === 'hard') return COMMUTE_TARGETS[where]
  return OPEN_RIDE_TARGETS
}

export function openRideName(load: number, where: Where = 'dehors'): string {
  return `${RIDE_NAMES[where]} · ${Math.round(load)}`
}

/**
 * La sortie envisagée, telle que les règles la liront.
 *
 * Sa charge visée **est** sa charge : elle la situe sur l'échelle du E.1, elle
 * décide si c'est une séance de qualité, et le E.2 s'y applique mot pour mot.
 */
export function asPlannedRide(load: number, date: DayKey): PlannedSession {
  return { id: CANDIDATE_ID, date, load, kind: 'endurance' }
}

/**
 * L'événement de calendrier.
 *
 * La charge est envoyée, contrairement à une séance de bibliothèque — et c'est
 * la différence de fond entre les deux. Une séance structurée laisse
 * intervals.icu calculer sa charge depuis ses blocs ; une sortie ouverte n'a
 * pas de blocs, donc la charge visée est la seule chose qui la définisse. Sans
 * elle, les règles n'auraient rien à peser.
 */
export function openRideEvent(
  load: number,
  date: DayKey,
  where: Where = 'dehors',
): Record<string, unknown> {
  const target = Math.round(load)
  return {
    category: 'WORKOUT',
    start_date_local: `${date}T00:00:00`,
    name: openRideName(target, where),
    type: RIDE_TYPES[where],
    icu_training_load: target,
    description:
      where === 'chill' || where === 'hard'
        ? `Trajet Stockel – Wavre. Charge attendue : ${target}.`
        : `Sortie libre, sans structure. Objectif : ${target} de charge.`,
  }
}

/** L'appel qui pose la sortie. Rien d'autre ne l'exécute. */
export async function placeOpenRide(
  credentials: Credentials,
  load: number,
  date: DayKey,
  where: Where = 'dehors',
): Promise<ApiOutcome<unknown>> {
  return createEvent(credentials, openRideEvent(load, date, where))
}
