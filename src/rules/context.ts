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
 * Ce qui marque un trajet dans un nom.
 *
 * Les libellés sont ceux que l'athlète leur donne lui-même dans Garmin, d'où
 * viennent d'ailleurs ceux du E.13. C'est le seul moyen de distinguer un
 * `Hard Commute` d'une vraie sortie : les deux sont des `Ride` avec un capteur
 * de puissance, et rien d'autre ne les sépare.
 *
 * L'électrique, lui, est écarté par son type — par principe, jamais par nom.
 */
const COMMUTE_MARKS = ['commute', 'trajet', 'domicile-travail']

export function namedLikeCommute(name: string | null): boolean {
  const flat = name?.toLowerCase() ?? ''
  return COMMUTE_MARKS.some((mark) => flat.includes(mark))
}

/**
 * Un trajet, quel que soit son vélo.
 *
 * **Il n'est jamais une séance de qualité** (règle critique). Sa charge, elle,
 * pèse la journée comme n'importe quelle autre.
 */
export function looksLikeCommute(type: string | null, name: string | null): boolean {
  return isCommute(type) || namedLikeCommute(name)
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
      commute: looksLikeCommute(event.type, event.name),
    })
  }

  return sessions
}

/**
 * Les journées observées, une par jour ayant porté au moins une activité.
 *
 * **`peakSeconds` se mesure depuis le E.21**, sur la courbe cardiaque de
 * chaque activité. Les pics sont passés en argument plutôt que lus ici : ce
 * module reste pur, et c'est ce qui le rend testable.
 *
 * Sans courbe — lecture échouée, activité trop ancienne — le pic vaut zéro et
 * la journée pèse par sa charge seule. C'est une sous-estimation, jamais une
 * sur-estimation : le sens le moins risqué pour une app qui décide d'en faire
 * moins.
 */
export function toDayRecords(
  activities: readonly Activity[],
  peaks: Readonly<Record<string, number>> = {},
): DayRecord[] {
  const loads = new Map<DayKey, number>()
  const peaked = new Map<DayKey, number>()

  for (const activity of activities) {
    const date = dayKeyOf(activity.startDateLocal)
    if (!date) continue
    loads.set(date, (loads.get(date) ?? 0) + (activity.trainingLoad ?? 0))

    // Les pointes de la journée se cumulent, comme les charges : deux sorties
    // qui montent chacune une minute font une journée qui en fait deux.
    const seconds = activity.id ? peaks[activity.id] : undefined
    if (seconds !== undefined) peaked.set(date, (peaked.get(date) ?? 0) + seconds)
  }

  return [...loads.entries()]
    .map(([date, observedLoad]) => ({
      date,
      observedLoad,
      peakSeconds: peaked.get(date) ?? 0,
    }))
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
  /** Les pics mesurés, par identifiant d'activité (E.21). */
  peaks?: Readonly<Record<string, number>>
}

/**
 * Le décor complet du moteur.
 *
 * Quand la fraîcheur est inconnue, elle vaut zéro : un TSB neutre ne
 * déclenche aucun refus. Une donnée manquante ne doit pas se transformer en
 * interdiction — l'app ne bloquerait pas une séance parce qu'elle ignore
 * quelque chose.
 */
export function buildContext({
  today,
  events,
  activities,
  wellness,
  intent,
  peaks = {},
}: Sources): Context {
  return {
    today,
    days: toDayRecords(activities, peaks),
    planned: toPlannedSessions(events),
    intent,
    tsb: freshnessOf(wellness, today) ?? 0,
  }
}
