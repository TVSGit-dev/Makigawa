/**
 * Le moteur de règles (section 5, parties E.2 à E.4).
 *
 * Tout se ramène à une question, posée séance par séance : **aujourd'hui
 * est-il un bon jour pour celle-ci ?** Quand la réponse est non, trois issues
 * dans l'ordre — décaler, réduire, laisser tomber — et aucune ne produit de
 * dette.
 *
 * Ce module ne touche à rien. Il produit des propositions que l'athlète
 * confirme (E.7), ce qui en fait une fonction pure, donc testable.
 */

import { shiftDayKey } from '../calendar/dates'
import {
  DEFAULT_SCALE,
  isQuality,
  levelOf,
  QUALITY_LEVEL,
  weighDay,
  type LoadScale,
} from './scale'
import { INTENTS, type Intent } from './intent'
import type { DayKey, DayRecord, DayWeight, PlannedSession } from './types'

/** Combien de jours l'app cherche une place avant de renoncer (E.3). */
export const MAX_SHIFT_DAYS = 2

/** Ce qui fait dire non, et pourquoi. */
export type Refusal =
  | { code: 'veille-chargee' }
  | { code: 'deux-jours-charges' }
  | { code: 'lendemain-charge' }
  | { code: 'tsb-sous-plancher'; tsb: number; floor: number }
  | { code: 'quota-hebdomadaire'; charged: number; allowed: number }
  | { code: 'une-seule-par-semaine' }
  | { code: 'qualite-voisine'; date: DayKey }
  | { code: 'force-trop-proche'; date: DayKey }
  | { code: 'renfo-sur-journee-chargee' }

/** Ce que l'app propose. Jamais ce qu'elle fait. */
export type Proposal =
  | { action: 'garder' }
  | { action: 'decaler'; to: DayKey; because: Refusal }
  | { action: 'reduire'; load: number; because: Refusal }
  | { action: 'abandonner'; because: Refusal }

export type Context = {
  today: DayKey
  /** Journées observées et à venir, dans n'importe quel ordre. */
  days: readonly DayRecord[]
  /** Toutes les séances planifiées, celle qu'on évalue comprise. */
  planned: readonly PlannedSession[]
  intent: Intent
  /** Le TSB du jour, tel que le donne intervals.icu. */
  tsb: number
  scale?: LoadScale
}

const WEIGHT_ORDER: Record<DayWeight, number> = { legere: 0, moyenne: 1, chargee: 2 }

/** Une séance qui pèse assez pour interférer avec une autre (E.4). */
function isSubstantial(session: PlannedSession, scale: LoadScale): boolean {
  return session.load !== null && levelOf(session.load, scale) >= 2
}

/**
 * La question centrale du E.2, posée pour un jour donné.
 *
 * Renvoie le premier motif de refus, ou `null` si le jour convient. La séance
 * évaluée est retirée de tous les calculs : sans quoi elle se bloquerait
 * elle-même, une séance de qualité rendant sa propre journée chargée.
 */
export function refuse(
  session: PlannedSession,
  date: DayKey,
  context: Context,
): Refusal | null {
  const scale = context.scale ?? DEFAULT_SCALE
  const rules = INTENTS[context.intent]
  const others = context.planned.filter((other) => other.id !== session.id)
  const dayAt = (key: DayKey) => context.days.find((day) => day.date === key)
  const weightAt = (key: DayKey) => weighDay(dayAt(key), key, others, scale)

  // E.6 — jamais de renfo sur une journée chargée.
  if (session.kind === 'force' && weightAt(date) === 'chargee') {
    return { code: 'renfo-sur-journee-chargee' }
  }

  // E.2 (1) — hier était chargée. Le mode ambitieux tolère un
  // enchaînement, mais un seul : au second, la règle reprend.
  const yesterday = weightAt(shiftDayKey(date, -1))
  if (yesterday === 'chargee') {
    const tolerated =
      rules.allowsConsecutiveCharged && !hasConsecutiveCharged(date, context, others, scale)
    if (!tolerated) return { code: 'veille-chargee' }
  }

  // E.2 (2) — les deux derniers jours cumulent deux journées au moins moyennes.
  const dayBefore = weightAt(shiftDayKey(date, -2))
  if (WEIGHT_ORDER[yesterday] >= 1 && WEIGHT_ORDER[dayBefore] >= 1) {
    return { code: 'deux-jours-charges' }
  }

  // E.6 — jamais deux journées chargées planifiées d'affilée, dans l'autre
  // sens : la veille est traitée plus haut, le lendemain ici.
  if (!rules.allowsConsecutiveCharged && weightAt(shiftDayKey(date, 1)) === 'chargee') {
    return { code: 'lendemain-charge' }
  }

  // E.2 (3) — le TSB est sous le plancher du mode.
  if (context.tsb < rules.tsbFloor) {
    return { code: 'tsb-sous-plancher', tsb: context.tsb, floor: rules.tsbFloor }
  }

  // E.2 (4) — en mode prudent, une seule séance de qualité par semaine.
  if (rules.oneQualityPerWeek && countQualityInWeek(date, others, scale) >= 1) {
    return { code: 'une-seule-par-semaine' }
  }

  // Partie D — quota de journées chargées sur sept jours, la séance comprise.
  const charged = countChargedDays(date, context, [...others, { ...session, date }], scale)
  if (charged > rules.chargedDaysPerWeek) {
    return { code: 'quota-hebdomadaire', charged, allowed: rules.chargedDaysPerWeek }
  }

  // E.4 — deux séances de qualité ne se suivent jamais.
  for (const other of others) {
    if (!isQuality(other, scale)) continue
    if (isWithin(other.date, date, 1)) return { code: 'qualite-voisine', date: other.date }
  }

  // E.4 — force et endurance demandent 24 à 48 h d'écart, dans les deux sens.
  if (session.kind === 'force' || session.kind === 'endurance') {
    const opposite = session.kind === 'force' ? 'endurance' : 'force'
    for (const other of others) {
      if (other.kind !== opposite || !isSubstantial(other, scale)) continue
      if (isWithin(other.date, date, 1)) return { code: 'force-trop-proche', date: other.date }
    }
  }

  return null
}

/**
 * Ce que l'app propose pour une séance.
 *
 * Les règles n'agissent que sur les séances de qualité (E.0, principe 1) :
 * en dessous, une séance cohabite avec tout et n'est jamais déplacée.
 */
export function propose(session: PlannedSession, context: Context): Proposal {
  const scale = context.scale ?? DEFAULT_SCALE

  if (!isQuality(session, scale)) return { action: 'garder' }

  const refusal = refuse(session, session.date, context)
  if (!refusal) return { action: 'garder' }

  // 1. Décaler — deux jours au plus, au-delà la séance ne sert plus
  //    l'intention de la semaine.
  for (let ahead = 1; ahead <= MAX_SHIFT_DAYS; ahead += 1) {
    const candidate = shiftDayKey(session.date, ahead)
    if (!refuse({ ...session, date: candidate }, candidate, context)) {
      return { action: 'decaler', to: candidate, because: refusal }
    }
  }

  // 2. Réduire — durée de moitié, intensité inchangée. Ta ressource rare est
  //    l'intensité : raccourcir préserve ce qui manque, adoucir détruit ce qui
  //    est rare. Une séance ainsi réduite descend sous le seuil de qualité, et
  //    les règles cessent donc de la gouverner.
  const halved = (session.load ?? 0) / 2
  if (levelOf(halved, scale) < QUALITY_LEVEL) {
    return { action: 'reduire', load: halved, because: refusal }
  }

  // 3. Laisser tomber. Pas de report, pas de marque, pas de mention.
  return { action: 'abandonner', because: refusal }
}

/** Y a-t-il déjà deux journées chargées consécutives dans les sept jours ? */
function hasConsecutiveCharged(
  date: DayKey,
  context: Context,
  others: readonly PlannedSession[],
  scale: LoadScale,
): boolean {
  let previous: DayWeight | null = null
  for (let back = 7; back >= 1; back -= 1) {
    const key = shiftDayKey(date, -back)
    const weight = weighDay(
      context.days.find((day) => day.date === key),
      key,
      others,
      scale,
    )
    if (previous === 'chargee' && weight === 'chargee') return true
    previous = weight
  }
  return false
}

function countChargedDays(
  date: DayKey,
  context: Context,
  sessions: readonly PlannedSession[],
  scale: LoadScale,
): number {
  let charged = 0
  for (let back = 0; back < 7; back += 1) {
    const key = shiftDayKey(date, -back)
    const weight = weighDay(
      context.days.find((day) => day.date === key),
      key,
      sessions,
      scale,
    )
    if (weight === 'chargee') charged += 1
  }
  return charged
}

/**
 * Les séances de qualité à moins de sept jours de `date`, celle-ci au centre.
 * Une fenêtre glissante, et non la semaine du calendrier : deux séances à
 * cheval sur un dimanche ne sont pas plus espacées que deux séances en
 * milieu de semaine.
 */
function countQualityInWeek(
  date: DayKey,
  sessions: readonly PlannedSession[],
  scale: LoadScale,
): number {
  const oldest = shiftDayKey(date, -3)
  const newest = shiftDayKey(date, 3)
  return sessions.filter(
    (session) =>
      isQuality(session, scale) && session.date >= oldest && session.date <= newest,
  ).length
}

/** Deux dates séparées d'au plus `days` jours, dans un sens ou dans l'autre. */
function isWithin(a: DayKey, b: DayKey, days: number): boolean {
  for (let offset = -days; offset <= days; offset += 1) {
    if (shiftDayKey(b, offset) === a) return true
  }
  return false
}
