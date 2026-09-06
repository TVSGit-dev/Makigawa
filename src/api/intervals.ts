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

/**
 * Une activité **réalisée**, telle qu'elle est remontée par Garmin ou Zwift.
 *
 * Aucune donnée de puissance n'est lue ici, et c'est délibéré : la règle
 * critique de `CLAUDE.md` exclut la puissance des `EBikeRide` **par principe,
 * jamais par nom de champ**. Ne rien lire est la seule façon de ne pas laisser
 * passer un champ à venir. Ce dont les règles ont besoin — la charge et le
 * type — n'en dépend pas.
 */
export type Activity = {
  id: string | null
  name: string | null
  /** Ride, VirtualRide, EBikeRide, WeightTraining… */
  type: string | null
  startDateLocal: string | null
  /** Charge, telle que calculée par intervals.icu. Jamais recalculée ici. */
  trainingLoad: number | null
  raw: Record<string, unknown>
}

/**
 * Une journée de « bien-être » : ce qu'intervals.icu tient jour par jour.
 *
 * `ctl` et `atl` sont la forme et la fatigue **calculées par intervals.icu**.
 * Le projet ne les recalcule jamais ; il en déduit seulement la fraîcheur,
 * qui est leur simple différence.
 */
export type Wellness = {
  date: string | null
  /** Forme — Chronic Training Load. */
  ctl: number | null
  /** Fatigue — Acute Training Load. */
  atl: number | null
  /** Score de sommeil de la montre, quand elle en donne un. */
  sleepScore: number | null
  /** Durée de sommeil, en secondes. */
  sleepSeconds: number | null
  raw: Record<string, unknown>
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

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  /** Sérialisé en JSON. Sa présence ajoute l'en-tête `Content-Type`. */
  body?: unknown
}

async function request<T>(
  path: string,
  { athleteId, apiKey }: Credentials,
  { method = 'GET', body }: RequestOptions = {},
): Promise<ApiOutcome<T>> {
  const headers: Record<string, string> = { Authorization: authorization(apiKey) }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(`${API_BASE}/athlete/${encodeURIComponent(athleteId)}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
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

  const raw = await response.text().catch(() => '')
  // Une suppression réussie ne renvoie rien : corps vide vaut succès, pas
  // réponse illisible.
  if (raw.trim() === '') return { kind: 'ok', data: null as T }

  try {
    return { kind: 'ok', data: JSON.parse(raw) as T }
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

/**
 * Écriture dans le calendrier.
 *
 * Makigawa décide du **quand** et du **si** : elle décale, dégrade ou
 * abandonne des séances créées dans intervals.icu. Ces trois fonctions sont
 * donc son seul pouvoir d'action, et la charge utile reste volontairement
 * ouverte — le vocabulaire de l'API se constate, il ne se devine pas.
 */
export async function createEvent(
  credentials: Credentials,
  event: Record<string, unknown>,
): Promise<ApiOutcome<CalendarEvent | null>> {
  const outcome = await request<unknown>('/events', credentials, { method: 'POST', body: event })
  if (outcome.kind !== 'ok') return outcome
  const record = asRecord(outcome.data)
  return { kind: 'ok', data: record ? toCalendarEvent(record) : null }
}

export async function updateEvent(
  credentials: Credentials,
  eventId: string,
  changes: Record<string, unknown>,
): Promise<ApiOutcome<CalendarEvent | null>> {
  const outcome = await request<unknown>(`/events/${encodeURIComponent(eventId)}`, credentials, {
    method: 'PUT',
    body: changes,
  })
  if (outcome.kind !== 'ok') return outcome
  const record = asRecord(outcome.data)
  return { kind: 'ok', data: record ? toCalendarEvent(record) : null }
}

export async function deleteEvent(
  credentials: Credentials,
  eventId: string,
): Promise<ApiOutcome<null>> {
  return request<null>(`/events/${encodeURIComponent(eventId)}`, credentials, { method: 'DELETE' })
}

function toActivity(raw: Record<string, unknown>): Activity {
  return {
    id: text(raw.id),
    name: text(raw.name),
    type: text(raw.type),
    startDateLocal: text(raw.start_date_local),
    trainingLoad: count(raw.icu_training_load),
    raw,
  }
}

function toWellness(raw: Record<string, unknown>): Wellness {
  return {
    date: text(raw.id) ?? text(raw.date),
    ctl: count(raw.ctl),
    atl: count(raw.atl),
    sleepScore: count(raw.sleepScore),
    sleepSeconds: count(raw.sleepSecs),
    raw,
  }
}

/** Un tableau d'objets, ou l'échec tel quel. Le reste est une réponse illisible. */
async function fetchList<T>(
  path: string,
  credentials: Credentials,
  map: (raw: Record<string, unknown>) => T,
  expected: string,
): Promise<ApiOutcome<T[]>> {
  const outcome = await request<unknown>(path, credentials)
  if (outcome.kind !== 'ok') return outcome

  if (!Array.isArray(outcome.data)) {
    return { kind: 'httpError', status: 200, detail: `Réponse inattendue : ${expected}.` }
  }

  return {
    kind: 'ok',
    data: outcome.data
      .map(asRecord)
      .filter((record): record is Record<string, unknown> => record !== null)
      .map(map),
  }
}

/** Les activités réalisées sur une fenêtre de jours. */
export async function fetchActivities(
  credentials: Credentials,
  from: Date,
  to: Date,
): Promise<ApiOutcome<Activity[]>> {
  const query = `?oldest=${isoDate(from)}&newest=${isoDate(to)}`
  return fetchList(`/activities${query}`, credentials, toActivity, 'un tableau d’activités')
}

/**
 * Forme, fatigue et sommeil, jour par jour.
 *
 * C'est ici que l'app apprend la fraîcheur du jour, dont dépend une des
 * quatre conditions du E.2. Elle la lit, elle ne la calcule pas.
 */
export async function fetchWellness(
  credentials: Credentials,
  from: Date,
  to: Date,
): Promise<ApiOutcome<Wellness[]>> {
  const query = `?oldest=${isoDate(from)}&newest=${isoDate(to)}`
  return fetchList(`/wellness${query}`, credentials, toWellness, 'un tableau de journées')
}

/** Fenêtre courte : on veut valider l'accès, pas rapatrier l'historique. */
export async function fetchRecentActivities(
  credentials: Credentials,
  days = 7,
): Promise<ApiOutcome<Activity[]>> {
  const newest = new Date()
  const oldest = new Date()
  oldest.setDate(oldest.getDate() - days)
  return fetchActivities(credentials, oldest, newest)
}
