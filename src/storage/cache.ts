/**
 * La dernière lecture réussie d'intervals.icu (E.21).
 *
 * Le service worker garde la coquille de l'app — le code, le style, les
 * icônes — mais aucune réponse de l'API. Sans réseau, Makigawa démarrait donc
 * pour afficher « Appel impossible » et rien d'autre. Dans un garage ou un
 * parking, c'est-à-dire là où l'on regarde son plan avant de partir, l'app ne
 * servait à rien.
 *
 * Elle garde maintenant sa dernière lecture. Un plan d'hier vaut mieux que pas
 * de plan, à condition de dire qu'il date — ce que fait l'horodatage.
 */

import type { Activity, CalendarEvent, Wellness } from '../api/intervals'

const KEY = 'makigawa.derniere-lecture'

export type CachedRead = {
  /** Quand la lecture a réussi, en millisecondes. */
  at: number
  events: CalendarEvent[]
  activities: Activity[]
  wellness: Wellness[]
}

/** Au-delà, mieux vaut l'écran d'erreur : un plan de la semaine dernière ment. */
export const CACHE_MAX_HOURS = 72

export function loadRead(now = Date.now()): CachedRead | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null

    const read = parsed as Partial<CachedRead>
    if (typeof read.at !== 'number') return null
    if (!Array.isArray(read.events) || !Array.isArray(read.activities)) return null
    if (!Array.isArray(read.wellness)) return null
    if (hoursSince(read.at, now) > CACHE_MAX_HOURS) return null

    return { at: read.at, events: read.events, activities: read.activities, wellness: read.wellness }
  } catch {
    return null
  }
}

export function saveRead(read: Omit<CachedRead, 'at'>, now = Date.now()): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ at: now, ...read }))
  } catch {
    // Le quota du navigateur peut refuser : l'app fonctionne sans mémoire,
    // elle redemandera simplement le réseau.
  }
}

export function hoursSince(at: number, now = Date.now()): number {
  return (now - at) / 3_600_000
}

/** « il y a 3 h », « hier », « il y a 2 jours ». */
export function describeAge(at: number, now = Date.now()): string {
  const hours = hoursSince(at, now)
  if (hours < 1) return 'il y a moins d’une heure'
  if (hours < 24) return `il y a ${Math.round(hours)} h`
  const days = Math.round(hours / 24)
  return days === 1 ? 'hier' : `il y a ${days} jours`
}
