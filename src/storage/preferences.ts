/**
 * Ce que l'app retient d'une visite à l'autre, sur ce téléphone seulement.
 *
 * L'intention choisie semaine par semaine, et rien d'autre.
 *
 * Les propositions écartées vivaient ici aussi. Elles servaient à ne pas
 * reposer la même question chaque matin quand l'app proposait de déplacer une
 * séance — depuis le E.19 elle n'en déplace plus aucune, donc il n'y a plus
 * rien à écarter.
 */

import type { Intent } from '../rules/intent'
import type { DayKey } from '../calendar/dates'

const INTENTS_KEY = 'makigawa.intents'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return fallback
    return parsed as T
  } catch {
    // Navigation privée ou stockage bloqué : on repart des valeurs par défaut.
    return fallback
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Rien à faire : l'app fonctionne sans mémoire, elle oublie simplement.
  }
}

/* ---------- l'intention, semaine par semaine ---------- */

const VALID: readonly Intent[] = ['prudent', 'normal', 'ambitieux']

function isIntent(value: unknown): value is Intent {
  return typeof value === 'string' && (VALID as readonly string[]).includes(value)
}

/** Les intentions retenues, du lundi le plus ancien au plus récent. */
export function loadIntents(): Record<DayKey, Intent> {
  const stored = read<Record<string, unknown>>(INTENTS_KEY, {})
  const clean: Record<DayKey, Intent> = {}
  for (const [week, intent] of Object.entries(stored)) {
    if (isIntent(intent)) clean[week] = intent
  }
  return clean
}

export function saveIntent(week: DayKey, intent: Intent): Record<DayKey, Intent> {
  const intents = { ...loadIntents(), [week]: intent }
  write(INTENTS_KEY, intents)
  return intents
}

/**
 * Les intentions des semaines précédant `week`, de la plus ancienne à la plus
 * récente — la forme qu'attend `allowedIntent`, qui borne le mode ambitieux
 * à deux semaines d'affilée.
 */
export function weeksBefore(intents: Record<DayKey, Intent>, week: DayKey): Intent[] {
  return Object.keys(intents)
    .filter((key) => key < week)
    .sort()
    .map((key) => intents[key])
    .filter((intent): intent is Intent => intent !== undefined)
}
