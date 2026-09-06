/**
 * Poser une séance de la bibliothèque sur un jour.
 *
 * C'est le rôle que le projet donne à Makigawa, dit littéralement : le
 * **quand**. Le contenu vient d'intervals.icu et n'est pas touché — la séance
 * posée est une copie de celle de la bibliothèque, structure comprise.
 *
 * Tout ce qui décide est pur, donc testable. Seul `placeWorkout` parle au
 * réseau, et seulement après un tap.
 */

import { createEvent, type ApiOutcome, type LibraryWorkout } from '../api/intervals'
import type { Credentials } from '../storage/credentials'
import { refuse, type Context, type Refusal } from '../rules/decide'
import { kindOf } from '../rules/context'
import { shiftDayKey, type DayKey } from '../calendar/dates'
import type { PlannedSession, SessionKind } from '../rules/types'

/**
 * L'identifiant qu'on donne à une séance pas encore posée.
 *
 * Il ne doit ressembler à aucun identifiant du calendrier : `refuse` écarte
 * des calculs la séance qu'il évalue, en la reconnaissant par son id. Si
 * celui-ci entrait en collision avec une séance réelle, cette séance-là
 * disparaîtrait de l'examen.
 */
export const CANDIDATE_ID = 'candidate:makigawa'

/** La séance envisagée, telle que les règles la liront. */
export function asPlanned(workout: LibraryWorkout, date: DayKey): PlannedSession {
  return {
    id: CANDIDATE_ID,
    date,
    load: workout.trainingLoad,
    kind: kindOf(workout.type),
  }
}

export type Verdict = {
  date: DayKey
  /** `null` quand le jour convient. */
  refusal: Refusal | null
}

/**
 * Une séance qu'on envisage de poser, quelle que soit sa provenance : la
 * bibliothèque, une sortie ouverte, ou une séance composée par l'app.
 *
 * `load` peut manquer — une séance que Makigawa vient de composer n'a pas
 * encore de charge, puisque c'est intervals.icu qui la calculera. Les jours
 * restent alors examinés sur tout le reste : la veille chargée, la séance de
 * qualité voisine, le renfo trop proche. C'est moins qu'un verdict complet,
 * mais c'est vrai, et ça vaut mieux qu'une charge inventée.
 */
export type Candidate = {
  load: number | null
  kind: SessionKind
}

/**
 * Ce que chaque jour à venir vaut pour cette séance.
 *
 * C'est la question du E.2 posée d'avance, sur tous les jours à la fois, au
 * lieu d'être posée après coup sur une séance déjà placée. Rien n'est écrit :
 * l'athlète voit les bons jours et choisit.
 */
export function verdictsFor(
  candidate: Candidate,
  today: DayKey,
  days: number,
  context: Context,
): Verdict[] {
  const verdicts: Verdict[] = []

  for (let ahead = 0; ahead < days; ahead += 1) {
    const date = shiftDayKey(today, ahead)
    const planned: PlannedSession = { id: CANDIDATE_ID, date, ...candidate }
    verdicts.push({ date, refusal: refuse(planned, date, context) })
  }

  return verdicts
}

/**
 * L'événement de calendrier que devient une séance de bibliothèque.
 *
 * Les champs sont recopiés tels quels. La `description` surtout : c'est la
 * structure, et elle n'est ni composée, ni découpée, ni traduite.
 */
export function eventFor(workout: LibraryWorkout, date: DayKey): Record<string, unknown> {
  const event: Record<string, unknown> = {
    category: 'WORKOUT',
    start_date_local: `${date}T00:00:00`,
    name: workout.name ?? 'Séance',
  }

  if (workout.description !== null) event.description = workout.description
  if (workout.type !== null) event.type = workout.type
  if (workout.movingTime !== null) event.moving_time = workout.movingTime

  return event
}

/** L'appel qui pose la séance. Rien d'autre ne l'exécute. */
export async function placeWorkout(
  credentials: Credentials,
  workout: LibraryWorkout,
  date: DayKey,
): Promise<ApiOutcome<unknown>> {
  return createEvent(credentials, eventFor(workout, date))
}
