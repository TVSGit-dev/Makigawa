import { beforeEach, describe, expect, it } from 'vitest'
import { countByReason, loadJournal, recordRefusals, type JournalEntry } from './journal'

const store = new Map<string, string>()
globalThis.localStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => void store.set(key, value),
  removeItem: (key: string) => void store.delete(key),
  clear: () => store.clear(),
  key: (index: number) => [...store.keys()][index] ?? null,
  get length() {
    return store.size
  },
} as Storage

beforeEach(() => localStorage.clear())

const entry = (over: Partial<JournalEntry> = {}): JournalEntry => ({
  date: '2026-09-07',
  code: 'deux-jours-charges',
  what: 'Sweet spot',
  ...over,
})

describe('le journal des refus', () => {
  it('retient ce qui a été écarté, et pourquoi', () => {
    recordRefusals('2026-09-07', [entry()])
    expect(loadJournal()).toHaveLength(1)
    expect(loadJournal()[0]?.code).toBe('deux-jours-charges')
  })

  it('remplace la journée plutôt que de l’empiler', () => {
    // Le plan se recalcule à chaque ouverture : empiler ferait croire à dix
    // décisions là où il n'y en a qu'une.
    recordRefusals('2026-09-07', [entry(), entry({ what: 'Seuil' })])
    recordRefusals('2026-09-07', [entry()])
    expect(loadJournal()).toHaveLength(1)
  })

  it('garde les journées précédentes', () => {
    recordRefusals('2026-09-06', [entry({ date: '2026-09-06' })])
    recordRefusals('2026-09-07', [entry()])
    expect(loadJournal().map((one) => one.date)).toEqual(['2026-09-06', '2026-09-07'])
  })

  it('oublie au bout d’un mois', () => {
    recordRefusals('2026-07-01', [entry({ date: '2026-07-01' })])
    recordRefusals('2026-09-07', [entry()])
    expect(loadJournal().map((one) => one.date)).toEqual(['2026-09-07'])
  })

  it('compte les motifs, le plus fréquent d’abord', () => {
    const journal = [
      entry({ code: 'deux-jours-charges' }),
      entry({ code: 'deux-jours-charges' }),
      entry({ code: 'veille-chargee' }),
    ]
    expect(countByReason(journal)).toEqual([
      { code: 'deux-jours-charges', times: 2 },
      { code: 'veille-chargee', times: 1 },
    ])
  })

  it('n’enregistre rien qui ressemble à une séance manquée', () => {
    // C'est de l'instrumentation sur l'app, jamais sur l'athlète.
    recordRefusals('2026-09-07', [entry()])
    const stored = localStorage.getItem('makigawa.journal') ?? ''
    expect(Object.keys(JSON.parse(stored)[0])).toEqual(['date', 'code', 'what'])
  })

  it('repart de zéro si le stockage est illisible', () => {
    localStorage.setItem('makigawa.journal', 'pas du JSON')
    expect(loadJournal()).toEqual([])
  })
})
