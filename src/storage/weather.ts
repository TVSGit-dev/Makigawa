/**
 * La dernière prévision reçue (E.31).
 *
 * Même raison que pour `cache.ts` : l'app doit s'ouvrir dans un garage. Mais
 * une météo se périme bien plus vite qu'un plan — un plan d'hier reste vrai,
 * une prévision d'avant-hier ne l'est plus. D'où deux durées distinctes :
 *
 * - **on ne redemande pas** une prévision de moins de trois heures. Open-Meteo
 *   ne la met de toute façon à jour qu'à l'heure, et le trajet ne bouge pas.
 * - **on n'affiche plus** une prévision de plus de vingt-quatre heures. Passé
 *   ce délai, mieux vaut ne rien dire que faire choisir une veste sur un temps
 *   d'hier.
 *
 * Rien n'en part vers intervals.icu, ni vers personne.
 */

import type { WeatherHour } from '../api/weather'

const KEY = 'makigawa.meteo'

/** Au-delà, la prévision n'est plus affichée du tout. */
export const WEATHER_MAX_HOURS = 24

/** En deçà, on garde ce qu'on a plutôt que de rappeler le réseau. */
export const WEATHER_FRESH_HOURS = 3

export type CachedWeather = {
  /** Quand la prévision a été reçue, en millisecondes. */
  at: number
  hours: WeatherHour[]
}

function hoursSince(at: number, now: number): number {
  return (now - at) / 3_600_000
}

/** Une heure relue depuis le téléphone, ou rien si elle est mal formée. */
function hourFrom(value: unknown): WeatherHour | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  if (typeof record.time !== 'string') return null

  const count = (key: string): number | null => {
    const one = record[key]
    return typeof one === 'number' && Number.isFinite(one) ? one : null
  }

  return {
    time: record.time,
    celsius: count('celsius'),
    felt: count('felt'),
    rainChance: count('rainChance'),
    rain: count('rain'),
    wind: count('wind'),
    gust: count('gust'),
    code: count('code'),
  }
}

export function loadWeather(now = Date.now()): CachedWeather | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null

    const read = parsed as Partial<CachedWeather>
    if (typeof read.at !== 'number' || !Array.isArray(read.hours)) return null
    if (hoursSince(read.at, now) > WEATHER_MAX_HOURS) return null

    const hours = read.hours.flatMap((one) => {
      const hour = hourFrom(one)
      return hour ? [hour] : []
    })
    if (hours.length === 0) return null

    return { at: read.at, hours }
  } catch {
    return null
  }
}

export function saveWeather(hours: readonly WeatherHour[], now = Date.now()): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ at: now, hours }))
  } catch {
    // Le quota peut refuser : l'app redemandera simplement le réseau.
  }
}

/** Vrai quand la prévision gardée est encore assez fraîche pour s'en contenter. */
export function isFresh(cached: CachedWeather | null, now = Date.now()): boolean {
  return cached !== null && hoursSince(cached.at, now) < WEATHER_FRESH_HOURS
}
