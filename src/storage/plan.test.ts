import { beforeEach, describe, expect, it } from 'vitest'
import {
  forgetStalePreferences,
  hasPlanPreferences,
  loadPlanPreferences,
  postponePlan,
  refuseFamily,
  refusedKeys,
  resetPlanPreferences,
} from './plan'

/** Le même stockage minimal que pour le démenti de nuit : trois méthodes suffisent. */
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

describe('écarter une famille', () => {
  it('se pose et se retire d’un tap', () => {
    expect(refusedKeys(refuseFamily('seuil', '2026-09-07'))).toEqual(['seuil'])
    expect(refusedKeys(refuseFamily('seuil', '2026-09-07'))).toEqual([])
  })

  it('survit à une relecture', () => {
    refuseFamily('seuil', '2026-09-07')
    expect(refusedKeys(loadPlanPreferences())).toEqual(['seuil'])
  })

  it('s’oublie au bout de l’horizon du plan', () => {
    // Sans ce ménage, une famille écartée un mardi de septembre le resterait
    // en décembre sans que personne sache pourquoi.
    refuseFamily('seuil', '2026-08-01')
    refuseFamily('navette', '2026-09-06')
    expect(refusedKeys(forgetStalePreferences('2026-09-07'))).toEqual(['navette'])
  })
})

describe('repousser le plan', () => {
  it('vise le lendemain de la proposition repoussée', () => {
    expect(postponePlan('2026-09-07').notBefore).toBe('2026-09-08')
  })

  it('se répète', () => {
    // Deux taps repoussent de deux jours.
    postponePlan('2026-09-07')
    expect(postponePlan('2026-09-08').notBefore).toBe('2026-09-09')
  })

  it('tient tant que sa date est devant', () => {
    postponePlan('2026-09-07')
    expect(forgetStalePreferences('2026-09-01').notBefore).toBe('2026-09-08')
  })

  it('s’oublie quand sa date passe', () => {
    postponePlan('2026-09-07')
    expect(forgetStalePreferences('2026-09-30').notBefore).toBeNull()
  })
})

describe('revenir en arrière', () => {
  it('sait dire qu’il y a quelque chose à défaire', () => {
    expect(hasPlanPreferences(loadPlanPreferences())).toBe(false)
    expect(hasPlanPreferences(refuseFamily('seuil', '2026-09-07'))).toBe(true)
  })

  it('défait les deux d’un seul geste', () => {
    refuseFamily('seuil', '2026-09-07')
    postponePlan('2026-09-07')
    const remis = resetPlanPreferences()
    expect(hasPlanPreferences(remis)).toBe(false)
    expect(hasPlanPreferences(loadPlanPreferences())).toBe(false)
  })
})

describe('ce que le refus ne fait pas', () => {
  it('ne garde aucune trace d’une séance écartée', () => {
    // Pas de dette : ce qui est écarté ne revient pas « en retard » (E.6).
    refuseFamily('seuil', '2026-09-07')
    const stored = localStorage.getItem('makigawa.plan') ?? ''
    expect(stored).not.toContain('retard')
    expect(Object.keys(JSON.parse(stored))).toEqual(['refused', 'notBefore'])
  })

  it('repart des valeurs par défaut si le stockage est illisible', () => {
    localStorage.setItem('makigawa.plan', 'ceci n’est pas du JSON')
    expect(hasPlanPreferences(loadPlanPreferences())).toBe(false)
  })
})
