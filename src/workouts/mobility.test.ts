import { describe, expect, it } from 'vitest'
import { AFTER, BEFORE, mobilitySeconds, ROUTINE, STRENGTH } from './mobility'

describe('la routine de souplesse', () => {
  it('tient les soixante secondes minimum sur les tenues longues', () => {
    // C'est le point sur lequel la littérature est la plus nette, et celui que
    // tout le monde rate : en dessous, l'effet ne dure pas.
    for (const move of AFTER) {
      expect(move.seconds, move.name).toBeGreaterThanOrEqual(60)
    }
  })

  it('ne fait pas de tenue longue avant la sortie', () => {
    // Étirer longuement un muscle juste avant de lui demander de la force
    // réduit cette force. Avant, on bouge ; après, on tient.
    for (const move of BEFORE) {
      expect(move.seconds, move.name).toBeLessThanOrEqual(60)
    }
  })

  it('combine mobilité, tenues et renforcement', () => {
    // Étirer seul ne suffit pas : un psoas court l'est souvent parce que les
    // fessiers ne font pas leur part.
    expect(BEFORE.length).toBeGreaterThan(0)
    expect(AFTER.length).toBeGreaterThan(0)
    expect(STRENGTH.length).toBeGreaterThan(0)
    expect(ROUTINE).toHaveLength(BEFORE.length + AFTER.length + STRENGTH.length)
  })

  it('vise le psoas nommément', () => {
    expect(AFTER.some((move) => move.target.includes('psoas'))).toBe(true)
  })

  it('compte les deux côtés dans sa durée', () => {
    const unSeulCote = mobilitySeconds(AFTER.map((move) => ({ ...move, bothSides: false })))
    expect(mobilitySeconds(AFTER)).toBeGreaterThan(unSeulCote)
  })

  it('dit comment faire, pas seulement quoi faire', () => {
    for (const move of ROUTINE) {
      expect(move.how.length, move.name).toBeGreaterThan(30)
    }
  })
})

describe('l’ordre dans lequel elle se fait', () => {
  it('bouge avant, tient après, renforce ensuite', () => {
    // C'est l'ordre qui fait l'effet : étirer longuement avant réduit la
    // force, et renforcer sans étirer laisse le psoas se raccourcir.
    const noms = ROUTINE.map((move) => move.name)
    expect(noms.indexOf(BEFORE[0]!.name)).toBeLessThan(noms.indexOf(AFTER[0]!.name))
    expect(noms.indexOf(AFTER[0]!.name)).toBeLessThan(noms.indexOf(STRENGTH[0]!.name))
  })

  it('tient dans un quart d’heure, les deux côtés comptés', () => {
    // Une routine qu'on ne fait pas est une routine inutile.
    expect(mobilitySeconds()).toBeLessThanOrEqual(15 * 60)
  })
})
