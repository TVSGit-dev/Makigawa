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
  unloadLevel,
  workSeconds,
  zoneOfFamily,
  zoneOfBlocks,
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

  it('n’invente pas de zone pour un nom qu’elle ne reconnaît pas', () => {
    expect(zoneOfName('Coach — bloc 3 semaine 2')).toBeNull()
    expect(zoneOfName(null)).toBeNull()
  })
})

describe('la zone lue sur la structure (E.21)', () => {
  it('reconnaît chaque famille du catalogue à ses blocs seuls', () => {
    const attendu: Record<string, string> = {
      endurance: 'endurance',
      tempo: 'tempo',
      'sweet-spot': 'sweet-spot',
      'sweet-spot-continu': 'sweet-spot',
      seuil: 'seuil',
      'vo2-30-30': 'vo2',
      'vo2-30-15': 'vo2',
      navette: 'anaerobie',
    }
    for (const [key, zone] of Object.entries(attendu)) {
      const workout = compose(familyOf(key)!, 45)
      expect(zoneOfBlocks(workout.blocks), key).toBe(zone)
    }
  })

  it('sépare le sweet spot du seuil, qui culminent tous deux vers 95 %', () => {
    // C'est la pointe au-dessus de 100 % qui les distingue.
    expect(zoneOfBlocks([{ seconds: 90, percent: 95 }, { seconds: 90, percent: 85 }])).toBe(
      'sweet-spot',
    )
    // Trois répétitions du motif de seuil : le long travail à 95 % dépasse
    // trois minutes, ce que le VO2 max n'a jamais.
    const seuil = [0, 1, 2].flatMap(() => [
      { seconds: 120, percent: 95 },
      { seconds: 30, percent: 110 },
    ])
    expect(zoneOfBlocks(seuil)).toBe('seuil')

    // Le même nombre de pointes, sans le travail à 95 % : c'est du VO2 max.
    const vo2 = [0, 1, 2, 3, 4, 5].flatMap(() => [
      { seconds: 30, percent: 115 },
      { seconds: 30, percent: 65 },
    ])
    expect(zoneOfBlocks(vo2)).toBe('vo2')
  })

  it('ignore les ouvertures, qui ne sont pas du travail', () => {
    // Deux sprints de quinze secondes à 200 % ne font pas une séance
    // anaérobie.
    const avecOuvertures = [
      { seconds: 15, percent: 200 },
      { seconds: 60, percent: 55 },
      { seconds: 600, percent: 65 },
    ]
    expect(zoneOfBlocks(avecOuvertures)).toBe('endurance')
  })

  it('ne dit rien d’une structure vide ou trop douce', () => {
    expect(zoneOfBlocks([])).toBeNull()
    expect(zoneOfBlocks([{ seconds: 600, percent: 40 }])).toBeNull()
  })

  it('fait monter un niveau sur une séance nommée autrement', () => {
    // Le nom garde la priorité ; la structure est le recours.
    const inconnue = event({ name: 'Bloc 3 semaine 2', description: '- 5m 45%\n- 20m 90%' })
    const held = heldFrom([completion({ event: inconnue })])
    expect(held[0]?.zone).toBe('sweet-spot')
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

  it('lit la structure quand le nom ne dit rien (E.21)', () => {
    // Vingt minutes à 90 % sont du sweet spot, quel que soit le nom.
    const inconnue = event({ name: 'Bloc 3 semaine 2', description: '- 20m 90%' })
    expect(heldFrom([completion({ event: inconnue })])[0]?.zone).toBe('sweet-spot')
  })

  it('ne fait rien monter sur une structure ambiguë', () => {
    // Faire monter le mauvais niveau serait pire que de n'en monter aucun.
    const molle = event({ name: 'Bloc 3', description: '- 20m 40%' })
    expect(heldFrom([completion({ event: molle })])).toEqual([])
  })

  it('ignore une séance sans structure lisible', () => {
    const sansBlocs = event({ name: 'Sweet spot', description: 'à sentir' })
    expect(heldFrom([completion({ event: sansBlocs })])).toEqual([])
  })
})

describe('le niveau d’une semaine de décharge (E.18)', () => {
  it('vise à peu près la moitié du travail tenu', () => {
    // Le C.4 demande −40 à −60 %.
    for (const zone of ZONES) {
      for (let level = 4; level <= LEVELS; level += 1) {
        const allege = unloadLevel(zone, level)
        const part = LADDERS[zone][allege - 1]! / LADDERS[zone][level - 1]!
        expect(part, `${zone} niveau ${level}`).toBeGreaterThanOrEqual(0.4)
        expect(part, `${zone} niveau ${level}`).toBeLessThanOrEqual(0.6)
      }
    }
  })

  it('ne descend jamais sous le premier échelon', () => {
    // On ne peut pas aller en dessous de la plus petite séance qui existe.
    expect(unloadLevel('seuil', 1)).toBe(1)
    expect(unloadLevel('seuil', 0)).toBe(1)
    expect(unloadLevel('seuil', 2)).toBe(1)
  })

  it('allège toujours, jamais l’inverse', () => {
    for (const zone of ZONES) {
      for (let level = 1; level <= LEVELS; level += 1) {
        expect(unloadLevel(zone, level), `${zone} ${level}`).toBeLessThanOrEqual(
          Math.max(1, level),
        )
      }
    }
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
