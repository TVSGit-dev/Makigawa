import { beforeEach, describe, expect, it } from 'vitest'
import {
  closedDayOf,
  forgetNightsBefore,
  intentAfterNight,
  loadNights,
  nightOn,
  setNight,
} from './night'

/**
 * Un stockage minimal, plutôt qu'un DOM entier pour une clé.
 *
 * Ce qui est éprouvé ici est la logique du module, pas l'implémentation du
 * navigateur — et le module ne se sert que de ces méthodes.
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

describe('les deux crans de nuit', () => {
  it('se posent et s’effacent d’un tap', () => {
    expect(nightOn(loadNights(), '2026-09-20')).toBeNull()
    expect(nightOn(setNight('2026-09-20', 'mauvaise'), '2026-09-20')).toBe('mauvaise')
    expect(nightOn(setNight('2026-09-20', 'atroce'), '2026-09-20')).toBe('atroce')
    expect(nightOn(setNight('2026-09-20', null), '2026-09-20')).toBeNull()
  })

  it('passent d’un cran à l’autre sans repasser par zéro', () => {
    // Trois cases, pas un bouton qui tourne : la troisième est justement celle
    // des mauvais matins, elle ne doit pas coûter deux taps.
    setNight('2026-09-20', 'mauvaise')
    expect(nightOn(setNight('2026-09-20', 'atroce'), '2026-09-20')).toBe('atroce')
  })

  it('survivent à une relecture', () => {
    setNight('2026-09-20', 'atroce')
    expect(nightOn(loadNights(), '2026-09-20')).toBe('atroce')
  })

  it('oublient les nuits passées', () => {
    // Une mauvaise nuit ne concerne qu'un jour : la garder ferait peser
    // indéfiniment un ressenti d'il y a trois semaines.
    setNight('2026-09-01', 'atroce')
    setNight('2026-09-20', 'mauvaise')
    const kept = forgetNightsBefore('2026-09-20')
    expect(nightOn(kept, '2026-09-01')).toBeNull()
    expect(nightOn(kept, '2026-09-20')).toBe('mauvaise')
  })

  it('ignorent ce qui n’est pas un cran connu', () => {
    localStorage.setItem('makigawa.nuits', JSON.stringify({ '2026-09-20': 'épouvantable' }))
    expect(nightOn(loadNights(), '2026-09-20')).toBeNull()
  })

  it('ne cassent pas sur du JSON invalide', () => {
    localStorage.setItem('makigawa.nuits', 'pas du JSON')
    expect(loadNights()).toEqual({})
  })
})

describe('les téléphones qui portent l’ancien format', () => {
  it('relisent un tableau de dates comme autant de nuits mauvaises', () => {
    // Avant le 20 septembre 2026 il n'y avait qu'un cran, et il s'écrivait en
    // tableau. Personne ne doit perdre son démenti au passage.
    localStorage.setItem('makigawa.nuits', JSON.stringify(['2026-09-20', '2026-09-21']))
    expect(nightOn(loadNights(), '2026-09-20')).toBe('mauvaise')
    expect(nightOn(loadNights(), '2026-09-21')).toBe('mauvaise')
  })

  it('réécrivent au nouveau format dès qu’on y touche', () => {
    localStorage.setItem('makigawa.nuits', JSON.stringify(['2026-09-20']))
    setNight('2026-09-21', 'atroce')
    const raw = localStorage.getItem('makigawa.nuits') ?? ''
    expect(raw).toContain('mauvaise')
    expect(raw).toContain('atroce')
    expect(JSON.parse(raw)).not.toBeInstanceOf(Array)
  })
})

describe('ce que chaque cran change', () => {
  it('force le mode prudent, des deux côtés', () => {
    for (const cran of ['mauvaise', 'atroce'] as const) {
      expect(intentAfterNight('ambitieux', cran), cran).toBe('prudent')
      expect(intentAfterNight('normal', cran), cran).toBe('prudent')
    }
  })

  it('ne change rien quand la montre et le ressenti s’accordent', () => {
    expect(intentAfterNight('ambitieux', null)).toBe('ambitieux')
    expect(intentAfterNight('normal', null)).toBe('normal')
  })

  it('ne ferme l’intensité que sur une nuit atroce', () => {
    const douce = setNight('2026-09-20', 'mauvaise')
    expect(closedDayOf(douce, '2026-09-20')).toBeNull()

    const dure = setNight('2026-09-20', 'atroce')
    expect(closedDayOf(dure, '2026-09-20')).toBe('2026-09-20')
  })

  it('ne ferme que le jour dit, jamais l’horizon', () => {
    // La différence avec la variabilité basse du E.30, qui vaut pour les
    // quatorze jours : une nuit ne dit rien de jeudi prochain.
    const nights = setNight('2026-09-20', 'atroce')
    expect(closedDayOf(nights, '2026-09-21')).toBeNull()
    expect(closedDayOf(nights, '2026-09-19')).toBeNull()
  })
})
