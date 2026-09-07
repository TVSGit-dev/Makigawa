import { describe, expect, it } from 'vitest'
import { holdsLevel, RAMP_SHARE, rampOf } from './ramp'
import type { Wellness } from '../api/intervals'

const day = (date: string, ctl: number): Wellness => ({
  date,
  ctl,
  atl: 20,
  sleepScore: null,
  sleepSeconds: null,
  raw: {},
})

describe('la vitesse de montée', () => {
  it('est la forme d’aujourd’hui moins celle d’il y a sept jours', () => {
    const ramp = rampOf([day('2026-08-31', 20), day('2026-09-07', 23)], '2026-09-07')
    expect(ramp?.rate).toBe(3)
    expect(ramp?.fitness).toBe(23)
  })

  it('descend aussi', () => {
    const ramp = rampOf([day('2026-08-31', 25), day('2026-09-07', 22)], '2026-09-07')
    expect(ramp?.rate).toBe(-3)
  })

  it('se contente du dernier relevé connu de chaque côté', () => {
    // La journée du jour n'existe pas toujours encore quand on ouvre l'app.
    const ramp = rampOf([day('2026-08-30', 20), day('2026-09-06', 24)], '2026-09-07')
    expect(ramp?.rate).toBe(4)
  })

  it('ne dit rien quand il n’y a pas deux relevés', () => {
    // Une donnée manquante ne se transforme jamais en interdiction.
    expect(rampOf([], '2026-09-07')).toBeNull()
    expect(rampOf([day('2026-09-07', 23)], '2026-09-07')).toBeNull()
  })

  it('ne dit rien quand les deux bouts sont le même relevé', () => {
    expect(rampOf([day('2026-09-01', 23)], '2026-09-07')).toBeNull()
  })
})

describe('le plafond', () => {
  it('vaut un dixième de la forme', () => {
    expect(rampOf([day('2026-08-31', 20), day('2026-09-07', 21)], '2026-09-07')?.cap).toBe(2.1)
    expect(RAMP_SHARE).toBe(0.1)
  })

  it('se resserre quand la forme est basse', () => {
    const basse = rampOf([day('2026-08-31', 18), day('2026-09-07', 20)], '2026-09-07')!
    const haute = rampOf([day('2026-08-31', 43), day('2026-09-07', 45)], '2026-09-07')!
    expect(basse.cap).toBeLessThan(haute.cap)
  })

  it('tient le niveau quand la montée l’atteint', () => {
    // CTL 20 → plafond 2. Une montée de 3 points est déjà trop rapide.
    expect(holdsLevel(rampOf([day('2026-08-31', 17), day('2026-09-07', 20)], '2026-09-07'))).toBe(
      true,
    )
  })

  it('laisse monter quand la forme stagne ou redescend', () => {
    expect(holdsLevel(rampOf([day('2026-08-31', 20), day('2026-09-07', 20)], '2026-09-07'))).toBe(
      false,
    )
    expect(holdsLevel(rampOf([day('2026-08-31', 24), day('2026-09-07', 20)], '2026-09-07'))).toBe(
      false,
    )
  })

  it('ne retient rien quand la vitesse est inconnue', () => {
    expect(holdsLevel(null)).toBe(false)
  })
})
