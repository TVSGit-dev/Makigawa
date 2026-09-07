import { describe, expect, it } from 'vitest'
import { DISTANCES, paceFor, wattsOf } from './outing'
import { loadForDistance, pastWattsFor } from './history'
import type { Activity } from '../api/intervals'

const ride = (over: Partial<Activity> & { km?: number; watts?: number } = {}): Activity => {
  const { km = 50, watts, ...rest } = over
  return {
    id: 'a1',
    name: 'Sortie',
    type: 'Ride',
    startDateLocal: '2026-08-30T09:00:00',
    trainingLoad: 200,
    movingTime: 7200,
    distance: km * 1000,
    pairedEventId: null,
    raw: watts === undefined ? {} : { average_watts: watts, has_device_watts: true },
    ...rest,
  }
}

describe('l’allure d’une sortie longue', () => {
  it('baisse quand la sortie s’allonge', () => {
    const paces = DISTANCES.map(paceFor)
    for (let i = 1; i < paces.length; i += 1) {
      expect(paces[i]!, `${DISTANCES[i]} km`).toBeLessThan(paces[i - 1]!)
    }
  })

  it('reste dans la zone où une sortie longue se roule', () => {
    for (const km of DISTANCES) {
      expect(paceFor(km)).toBeGreaterThanOrEqual(60)
      expect(paceFor(km)).toBeLessThanOrEqual(85)
    }
  })

  it('s’affiche en watts sans jamais se décider en watts', () => {
    // La décision reste un pourcentage : le jour du test FTP, tout suit.
    expect(wattsOf(72, 221)).toBe(159)
    expect(wattsOf(72, 240)).toBe(173)
    expect(wattsOf(72, null)).toBeNull()
    expect(wattsOf(72, 0)).toBeNull()
  })
})

describe('ce que ses sorties ont réellement coûté', () => {
  it('lit la fourchette dans l’historique, sans rien estimer', () => {
    const range = loadForDistance(
      [ride({ km: 48, trainingLoad: 190 }), ride({ km: 52, trainingLoad: 215 })],
      50,
    )
    expect(range).toEqual({ low: 190, high: 215, count: 2 })
  })

  it('ne dit rien plutôt qu’un chiffre inventé', () => {
    expect(loadForDistance([], 50)).toBeNull()
    expect(loadForDistance([ride({ km: 17 })], 50)).toBeNull()
  })

  it('écarte les trajets, quel que soit leur vélo', () => {
    // Un aller-retour n'apprend rien sur une sortie longue.
    const trajets = [
      ride({ km: 45, type: 'EBikeRide', trainingLoad: 40 }),
      ride({ km: 48, name: 'Hard Commute', trainingLoad: 115 }),
    ]
    expect(loadForDistance(trajets, 50)).toBeNull()
  })

  it('accepte un quart d’écart sur la distance', () => {
    expect(loadForDistance([ride({ km: 62 })], 50)).not.toBeNull()
    expect(loadForDistance([ride({ km: 64 })], 50)).toBeNull()
  })
})

describe('l’allure réellement tenue', () => {
  it('moyenne la puissance de ses sorties comparables', () => {
    expect(pastWattsFor([ride({ km: 50, watts: 170 }), ride({ km: 50, watts: 190 })], 50)).toBe(180)
  })

  it('ne lit jamais la puissance d’un vélo électrique', () => {
    // La règle critique : il n'y a pas de capteur, toute valeur est fausse.
    const electrique = ride({ km: 50, type: 'EBikeRide', watts: 306 })
    expect(pastWattsFor([electrique], 50)).toBeNull()
  })

  it('ne lit pas non plus une puissance sans capteur déclaré', () => {
    const sansCapteur = ride({ km: 50 })
    sansCapteur.raw = { average_watts: 220, has_device_watts: false }
    expect(pastWattsFor([sansCapteur], 50)).toBeNull()
  })

  it('ne dit rien quand aucune sortie ne porte de puissance', () => {
    expect(pastWattsFor([ride({ km: 50 })], 50)).toBeNull()
  })
})
