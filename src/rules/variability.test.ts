import { describe, expect, it } from 'vitest'
import {
  driftOf,
  variabilityOf,
  VARIABILITY_MIN_NIGHTS,
  VARIABILITY_NIGHTS_NEEDED,
  VARIABILITY_SWC,
} from './variability'
import { refuse } from './decide'
import type { Wellness } from '../api/intervals'
import type { Context, } from './decide'
import type { PlannedSession } from './types'

const TODAY = '2026-09-08'

const shift = (date: string, days: number): string => {
  const d = new Date(`${date}T00:00:00`)
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const night = (date: string, hrv: number | null): Wellness => ({
  date,
  ctl: 30,
  atl: 25,
  sleepScore: null,
  sleepSeconds: null,
  hrv,
  restingHr: 48,
  raw: {},
})

/** `days` nuits consécutives finissant la veille de `TODAY`, toutes à `hrv`. */
const steady = (days: number, hrv = 60, from = TODAY): Wellness[] =>
  Array.from({ length: days }, (_, i) => night(shift(from, -(days - 1 - i)), hrv))

describe('tant que la base n’est pas faite', () => {
  it('ne dit rien du tout sans aucune nuit', () => {
    const v = variabilityOf([], TODAY)
    expect(v.low).toBe(false)
    expect(v.nights).toBe(0)
    expect(v.missing).toBe(VARIABILITY_NIGHTS_NEEDED)
  })

  it('compte les nuits et dit combien il en manque', () => {
    const v = variabilityOf(steady(10), TODAY)
    expect(v.nights).toBe(10)
    expect(v.missing).toBe(VARIABILITY_NIGHTS_NEEDED - 10)
    // Et surtout : elle ne refuse rien tant qu'elle ne sait pas.
    expect(v.low).toBe(false)
  })

  it('ne se déclenche jamais sur une base trop courte, même très basse', () => {
    const nuits = [...steady(10, 60), night(TODAY, 5)]
    expect(variabilityOf(nuits, TODAY).low).toBe(false)
  })

  it('exige assez de nuits dans la fenêtre glissante', () => {
    // Trois nuits sur les sept derniers jours : pas de moyenne du jour.
    const trous = [night(TODAY, 60), night(shift(TODAY, -2), 60), night(shift(TODAY, -4), 60)]
    expect(variabilityOf([...steady(40, 60, shift(TODAY, -10)), ...trous], TODAY).today).toBe(
      null,
    )
    expect(VARIABILITY_MIN_NIGHTS).toBe(4)
  })
})

describe('une fois la base faite', () => {
  /** Quarante nuits qui varient un peu, pour que l'écart-type ne soit pas nul. */
  const base = Array.from({ length: 40 }, (_, i) =>
    night(shift(TODAY, -(40 - i)), 55 + (i % 5) * 4),
  )

  it('ne refuse rien quand la variabilité est dans la normale', () => {
    const v = variabilityOf([...base, night(TODAY, 60)], TODAY)
    expect(v.missing).toBe(0)
    expect(v.floor).not.toBeNull()
    expect(v.low).toBe(false)
  })

  it('se déclenche quand la moyenne du jour passe sous le plancher', () => {
    // Sept nuits effondrées : la moyenne glissante tombe nettement.
    const chute = Array.from({ length: 7 }, (_, i) => night(shift(TODAY, -6 + i), 30))
    const v = variabilityOf([...base, ...chute], TODAY)
    expect(v.low).toBe(true)
    expect(v.today!).toBeLessThan(v.floor!)
  })

  it('ne donne aucune permission quand elle est haute', () => {
    // Une bonne semaine ne rend pas le plan plus ambitieux : le E.20 garde le
    // dernier mot, et `low` est le seul état que le moteur lit.
    const haute = Array.from({ length: 7 }, (_, i) => night(shift(TODAY, -6 + i), 120))
    const v = variabilityOf([...base, ...haute], TODAY)
    expect(v.low).toBe(false)
    expect(v.today!).toBeGreaterThan(v.baseline!)
  })

  it('place le plancher à une demi-mesure de dispersion sous la normale', () => {
    const v = variabilityOf([...base, night(TODAY, 60)], TODAY)
    const spread = (v.baseline! - v.floor!) / VARIABILITY_SWC
    expect(spread).toBeGreaterThan(0)
  })

  it('dit l’écart en pourcentage plutôt qu’en logarithme', () => {
    const chute = Array.from({ length: 7 }, (_, i) => night(shift(TODAY, -6 + i), 30))
    const drift = driftOf(variabilityOf([...base, ...chute], TODAY))
    expect(drift).not.toBeNull()
    expect(drift!).toBeLessThan(0)
  })

  it('écarte une mesure absurde plutôt que d’en prendre le logarithme', () => {
    const v = variabilityOf([...base, night(TODAY, 0), night(shift(TODAY, -1), -5)], TODAY)
    expect(Number.isFinite(v.today!)).toBe(true)
  })
})

describe('la sixième condition du E.2 (E.30)', () => {
  const seance: PlannedSession = {
    id: 'x',
    date: TODAY,
    load: 80,
    kind: 'endurance',
  }

  const context = (lowVariability: boolean): Context => ({
    today: TODAY,
    days: [],
    planned: [seance],
    intent: 'normal',
    tsb: 5,
    lowVariability,
  })

  it('refuse une séance de qualité quand la variabilité est basse', () => {
    expect(refuse(seance, TODAY, context(true))).toEqual({ code: 'variabilite-basse' })
  })

  it('laisse passer quand elle est normale', () => {
    expect(refuse(seance, TODAY, context(false))).toBeNull()
  })

  it('ne touche pas à ce qui n’est pas une séance de qualité', () => {
    // Une variabilité basse dit « pas d'intensité », jamais « ne bouge pas ».
    const trajet: PlannedSession = { ...seance, load: 35, kind: 'autre', commute: true }
    expect(refuse(trajet, TODAY, { ...context(true), planned: [trajet] })).toBeNull()
  })
})
