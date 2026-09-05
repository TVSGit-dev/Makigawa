import type { Credentials } from '../storage/credentials'

const API_BASE = 'https://intervals.icu/api/v1'

/**
 * Résultat d'un appel, volontairement exhaustif : tant que la politique CORS
 * d'intervals.icu n'est pas confirmée depuis un vrai navigateur, on doit
 * pouvoir distinguer « clé refusée » de « navigateur bloqué ». Les deux se
 * ressemblent à l'usage, mais appellent des corrections opposées.
 */
export type ApiOutcome<T> =
  | { kind: 'ok'; data: T }
  | { kind: 'unauthorized' }
  | { kind: 'httpError'; status: number; detail: string }
  | { kind: 'blocked'; detail: string }

export type Activity = {
  id: string
  name: string | null
  type: string | null
  start_date_local: string | null
}

/** intervals.icu attend une authentification Basic dont l'identifiant est le littéral API_KEY. */
function authorization(apiKey: string): string {
  return `Basic ${btoa(`API_KEY:${apiKey}`)}`
}

function isoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

async function request<T>(path: string, { athleteId, apiKey }: Credentials): Promise<ApiOutcome<T>> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}/athlete/${encodeURIComponent(athleteId)}${path}`, {
      headers: { Authorization: authorization(apiKey) },
    })
  } catch (error) {
    // fetch ne rejette que sur erreur réseau ou refus CORS : dans les deux cas
    // aucune réponse n'est lisible, et le navigateur n'en dit pas plus.
    return {
      kind: 'blocked',
      detail: error instanceof Error ? error.message : 'Requête impossible',
    }
  }

  if (response.status === 401 || response.status === 403) return { kind: 'unauthorized' }

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    return { kind: 'httpError', status: response.status, detail: detail.slice(0, 200) }
  }

  try {
    return { kind: 'ok', data: (await response.json()) as T }
  } catch {
    return { kind: 'httpError', status: response.status, detail: 'Réponse illisible (JSON attendu)' }
  }
}

/**
 * Un événement du calendrier : une séance **planifiée**, pas une activité
 * réalisée.
 *
 * Les champs nommés ici sont une hypothèse de départ. La façon dont l'API
 * représente une séance planifiée restait à constater — d'où `raw`, qui
 * conserve la réponse entière tant que ce n'est pas fait. Un champ absent
 * vaut `null`, jamais une exception : on lit sans savoir.
 */
export type CalendarEvent = {
  id: string | null
  /** Date locale, `2026-09-08` ou `2026-09-08T00:00:00` selon l'API. */
  startDateLocal: string | null
  name: string | null
  description: string | null
  /** Vocabulaire d'intervals.icu : WORKOUT, NOTE, RACE_A… */
  category: string | null
  /** Ride, VirtualRide, WeightTraining… */
  type: string | null
  /** Durée planifiée, en secondes. */
  movingTime: number | null
  /** Charge planifiée, telle que calculée par intervals.icu. */
  trainingLoad: number | null
  /** La réponse brute, pour constater la forme réelle. */
  raw: Record<string, unknown>
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

/** Une chaîne non vide, ou un nombre rendu lisible. Sinon `null`. */
function text(value: unknown): string | null {
  if (typeof value === 'string') return value.trim() === '' ? null : value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return null
}

function count(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function toCalendarEvent(raw: Record<string, unknown>): CalendarEvent {
  return {
    id: text(raw.id),
    startDateLocal: text(raw.start_date_local),
    name: text(raw.name),
    description: text(raw.description),
    category: text(raw.category),
    type: text(raw.type),
    movingTime: count(raw.moving_time),
    trainingLoad: count(raw.icu_training_load),
    raw,
  }
}

/**
 * Le calendrier sur une fenêtre de jours. Lecture seule : Makigawa décide du
 * moment d'une séance, jamais de son contenu, qui se crée dans intervals.icu.
 */
export async function fetchCalendarEvents(
  credentials: Credentials,
  from: Date,
  to: Date,
): Promise<ApiOutcome<CalendarEvent[]>> {
  const query = `?oldest=${isoDate(from)}&newest=${isoDate(to)}`
  const outcome = await request<unknown>(`/events${query}`, credentials)
  if (outcome.kind !== 'ok') return outcome

  if (!Array.isArray(outcome.data)) {
    return {
      kind: 'httpError',
      status: 200,
      detail: 'Réponse inattendue : un tableau d’événements était attendu.',
    }
  }

  const records = outcome.data
    .map(asRecord)
    .filter((record): record is Record<string, unknown> => record !== null)

  return { kind: 'ok', data: records.map(toCalendarEvent) }
}

/** Fenêtre courte : on veut valider l'accès, pas rapatrier l'historique. */
export async function fetchRecentActivities(
  credentials: Credentials,
  days = 7,
): Promise<ApiOutcome<Activity[]>> {
  const newest = new Date()
  const oldest = new Date()
  oldest.setDate(oldest.getDate() - days)
  const query = `?oldest=${isoDate(oldest)}&newest=${isoDate(newest)}`
  return request<Activity[]>(`/activities${query}`, credentials)
}
