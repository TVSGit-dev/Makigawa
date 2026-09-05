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
