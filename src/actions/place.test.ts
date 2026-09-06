import { describe, expect, it } from 'vitest'
import type { LibraryWorkout } from '../api/intervals'
import type { Context } from '../rules/decide'
import type { DayRecord, PlannedSession } from '../rules/types'
import { asPlanned, CANDIDATE_ID, eventFor, verdictsFor } from './place'

const workout = (over: Partial<LibraryWorkout> = {}): LibraryWorkout => ({
  id: 'w1',
  name: 'Endurance 45',
  description: '- 5m z1\n- 35m z2\n- 5m z1',
  type: 'VirtualRide',
  movingTime: 2700,
  trainingLoad: 55,
  folder: 'Intérieur',
  raw: {},
  ...over,
})

const observed = (date: string, load: number): DayRecord => ({
  date,
  observedLoad: load,
  peakSeconds: 0,
})

const context = (over: Partial<Context> = {}): Context => ({
  today: '2026-09-10',
  days: [],
  planned: [],
  intent: 'normal',
  tsb: 0,
  ...over,
})

describe('la séance envisagée', () => {
  it('emprunte sa charge et sa nature à la bibliothèque', () => {
    expect(asPlanned(workout(), '2026-09-12')).toEqual({
      id: CANDIDATE_ID,
      date: '2026-09-12',
      load: 55,
      kind: 'endurance',
    })
  })

  it('reconnaît un renfo, dont l’espacement n’est pas le même', () => {
    expect(asPlanned(workout({ type: 'WeightTraining' }), '2026-09-12').kind).toBe('force')
  })

  it('porte un identifiant qui ne peut appartenir à aucune séance réelle', () => {
    // `refuse` écarte de ses calculs la séance qu'il évalue, en la
    // reconnaissant par son id. Une collision effacerait une vraie séance de
    // l'examen.
    expect(CANDIDATE_ID).toContain(':')
  })
})

describe('les bons jours', () => {
  it('donne un verdict par jour, à partir d’aujourd’hui', () => {
    const verdicts = verdictsFor(workout(), '2026-09-10', 3, context())
    expect(verdicts.map((v) => v.date)).toEqual(['2026-09-10', '2026-09-11', '2026-09-12'])
  })

  it('dit oui quand rien ne s’y oppose', () => {
    const verdicts = verdictsFor(workout(), '2026-09-10', 3, context())
    expect(verdicts.every((v) => v.refusal === null)).toBe(true)
  })

  it('refuse le lendemain d’une journée chargée, et pas les autres', () => {
    const ctx = context({ days: [observed('2026-09-10', 115)] })
    const verdicts = verdictsFor(workout(), '2026-09-10', 4, ctx)

    expect(verdicts[1]?.refusal?.code).toBe('veille-chargee')
    expect(verdicts[3]?.refusal).toBeNull()
  })

  it('tient compte de ce qui est déjà planifié', () => {
    const existing: PlannedSession = {
      id: 'e9',
      date: '2026-09-12',
      load: 90,
      kind: 'endurance',
    }
    const verdicts = verdictsFor(workout(), '2026-09-10', 4, context({ planned: [existing] }))

    // Le 12 porte déjà une séance de qualité, le 11 et le 13 la touchent.
    expect(verdicts.find((v) => v.date === '2026-09-12')?.refusal).not.toBeNull()
    expect(verdicts.find((v) => v.date === '2026-09-10')?.refusal).toBeNull()
  })

  it('n’écarte jamais une vraie séance en s’examinant elle-même', () => {
    // Une séance réelle portant la même date doit rester visible du moteur :
    // c'est elle qui doit faire refuser le jour.
    const twin: PlannedSession = { id: 'e1', date: '2026-09-10', load: 90, kind: 'endurance' }
    const verdicts = verdictsFor(workout(), '2026-09-10', 1, context({ planned: [twin] }))
    expect(verdicts[0]?.refusal).not.toBeNull()
  })
})

describe('l’événement posé', () => {
  it('recopie la structure sans y toucher', () => {
    expect(eventFor(workout(), '2026-09-12')).toEqual({
      category: 'WORKOUT',
      start_date_local: '2026-09-12T00:00:00',
      name: 'Endurance 45',
      description: '- 5m z1\n- 35m z2\n- 5m z1',
      type: 'VirtualRide',
      moving_time: 2700,
    })
  })

  it('n’invente pas les champs que la bibliothèque n’a pas', () => {
    const bare = eventFor(workout({ description: null, type: null, movingTime: null }), '2026-09-12')
    expect(bare).toEqual({
      category: 'WORKOUT',
      start_date_local: '2026-09-12T00:00:00',
      name: 'Endurance 45',
    })
  })

  it('n’envoie jamais la charge : c’est intervals.icu qui la calcule', () => {
    // « Aucun calcul de charge maison » — et une charge écrite à la main
    // serait pire qu'un calcul : elle serait figée.
    expect(eventFor(workout(), '2026-09-12')).not.toHaveProperty('icu_training_load')
  })

  it('se rabat sur un nom générique plutôt que d’en manquer', () => {
    expect(eventFor(workout({ name: null }), '2026-09-12')).toMatchObject({ name: 'Séance' })
  })
})
