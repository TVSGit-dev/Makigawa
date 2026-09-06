import { describe, expect, it } from 'vitest'
import type { CalendarEvent } from '../api/intervals'
import { changeFor, halveStructure } from './apply'
import type { Proposal } from '../rules/decide'

const event = (over: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id: 'e1',
  startDateLocal: '2026-09-10T18:30:00',
  name: 'Endurance 45',
  description: '- 5m z1\n- 35m z2\n- 5m z1',
  category: 'WORKOUT',
  type: 'VirtualRide',
  movingTime: 2700,
  trainingLoad: 55,
  raw: {},
  ...over,
})

const because: Proposal & { action: 'decaler' } = {
  action: 'decaler',
  to: '2026-09-12',
  because: { code: 'veille-chargee' },
}

describe('raccourcir une structure', () => {
  it('divise chaque durée par deux', () => {
    expect(halveStructure('- 10m z2\n- 20m z3')).toBe('- 5m z2\n- 10m z3')
  })

  it('ne touche jamais aux zones', () => {
    // « Durée de moitié, intensité inchangée » : la ressource rare est
    // l'intensité, la raccourcir la détruirait.
    const halved = halveStructure('- 12m z2\n- 8m z4\n- 5m z2\n- 8m z4')
    expect(halved).toBe('- 6m z2\n- 4m z4\n- 3m z2\n- 4m z4')
  })

  it('n’ajoute ni ne retire aucun bloc', () => {
    const source = '- 10m z2\n- 1m z5\n- 2m z2\n- 1m z5\n- 5m z1'
    expect(halveStructure(source)?.split('\n')).toHaveLength(5)
  })

  it('garde une minute plutôt que de faire disparaître un bloc', () => {
    expect(halveStructure('- 1m z5')).toBe('- 1m z5')
  })

  it('sait raccourcir des secondes', () => {
    expect(halveStructure('- 30s z6')).toBe('- 15s z6')
  })

  it('traverse les lignes vides sans broncher', () => {
    expect(halveStructure('- 10m z2\n\n- 10m z3')).toBe('- 5m z2\n\n- 5m z3')
  })

  it('ne lit que la durée, et recopie la cible quelle qu’elle soit', () => {
    // La règle ne dit rien de la façon dont la cible est écrite : zone,
    // pourcentage, watts ou rampe, elle est recopiée telle quelle. Une rampe
    // deux fois plus courte monte toujours de 50 à 70 %.
    expect(halveStructure('- 10m ramp 50-70%')).toBe('- 5m ramp 50-70%')
    expect(halveStructure('- 20m 75%')).toBe('- 10m 75%')
  })

  it('renonce dès qu’une ligne n’est pas comprise', () => {
    // Refuser est sûr, deviner ne l'est pas : une structure à demi traduite
    // serait pire qu'une séance laissée entière. Une répétition surtout —
    // diviser la durée d'un bloc répété quatre fois n'en divise pas le total.
    expect(halveStructure('- 10m z2\n3x 5m z4')).toBeNull()
    expect(halveStructure('4x\n- 5m z4\n- 5m z2')).toBeNull()
    expect(halveStructure('Échauffement libre')).toBeNull()
    expect(halveStructure('- 1:30 z2')).toBeNull()
    expect(halveStructure('- z2')).toBeNull()
  })

  it('renonce sur une séance sans structure', () => {
    expect(halveStructure(null)).toBeNull()
    expect(halveStructure('')).toBeNull()
    expect(halveStructure('\n\n')).toBeNull()
  })
})

describe('l’écriture que suppose une proposition', () => {
  it('n’écrit rien quand la séance est gardée', () => {
    expect(changeFor(event(), { action: 'garder' })).toBeNull()
  })

  it('décale sans toucher au contenu', () => {
    const change = changeFor(event(), because)
    expect(change).toEqual({
      kind: 'move',
      to: '2026-09-12',
      body: { start_date_local: '2026-09-12T18:30:00' },
    })
  })

  it('garde l’heure de la séance en la décalant', () => {
    const change = changeFor(event({ startDateLocal: '2026-09-10T07:15:00' }), because)
    expect(change).toMatchObject({ body: { start_date_local: '2026-09-12T07:15:00' } })
  })

  it('se rabat sur minuit quand la date n’en portait pas', () => {
    const change = changeFor(event({ startDateLocal: '2026-09-10' }), because)
    expect(change).toMatchObject({ body: { start_date_local: '2026-09-12T00:00:00' } })
  })

  it('réduit en ne réécrivant que les durées', () => {
    const proposal: Proposal = { action: 'reduire', load: 27.5, because: { code: 'veille-chargee' } }
    expect(changeFor(event(), proposal)).toEqual({
      kind: 'shorten',
      description: '- 3m z1\n- 18m z2\n- 3m z1',
      body: { description: '- 3m z1\n- 18m z2\n- 3m z1' },
    })
  })

  it('renvoie la réduction à l’athlète quand la structure lui échappe', () => {
    const proposal: Proposal = { action: 'reduire', load: 27.5, because: { code: 'veille-chargee' } }
    const change = changeFor(event({ description: 'Sortie libre, 2 h' }), proposal)
    expect(change?.kind).toBe('byHand')
  })

  it('supprime, sans rien laisser derrière', () => {
    // E.3 : « pas de report, pas de marque, pas de mention ».
    const proposal: Proposal = { action: 'abandonner', because: { code: 'veille-chargee' } }
    expect(changeFor(event(), proposal)).toEqual({ kind: 'drop' })
  })
})
