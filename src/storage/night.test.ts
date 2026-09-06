import { beforeEach, describe, expect, it } from 'vitest'
import { forgetNightsBefore, intentAfterNight, loadDenials, toggleDenial } from './night'

/**
 * Un stockage minimal, plutôt qu'un DOM entier pour trois clés.
 *
 * Ce qui est éprouvé ici est la logique du module, pas l'implémentation du
 * navigateur — et le module ne se sert que de ces trois méthodes.
 */
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

describe('le démenti de nuit', () => {
  it('se pose et se retire d’un tap', () => {
    expect(loadDenials().has('2026-09-10')).toBe(false)
    expect(toggleDenial('2026-09-10').has('2026-09-10')).toBe(true)
    expect(toggleDenial('2026-09-10').has('2026-09-10')).toBe(false)
  })

  it('survit à une relecture', () => {
    toggleDenial('2026-09-10')
    expect(loadDenials().has('2026-09-10')).toBe(true)
  })

  it('oublie les nuits passées', () => {
    // Une mauvaise nuit ne concerne qu'un jour : la garder ferait peser
    // indéfiniment un ressenti d'il y a trois semaines.
    toggleDenial('2026-09-01')
    toggleDenial('2026-09-10')
    const kept = forgetNightsBefore('2026-09-10')
    expect(kept.has('2026-09-01')).toBe(false)
    expect(kept.has('2026-09-10')).toBe(true)
  })
})

describe('ce que le démenti change', () => {
  it('force le mode prudent, ni plus ni moins', () => {
    expect(intentAfterNight('ambitieux', true)).toBe('prudent')
    expect(intentAfterNight('normal', true)).toBe('prudent')
  })

  it('ne change rien quand la montre et le ressenti s’accordent', () => {
    expect(intentAfterNight('ambitieux', false)).toBe('ambitieux')
    expect(intentAfterNight('normal', false)).toBe('normal')
  })
})
