/**
 * La séance d'après (section 5, E.15).
 *
 * C'est la pièce qui manquait à tout le reste : l'app savait ce qu'elle avait
 * proposé, elle ne savait pas ce qui avait été fait. La reprise du E.5 en
 * dépendait, les niveaux du E.16 en dépendent, et le simple fait de pouvoir
 * dire à l'athlète ce qu'il a fait plutôt que ce qu'il avait prévu.
 *
 * **Rien n'est calculé ici.** Les deux charges viennent d'intervals.icu — celle
 * qu'il a déduite de la structure prévue, celle qu'il a mesurée sur
 * l'activité. Ce module les met côte à côte, il n'en produit aucune.
 */

import type { Activity, CalendarEvent } from '../api/intervals'
import { dayKeyOf, type DayKey } from '../calendar/dates'
import { isCommute, isSession, kindOf } from './context'
import { DEFAULT_SCALE, levelOf, QUALITY_LEVEL, type LoadScale } from './scale'
import type { Intent } from './intent'

/** Ce qu'une séance prévue est devenue. */
export type Outcome = 'tenue' | 'allegee' | 'absente'

export type Completion = {
  event: CalendarEvent
  date: DayKey
  /** La charge prévue, telle qu'intervals.icu l'a calculée. */
  planned: number | null
  /** L'activité qui l'a réalisée, quand on a su la retrouver. */
  activity: Activity | null
  /** La charge réalisée. */
  done: number | null
  outcome: Outcome
}

/**
 * Les deux seuils de la comparaison.
 *
 * Quatre-vingt-cinq pour cent parce qu'une séance faite à ce niveau-là **est**
 * la séance : il y manque un retour au calme ou une répétition, pas le
 * travail. En dessous de la moitié, c'en est une autre.
 */
export const HELD_RATIO = 0.85
export const LIGHTENED_RATIO = 0.5

/**
 * Ce qui marque un trajet dans le nom d'une activité.
 *
 * Les noms sont ceux que l'athlète leur donne lui-même dans Garmin, d'où
 * viennent d'ailleurs les libellés du E.13. C'est le seul moyen de distinguer
 * un `Hard Commute` d'une vraie sortie : les deux sont des `Ride` avec un
 * capteur de puissance, et rien d'autre ne les sépare.
 *
 * L'électrique, lui, est écarté par son type — par principe, jamais par nom.
 */
const COMMUTE_MARKS = ['commute', 'trajet', 'domicile-travail']

export function looksLikeCommute(activity: Activity): boolean {
  if (isCommute(activity.type)) return true
  const name = activity.name?.toLowerCase() ?? ''
  return COMMUTE_MARKS.some((mark) => name.includes(mark))
}

/**
 * Une activité peut-elle être la réalisation d'une séance ?
 *
 * Un trajet ne l'est jamais, quelle que soit sa charge : le voir comme tel
 * ferait passer un aller-retour pour un sweet spot tenu, et ferait monter un
 * niveau que personne n'a gagné.
 */
function couldRealise(activity: Activity, event: CalendarEvent): boolean {
  if (looksLikeCommute(activity)) return false
  return kindOf(activity.type) === kindOf(event.type)
}

function outcomeOf(planned: number | null, done: number | null): Outcome {
  if (done === null) return 'absente'
  // Une séance sans charge prévue mais réalisée est tenue : il n'y a rien à
  // comparer, et l'activité existe.
  if (planned === null || planned <= 0) return 'tenue'

  const ratio = done / planned
  if (ratio >= HELD_RATIO) return 'tenue'
  if (ratio >= LIGHTENED_RATIO) return 'allegee'
  return 'absente'
}

export type MatchOptions = {
  events: readonly CalendarEvent[]
  activities: readonly Activity[]
  /** Rien n'est jugé à partir d'aujourd'hui : la journée n'est pas finie. */
  today: DayKey
  /** Le plus ancien jour examiné. */
  since: DayKey
}

/**
 * Ce que sont devenues les séances passées.
 *
 * Trois moyens de retrouver une séance dans ce qui a été fait, dans cet ordre :
 * le lien d'intervals.icu, puis le même jour et la même nature, puis rien.
 * Une activité déjà appariée ne l'est pas deux fois — sans quoi une seule
 * sortie ferait passer deux séances pour tenues.
 */
export function matchCompletions({
  events,
  activities,
  today,
  since,
}: MatchOptions): Completion[] {
  const byPairing = new Map<string, Activity>()
  for (const activity of activities) {
    if (activity.pairedEventId) byPairing.set(activity.pairedEventId, activity)
  }

  const used = new Set<Activity>()
  const completions: Completion[] = []

  const past = events
    .filter(isSession)
    .map((event) => ({ event, date: dayKeyOf(event.startDateLocal) }))
    .filter(
      (entry): entry is { event: CalendarEvent; date: DayKey } =>
        entry.date !== null && entry.date < today && entry.date >= since,
    )
    .sort((a, b) => a.date.localeCompare(b.date))

  for (const { event, date } of past) {
    const paired = event.id ? byPairing.get(event.id) : undefined
    const activity = paired ?? nearestOnDay(event, date, activities, used)
    if (activity) used.add(activity)

    completions.push({
      event,
      date,
      planned: event.trainingLoad,
      activity: activity ?? null,
      done: activity?.trainingLoad ?? null,
      outcome: outcomeOf(event.trainingLoad, activity?.trainingLoad ?? null),
    })
  }

  return completions
}

/** L'activité du jour dont la charge est la plus proche de celle prévue. */
function nearestOnDay(
  event: CalendarEvent,
  date: DayKey,
  activities: readonly Activity[],
  used: ReadonlySet<Activity>,
): Activity | undefined {
  const candidates = activities.filter(
    (activity) =>
      !used.has(activity) &&
      // Une activité qu'intervals.icu a appariée ailleurs appartient à cette
      // autre séance, pas à celle-ci.
      (!activity.pairedEventId || activity.pairedEventId === event.id) &&
      dayKeyOf(activity.startDateLocal) === date &&
      couldRealise(activity, event),
  )

  if (candidates.length <= 1) return candidates[0]

  const target = event.trainingLoad ?? 0
  return [...candidates].sort(
    (a, b) => Math.abs((a.trainingLoad ?? 0) - target) - Math.abs((b.trainingLoad ?? 0) - target),
  )[0]
}

/* ---------- la reprise du E.5 ---------- */

/** Au-delà de tant de jours sans séance de qualité, l'app repart doucement. */
export const REPRISE_DAYS = 14

/**
 * Une activité de qualité au sens du E.1 : la filière aérobie, sollicitée
 * assez fort pour compter.
 *
 * **Les trajets n'en sont jamais**, comme le E.5 l'exige : ils entretiennent
 * la base mais ne sollicitent ni le haut de la filière, ni les tissus qui se
 * déconditionnent le plus vite.
 */
export function isQualityActivity(
  activity: Activity,
  scale: LoadScale = DEFAULT_SCALE,
): boolean {
  if (looksLikeCommute(activity)) return false
  if (kindOf(activity.type) !== 'endurance') return false
  return activity.trainingLoad !== null && levelOf(activity.trainingLoad, scale) >= QUALITY_LEVEL
}

/**
 * Depuis combien de jours il n'y a pas eu de séance de qualité.
 *
 * `null` quand l'historique est vide : on ne sait pas, et une donnée manquante
 * ne doit pas se transformer en verdict. Quand il y a des activités mais
 * aucune de qualité, la réponse est la fenêtre entière — c'est un plancher,
 * pas une mesure, et il suffit à déclencher la reprise.
 */
export function daysSinceQuality(
  activities: readonly Activity[],
  today: DayKey,
  window: number,
  scale: LoadScale = DEFAULT_SCALE,
): number | null {
  if (activities.length === 0) return null

  const latest = activities
    .filter((activity) => isQualityActivity(activity, scale))
    .map((activity) => dayKeyOf(activity.startDateLocal))
    .filter((date): date is DayKey => date !== null && date <= today)
    .sort()
    .at(-1)

  if (!latest) return window
  return Math.min(window, daysBetween(latest, today))
}

function daysBetween(from: DayKey, to: DayKey): number {
  const start = new Date(`${from}T00:00:00`).getTime()
  const end = new Date(`${to}T00:00:00`).getTime()
  return Math.round((end - start) / 86_400_000)
}

export function isReprise(daysSince: number | null): boolean {
  return daysSince !== null && daysSince >= REPRISE_DAYS
}

/**
 * Le mode réellement appliqué pendant une reprise.
 *
 * **Prudent, ni plus ni moins** — soit exactement « une seule séance de qualité
 * la première semaine » du E.5. Le mode se relâche de lui-même dès qu'une
 * séance de qualité est faite, puisque le compteur repart à zéro ; le plafond
 * de +10 % par semaine est alors tenu par le E.16, qui ne propose qu'un cran
 * de plus à la fois. C'est le comportement que le E.5 demande, sans inventer
 * une machine à états de trois semaines dont rien ne dirait où elle en est.
 */
export function intentAfterReprise(intent: Intent, reprise: boolean): Intent {
  return reprise ? 'prudent' : intent
}
