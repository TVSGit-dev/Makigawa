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
 * une charge de 55 est modérée, pas légère.
 *
 * **Étalonnées sur des journées réelles**, relevées par l'athlète le
 * 6 septembre 2026 :
 *
 * | Journée ou séance | Charge |
 * |---|---|
 * | aller-retour en vélo électrique | 30 à 40 |
 * | séance « Chill », une heure d'intérieur | 69 |
 * | aller-retour musculaire | 110 à 120 |
 * | belle balade, une seule sortie | 140 |
 *
 * Les bornes sont placées à mi-chemin entre ces repères, ce qui laisse une
 * quinzaine de points de marge de part et d'autre. Elles restent un paramètre
 * et non une constante figée : le poids ou la LTHR changent, les charges
 * suivent.
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
  light: 20,
  moderate: 55,
  sustained: 90,
  heavy: 135,
}

/** Le seuil de pic, en battements par minute. */
export const PEAK_BPM = 175

/**
 * Le seuil de travail, en battements par minute — `T_effort` des constantes
 * athlète (E.29).
 *
 * Il figurait dans `CLAUDE.md` depuis le premier jour, venait de l'esquisse de
 * phase 2 abandonnée le 5 septembre, et n'était employé nulle part. Il sert
 * ici, et c'est le seul emploi honnête qu'on puisse lui donner : il sépare un
 * trajet électrique (~129 bpm) d'un aller-retour musculaire (~160 bpm), donc
 * il sépare bien ce qui coûte de ce qui ne coûte pas.
 */
export const EFFORT_BPM = 150

/**
 * Combien de temps au-dessus du seuil bascule une journée en chargée.
 *
 * Sans durée minimale, un unique battement suffisait, et un sprint de trente
 * secondes pour attraper un feu pesait autant qu'un effort maximal.
 */
export const PEAK_MIN_SECONDS = 120

/**
 * À partir de quel niveau une séance est dite « de qualité » (E.1).
 *
 * Une séance et une journée ne vivent pas dans la même plage : la séance
 * « Chill » pèse 69 quand un aller-retour musculaire en pèse 110 à 120. Le
 * seuil de qualité d'une **séance** est donc plus bas d'un cran que celui
 * d'une **journée chargée** — sans quoi une heure d'intérieur structurée ne
 * serait pas une séance de qualité, ce qu'elle est manifestement.
 */
export const QUALITY_LEVEL: LoadLevel = 2

/** À partir de quel niveau une **journée** est dite chargée. */
export const CHARGED_DAY_LEVEL: LoadLevel = 3

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
 * Deux choses n'en sont jamais. Une séance dont la charge est inconnue — on ne
 * suppose pas ce qu'on ne sait pas. Et **un trajet**, quelle que soit sa
 * charge : c'est la règle critique du projet, et sa charge continue de peser
 * la journée sans faire de lui de l'entraînement.
 */
export function isQuality(session: PlannedSession, scale: LoadScale = DEFAULT_SCALE): boolean {
  if (session.commute) return false
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

  if (level >= CHARGED_DAY_LEVEL) return 'chargee'
  if (level === CHARGED_DAY_LEVEL - 1) return 'moyenne'
  return 'legere'
}
