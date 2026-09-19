import { describe, expect, it } from 'vitest'
import { assistedShare, legsOn } from './legs'
import { averageWattsOf, isAssisted, unassistedWattsOf, type Activity } from '../api/intervals'

const TODAY = '2026-09-19'

type Over = Partial<Activity> & { watts?: number; sensor?: boolean; day?: string }

const trajet = (over: Over = {}): Activity => {
  const { watts, sensor = true, day = TODAY, ...rest } = over
  return {
    id: 'a1',
    name: 'Commute',
    type: 'EBikeRide',
    startDateLocal: `${day}T08:10:00`,
    trainingLoad: 35,
    movingTime: 2160,
    distance: 15600,
    pairedEventId: null,
    raw: watts === undefined ? {} : { average_watts: watts, has_device_watts: sensor },
    ...rest,
  }
}

describe('les deux portes de la puissance (E.33)', () => {
  it('lit une puissance électrique mesurée — c’est bien ses jambes', () => {
    expect(averageWattsOf(trajet({ watts: 85 }))).toBe(85)
  })

  it('refuse la même sans capteur confirmé', () => {
    // Le 17 septembre 2026, sans capteur : 369 W attribués aux jambes.
    expect(averageWattsOf(trajet({ watts: 369, sensor: false }))).toBeNull()
  })

  it('refuse une puissance dont aucun capteur ne répond', () => {
    const muet = trajet()
    muet.raw = { average_watts: 369 }
    expect(averageWattsOf(muet)).toBeNull()
  })

  it('refuse ce qui n’est pas du vélo', () => {
    const course = trajet({ type: 'Run', watts: 280 })
    expect(averageWattsOf(course)).toBeNull()
  })

  it('ne rend jamais comparable une puissance assistée', () => {
    const electrique = trajet({ watts: 85 })
    expect(averageWattsOf(electrique)).toBe(85)
    expect(unassistedWattsOf(electrique)).toBeNull()
  })

  it('laisse passer le musculaire par les deux portes', () => {
    const dur = trajet({ type: 'Ride', name: 'Hard Commute', watts: 179 })
    expect(averageWattsOf(dur)).toBe(179)
    expect(unassistedWattsOf(dur)).toBe(179)
    expect(isAssisted(dur)).toBe(false)
  })
})

describe('ce que ses jambes font sur ses trajets', () => {
  const electriques = [
    trajet({ id: 'e1', watts: 79, day: '2026-09-18' }),
    trajet({ id: 'e2', watts: 91, day: '2026-09-18' }),
  ]
  const musculaire = trajet({
    id: 'm1',
    type: 'Ride',
    name: 'Hard Commute',
    watts: 179,
    day: '2026-09-09',
    trainingLoad: 116,
  })

  it('range les deux vélos dans deux colonnes, jamais dans une moyenne', () => {
    const legs = legsOn([...electriques, musculaire], TODAY)
    expect(legs.assisted).toEqual({ watts: 85, count: 2 })
    expect(legs.unassisted).toEqual({ watts: 179, count: 1 })
  })

  it('ne compte pas un trajet sans capteur', () => {
    const avant = trajet({ id: 'e0', watts: 369, sensor: false, day: '2026-09-17' })
    const legs = legsOn([avant], TODAY)
    expect(legs.assisted).toBeNull()
    expect(legs.unassisted).toBeNull()
  })

  it('n’avale que les trajets, pas les séances', () => {
    const seance: Activity = {
      ...trajet({ id: 's1', type: 'Ride', watts: 210 }),
      name: 'Sweet spot',
      distance: 40000,
    }
    const legs = legsOn([seance, ...electriques], TODAY)
    expect(legs.unassisted).toBeNull()
    expect(legs.assisted).toEqual({ watts: 85, count: 2 })
  })

  it('s’arrête à la fenêtre demandée', () => {
    const vieux = trajet({ id: 'e9', watts: 85, day: '2026-08-01' })
    expect(legsOn([vieux], TODAY).assisted).toBeNull()
    expect(legsOn([vieux], TODAY, 60).assisted).toEqual({ watts: 85, count: 1 })
  })

  it('dit la part des jambes, et se tait à un seul terme', () => {
    const legs = legsOn([...electriques, musculaire], TODAY)
    // 85 / 179 — le rapport que le E.32 supposait « à peu près moitié ».
    expect(assistedShare(legs)).toBe(47)
    expect(assistedShare(legsOn(electriques, TODAY))).toBeNull()
    expect(assistedShare(legsOn([musculaire], TODAY))).toBeNull()
  })
})
