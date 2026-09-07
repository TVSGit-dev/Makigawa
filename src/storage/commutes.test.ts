import { beforeEach, describe, expect, it } from 'vitest'
import { commuteOn, cycleCommute, forgetOldCommutes, loadCommutes } from './commutes'

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

describe('les jours de trajet', () => {
  it('partent du défaut tant que rien n’est marqué', () => {
    // Électrique en semaine, rien le week-end : ce que le projet relève.
    expect(commuteOn({}, '2026-09-07')).toBe('chill')
    expect(commuteOn({}, '2026-09-12')).toBe('aucun')
  })

  it('défilent d’un tap, et reviennent au point de départ', () => {
    expect(commuteOn(cycleCommute('2026-09-07'), '2026-09-07')).toBe('hard')
    expect(commuteOn(cycleCommute('2026-09-07'), '2026-09-07')).toBe('aucun')
    expect(commuteOn(cycleCommute('2026-09-07'), '2026-09-07')).toBe('chill')
  })

  it('défilent depuis le défaut du week-end aussi', () => {
    expect(commuteOn(cycleCommute('2026-09-12'), '2026-09-12')).toBe('chill')
  })

  it('survivent à une relecture', () => {
    cycleCommute('2026-09-07')
    expect(commuteOn(loadCommutes(), '2026-09-07')).toBe('hard')
  })

  it('ne retiennent qu’un mois', () => {
    cycleCommute('2026-07-01')
    cycleCommute('2026-09-07')
    expect(Object.keys(forgetOldCommutes('2026-09-08'))).toEqual(['2026-09-07'])
  })

  it('repartent du défaut si le stockage est illisible', () => {
    localStorage.setItem('makigawa.trajets', 'pas du JSON')
    expect(loadCommutes()).toEqual({})
  })
})
