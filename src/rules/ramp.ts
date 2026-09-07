/**
 * La vitesse à laquelle la forme monte (section 5, E.20).
 *
 * C'est la part chirurgicale du E.19 : progresser, c'est en faire un peu plus
 * qu'avant ; se blesser, c'est en faire trop d'un coup. La différence n'est pas
 * la quantité, c'est **la vitesse**.
 *
 * Rien n'est estimé ici. La CTL d'aujourd'hui moins celle d'il y a sept jours
 * est une soustraction sur deux nombres d'intervals.icu — la même arithmétique
 * que la fraîcheur, et le projet n'en fait pas d'autre.
 */

import { shiftDayKey, type DayKey } from '../calendar/dates'
import type { Wellness } from '../api/intervals'

/**
 * Le plafond, en part de la forme actuelle.
 *
 * Le +10 % par semaine du E.5, appliqué désormais tout le temps. Un
 * pourcentage plutôt qu'un nombre fixe parce qu'il suit l'athlète : à une CTL
 * de 20 il autorise 2 points, à 45 il en autorise 4,5 — la fourchette que la
 * littérature donne pour une montée soutenable, et qui se resserre d'elle-même
 * quand la forme est basse, c'est-à-dire quand les tissus sont les moins prêts.
 */
export const RAMP_SHARE = 0.1

/** Sur combien de jours la vitesse se mesure. */
export const RAMP_DAYS = 7

/**
 * L'écart toléré entre les deux relevés, en jours.
 *
 * Le relevé du jour n'existe pas toujours encore le matin, et celui d'il y a
 * sept jours peut manquer : prendre le plus proche disponible est le bon
 * réflexe. Mais sans borne, un trou de trois semaines dans l'historique
 * donnait « six points par semaine » pour six points en vingt jours — un
 * chiffre faux, et assez haut pour bloquer la progression à tort.
 */
const RAMP_MIN_GAP = 4
const RAMP_MAX_GAP = 10

export type Ramp = {
  /** La forme d'aujourd'hui, telle qu'intervals.icu la donne. */
  fitness: number
  /** Points de forme gagnés en sept jours. Négatif quand elle redescend. */
  rate: number
  /** Ce que le plafond autorise sur la même durée. */
  cap: number
}

/** La dernière CTL connue à cette date ou avant. */
function fitnessAt(wellness: readonly Wellness[], date: DayKey): { date: DayKey; ctl: number } | null {
  const usable = wellness
    .filter((day): day is Wellness & { date: DayKey; ctl: number } =>
      day.date !== null && day.ctl !== null && day.date <= date,
    )
    .sort((a, b) => a.date.localeCompare(b.date))

  const latest = usable.at(-1)
  return latest ? { date: latest.date, ctl: latest.ctl } : null
}

/**
 * La vitesse de montée, ou `null` quand on ne peut pas la savoir.
 *
 * Il faut deux relevés distincts à sept jours d'écart. Sans eux il n'y a pas
 * de vitesse — et une donnée manquante ne se transforme jamais en
 * interdiction.
 */
export function rampOf(wellness: readonly Wellness[], today: DayKey): Ramp | null {
  const now = fitnessAt(wellness, today)
  const before = fitnessAt(wellness, shiftDayKey(today, -RAMP_DAYS))
  if (!now || !before) return null

  const gap = daysBetween(before.date, now.date)
  if (gap < RAMP_MIN_GAP || gap > RAMP_MAX_GAP) return null

  return {
    fitness: now.ctl,
    // Ramenée à sept jours : l'écart réel fait quatre à dix jours, et
    // annoncer « par semaine » un chiffre qui ne l'est pas serait mentir.
    rate: ((now.ctl - before.ctl) * RAMP_DAYS) / gap,
    cap: now.ctl * RAMP_SHARE,
  }
}

function daysBetween(from: DayKey, to: DayKey): number {
  const start = new Date(`${from}T00:00:00`).getTime()
  const end = new Date(`${to}T00:00:00`).getTime()
  return Math.round((end - start) / 86_400_000)
}

/**
 * La forme monte-t-elle déjà aussi vite que le plafond l'autorise ?
 *
 * Si oui, le plan tient son niveau au lieu de le monter d'un cran (E.16). Rien
 * n'est retiré, rien n'est réduit : la semaine ressemble à la précédente, et
 * c'est tout ce qu'il faut. On ne progresse pas en ajoutant à ce qui monte
 * déjà.
 */
export function holdsLevel(ramp: Ramp | null): boolean {
  // Un plafond nul ne retient rien : à forme nulle, le pourcentage n'a plus de
  // sens, et sans cette garde un athlète parti de zéro resterait au premier
  // échelon pour toujours.
  return ramp !== null && ramp.cap > 0 && ramp.rate >= ramp.cap
}
