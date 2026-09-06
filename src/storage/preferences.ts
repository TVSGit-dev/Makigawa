/**
 * Ce que l'app retient d'une visite à l'autre, sur ce téléphone seulement.
 *
 * Deux choses : l'intention choisie semaine par semaine, et les propositions
 * que l'athlète a déjà écartées. La seconde existe pour une raison de fond —
 * une app qui repose la même question chaque matin est une app qui insiste,
 * et l'insistance est exactement ce que les contraintes d'interface
 * interdisent.
 */

import type { Intent } from '../rules/intent'
import type { DayKey } from '../calendar/dates'

const INTENTS_KEY = 'makigawa.intents'
const DISMISSED_KEY = 'makigawa.dismissed'

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

/* ---------- les propositions écartées ---------- */

/**
 * L'empreinte d'une proposition : la séance, ce qui lui est proposé, et le
 * jour où on le lui propose.
 *
 * Écarter une proposition ne l'écarte que telle quelle. Si le moteur change
 * d'avis demain — parce que la semaine a changé — la nouvelle proposition a
 * une autre empreinte, et elle est posée à nouveau. C'est voulu : ce qui est
 * refusé, c'est cette proposition-là, pas toute question à venir.
 */
export function fingerprint(eventId: string, action: string, today: DayKey): string {
  return `${eventId}|${action}|${today}`
}

export function loadDismissed(): Set<string> {
  const stored = read<Record<string, unknown>>(DISMISSED_KEY, {})
  return new Set(Object.keys(stored))
}

export function dismiss(mark: string): Set<string> {
  const marks = loadDismissed()
  marks.add(mark)
  write(DISMISSED_KEY, Object.fromEntries([...marks].map((key) => [key, true])))
  return marks
}

/**
 * Oublie les empreintes qui ne concernent plus aujourd'hui. Sans ce ménage,
 * le stockage grossirait d'une entrée par proposition écartée, à vie.
 */
export function forgetOlderThan(today: DayKey): Set<string> {
  const kept = [...loadDismissed()].filter((mark) => (mark.split('|')[2] ?? '') >= today)
  write(DISMISSED_KEY, Object.fromEntries(kept.map((key) => [key, true])))
  return new Set(kept)
}
