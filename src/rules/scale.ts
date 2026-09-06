/**
 * L'échelle de charge (section 5, E.1).
 *
 * Une seule échelle qui sert deux fois : pour situer une séance prise
 * isolément, et pour situer une journée une fois ses activités additionnées.
 * Les charges viennent d'intervals.icu — le projet ne recalcule jamais la
 * sienne.
 */

import type { DayRecord, DayWeight, LoadLevel, PlannedSession } from './types'

/**
 * Les bornes de l'échelle. Chaque borne appartient au niveau supérieur :
 * une charge de 40 est modérée, pas légère.
 *
 * **Provisoires.** Le seul ancrage réel est la séance « Chill » relevée le
 * 5 septembre 2026 — une heure d'intérieur pour une charge de 69 — et le
 * reste est déduit autour. La phase 6 les corrigera sur des journées réelles,
 * d'où leur passage en paramètre plutôt qu'en constante figée.
 */
export type LoadScale = {
  /** En dessous : niveau 0, négligeable. */
  light: number
  /** En dessous : niveau 1, légère. */
  moderate: number
  /** En dessous : niveau 2, modérée. */
  sustained: number
  /** En dessous : niveau 3, soutenue. Au-delà : niveau 4, lourde. */
  heavy: number
}

export const DEFAULT_SCALE: LoadScale = {
  light: 15,
  moderate: 40,
  sustained: 70,
  heavy: 110,
}

/** Le seuil de pic, en battements par minute. */
export const PEAK_BPM = 175

/**
 * Combien de temps au-dessus du seuil bascule une journée en chargée.
 *
 * Sans durée minimale, un unique battement suffisait, et un sprint de trente
 * secondes pour attraper un feu pesait autant qu'un effort maximal.
 */
export const PEAK_MIN_SECONDS = 120

/** À partir de quel niveau une séance est dite « de qualité » (E.1). */
export const QUALITY_LEVEL: LoadLevel = 3

export function levelOf(load: number, scale: LoadScale = DEFAULT_SCALE): LoadLevel {
  if (load < scale.light) return 0
  if (load < scale.moderate) return 1
  if (load < scale.sustained) return 2
  if (load < scale.heavy) return 3
  return 4
}

/**
 * Une séance de qualité est celle que les règles protègent. En dessous, elle
 * cohabite avec tout : ni bloquante, ni bloquée.
 *
 * Une séance dont la charge est inconnue n'en est jamais une — on ne suppose
 * pas ce qu'on ne sait pas.
 */
export function isQuality(session: PlannedSession, scale: LoadScale = DEFAULT_SCALE): boolean {
  return session.load !== null && levelOf(session.load, scale) >= QUALITY_LEVEL
}

/** La charge planifiée d'une journée, séances sans charge ignorées. */
export function plannedLoadOn(date: string, sessions: readonly PlannedSession[]): number {
  return sessions
    .filter((session) => session.date === date)
    .reduce((total, session) => total + (session.load ?? 0), 0)
}

/**
 * Le poids d'une journée.
 *
 * Une journée passée pèse ce qu'elle a coûté ; une journée à venir pèse ce
 * qu'on y a planifié. Le pic prime sur le total : une charge modérée peut
 * cacher un effort maximal court, qui coûte cher nerveusement sans peser
 * lourd.
 */
export function weighDay(
  day: DayRecord | undefined,
  date: string,
  sessions: readonly PlannedSession[],
  scale: LoadScale = DEFAULT_SCALE,
): DayWeight {
  if (day && day.peakSeconds >= PEAK_MIN_SECONDS) return 'chargee'

  const load = day?.observedLoad ?? plannedLoadOn(date, sessions)
  const level = levelOf(load, scale)

  if (level >= 3) return 'chargee'
  if (level === 2) return 'moyenne'
  return 'legere'
}
