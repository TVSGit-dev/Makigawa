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
    expect(levelOf(18)).toBe(0)
    expect(levelOf(35)).toBe(1) // un aller-retour électrique
    expect(levelOf(69)).toBe(2) // la séance « Chill »
    expect(levelOf(115)).toBe(3) // un aller-retour musculaire
    expect(levelOf(140)).toBe(4) // une belle balade
  })

  it('range chaque borne dans le niveau supérieur', () => {
    expect(levelOf(DEFAULT_SCALE.light)).toBe(1)
    expect(levelOf(DEFAULT_SCALE.moderate)).toBe(2)
    expect(levelOf(DEFAULT_SCALE.sustained)).toBe(3)
    expect(levelOf(DEFAULT_SCALE.heavy)).toBe(4)
  })

  it('suit des bornes personnalisées, le profil de l’athlète pouvant changer', () => {
    const wider = { light: 25, moderate: 70, sustained: 115, heavy: 170 }
    expect(levelOf(60, wider)).toBe(1)
    expect(levelOf(60)).toBe(2)
  })
})

describe('isQuality', () => {
  it('retient les niveaux 3 et 4', () => {
    expect(isQuality(session({ load: 90 }))).toBe(true)
    expect(isQuality(session({ load: 150 }))).toBe(true)
  })

  it('retient la séance « Chill », une heure d’intérieur structurée', () => {
    expect(isQuality(session({ load: 69 }))).toBe(true)
  })

  it('écarte ce qui pèse moins', () => {
    expect(isQuality(session({ load: 35 }))).toBe(false) // un trajet électrique
    expect(isQuality(session({ load: 10 }))).toBe(false) // de la mobilité
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
    expect(weighDay(day({ observedLoad: 35 }), '2026-09-10', [])).toBe('legere')
    expect(weighDay(day({ observedLoad: 69 }), '2026-09-10', [])).toBe('moyenne')
    expect(weighDay(day({ observedLoad: 115 }), '2026-09-10', [])).toBe('chargee')
  })

  it('pèse une journée à venir à ce qu’on y a planifié', () => {
    const planned = [session({ date: '2026-09-10', load: 115 })]
    expect(weighDay(undefined, '2026-09-10', planned)).toBe('chargee')
  })

  it('préfère le constaté au planifié quand les deux existent', () => {
    const planned = [session({ date: '2026-09-10', load: 115 })]
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
 * Les journées réelles relevées par l'athlète le 6 septembre 2026. Ce sont
 * elles qui étalonnent l'échelle : si l'une de ces assertions tombe, ce sont
 * les bornes qu'on déplace — jamais les règles.
 *
 * Chaque repère est éprouvé à ses deux extrémités, l'athlète les ayant donnés
 * en fourchette.
 */
describe('journées de référence, relevées', () => {
  it('un aller-retour en vélo électrique sort en journée légère', () => {
    for (const load of [30, 40]) {
      expect(weighDay(day({ observedLoad: load }), '2026-09-10', [])).toBe('legere')
    }
  })

  it('un aller-retour musculaire sort en journée chargée', () => {
    for (const load of [110, 120]) {
      expect(weighDay(day({ observedLoad: load }), '2026-09-10', [])).toBe('chargee')
    }
  })

  it('une belle balade suffit à elle seule à charger la journée', () => {
    expect(weighDay(day({ observedLoad: 140 }), '2026-09-10', [])).toBe('chargee')
  })

  it('une journée de trajets plus une séance devient chargée', () => {
    // 35 de trajets et la séance « Chill » à 69 : le cumul bascule.
    expect(weighDay(day({ observedLoad: 35 + 69 }), '2026-09-10', [])).toBe('chargee')
  })

  it('laisse une marge de part et d’autre des repères', () => {
    // Un électrique un peu appuyé reste léger, un musculaire un peu doux
    // reste chargé : les bornes ne frôlent pas les valeurs relevées.
    expect(weighDay(day({ observedLoad: 50 }), '2026-09-10', [])).toBe('legere')
    expect(weighDay(day({ observedLoad: 95 }), '2026-09-10', [])).toBe('chargee')
  })
})
