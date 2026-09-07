import { beforeEach, describe, expect, it } from 'vitest'
import { CACHE_MAX_HOURS, describeAge, loadRead, saveRead } from './cache'

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

const NOW = Date.parse('2026-09-07T09:00:00Z')
const read = { events: [], activities: [], wellness: [] }

describe('la dernière lecture', () => {
  it('se relit telle quelle', () => {
    saveRead(read, NOW)
    expect(loadRead(NOW)?.at).toBe(NOW)
  })

  it('s’oublie quand elle est trop vieille', () => {
    // Un plan de la semaine dernière ment : mieux vaut l'écran d'erreur.
    saveRead(read, NOW)
    expect(loadRead(NOW + (CACHE_MAX_HOURS - 1) * 3_600_000)).not.toBeNull()
    expect(loadRead(NOW + (CACHE_MAX_HOURS + 1) * 3_600_000)).toBeNull()
  })

  it('ne rend rien d’illisible', () => {
    localStorage.setItem('makigawa.derniere-lecture', 'pas du JSON')
    expect(loadRead(NOW)).toBeNull()

    localStorage.setItem('makigawa.derniere-lecture', JSON.stringify({ at: NOW }))
    expect(loadRead(NOW)).toBeNull()
  })

  it('dit son âge en français', () => {
    expect(describeAge(NOW, NOW + 30 * 60_000)).toBe('il y a moins d’une heure')
    expect(describeAge(NOW, NOW + 3 * 3_600_000)).toBe('il y a 3 h')
    expect(describeAge(NOW, NOW + 26 * 3_600_000)).toBe('hier')
    expect(describeAge(NOW, NOW + 50 * 3_600_000)).toBe('il y a 2 jours')
  })
})
