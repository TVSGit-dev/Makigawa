import { describe, expect, it } from 'vitest'
import {
  asPlannedCommute,
  COMMUTE_CYCLE,
  COMMUTE_LOADS,
  defaultCommute,
  isWorkday,
} from './commute'
import { isQuality, levelOf } from '../rules/scale'
import { weighDay } from '../rules/scale'

describe('les charges relevées', () => {
  it('reprend les mesures de l’athlète, sans en inventer', () => {
    expect(COMMUTE_LOADS.chill).toBe(35)
    expect(COMMUTE_LOADS.hard).toBe(115)
    expect(COMMUTE_LOADS.aucun).toBe(0)
  })

  it('fait de l’aller-retour musculaire une journée chargée', () => {
    // C'est ce que le E.13 constatait déjà : niveau 3 sur l'échelle du E.1.
    expect(levelOf(COMMUTE_LOADS.hard)).toBe(3)
    expect(levelOf(COMMUTE_LOADS.chill)).toBe(1)
  })
})

describe('la marque du jour', () => {
  it('défile électrique → musculaire → rien', () => {
    expect(COMMUTE_CYCLE).toEqual(['chill', 'hard', 'aucun'])
  })

  it('vaut électrique en semaine, rien le week-end', () => {
    // 7 septembre 2026 est un lundi, le 12 un samedi.
    expect(defaultCommute('2026-09-07')).toBe('chill')
    expect(defaultCommute('2026-09-11')).toBe('chill')
    expect(defaultCommute('2026-09-12')).toBe('aucun')
    expect(defaultCommute('2026-09-13')).toBe('aucun')
  })

  it('connaît les jours de semaine', () => {
    expect(isWorkday('2026-09-07')).toBe(true)
    expect(isWorkday('2026-09-13')).toBe(false)
  })
})

describe('ce que les règles en lisent', () => {
  it('n’est jamais une séance, quelle que soit sa charge', () => {
    // La règle critique du projet : un trajet porte une charge, ce n'est pas
    // de l'entraînement.
    for (const kind of ['chill', 'hard'] as const) {
      expect(asPlannedCommute(kind, '2026-09-07')?.kind).toBe('autre')
    }
  })

  it('ne pose rien les jours sans trajet', () => {
    expect(asPlannedCommute('aucun', '2026-09-07')).toBeNull()
  })

  it('rend la journée chargée quand le trajet est musculaire', () => {
    const trajet = asPlannedCommute('hard', '2026-09-07')!
    expect(weighDay(undefined, '2026-09-07', [trajet])).toBe('chargee')
  })

  it('laisse la journée légère quand il est électrique', () => {
    const trajet = asPlannedCommute('chill', '2026-09-07')!
    expect(weighDay(undefined, '2026-09-07', [trajet])).toBe('legere')
    expect(isQuality(trajet)).toBe(false)
  })
})
