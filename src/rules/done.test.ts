import { describe, expect, it } from 'vitest'
import {
  daysSinceQuality,
  intentAfterReprise,
  isQualityActivity,
  isReprise,
  matchCompletions,
} from './done'
import type { Activity, CalendarEvent } from '../api/intervals'

const event = (over: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id: 'e1',
  startDateLocal: '2026-09-04T00:00:00',
  name: 'Sweet spot 2 × 12 min',
  description: '- 12m 90%',
  category: 'WORKOUT',
  type: 'VirtualRide',
  movingTime: 2700,
  trainingLoad: 80,
  raw: {},
  ...over,
})

const activity = (over: Partial<Activity> = {}): Activity => ({
  id: 'a1',
  name: 'Zwift',
  type: 'VirtualRide',
  startDateLocal: '2026-09-04T18:00:00',
  trainingLoad: 78,
  pairedEventId: null,
  raw: {},
  ...over,
})

const match = (events: CalendarEvent[], activities: Activity[]) =>
  matchCompletions({ events, activities, today: '2026-09-07', since: '2026-08-01' })

describe('retrouver la séance dans ce qui a été fait', () => {
  it('suit d’abord l’appariement d’intervals.icu', () => {
    // Une activité d'un autre jour, mais qu'intervals.icu a liée : c'est lui
    // qui apparie, on relaie.
    const lie = activity({ startDateLocal: '2026-09-05T18:00:00', pairedEventId: 'e1' })
    const [fait] = match([event()], [lie])
    expect(fait?.activity?.id).toBe('a1')
    expect(fait?.outcome).toBe('tenue')
  })

  it('se rabat sur le même jour et la même nature', () => {
    const [fait] = match([event()], [activity()])
    expect(fait?.activity?.id).toBe('a1')
  })

  it('ne voit jamais un trajet électrique comme une séance', () => {
    // La règle critique du projet : un trajet porte une charge, ce n'est
    // jamais une séance.
    const trajet = activity({ type: 'EBikeRide', trainingLoad: 90 })
    expect(match([event({ type: 'Ride' })], [trajet])[0]?.outcome).toBe('absente')
  })

  it('ne voit pas non plus un trajet musculaire comme une séance', () => {
    const trajet = activity({ type: 'Ride', name: 'Hard Commute', trainingLoad: 115 })
    expect(match([event({ type: 'Ride' })], [trajet])[0]?.outcome).toBe('absente')
  })

  it('n’apparie pas deux séances à la même sortie', () => {
    // Sans quoi une seule sortie ferait passer deux séances pour tenues.
    const faits = match([event({ id: 'e1' }), event({ id: 'e2' })], [activity()])
    expect(faits.map((fait) => fait.outcome)).toEqual(['tenue', 'absente'])
  })

  it('prend l’activité dont la charge est la plus proche', () => {
    const loin = activity({ id: 'a2', trainingLoad: 20 })
    const proche = activity({ id: 'a3', trainingLoad: 82 })
    expect(match([event()], [loin, proche])[0]?.activity?.id).toBe('a3')
  })

  it('ne juge pas la journée en cours ni le futur', () => {
    const faits = match(
      [event({ startDateLocal: '2026-09-07T00:00:00' }), event({ id: 'e2', startDateLocal: '2026-09-09T00:00:00' })],
      [],
    )
    expect(faits).toEqual([])
  })

  it('ignore ce qui n’est pas une séance', () => {
    expect(match([event({ category: 'SEASON_START' })], [])).toEqual([])
  })
})

describe('ce que la comparaison dit', () => {
  const outcome = (planned: number | null, done: number | null) =>
    match([event({ trainingLoad: planned })], done === null ? [] : [activity({ trainingLoad: done })])[0]
      ?.outcome

  it('appelle tenue une séance faite à 85 % ou plus', () => {
    expect(outcome(100, 100)).toBe('tenue')
    expect(outcome(100, 85)).toBe('tenue')
  })

  it('appelle allégée une séance faite entre la moitié et 85 %', () => {
    expect(outcome(100, 84)).toBe('allegee')
    expect(outcome(100, 50)).toBe('allegee')
  })

  it('appelle absente ce qui est en dessous de la moitié, ou rien', () => {
    expect(outcome(100, 49)).toBe('absente')
    expect(outcome(100, null)).toBe('absente')
  })

  it('tient pour tenue une séance sans charge prévue mais réalisée', () => {
    // Il n'y a rien à comparer, et l'activité existe.
    expect(outcome(null, 60)).toBe('tenue')
  })
})

describe('la reprise du E.5', () => {
  const quality = (date: string, over: Partial<Activity> = {}) =>
    activity({ startDateLocal: `${date}T09:00:00`, type: 'Ride', trainingLoad: 90, ...over })

  it('compte les jours depuis la dernière séance de qualité', () => {
    expect(daysSinceQuality([quality('2026-09-02')], '2026-09-07', 42)).toBe(5)
  })

  it('ne remet pas le compteur à zéro sur un trajet', () => {
    // Le E.5 l'exige : les trajets entretiennent la base, ils ne comptent pas.
    const trajets = [
      quality('2026-09-06', { type: 'EBikeRide' }),
      quality('2026-09-06', { id: 'a2', name: 'Hard Commute', trainingLoad: 115 }),
    ]
    expect(daysSinceQuality(trajets, '2026-09-07', 42)).toBe(42)
  })

  it('ne compte pas une sortie trop légère', () => {
    expect(isQualityActivity(quality('2026-09-06', { trainingLoad: 30 }))).toBe(false)
    expect(isQualityActivity(quality('2026-09-06', { trainingLoad: 90 }))).toBe(true)
  })

  it('ne décide rien quand l’historique est vide', () => {
    // Une donnée manquante ne doit pas se transformer en verdict.
    expect(daysSinceQuality([], '2026-09-07', 42)).toBeNull()
    expect(isReprise(null)).toBe(false)
  })

  it('bascule en reprise au bout de quatorze jours', () => {
    expect(isReprise(13)).toBe(false)
    expect(isReprise(14)).toBe(true)
  })

  it('force le mode prudent, et rien de plus', () => {
    expect(intentAfterReprise('ambitieux', true)).toBe('prudent')
    expect(intentAfterReprise('ambitieux', false)).toBe('ambitieux')
  })
})
