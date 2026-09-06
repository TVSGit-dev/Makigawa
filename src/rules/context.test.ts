import { describe, expect, it } from 'vitest'
import type { Activity, CalendarEvent, Wellness } from '../api/intervals'
import {
  buildContext,
  freshnessOf,
  isCommute,
  isSession,
  kindOf,
  toDayRecords,
  toPlannedSessions,
} from './context'

const event = (over: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id: 'e1',
  startDateLocal: '2026-09-10T00:00:00',
  name: 'Endurance 45',
  description: '- 5m z1\n- 35m z2\n- 5m z1',
  category: 'WORKOUT',
  type: 'VirtualRide',
  movingTime: 2700,
  trainingLoad: 55,
  raw: {},
  ...over,
})

const activity = (over: Partial<Activity> = {}): Activity => ({
  id: 'a1',
  name: 'Trajet',
  type: 'EBikeRide',
  startDateLocal: '2026-09-09T08:00:00',
  trainingLoad: 18,
  raw: {},
  ...over,
})

const wellness = (over: Partial<Wellness> = {}): Wellness => ({
  date: '2026-09-10',
  ctl: 18,
  atl: 22,
  sleepScore: null,
  sleepSeconds: null,
  raw: {},
  ...over,
})

describe('ce qui compte comme une séance', () => {
  it('garde les séances et écarte les repères de calendrier', () => {
    expect(isSession(event({ category: 'WORKOUT' }))).toBe(true)
    expect(isSession(event({ category: 'SEASON_START' }))).toBe(false)
    expect(isSession(event({ category: 'NOTE' }))).toBe(false)
  })

  it('reconnaît la nature d’une séance à son type d’activité', () => {
    expect(kindOf('VirtualRide')).toBe('endurance')
    expect(kindOf('Ride')).toBe('endurance')
    expect(kindOf('WeightTraining')).toBe('force')
    expect(kindOf(null)).toBe('autre')
  })

  it('ne fait jamais du vélo électrique une séance d’endurance', () => {
    // La règle critique de CLAUDE.md : un trajet porte une charge, mais ce
    // n'est pas une séance, et il n'entre dans aucune règle d'espacement.
    expect(kindOf('EBikeRide')).toBe('autre')
    expect(isCommute('EBikeRide')).toBe(true)
    expect(isCommute('Ride')).toBe(false)
  })
})

describe('les séances planifiées', () => {
  it('traduit un événement en séance que les règles comprennent', () => {
    expect(toPlannedSessions([event()])).toEqual([
      { id: 'e1', date: '2026-09-10', load: 55, kind: 'endurance' },
    ])
  })

  it('écarte un événement sans identifiant', () => {
    // Sans identifiant, l'app ne peut ni le décaler ni le supprimer : lui
    // proposer quelque chose serait mentir.
    expect(toPlannedSessions([event({ id: null })])).toEqual([])
  })

  it('écarte un événement sans date exploitable', () => {
    expect(toPlannedSessions([event({ startDateLocal: null })])).toEqual([])
  })

  it('garde une séance sans charge connue, sans lui en inventer une', () => {
    expect(toPlannedSessions([event({ trainingLoad: null })])[0]?.load).toBeNull()
  })
})

describe('les journées observées', () => {
  it('additionne les activités d’une même journée', () => {
    const days = toDayRecords([
      activity({ id: 'aller', trainingLoad: 18 }),
      activity({ id: 'retour', trainingLoad: 17 }),
    ])
    expect(days).toEqual([{ date: '2026-09-09', observedLoad: 35, peakSeconds: 0 }])
  })

  it('sépare les journées et les range dans l’ordre', () => {
    const days = toDayRecords([
      activity({ startDateLocal: '2026-09-11T08:00:00' }),
      activity({ startDateLocal: '2026-09-09T08:00:00' }),
    ])
    expect(days.map((day) => day.date)).toEqual(['2026-09-09', '2026-09-11'])
  })

  it('compte pour zéro une activité sans charge, plutôt que d’en supposer une', () => {
    expect(toDayRecords([activity({ trainingLoad: null })])[0]?.observedLoad).toBe(0)
  })

  it('ignore une activité sans date', () => {
    expect(toDayRecords([activity({ startDateLocal: null })])).toEqual([])
  })
})

describe('la fraîcheur', () => {
  it('est la différence entre la forme et la fatigue d’intervals.icu', () => {
    expect(freshnessOf([wellness({ ctl: 18, atl: 22 })], '2026-09-10')).toBe(-4)
  })

  it('prend la journée la plus récente disponible', () => {
    // Le relevé du jour n'existe pas toujours quand on ouvre l'app le matin.
    const days = [wellness({ date: '2026-09-08', ctl: 10, atl: 10 }), wellness({ date: '2026-09-09', ctl: 18, atl: 25 })]
    expect(freshnessOf(days, '2026-09-10')).toBe(-7)
  })

  it('ne regarde jamais dans le futur', () => {
    const days = [wellness({ date: '2026-09-12', ctl: 40, atl: 10 })]
    expect(freshnessOf(days, '2026-09-10')).toBeNull()
  })

  it('renonce plutôt que de deviner quand la donnée manque', () => {
    expect(freshnessOf([wellness({ ctl: null })], '2026-09-10')).toBeNull()
    expect(freshnessOf([], '2026-09-10')).toBeNull()
  })
})

describe('le décor complet', () => {
  it('assemble ce que le moteur attend', () => {
    const context = buildContext({
      today: '2026-09-10',
      events: [event()],
      activities: [activity()],
      wellness: [wellness()],
      intent: 'normal',
    })

    expect(context).toEqual({
      today: '2026-09-10',
      days: [{ date: '2026-09-09', observedLoad: 18, peakSeconds: 0 }],
      planned: [{ id: 'e1', date: '2026-09-10', load: 55, kind: 'endurance' }],
      intent: 'normal',
      tsb: -4,
    })
  })

  it('prend une fraîcheur neutre quand elle est inconnue', () => {
    // Une donnée manquante ne doit pas devenir une interdiction : l'app ne
    // bloque pas une séance parce qu'elle ignore quelque chose.
    const context = buildContext({
      today: '2026-09-10',
      events: [],
      activities: [],
      wellness: [],
      intent: 'normal',
    })
    expect(context.tsb).toBe(0)
  })
})
