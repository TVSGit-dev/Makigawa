import { describe, expect, it } from 'vitest'
import { familiesFor, planWeek } from './week'
import type { Context } from '../rules/decide'
import type { DayRecord, PlannedSession } from '../rules/types'
import { levelOf } from '../rules/scale'

const observed = (date: string, load: number): DayRecord => ({
  date,
  observedLoad: load,
  peakSeconds: 0,
})

const context = (over: Partial<Context> = {}): Context => ({
  today: '2026-09-07',
  days: [],
  planned: [],
  intent: 'normal',
  tsb: 0,
  ...over,
})

const plan = (over: Partial<Context> = {}, fitness: number | null = 17) =>
  planWeek({ context: context(over), today: '2026-09-07', fitness })

describe('ce que la forme ouvre', () => {
  it('garde les séances dures fermées tant que la forme est basse', () => {
    // Le risque n'est pas de manquer de forme, c'est de se sentir capable
    // avant d'être prêt : les tissus se réadaptent plus lentement.
    const keys = familiesFor(17).map((family) => family.key)
    expect(keys).toEqual(['endurance', 'tempo', 'sweet-spot'])
  })

  it('ouvre le seuil, puis le VO2 max, à mesure que la forme monte', () => {
    expect(familiesFor(30).map((f) => f.key)).toContain('seuil')
    expect(familiesFor(30).map((f) => f.key)).not.toContain('vo2-30-30')
    expect(familiesFor(45).map((f) => f.key)).toContain('vo2-30-30')
  })

  it('reste prudent quand la forme est inconnue', () => {
    expect(familiesFor(null).map((f) => f.key)).toEqual(['endurance', 'tempo', 'sweet-spot'])
  })
})

describe('le planning proposé', () => {
  it('propose autant de séances que le mode en autorise', () => {
    expect(plan({ intent: 'prudent' })).toHaveLength(1)
    expect(plan({ intent: 'normal' })).toHaveLength(2)
    expect(plan({ intent: 'ambitieux' })).toHaveLength(3)
  })

  it('commence par la séance la plus exigeante', () => {
    // Elle est posée quand la fraîcheur est la meilleure.
    const semaine = plan()
    expect(semaine[0]?.workout.family.key).toBe('sweet-spot')
    expect(semaine[1]?.workout.family.key).toBe('tempo')
  })

  it('fait la première plus longue que les suivantes', () => {
    const semaine = plan()
    expect(semaine[0]!.workout.seconds).toBeGreaterThan(semaine[1]!.workout.seconds)
  })

  it('n’enchaîne jamais deux séances de qualité', () => {
    // Chaque séance retenue entre dans le décor de la suivante : sans cela
    // l'app se contredirait au premier examen.
    for (const intent of ['normal', 'ambitieux'] as const) {
      const dates = plan({ intent }, 45).map((s) => s.date).sort()
      for (let i = 1; i < dates.length; i += 1) {
        expect(dates[i], `${intent} : ${dates[i - 1]} puis ${dates[i]}`).not.toBe(dates[i - 1])
        const veille = new Date(`${dates[i - 1]}T00:00:00`)
        const jour = new Date(`${dates[i]}T00:00:00`)
        expect((jour.getTime() - veille.getTime()) / 86_400_000).toBeGreaterThan(1)
      }
    }
  })

  it('ne pose rien le lendemain d’une journée chargée', () => {
    const semaine = plan({ days: [observed('2026-09-07', 140)] })
    expect(semaine.map((s) => s.date)).not.toContain('2026-09-08')
  })

  it('contourne une séance déjà au calendrier', () => {
    const existante: PlannedSession = {
      id: 'e1',
      date: '2026-09-08',
      load: 90,
      kind: 'endurance',
    }
    const dates = plan({ planned: [existante] }).map((s) => s.date)
    // Ni le jour même, ni ses voisins : deux séances de qualité ne se suivent
    // jamais.
    expect(dates).not.toContain('2026-09-07')
    expect(dates).not.toContain('2026-09-08')
    expect(dates).not.toContain('2026-09-09')
  })

  it('propose moins plutôt que de proposer mal', () => {
    // Sous le plancher de fraîcheur du mode, aucun jour ne convient.
    expect(plan({ tsb: -50 })).toEqual([])
  })

  it('dit pourquoi chaque séance est là', () => {
    for (const suggestion of plan()) {
      expect(suggestion.because.length).toBeGreaterThan(10)
    }
  })

  it('adapte son explication à une forme basse', () => {
    expect(plan({}, 17)[0]?.because).toContain('forme est encore basse')
    expect(plan({}, 45)[0]?.because).not.toContain('forme est encore basse')
  })
})

describe('refuser, ou repousser (E.14)', () => {
  const refuse = (keys: string[], fitness: number | null = 17) =>
    planWeek({ context: context(), today: '2026-09-07', fitness, refused: keys })

  it('propose autre chose quand une famille est écartée', () => {
    // « Pas celle-ci » écarte la famille, pas le jour.
    const avant = plan()
    expect(avant[0]?.workout.family.key).toBe('sweet-spot')

    const apres = refuse(['sweet-spot'])
    expect(apres.map((s) => s.workout.family.key)).not.toContain('sweet-spot')
    expect(apres.length).toBe(avant.length)
  })

  it('ne repêche jamais une famille refusée', () => {
    // Redemander ce qu'on vient de refuser serait ne pas avoir entendu.
    expect(refuse(['endurance', 'tempo', 'sweet-spot'])).toEqual([])
  })

  it('recule le plan entier derrière un report', () => {
    const repousse = planWeek({
      context: context(),
      today: '2026-09-07',
      fitness: 17,
      notBefore: '2026-09-09',
    })
    for (const suggestion of repousse) {
      expect(suggestion.date >= '2026-09-09').toBe(true)
    }
    expect(repousse[0]?.date).toBe('2026-09-09')
  })

  it('replace les suivantes autour de la première repoussée', () => {
    // L'adaptation du reste : le plan est recalculé, jamais rapiécé.
    const repousse = planWeek({
      context: context({ intent: 'ambitieux' }),
      today: '2026-09-07',
      fitness: 45,
      notBefore: '2026-09-10',
    })
    const dates = repousse.map((s) => s.date).sort()
    expect(dates.length).toBeGreaterThan(1)
    expect(dates[0]).toBe('2026-09-10')
    for (let i = 1; i < dates.length; i += 1) {
      const veille = new Date(`${dates[i - 1]}T00:00:00`)
      const jour = new Date(`${dates[i]}T00:00:00`)
      expect((jour.getTime() - veille.getTime()) / 86_400_000).toBeGreaterThan(1)
    }
  })

  it('ne rogne pas l’horizon en repoussant', () => {
    // Repousser déplace la fenêtre, il ne la raccourcit pas : sinon
    // repousser assez loin finirait par ne plus rien proposer.
    const loin = planWeek({
      context: context({ intent: 'ambitieux' }),
      today: '2026-09-07',
      fitness: 45,
      notBefore: '2026-09-25',
    })
    expect(loin).toHaveLength(3)
  })

  it('ignore un report déjà passé', () => {
    const passe = planWeek({
      context: context(),
      today: '2026-09-07',
      fitness: 17,
      notBefore: '2026-09-01',
    })
    expect(passe.map((s) => s.date)).toEqual(plan().map((s) => s.date))
  })

  it('ne descend pas d’un cran l’exigence de la semaine', () => {
    // Refuser du seuil parce qu'on n'en a pas envie ne veut pas dire qu'on
    // est fatigué : l'app prend la famille suivante, pas la plus douce.
    const apres = planWeek({
      context: context(),
      today: '2026-09-07',
      fitness: 45,
      refused: ['navette'],
    })
    expect(apres[0]?.workout.family.key).toBe('vo2-30-15')
  })
})

describe('ce que le planning respecte', () => {
  it('tient le quota de journées chargées du mode', () => {
    const semaine = plan({ intent: 'normal' }, 45)
    const jours = new Set(semaine.map((s) => s.date))
    expect(jours.size).toBeLessThanOrEqual(2)
  })

  it('ne propose jamais une séance dont la charge serait inventée', () => {
    // La charge vient d'intervals.icu, calculée depuis la structure.
    for (const suggestion of plan()) {
      expect(suggestion.workout).not.toHaveProperty('load')
      expect(levelOf(0)).toBe(0)
    }
  })
})
