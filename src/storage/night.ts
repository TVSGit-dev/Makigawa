/**
 * Le démenti de nuit (section 5, E.12).
 *
 * intervals.icu reçoit déjà les données de sommeil de la montre. L'app affiche
 * ce que la montre a mesuré, et un seul tap la contredit.
 *
 * Un score de sommeil compte des durées et des phases : se lever deux fois
 * pour un enfant coûte quelques minutes sur chaque compteur, donc le score
 * reste bon — et la nuit a pourtant été hachée. Les deux mesurent des choses
 * différentes, et aucune n'a tort. Mais pour l'entraînement c'est le ressenti
 * qui porte le signal, et il précède souvent les chiffres.
 *
 * **Deux crans depuis le 20 septembre 2026.** Prudent est le mode le plus doux
 * qui existe : sur une semaine déjà réglée dessus, le démenti n'avait plus rien
 * à serrer, et aucun moyen de dire « celle-là était pire ». Le cran `atroce`
 * ferme en plus l'intensité du jour.
 *
 * **Le démenti n'est jamais envoyé à intervals.icu.** Il vit dans le
 * téléphone : c'est un ressenti, pas une mesure, et le calendrier n'a pas à en
 * porter la trace.
 */

import type { DayKey } from '../calendar/dates'
import type { Intent } from '../rules/intent'

const KEY = 'makigawa.nuits'

/**
 * Ce que l'athlète dit de sa nuit.
 *
 * Il n'y a pas de troisième cran, et il n'y en aura pas : le plancher du
 * plancher est « pas d'intensité aujourd'hui », jamais « ne bouge pas ».
 */
export type NightKind = 'mauvaise' | 'atroce'

/** Les nuits démenties, avec leur cran. */
export type Nights = Record<DayKey, NightKind>

function isKind(value: unknown): value is NightKind {
  return value === 'mauvaise' || value === 'atroce'
}

/**
 * Ce que le téléphone contient, quel que soit le format qui l'a écrit.
 *
 * **L'ancien format était un tableau de dates**, du temps où il n'y avait qu'un
 * cran. Les téléphones qui le portent encore le relisent ici comme autant de
 * nuits `mauvaise` : c'est ce qu'elles voulaient dire, et personne ne perd son
 * démenti au passage.
 */
export function loadNights(): Nights {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)

    if (Array.isArray(parsed)) {
      const migrated: Nights = {}
      for (const day of parsed) if (typeof day === 'string') migrated[day] = 'mauvaise'
      return migrated
    }

    if (typeof parsed !== 'object' || parsed === null) return {}

    const clean: Nights = {}
    for (const [day, kind] of Object.entries(parsed)) if (isKind(kind)) clean[day] = kind
    return clean
  } catch {
    return {}
  }
}

function save(nights: Nights): Nights {
  try {
    localStorage.setItem(KEY, JSON.stringify(nights))
  } catch {
    // Rien à faire : l'app fonctionne sans mémoire, elle oublie simplement.
  }
  return nights
}

/**
 * Pose le cran du jour, ou l'efface avec `null`.
 *
 * Un tap atteint n'importe quel état, retour compris : c'est ce que le curseur
 * à trois cases demande, et une mauvaise nuit se corrige.
 */
export function setNight(day: DayKey, kind: NightKind | null): Nights {
  const nights = { ...loadNights() }
  if (kind === null) delete nights[day]
  else nights[day] = kind
  return save(nights)
}

/** Ce que l'athlète a dit de cette nuit-là, ou `null` s'il n'a rien dit. */
export function nightOn(nights: Nights, day: DayKey): NightKind | null {
  return nights[day] ?? null
}

/**
 * Oublie les nuits passées.
 *
 * Une mauvaise nuit ne concerne qu'un jour : la garder au-delà ferait peser
 * indéfiniment un ressenti d'il y a trois semaines.
 */
export function forgetNightsBefore(today: DayKey): Nights {
  const kept: Nights = {}
  for (const [day, kind] of Object.entries(loadNights())) if (day >= today) kept[day] = kind
  return save(kept)
}

/**
 * Le mode réellement appliqué aujourd'hui.
 *
 * Les deux crans forcent **prudent**, ni plus ni moins : plancher de fraîcheur
 * à −10, une seule séance de qualité, une seule journée chargée. C'est un effet
 * borné, réversible d'un tap, et qui ne touche qu'aujourd'hui — une mauvaise
 * nuit ne condamne pas la semaine.
 *
 * Ce qui sépare les deux crans ne se joue pas ici mais dans le E.2 : `atroce`
 * ferme en plus l'intensité du jour, et cette condition-là est posée sur la
 * date. Le mode, lui, est le même — il n'existe rien en dessous de prudent.
 */
export function intentAfterNight(intent: Intent, night: NightKind | null): Intent {
  return night === null ? intent : 'prudent'
}

/**
 * Le jour dont l'intensité est fermée par une nuit atroce, s'il y en a un.
 *
 * C'est une **date**, pas un drapeau, et c'est toute la différence avec la
 * variabilité basse du E.30 : celle-ci vaut pour l'horizon entier, une nuit ne
 * concerne qu'un jour. Effacer l'intensité de la quinzaine sur la foi d'une
 * seule nuit serait exactement ce que le E.12 s'interdit.
 */
export function closedDayOf(nights: Nights, today: DayKey): DayKey | null {
  return nightOn(nights, today) === 'atroce' ? today : null
}
