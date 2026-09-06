import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SCALE,
  isQuality,
  levelOf,
  PEAK_MIN_SECONDS,
  plannedLoadOn,
  weighDay,
} from './scale'
import type { DayRecord, PlannedSession } from './types'

const session = (over: Partial<PlannedSession> = {}): PlannedSession => ({
  id: 's',
  date: '2026-09-10',
  load: 80,
  kind: 'endurance',
  ...over,
})

const day = (over: Partial<DayRecord> = {}): DayRecord => ({
  date: '2026-09-10',
  observedLoad: null,
  peakSeconds: 0,
  ...over,
})

describe('levelOf', () => {
  it('classe les charges selon les cinq niveaux', () => {
    expect(levelOf(0)).toBe(0)
    expect(levelOf(14)).toBe(0)
    expect(levelOf(25)).toBe(1)
    expect(levelOf(55)).toBe(2)
    expect(levelOf(69)).toBe(2) // la séance « Chill », seul ancrage réel
    expect(levelOf(90)).toBe(3)
    expect(levelOf(150)).toBe(4)
  })

  it('range chaque borne dans le niveau supérieur', () => {
    expect(levelOf(DEFAULT_SCALE.light)).toBe(1)
    expect(levelOf(DEFAULT_SCALE.moderate)).toBe(2)
    expect(levelOf(DEFAULT_SCALE.sustained)).toBe(3)
    expect(levelOf(DEFAULT_SCALE.heavy)).toBe(4)
  })

  it('suit des bornes personnalisées, la phase 6 devant les corriger', () => {
    const wider = { light: 20, moderate: 60, sustained: 100, heavy: 160 }
    expect(levelOf(55, wider)).toBe(1)
    expect(levelOf(55)).toBe(2)
  })
})

describe('isQuality', () => {
  it('retient les niveaux 3 et 4', () => {
    expect(isQuality(session({ load: 90 }))).toBe(true)
    expect(isQuality(session({ load: 150 }))).toBe(true)
  })

  it('écarte ce qui pèse moins', () => {
    expect(isQuality(session({ load: 69 }))).toBe(false)
    expect(isQuality(session({ load: 10 }))).toBe(false)
  })

  it('ne suppose pas ce qu’elle ne sait pas', () => {
    expect(isQuality(session({ load: null }))).toBe(false)
  })
})

describe('plannedLoadOn', () => {
  it('additionne les séances du jour et ignore les autres', () => {
    const sessions = [
      session({ id: 'a', date: '2026-09-10', load: 40 }),
      session({ id: 'b', date: '2026-09-10', load: 30 }),
      session({ id: 'c', date: '2026-09-11', load: 90 }),
    ]
    expect(plannedLoadOn('2026-09-10', sessions)).toBe(70)
  })

  it('traite une séance sans charge comme nulle, pas comme une erreur', () => {
    expect(plannedLoadOn('2026-09-10', [session({ load: null })])).toBe(0)
  })
})

describe('weighDay', () => {
  it('pèse une journée passée à ce qu’elle a coûté', () => {
    expect(weighDay(day({ observedLoad: 20 }), '2026-09-10', [])).toBe('legere')
    expect(weighDay(day({ observedLoad: 55 }), '2026-09-10', [])).toBe('moyenne')
    expect(weighDay(day({ observedLoad: 95 }), '2026-09-10', [])).toBe('chargee')
  })

  it('pèse une journée à venir à ce qu’on y a planifié', () => {
    const planned = [session({ date: '2026-09-10', load: 95 })]
    expect(weighDay(undefined, '2026-09-10', planned)).toBe('chargee')
  })

  it('préfère le constaté au planifié quand les deux existent', () => {
    const planned = [session({ date: '2026-09-10', load: 95 })]
    expect(weighDay(day({ observedLoad: 10 }), '2026-09-10', planned)).toBe('legere')
  })

  it('bascule en chargée sur un pic, quelle que soit la charge totale', () => {
    const light = day({ observedLoad: 20, peakSeconds: PEAK_MIN_SECONDS })
    expect(weighDay(light, '2026-09-10', [])).toBe('chargee')
  })

  it('ignore un pic trop court', () => {
    const sprint = day({ observedLoad: 20, peakSeconds: PEAK_MIN_SECONDS - 1 })
    expect(weighDay(sprint, '2026-09-10', [])).toBe('legere')
  })

  it('tient une journée sans rien pour légère', () => {
    expect(weighDay(undefined, '2026-09-10', [])).toBe('legere')
  })
})

/**
 * Le contrôle que la phase 6 doit confirmer sur des journées réelles : un
 * aller-retour électrique sort en légère, un aller-retour musculaire en
 * chargée.
 *
 * Les charges employées ici sont **estimées**, faute de relevé. Si ces
 * assertions tombent devant les vrais chiffres, ce sont les bornes de
 * l'échelle qu'on déplace — jamais les règles.
 */
describe('journées de référence (à confirmer en phase 6)', () => {
  it('un aller-retour en vélo électrique sort en journée légère', () => {
    const commute = day({ observedLoad: 2 * 15, peakSeconds: 0 })
    expect(weighDay(commute, '2026-09-10', [])).toBe('legere')
  })

  it('un aller-retour musculaire sort en journée chargée', () => {
    const commute = day({ observedLoad: 2 * 45, peakSeconds: 0 })
    expect(weighDay(commute, '2026-09-10', [])).toBe('chargee')
  })
})
