import { describe, expect, it } from 'vitest'
import { familiesFor, planWeek } from './week'
import type { Context } from '../rules/decide'
import type { DayRecord, PlannedSession } from '../rules/types'
import { levelOf } from '../rules/scale'
import { MAX_MINUTES, standingOf, STANDING_NAMES, ZONES, type Zone } from './levels'
import { asPlannedCommute } from '../actions/commute'

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
    expect(keys).toEqual(['recuperation', 'endurance', 'tempo', 'sweet-spot'])
  })

  it('ouvre le seuil, puis le VO2 max, à mesure que la forme monte', () => {
    expect(familiesFor(30).map((f) => f.key)).toContain('seuil')
    expect(familiesFor(30).map((f) => f.key)).not.toContain('vo2-30-30')
    expect(familiesFor(45).map((f) => f.key)).toContain('vo2-30-30')
  })

  it('reste prudent quand la forme est inconnue', () => {
    expect(familiesFor(null).map((f) => f.key)).toEqual([
      'recuperation',
      'endurance',
      'tempo',
      'sweet-spot',
    ])
  })
})

describe('le planning proposé', () => {
  it('couvre les deux semaines, au quota hebdomadaire du mode', () => {
    // L'horizon fait quatorze jours et le quota est hebdomadaire : le plan
    // porte donc deux semaines de séances (E.19).
    expect(plan({ intent: 'prudent' })).toHaveLength(2)
    expect(plan({ intent: 'normal' })).toHaveLength(4)
    expect(plan({ intent: 'ambitieux' })).toHaveLength(6)
  })

  it('commence par la séance la plus exigeante', () => {
    // Elle est posée quand la fraîcheur est la meilleure.
    const semaine = plan()
    expect(semaine[0]?.workout.family.key).toBe('sweet-spot')
    expect(semaine[1]?.workout.family.key).toBe('tempo')
  })

  it('part du premier échelon tant que rien n’a été tenu', () => {
    // La durée ne vient plus du rang de la séance dans la semaine mais du
    // niveau tenu dans sa zone (E.16).
    for (const suggestion of plan()) {
      expect(suggestion.because).toMatch(/forme est encore basse|plus court et plus doux/)
    }
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
    expect(refuse(['recuperation', 'endurance', 'tempo', 'sweet-spot'])).toEqual([])
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
    expect(loin).toHaveLength(6)
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
    expect(apres[0]?.workout.family.key).toBe('vo2-long')
  })
})

describe('les niveaux par zone (E.16)', () => {
  const withLevels = (levels: Partial<Record<Zone, number>>, reprise = false) =>
    planWeek({ context: context(), today: '2026-09-07', fitness: 17, levels, reprise })

  it('propose plus long quand le niveau est plus haut', () => {
    const bas = withLevels({ 'sweet-spot': 1 })[0]!
    const haut = withLevels({ 'sweet-spot': 7 })[0]!
    expect(haut.workout.family.key).toBe('sweet-spot')
    expect(haut.workout.seconds).toBeGreaterThan(bas.workout.seconds)
  })

  it('dit le niveau visé, et qu’il monte d’un cran', () => {
    expect(withLevels({ 'sweet-spot': 3 })[0]?.because).toContain('niveau 3')
    expect(withLevels({ 'sweet-spot': 3 })[0]?.because).toContain('vise le 4')
  })

  it('ne monte pas d’un cran pendant une reprise', () => {
    // On reprend là où on s'était arrêté (E.5).
    const reprise = withLevels({ 'sweet-spot': 3 }, true)[0]!
    const normal = withLevels({ 'sweet-spot': 3 })[0]!
    expect(reprise.workout.seconds).toBeLessThan(normal.workout.seconds)
    expect(reprise.because).toContain('sans monter')
  })

  it('ne fait pas déborder une séance au-delà du plafond de temps', () => {
    for (const zone of ZONES) {
      for (const suggestion of withLevels({ [zone]: 10 })) {
        expect(suggestion.workout.seconds / 60, zone).toBeLessThanOrEqual(MAX_MINUTES + 5)
      }
    }
  })

  it('n’ouvre pas une zone que la forme garde fermée', () => {
    // Un niveau élevé en VO2 max ne rouvre pas le VO2 max à CTL basse.
    const familles = withLevels({ vo2: 9 }).map((s) => s.workout.family.key)
    expect(familles).not.toContain('vo2-30-30')
    expect(familles).not.toContain('vo2-30-15')
  })
})

describe('les trajets dans le plan (E.17)', () => {
  const trajet = (date: string, kind: 'chill' | 'hard') => asPlannedCommute(kind, date)!

  it('ne laisse pas un trajet consommer la séance de la semaine', () => {
    // Un aller-retour musculaire pèse 115 : sans le drapeau, il passait pour
    // une séance de qualité et le mode prudent ne proposait plus rien.
    const semaine = planWeek({
      context: context({ intent: 'prudent', planned: [trajet('2026-09-08', 'hard')] }),
      today: '2026-09-07',
      fitness: 17,
    })
    expect(semaine.length).toBeGreaterThan(0)
  })

  it('s’écarte quand même des journées chargées par un trajet', () => {
    // Sa charge compte toujours : le jour et ses voisins restent pris.
    const dates = planWeek({
      context: context({ planned: [trajet('2026-09-09', 'hard')] }),
      today: '2026-09-07',
      fitness: 17,
    }).map((s) => s.date)
    expect(dates).not.toContain('2026-09-08')
    expect(dates).not.toContain('2026-09-09')
    expect(dates).not.toContain('2026-09-10')
  })

  it('ne bloque rien avec un trajet électrique', () => {
    const dates = planWeek({
      context: context({ planned: [trajet('2026-09-07', 'chill')] }),
      today: '2026-09-07',
      fitness: 17,
    }).map((s) => s.date)
    expect(dates).toContain('2026-09-07')
  })
})

describe('la semaine de décharge (E.18)', () => {
  const decharge = (levels: Partial<Record<Zone, number>>) =>
    planWeek({
      context: context({ intent: 'prudent' }),
      today: '2026-09-07',
      fitness: 17,
      levels,
      decharge: true,
    })

  const charge = (levels: Partial<Record<Zone, number>>) =>
    planWeek({ context: context({ intent: 'prudent' }), today: '2026-09-07', fitness: 17, levels })

  it('propose moins de travail que la semaine de charge', () => {
    const allegee = decharge({ 'sweet-spot': 8 })[0]!
    const pleine = charge({ 'sweet-spot': 8 })[0]!
    expect(allegee.workout.seconds).toBeLessThan(pleine.workout.seconds)
  })

  it('garde la même famille, donc la même intensité', () => {
    // Le C.4 : on allège le volume, on garde de quoi ne pas s'éteindre.
    const allegee = decharge({ 'sweet-spot': 8 })[0]!
    expect(allegee.workout.family.key).toBe(charge({ 'sweet-spot': 8 })[0]!.workout.family.key)
    expect(Math.max(...allegee.workout.blocks.map((b) => b.percent))).toBe(
      Math.max(...charge({ 'sweet-spot': 8 })[0]!.workout.blocks.map((b) => b.percent)),
    )
  })

  it('le dit', () => {
    expect(decharge({ 'sweet-spot': 8 })[0]?.because).toContain('décharge')
  })

  it('n’en propose qu’une, et ne déborde pas sur la semaine suivante', () => {
    // Une décharge ne concerne que la semaine en cours.
    expect(decharge({ 'sweet-spot': 8 })).toHaveLength(1)
  })
})

describe('ce que le planning respecte', () => {
  it('tient le quota de journées chargées du mode, semaine glissante', () => {
    // Le quota est hebdomadaire : c'est chaque fenêtre de sept jours qui doit
    // le respecter, pas le plan entier.
    const dates = plan({ intent: 'normal' }, 45).map((s) => s.date)
    for (const jour of dates) {
      const fin = new Date(`${jour}T00:00:00`)
      fin.setDate(fin.getDate() + 6)
      const dans = dates.filter(
        (autre) => autre >= jour && new Date(`${autre}T00:00:00`) <= fin,
      )
      expect(dans.length, `fenêtre du ${jour}`).toBeLessThanOrEqual(2)
    }
  })

  it('ne propose jamais une séance dont la charge serait inventée', () => {
    // La charge vient d'intervals.icu, calculée depuis la structure.
    for (const suggestion of plan()) {
      expect(suggestion.workout).not.toHaveProperty('load')
      expect(levelOf(0)).toBe(0)
    }
  })
})

describe('ce que vaut le cran proposé (E.26)', () => {
  it('dit « productive » un cran au-dessus de ce qui a été tenu', () => {
    expect(standingOf(4, 5)).toBe('productive')
  })

  it('dit « à ta portée » au niveau tenu ou en dessous', () => {
    expect(standingOf(6, 6)).toBe('portee')
    expect(standingOf(6, 3)).toBe('portee')
  })

  it('dit « un pari » deux crans au-dessus', () => {
    expect(standingOf(4, 6)).toBe('pari')
  })

  it('dit « inconnu » quand rien n’a été tenu dans la zone', () => {
    // Ce n'est pas un avertissement : une zone vierge est normale au début.
    expect(standingOf(0, 1)).toBe('inconnu')
    expect(standingOf(0, 5)).toBe('inconnu')
  })

  it('dit « inconnu » au-delà de deux crans', () => {
    expect(standingOf(2, 6)).toBe('inconnu')
  })

  it('tient une récupération toujours à portée', () => {
    // Elle ne progresse pas : la déclarer inconnue faute d'historique n'aurait
    // aucun sens (E.25).
    expect(standingOf(0, 1, 'recuperation')).toBe('portee')
  })

  it('accompagne chaque proposition du plan', () => {
    // Sans ce mot, refuser se fait à l'aveugle (E.14).
    const suggestions = planWeek({
      context: context(),
      today: '2026-09-07',
      fitness: 45,
      levels: { vo2: 3 },
    })
    expect(suggestions.length).toBeGreaterThan(0)
    for (const one of suggestions) {
      expect(Object.keys(STANDING_NAMES)).toContain(one.standing)
    }
  })
})
