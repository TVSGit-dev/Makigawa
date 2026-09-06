import { describe, expect, it } from 'vitest'
import {
  AFTER,
  asPlannedMobility,
  BEFORE,
  mobilityEvent,
  mobilitySeconds,
  mobilityText,
  MOBILITY_LOAD,
  ROUTINE,
  STRENGTH,
} from './mobility'
import { isQuality, levelOf, weighDay } from '../rules/scale'

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

describe('ce que la souplesse pèse', () => {
  it('reste au niveau 0 : elle ne bloque rien', () => {
    // Elle doit pouvoir se poser le lendemain d'une grosse sortie — c'est là
    // qu'elle sert le plus.
    expect(levelOf(MOBILITY_LOAD)).toBe(0)
  })

  it('n’est jamais une séance de qualité', () => {
    expect(isQuality(asPlannedMobility('2026-09-10'))).toBe(false)
  })

  it('ne fait pas basculer une journée', () => {
    const seule = asPlannedMobility('2026-09-10')
    expect(weighDay(undefined, '2026-09-10', [seule])).toBe('legere')
  })
})

describe('l’événement posé', () => {
  it('n’est ni un vélo ni une puissance', () => {
    // Il n'y a pas de vélo, pas de watt, pas de zone. Le type doit le dire.
    const event = mobilityEvent('2026-09-10')
    expect(event.type).toBe('Workout')
    expect(String(event.description)).not.toMatch(/%|z[1-6]/)
  })

  it('porte sa charge, faute de structure d’où la déduire', () => {
    expect(mobilityEvent('2026-09-10')).toHaveProperty('icu_training_load', MOBILITY_LOAD)
  })

  it('écrit la routine dans l’ordre où elle se fait', () => {
    const texte = mobilityText()
    expect(texte.indexOf('AVANT')).toBeLessThan(texte.indexOf('APRÈS'))
    expect(texte.indexOf('APRÈS')).toBeLessThan(texte.indexOf('RENFORCEMENT'))
  })
})
