import { beforeEach, describe, expect, it } from 'vitest'
import { heldInWeek, intentAfterUnload, LOADING_WEEKS, shouldUnload } from './decharge'
import {
  answerUnload,
  forgetOldUnloads,
  loadUnloadChoices,
  unloadedWeeks,
} from '../storage/decharge'

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

// Lundis : 24 août, 31 août, 7 septembre 2026.
const TODAY = '2026-09-08'

const unload = (held: string[], unloaded: string[] = []) =>
  shouldUnload({ held, today: TODAY, unloaded: new Set(unloaded) })

describe('ce qui compte comme semaine de charge', () => {
  it('un jour tenu dans la semaine suffit', () => {
    expect(heldInWeek(['2026-09-02'], '2026-08-31')).toBe(true)
  })

  it('ne déborde pas sur la semaine voisine', () => {
    expect(heldInWeek(['2026-09-07'], '2026-08-31')).toBe(false)
    expect(heldInWeek(['2026-08-30'], '2026-08-31')).toBe(false)
  })

  it('ne compte rien sans jour tenu', () => {
    expect(heldInWeek([], '2026-08-31')).toBe(false)
  })
})

describe('quand la décharge se propose', () => {
  it('après deux semaines de charge', () => {
    expect(unload(['2026-08-26', '2026-09-02'])).toBe(true)
  })

  it('pas après une seule', () => {
    expect(unload(['2026-09-02'])).toBe(false)
    expect(LOADING_WEEKS).toBe(2)
  })

  it('pas si la semaine en cours a déjà porté du travail', () => {
    // Alléger un mercredi où la séance est faite n'allège rien.
    expect(unload(['2026-08-26', '2026-09-02', '2026-09-07'])).toBe(false)
  })

  it('ne compte pas une décharge comme une semaine de charge', () => {
    // Sans quoi le cycle se mordrait la queue dès la première.
    expect(unload(['2026-08-26', '2026-09-02'], ['2026-08-31'])).toBe(false)
  })

  it('repart pour un cycle après la décharge', () => {
    const apres = shouldUnload({
      held: ['2026-09-09', '2026-09-16'],
      today: '2026-09-22',
      unloaded: new Set(['2026-08-31']),
    })
    expect(apres).toBe(true)
  })

  it('compte une séance reconnue sans passer par le calendrier (E.22)', () => {
    // Depuis le E.19, une séance tenue peut n'exister que dans l'app.
    expect(unload(['2026-08-26', '2026-09-02'])).toBe(true)
  })

  it('force le mode prudent une fois acceptée', () => {
    expect(intentAfterUnload('ambitieux', true)).toBe('prudent')
    expect(intentAfterUnload('ambitieux', false)).toBe('ambitieux')
  })
})

describe('ce que l’athlète a répondu', () => {
  it('retient une décharge acceptée', () => {
    answerUnload('2026-09-07', 'acceptee')
    expect(loadUnloadChoices()['2026-09-07']).toBe('acceptee')
    expect(unloadedWeeks(loadUnloadChoices()).has('2026-09-07')).toBe(true)
  })

  it('retient un refus, et ne le compte pas comme une décharge', () => {
    answerUnload('2026-09-07', 'ecartee')
    expect(unloadedWeeks(loadUnloadChoices()).has('2026-09-07')).toBe(false)
  })

  it('se laisse défaire', () => {
    answerUnload('2026-09-07', 'acceptee')
    expect(loadUnloadChoices()['2026-09-07']).toBe('acceptee')
    answerUnload('2026-09-07', null)
    expect(loadUnloadChoices()['2026-09-07']).toBeUndefined()
  })

  it('oublie les réponses trop anciennes', () => {
    answerUnload('2026-05-04', 'acceptee')
    answerUnload('2026-09-07', 'acceptee')
    expect(Object.keys(forgetOldUnloads('2026-09-08'))).toEqual(['2026-09-07'])
  })

  it('repart des valeurs par défaut si le stockage est illisible', () => {
    localStorage.setItem('makigawa.decharges', 'pas du JSON')
    expect(loadUnloadChoices()).toEqual({})
  })
})
