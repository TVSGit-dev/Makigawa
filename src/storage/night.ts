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
 * **Le démenti n'est jamais envoyé à intervals.icu.** Il vit dans le
 * téléphone : c'est un ressenti, pas une mesure, et le calendrier n'a pas à en
 * porter la trace.
 */

import type { DayKey } from '../calendar/dates'
import type { Intent } from '../rules/intent'

const KEY = 'makigawa.nuits'

/** Les jours dont l'athlète a démenti le score. */
export function loadDenials(): Set<DayKey> {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return new Set()
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? new Set(parsed.filter((day) => typeof day === 'string')) : new Set()
  } catch {
    return new Set()
  }
}

function save(days: Set<DayKey>): Set<DayKey> {
  try {
    localStorage.setItem(KEY, JSON.stringify([...days]))
  } catch {
    // Rien à faire : l'app fonctionne sans mémoire, elle oublie simplement.
  }
  return days
}

/** Un tap le pose, un autre le retire. Une mauvaise nuit se corrige. */
export function toggleDenial(day: DayKey): Set<DayKey> {
  const days = loadDenials()
  if (days.has(day)) days.delete(day)
  else days.add(day)
  return save(days)
}

/**
 * Oublie les démentis passés.
 *
 * Une mauvaise nuit ne concerne qu'un jour : la garder au-delà ferait peser
 * indéfiniment un ressenti d'il y a trois semaines.
 */
export function forgetNightsBefore(today: DayKey): Set<DayKey> {
  return save(new Set([...loadDenials()].filter((day) => day >= today)))
}

/**
 * Le mode réellement appliqué aujourd'hui.
 *
 * Un démenti force **prudent**, ni plus ni moins : plancher de fraîcheur à
 * −10, une seule séance de qualité, une seule journée chargée. C'est un effet
 * borné, réversible d'un tap, et qui ne touche qu'aujourd'hui — une mauvaise
 * nuit ne condamne pas la semaine.
 */
export function intentAfterNight(intent: Intent, denied: boolean): Intent {
  return denied ? 'prudent' : intent
}
