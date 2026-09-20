/**
 * La septième condition du E.2 : la nuit atroce (E.12, second cran).
 *
 * Le mécanisme est celui de la variabilité basse — on ferme l'intensité, pas la
 * journée — mais la portée ne l'est pas : `lowVariability` vaut pour l'horizon
 * entier, une nuit ne concerne qu'un jour.
 */

import { describe, expect, it } from 'vitest'
import { refuse, type Context } from './decide'
import type { PlannedSession } from './types'
import { shiftDayKey } from '../calendar/dates'

const TODAY = '2026-09-20'
const DEMAIN = shiftDayKey(TODAY, 1)

const seance = (date: string, load = 80): PlannedSession => ({
  id: `s-${date}`,
  date,
  load,
  kind: 'endurance',
})

const context = (over: Partial<Context> = {}): Context => ({
  today: TODAY,
  days: [],
  planned: [],
  intent: 'normal',
  tsb: 5,
  ...over,
})

describe('la nuit atroce ferme l’intensité du jour', () => {
  it('refuse une séance de qualité sur le jour dit', () => {
    const une = seance(TODAY)
    expect(refuse(une, TODAY, context({ planned: [une], closedDay: TODAY }))).toEqual({
      code: 'nuit-atroce',
    })
  })

  it('ne dit rien sans nuit atroce', () => {
    const une = seance(TODAY)
    expect(refuse(une, TODAY, context({ planned: [une] }))).toBeNull()
    expect(refuse(une, TODAY, context({ planned: [une], closedDay: null }))).toBeNull()
  })
})

describe('elle ne ferme qu’un jour, jamais l’horizon', () => {
  it('laisse passer le lendemain', () => {
    // La différence avec le E.30, et c'est tout le sujet : effacer l'intensité
    // de la quinzaine sur la foi d'une seule nuit serait exactement ce que le
    // E.12 s'interdit — « un effet qui ne touche qu'aujourd'hui ».
    const demain = seance(DEMAIN)
    expect(refuse(demain, DEMAIN, context({ planned: [demain], closedDay: TODAY }))).toBeNull()
  })

  it('là où la variabilité basse, elle, ferme les deux', () => {
    const demain = seance(DEMAIN)
    expect(
      refuse(demain, DEMAIN, context({ planned: [demain], lowVariability: true })),
    ).toEqual({ code: 'variabilite-basse' })
  })
})

describe('elle ferme l’intensité, pas la journée', () => {
  it('laisse passer ce qui n’est pas intense', () => {
    // Une séance douce se pose toujours : « pas d'intensité aujourd'hui »,
    // jamais « ne bouge pas ». Sans quoi l'app afficherait « rien de prévu »,
    // ce qui se lit comme le contraire de ce que la règle dit.
    const douce: PlannedSession = { ...seance(TODAY, 10), intensity: false }
    expect(refuse(douce, TODAY, context({ planned: [douce], closedDay: TODAY }))).toBeNull()
  })

  it('laisse toujours passer un trajet', () => {
    // Un trajet n'est jamais une séance de qualité, et on ne peut pas ne pas
    // aller travailler.
    const trajet: PlannedSession = { ...seance(TODAY, 35), kind: 'autre', commute: true }
    expect(refuse(trajet, TODAY, context({ planned: [trajet], closedDay: TODAY }))).toBeNull()
  })
})
