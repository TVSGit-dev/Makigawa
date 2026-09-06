/**
 * De ce qu'intervals.icu renvoie vers ce que les règles attendent.
 *
 * Le moteur du E.7 est une fonction pure : il ne sait rien du réseau. Ce
 * module est la traduction, et il est pur lui aussi — d'où ses tests.
 *
 * Rien n'est recalculé ici. Les charges viennent d'intervals.icu, la forme et
 * la fatigue aussi. La seule arithmétique du fichier est une soustraction,
 * celle qui donne la fraîcheur.
 */

import type { Activity, CalendarEvent, Wellness } from '../api/intervals'
import { dayKeyOf } from '../calendar/dates'
import type { Context } from './decide'
import type { Intent } from './intent'
import type { DayKey, DayRecord, PlannedSession, SessionKind } from './types'

/**
 * Ce qui compte comme une séance dans le calendrier.
 *
 * Le calendrier porte aussi des repères qui ne sont pas des choses à faire —
 * un `SEASON_START` a été constaté le 5 septembre. Filtrer sur `category`
 * plutôt que supposer que tout événement est une séance.
 */
const SESSION_CATEGORIES = new Set(['WORKOUT'])

export function isSession(event: CalendarEvent): boolean {
  return event.category === null || SESSION_CATEGORIES.has(event.category)
}

/**
 * Les types d'activité qui sollicitent la force. L'espacement force/endurance
 * du E.4 s'y applique.
 */
const FORCE_TYPES = new Set(['WeightTraining', 'Workout', 'Crossfit', 'Yoga'])

/**
 * Les types qui sollicitent la filière aérobie avec un effort réel.
 *
 * Le vélo électrique n'y est pas, et c'est le cœur de la règle critique : un
 * trajet en `EBikeRide` porte une charge — qui compte toujours — mais ce n'est
 * pas une séance, et il n'entre dans aucune règle d'espacement.
 */
const ENDURANCE_TYPES = new Set(['Ride', 'VirtualRide', 'Run', 'Swim', 'Rowing'])

export function kindOf(type: string | null): SessionKind {
  if (type === null) return 'autre'
  if (FORCE_TYPES.has(type)) return 'force'
  if (ENDURANCE_TYPES.has(type)) return 'endurance'
  return 'autre'
}

/** Un trajet en vélo électrique. Sa charge compte, il n'est jamais une séance. */
export function isCommute(type: string | null): boolean {
  return type === 'EBikeRide'
}

/**
 * Les séances planifiées, telles que les règles les lisent.
 *
 * Un événement sans identifiant est écarté : l'app ne peut ni le décaler ni
 * le supprimer, donc lui proposer quelque chose serait mentir.
 */
export function toPlannedSessions(events: readonly CalendarEvent[]): PlannedSession[] {
  const sessions: PlannedSession[] = []

  for (const event of events) {
    if (!isSession(event)) continue
    const date = dayKeyOf(event.startDateLocal)
    if (!date || !event.id) continue

    sessions.push({
      id: event.id,
      date,
      load: event.trainingLoad,
      kind: kindOf(event.type),
    })
  }

  return sessions
}

/**
 * Les journées observées, une par jour ayant porté au moins une activité.
 *
 * **`peakSeconds` vaut toujours zéro pour l'instant**, et ce n'est pas un
 * oubli. Le seuil de pic du E.1 est un temps cumulé au-dessus de 175 bpm ;
 * le connaître demande la courbe de fréquence cardiaque de chaque activité,
 * que l'app ne rapatrie pas. Deviner à partir des zones d'intervals.icu est
 * exclu — les règles comparent des bpm bruts, jamais un nom de zone.
 *
 * Conséquence assumée : une journée pèse par sa charge seule. Un effort
 * maximal court noyé dans une journée légère ne la fait pas basculer. C'est
 * une sous-estimation, jamais une sur-estimation — le sens le moins risqué
 * pour une app qui décide d'en faire moins.
 */
export function toDayRecords(activities: readonly Activity[]): DayRecord[] {
  const loads = new Map<DayKey, number>()

  for (const activity of activities) {
    const date = dayKeyOf(activity.startDateLocal)
    if (!date) continue
    loads.set(date, (loads.get(date) ?? 0) + (activity.trainingLoad ?? 0))
  }

  return [...loads.entries()]
    .map(([date, observedLoad]) => ({ date, observedLoad, peakSeconds: 0 }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * La fraîcheur du jour — le TSB dont dépend la troisième condition du E.2.
 *
 * C'est la différence entre la forme et la fatigue calculées par
 * intervals.icu. La journée la plus récente à porter les deux l'emporte : le
 * relevé du jour même n'existe pas toujours encore quand on ouvre l'app le
 * matin.
 */
export function freshnessOf(wellness: readonly Wellness[], upTo: DayKey): number | null {
  const usable = wellness
    .filter((day) => day.date !== null && day.date <= upTo)
    .filter((day) => day.ctl !== null && day.atl !== null)
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))

  const latest = usable[usable.length - 1]
  return latest ? (latest.ctl ?? 0) - (latest.atl ?? 0) : null
}

export type Sources = {
  today: DayKey
  events: readonly CalendarEvent[]
  activities: readonly Activity[]
  wellness: readonly Wellness[]
  intent: Intent
}

/**
 * Le décor complet du moteur.
 *
 * Quand la fraîcheur est inconnue, elle vaut zéro : un TSB neutre ne
 * déclenche aucun refus. Une donnée manquante ne doit pas se transformer en
 * interdiction — l'app ne bloquerait pas une séance parce qu'elle ignore
 * quelque chose.
 */
export function buildContext({ today, events, activities, wellness, intent }: Sources): Context {
  return {
    today,
    days: toDayRecords(activities),
    planned: toPlannedSessions(events),
    intent,
    tsb: freshnessOf(wellness, today) ?? 0,
  }
}
