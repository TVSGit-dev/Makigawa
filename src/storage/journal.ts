/**
 * Ce que l'app a refusé, et pourquoi (section 5, E.21).
 *
 * La phase 6 consiste à *observer les règles sur des semaines réelles, et
 * corriger les bornes plutôt que le code*. Encore faut-il voir les règles
 * agir : sans trace, personne ne peut dire si la condition 2 du E.2 — retenue
 * avec réserve — bloque six séances par semaine ou aucune.
 *
 * **C'est de l'instrumentation sur l'app, jamais sur l'athlète.** Le journal
 * n'enregistre aucune séance manquée, aucun écart, aucune assiduité : rien que
 * des décisions que Makigawa a prises. La différence n'est pas cosmétique —
 * l'un se relit pour corriger un seuil, l'autre serait la dette que le projet
 * s'interdit.
 */

import { shiftDayKey, type DayKey } from '../calendar/dates'
import type { Refusal } from '../rules/decide'

const KEY = 'makigawa.journal'

/** Trente jours : de quoi couvrir deux cycles de charge. */
export const JOURNAL_DAYS = 30

export type JournalEntry = {
  /** Le jour où le refus portait. */
  date: DayKey
  /** Le code du motif, tel que le E.2 le nomme. */
  code: Refusal['code']
  /** Ce qui a été écarté — une famille de séance, ou un trajet. */
  what: string
}

export type Journal = JournalEntry[]

function read(): Journal {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((entry): entry is JournalEntry => {
      const one = entry as Partial<JournalEntry>
      return typeof one?.date === 'string' && typeof one?.code === 'string' && typeof one?.what === 'string'
    })
  } catch {
    return []
  }
}

export function loadJournal(): Journal {
  return read()
}

/**
 * Retient les refus du jour.
 *
 * Le journal est **remplacé pour la journée en cours** plutôt que complété :
 * le plan se recalcule à chaque ouverture, et empiler dix fois les mêmes refus
 * ferait croire à dix décisions là où il n'y en a qu'une.
 */
export function recordRefusals(today: DayKey, entries: readonly JournalEntry[]): Journal {
  const floor = shiftDayKey(today, -JOURNAL_DAYS)
  const kept = read().filter((entry) => entry.date >= floor && entry.date !== today)
  const journal = [...kept, ...entries.filter((entry) => entry.date === today)]

  try {
    localStorage.setItem(KEY, JSON.stringify(journal))
  } catch {
    // Rien à faire : le journal est un confort, pas une règle.
  }
  return journal
}

/** Combien de fois chaque motif a bloqué quelque chose. Le plus fréquent d'abord. */
export function countByReason(journal: Journal): { code: Refusal['code']; times: number }[] {
  const counts = new Map<Refusal['code'], number>()
  for (const entry of journal) counts.set(entry.code, (counts.get(entry.code) ?? 0) + 1)
  return [...counts.entries()]
    .map(([code, times]) => ({ code, times }))
    .sort((a, b) => b.times - a.times)
}
