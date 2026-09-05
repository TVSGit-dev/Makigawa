/**
 * Identifiants intervals.icu, saisis une fois sur le téléphone.
 *
 * Ils ne sont jamais commités ni inclus dans le bundle : ils vivent
 * uniquement dans le stockage local de cet appareil.
 */
export type Credentials = {
  athleteId: string
  apiKey: string
}

const STORAGE_KEY = 'makigawa.credentials'

export function loadCredentials(): Credentials | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const { athleteId, apiKey } = parsed as Partial<Credentials>
    if (typeof athleteId !== 'string' || typeof apiKey !== 'string') return null
    return { athleteId, apiKey }
  } catch {
    // Navigation privée ou stockage bloqué : on repart d'un formulaire vide.
    return null
  }
}

export function saveCredentials(credentials: Credentials): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials))
    return true
  } catch {
    return false
  }
}

export function clearCredentials(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Rien à faire : le stockage est déjà inaccessible.
  }
}
