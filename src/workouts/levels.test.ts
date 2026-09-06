import { describe, expect, it } from 'vitest'
import {
  composeAtLevel,
  heldFrom,
  LADDERS,
  LEVELS,
  levelIn,
  levelOfWork,
  levelsFrom,
  MAX_MINUTES,
  nextLevel,
  workSeconds,
  zoneOfFamily,
  zoneOfName,
  ZONES,
  type Held,
} from './levels'
import { familyOf } from './families'
import { compose, toNotation } from './compose'
import { blocksOf } from './read'
import type { Completion } from '../rules/done'
import type { CalendarEvent } from '../api/intervals'

const event = (over: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id: 'e1',
  startDateLocal: '2026-09-04T00:00:00',
  name: 'Sweet spot 2 × 12 min',
  description: null,
  category: 'WORKOUT',
  type: 'VirtualRide',
  movingTime: 2700,
  trainingLoad: 80,
  raw: {},
  ...over,
})

const completion = (over: Partial<Completion> = {}): Completion => ({
  event: event(),
  date: '2026-09-04',
  planned: 80,
  activity: null,
  done: 78,
  outcome: 'tenue',
  ...over,
})

/** Une séance composée, telle qu'elle revient du calendrier : par sa notation. */
const asPlanned = (familyKey: string, minutes: number) => {
  const family = familyOf(familyKey)!
  const workout = compose(family, minutes)
  return event({ name: workout.name, description: toNotation(workout) })
}

describe('les zones', () => {
  it('regroupe les familles qui construisent la même chose', () => {
    expect(zoneOfFamily('sweet-spot')).toBe('sweet-spot')
    expect(zoneOfFamily('sweet-spot-continu')).toBe('sweet-spot')
    expect(zoneOfFamily('vo2-30-30')).toBe('vo2')
    expect(zoneOfFamily('vo2-30-15')).toBe('vo2')
  })

  it('couvre toutes les familles du catalogue', () => {
    for (const key of [
      'endurance', 'tempo', 'sweet-spot', 'sweet-spot-continu',
      'seuil', 'vo2-30-30', 'vo2-30-15', 'navette',
    ]) {
      expect(zoneOfFamily(key), key).not.toBeNull()
    }
  })

  it('reconnaît la zone au nom que Makigawa écrit', () => {
    expect(zoneOfName('Sweet spot 2 × 12 min')).toBe('sweet-spot')
    expect(zoneOfName('VO2 max 30/15 3 × 5 min')).toBe('vo2')
    expect(zoneOfName('Navette lactate 4 × 3 min')).toBe('anaerobie')
    expect(zoneOfName('Séance seuil')).toBe('seuil')
  })

  it('n’invente pas de zone pour une séance qu’elle ne reconnaît pas', () => {
    // Sous-estimation assumée : l'app proposera plus doux, jamais plus dur.
    expect(zoneOfName('Coach — bloc 3 semaine 2')).toBeNull()
    expect(zoneOfName(null)).toBeNull()
  })
})

describe('le temps de travail', () => {
  it('ne compte que les blocs d’effort', () => {
    const blocks = [
      { seconds: 300, percent: 45 },
      { seconds: 600, percent: 95 },
      { seconds: 240, percent: 65 },
    ]
    expect(workSeconds(blocks, 'sweet-spot')).toBe(600)
  })

  it('écarte les ouvertures sans écarter la navette', () => {
    // Deux sprints de quinze secondes réveillent sans fatiguer ; les vingt
    // secondes de la navette sont bel et bien le travail.
    expect(workSeconds([{ seconds: 15, percent: 200 }], 'anaerobie')).toBe(0)
    expect(workSeconds([{ seconds: 20, percent: 200 }], 'anaerobie')).toBe(20)
  })

  it('garde le « under » d’un over-under sweet spot', () => {
    expect(workSeconds([{ seconds: 90, percent: 85 }], 'sweet-spot')).toBe(90)
  })
})

describe('les échelons', () => {
  it('donne dix échelons à chaque zone, croissants', () => {
    for (const zone of ZONES) {
      const ladder = LADDERS[zone]
      expect(ladder, zone).toHaveLength(LEVELS)
      for (let i = 1; i < ladder.length; i += 1) {
        expect(ladder[i], `${zone} échelon ${i}`).toBeGreaterThan(ladder[i - 1]!)
      }
    }
  })

  it('vaut zéro tant que rien n’a été tenu', () => {
    expect(levelIn('seuil', [])).toBe(0)
    expect(levelOfWork('vo2', 0)).toBe(0)
  })

  it('retient la plus grosse séance de la zone', () => {
    const held: Held[] = [
      { zone: 'sweet-spot', seconds: 900 },
      { zone: 'sweet-spot', seconds: 1620 },
      { zone: 'seuil', seconds: 450 },
    ]
    expect(levelIn('sweet-spot', held)).toBe(5)
    expect(levelIn('seuil', held)).toBe(1)
    expect(levelsFrom(held).vo2).toBe(0)
  })
})

describe('ce qui compte comme tenu', () => {
  it('lit le niveau sur la structure d’une séance tenue', () => {
    const held = heldFrom([completion({ event: asPlanned('sweet-spot', 45) })])
    expect(held).toHaveLength(1)
    expect(held[0]?.zone).toBe('sweet-spot')
    expect(held[0]?.seconds).toBeGreaterThan(0)
  })

  it('ne compte ni les allégées ni les absentes', () => {
    // Le temps de travail se lit sur la structure prévue : compter une
    // séance faite à moitié au prix fort ferait monter un niveau non gagné.
    const planned = asPlanned('sweet-spot', 45)
    expect(heldFrom([completion({ event: planned, outcome: 'allegee' })])).toEqual([])
    expect(heldFrom([completion({ event: planned, outcome: 'absente' })])).toEqual([])
  })

  it('ignore une séance dont la famille n’est pas reconnaissable', () => {
    const inconnue = event({ name: 'Bloc 3 semaine 2', description: '- 20m 90%' })
    expect(heldFrom([completion({ event: inconnue })])).toEqual([])
  })

  it('ignore une séance sans structure lisible', () => {
    const sansBlocs = event({ name: 'Sweet spot', description: 'à sentir' })
    expect(heldFrom([completion({ event: sansBlocs })])).toEqual([])
  })
})

describe('la séance que le niveau vise', () => {
  it('monte d’un cran, jamais de deux', () => {
    expect(nextLevel(0)).toBe(1)
    expect(nextLevel(4)).toBe(5)
    expect(nextLevel(LEVELS)).toBe(LEVELS)
  })

  it('ne monte pas pendant une reprise', () => {
    // On reprend là où on s'était arrêté, on ne progresse pas le premier jour.
    expect(nextLevel(4, true)).toBe(4)
    expect(nextLevel(0, true)).toBe(1)
  })

  it('propose plus long à mesure que le niveau monte', () => {
    const bas = composeAtLevel(familyOf('sweet-spot')!, 1)
    const haut = composeAtLevel(familyOf('sweet-spot')!, 8)
    expect(haut.seconds).toBeGreaterThan(bas.seconds)
  })

  it('atteint le temps de travail visé quand c’est possible', () => {
    for (const key of ['tempo', 'sweet-spot', 'seuil', 'vo2-30-30']) {
      const family = familyOf(key)!
      const zone = zoneOfFamily(key)!
      for (const level of [1, 3, 5]) {
        const workout = composeAtLevel(family, level)
        expect(
          workSeconds(workout.blocks, zone),
          `${key} niveau ${level}`,
        ).toBeGreaterThanOrEqual(LADDERS[zone][level - 1]!)
      }
    }
  })

  it('ne dépasse jamais le plafond de temps', () => {
    // La contrainte de l'athlète n'est pas sa forme, c'est son agenda.
    for (const key of ['endurance', 'tempo', 'sweet-spot', 'seuil', 'vo2-30-30', 'navette']) {
      const workout = composeAtLevel(familyOf(key)!, LEVELS)
      expect(workout.seconds / 60, key).toBeLessThanOrEqual(MAX_MINUTES + 5)
    }
  })

  it('prend la plus courte séance qui atteint le niveau', () => {
    // Au-delà, on ajouterait de l'échauffement sans ajouter de travail.
    const family = familyOf('seuil')!
    const workout = composeAtLevel(family, 1)
    expect(workout.seconds).toBeLessThan(compose(family, 60).seconds)
  })

  it('relit ce qu’elle a écrit', () => {
    // Le niveau se lit sur la notation, donc l'aller-retour doit tenir.
    const workout = composeAtLevel(familyOf('sweet-spot')!, 4)
    const relu = workSeconds(blocksOf(toNotation(workout)), 'sweet-spot')
    expect(relu).toBe(workSeconds(workout.blocks, 'sweet-spot'))
  })
})
