/**
 * La météo du trajet (section 5, E.31).
 *
 * **Le second tiers du projet, et le seul qui passe ses règles.** Jusqu'ici
 * l'app ne parlait qu'à intervals.icu. Open-Meteo est retenu pour une raison
 * qui élimine tout le reste : il ne demande **aucune clé**. Une clé météo dans
 * le bundle serait exactement ce que la section Sécurité interdit, et une app
 * sans serveur n'a nulle part où la cacher.
 *
 * Rien de personnel ne part : des coordonnées et des dates. Pas d'identifiant,
 * pas de clé intervals.icu, aucune activité. Et les coordonnées sont **fixes** —
 * le trajet ne bouge pas, donc demander la position du téléphone ajouterait une
 * permission pour un renseignement qu'on a déjà.
 */

/** Le même vocabulaire de résultat que pour intervals.icu. */
export type WeatherOutcome<T> =
  | { kind: 'ok'; data: T }
  | { kind: 'httpError'; status: number; detail: string }
  | { kind: 'blocked'; detail: string }

const API = 'https://api.open-meteo.com/v1/forecast'

/**
 * Le trajet Stockel — Wavre, pris en son milieu.
 *
 * Dix-sept kilomètres : à cette échelle, un seul point suffit. Deux appels pour
 * les deux extrémités donneraient le même temps à un dixième de degré près, et
 * doubleraient le réseau pour rien.
 */
export const COMMUTE_PLACE = { latitude: 50.78, longitude: 4.54 } as const

/** Le fuseau dans lequel les heures de trajet ont un sens. */
const TIMEZONE = 'Europe/Brussels'

/**
 * Sur combien de jours la prévision vaut d'être affichée.
 *
 * Le plan couvre quatorze jours, la météo n'en couvre que sept. Au-delà, une
 * prévision ne dit plus rien d'utilisable pour choisir une veste, et l'afficher
 * donnerait à une supposition l'apparence d'un renseignement.
 */
export const WEATHER_DAYS = 7

/** Une heure de prévision, telle qu'Open-Meteo la rend. */
export type WeatherHour = {
  /** « 2026-09-09T08:00 », heure locale du fuseau demandé. */
  time: string
  /** La température de l'air, en °C. */
  celsius: number | null
  /**
   * La température **ressentie**, en °C.
   *
   * Lue chez le fournisseur, jamais recalculée : elle intègre déjà le vent et
   * l'humidité, et la refaire ici serait la refaire moins bien.
   */
  felt: number | null
  /** Probabilité de précipitation, en pourcentage. */
  rainChance: number | null
  /** Précipitation cumulée sur l'heure, en mm. */
  rain: number | null
  /** Vent moyen et rafale, en km/h. */
  wind: number | null
  gust: number | null
  /** Le code WMO, tel quel. Sa lecture appartient à `src/rules/dress.ts`. */
  code: number | null
}

function count(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function column(raw: Record<string, unknown>, key: string): unknown[] {
  const value = raw[key]
  return Array.isArray(value) ? value : []
}

/**
 * Les heures de la prévision, remises en lignes.
 *
 * Open-Meteo répond en colonnes parallèles — un tableau par variable, tous de
 * la même longueur. On les recoud une fois ici pour que le reste de l'app
 * manipule des heures et non des index.
 */
function toHours(payload: unknown): WeatherHour[] {
  if (typeof payload !== 'object' || payload === null) return []
  const hourly = (payload as Record<string, unknown>).hourly
  if (typeof hourly !== 'object' || hourly === null) return []

  const raw = hourly as Record<string, unknown>
  const times = column(raw, 'time')

  return times.flatMap((time, index) => {
    if (typeof time !== 'string') return []
    return [
      {
        time,
        celsius: count(column(raw, 'temperature_2m')[index]),
        felt: count(column(raw, 'apparent_temperature')[index]),
        rainChance: count(column(raw, 'precipitation_probability')[index]),
        rain: count(column(raw, 'precipitation')[index]),
        wind: count(column(raw, 'wind_speed_10m')[index]),
        gust: count(column(raw, 'wind_gusts_10m')[index]),
        code: count(column(raw, 'weather_code')[index]),
      },
    ]
  })
}

const VARIABLES = [
  'temperature_2m',
  'apparent_temperature',
  'precipitation_probability',
  'precipitation',
  'wind_speed_10m',
  'wind_gusts_10m',
  'weather_code',
].join(',')

/**
 * La prévision horaire du trajet, sur les jours qui valent la peine.
 *
 * Un échec ne bloque rien : sans météo, l'app affiche le plan comme avant.
 * C'est la même prudence que partout — une donnée manquante n'est jamais une
 * interdiction.
 */
export async function fetchWeather(
  days: number = WEATHER_DAYS,
  place: { latitude: number; longitude: number } = COMMUTE_PLACE,
): Promise<WeatherOutcome<WeatherHour[]>> {
  const query = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    hourly: VARIABLES,
    timezone: TIMEZONE,
    forecast_days: String(Math.max(1, Math.min(16, days))),
  })

  let response: Response
  try {
    response = await fetch(`${API}?${query.toString()}`)
  } catch (error) {
    return { kind: 'blocked', detail: error instanceof Error ? error.message : String(error) }
  }

  if (!response.ok) {
    return {
      kind: 'httpError',
      status: response.status,
      detail: `Open-Meteo a répondu ${response.status}.`,
    }
  }

  try {
    return { kind: 'ok', data: toHours(await response.json()) }
  } catch {
    return { kind: 'httpError', status: 200, detail: 'Réponse illisible.' }
  }
}
