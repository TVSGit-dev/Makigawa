import { describe, expect, it } from 'vitest'
import type { CalendarEvent } from '../api/intervals'
import { changeFor } from './apply'
import { asPlannedRide, openRideEvent, OPEN_RIDE_TARGETS } from './open-ride'
import { levelOf } from '../rules/scale'
import type { Proposal } from '../rules/decide'

const reduire: Proposal = { action: 'reduire', load: 70, because: { code: 'veille-chargee' } }

const openRide = (over: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id: 'e1',
  startDateLocal: '2026-09-12T00:00:00',
  name: 'Sortie longue · 140',
  description: 'Sortie libre, sans structure. Objectif : 140 de charge.',
  category: 'WORKOUT',
  type: 'Ride',
  movingTime: null,
  trainingLoad: 140,
  raw: {},
  ...over,
})

describe('la sortie ouverte', () => {
  it('pose une séance sans structure, avec sa charge visée', () => {
    expect(openRideEvent(140, '2026-09-12')).toEqual({
      category: 'WORKOUT',
      start_date_local: '2026-09-12T00:00:00',
      name: 'Sortie longue · 140',
      type: 'Ride',
      icu_training_load: 140,
      description: 'Sortie libre, sans structure. Objectif : 140 de charge.',
    })
  })

  it('envoie la charge, là où une séance structurée ne le fait jamais', () => {
    // C'est la différence de fond : une séance structurée tient sa charge de
    // ses blocs, une sortie ouverte n'a que sa charge visée. Sans elle, les
    // règles n'auraient rien à peser.
    expect(openRideEvent(200, '2026-09-12')).toHaveProperty('icu_training_load', 200)
  })

  it('distingue la sortie dehors de la Zwift libre', () => {
    // Le type décide de la façon dont intervals.icu et les règles la lisent.
    expect(openRideEvent(140, '2026-09-12', 'dehors')).toMatchObject({
      type: 'Ride',
      name: 'Sortie longue · 140',
    })
    expect(openRideEvent(60, '2026-09-12', 'zwift')).toMatchObject({
      type: 'VirtualRide',
      name: 'Zwift libre · 60',
    })
  })

  it('donne aux règles une séance qu’elles savent lire', () => {
    expect(asPlannedRide(140, '2026-09-12')).toMatchObject({ load: 140, kind: 'endurance' })
  })

  it('couvre toute l’échelle, de la journée légère à la plus lourde', () => {
    const niveaux = new Set(OPEN_RIDE_TARGETS.map((target) => levelOf(target.load)))
    expect([...niveaux].sort()).toEqual([1, 2, 3, 4])
  })

  it('propose des charges croissantes, chacune avec son repère', () => {
    const loads = OPEN_RIDE_TARGETS.map((target) => target.load)
    expect([...loads].sort((a, b) => a - b)).toEqual(loads)
    expect(OPEN_RIDE_TARGETS.every((target) => target.hint.length > 0)).toBe(true)
  })
})

describe('réduire une sortie ouverte', () => {
  it('divise la charge visée par deux, faute de structure à raccourcir', () => {
    expect(changeFor(openRide(), reduire)).toEqual({
      kind: 'lighten',
      load: 70,
      body: { icu_training_load: 70, name: 'Sortie longue · 70' },
    })
  })

  it('corrige le nom, qui annonçait l’ancienne charge', () => {
    const change = changeFor(openRide({ name: 'Sortie longue · 200', trainingLoad: 200 }), reduire)
    expect(change).toMatchObject({ body: { name: 'Sortie longue · 100' } })
  })

  it('laisse tranquille un nom qui n’annonce aucune charge', () => {
    const change = changeFor(openRide({ name: 'Balade avec les copains' }), reduire)
    expect(change).toEqual({ kind: 'lighten', load: 70, body: { icu_training_load: 70 } })
  })

  it('ne touche jamais à la charge d’une séance structurée', () => {
    // Une séance structurée tient sa charge de ses blocs : la réécrire à la
    // main la figerait. Même quand l'app ne sait pas lire la structure.
    const structured = openRide({ description: '3x 5m z4\n- 10m z2', trainingLoad: 90 })
    expect(changeFor(structured, reduire)?.kind).toBe('byHand')
  })

  it('reconnaît une structure même écrite autrement', () => {
    for (const description of ['- 20m z2', '4x\n- 5m z4', '  - 10m 80%']) {
      const change = changeFor(openRide({ description }), reduire)
      expect(change?.kind, description).not.toBe('lighten')
    }
  })

  it('renonce sur une séance libre sans charge connue', () => {
    const change = changeFor(openRide({ trainingLoad: null }), reduire)
    expect(change?.kind).toBe('byHand')
  })
})
