import { describe, expect, it } from 'vitest'
import { adviseCommute, commuteVerdicts, COMMUTE_OPTIONS, isWorkday } from './commute'
import type { Context } from '../rules/decide'
import type { DayRecord, PlannedSession } from '../rules/types'

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

const advise = (over: Partial<Context> = {}, date = '2026-09-07') =>
  adviseCommute(date, context(over))

describe('les trois réponses', () => {
  it('va de la plus exigeante à la plus économe', () => {
    const loads = COMMUTE_OPTIONS.map((option) => option.load)
    expect(loads).toEqual([...loads].sort((a, b) => b - a))
  })

  it('reprend les charges relevées par l’athlète, sans en inventer', () => {
    expect(COMMUTE_OPTIONS.map((o) => o.load)).toEqual([115, 58, 35])
  })

  it('n’écrit jamais un trajet électrique comme un Ride', () => {
    // La règle critique : ce vélo n'a pas de capteur, son type doit le dire.
    const electrique = COMMUTE_OPTIONS.find((o) => o.choice === 'electrique')!
    expect(electrique.where).toBe('chill')
  })
})

describe('ce que l’app recommande', () => {
  it('propose les jambes quand rien ne s’y oppose', () => {
    expect(advise().option.choice).toBe('aller-retour')
    expect(advise().refused).toEqual([])
  })

  it('descend d’un cran après une journée chargée', () => {
    // Le E.2 refuse l'aller-retour, qui ferait une seconde journée chargée.
    const apres = advise({ days: [observed('2026-09-06', 140)] })
    expect(apres.option.choice).not.toBe('aller-retour')
    expect(apres.refused[0]?.reason.code).toBe('veille-chargee')
  })

  it('bascule sur la batterie quand la fraîcheur est au plancher', () => {
    const epuise = advise({ tsb: -40 })
    expect(epuise.option.choice).toBe('electrique')
    expect(epuise.refused).toHaveLength(2)
  })

  it('protège une séance de qualité prévue le même jour', () => {
    const seance: PlannedSession = {
      id: 'e1',
      date: '2026-09-07',
      load: 90,
      kind: 'endurance',
    }
    expect(advise({ planned: [seance] }).option.choice).toBe('electrique')
  })

  it('répond toujours quelque chose', () => {
    // Il va au travail de toute façon : une question sans réponse serait
    // une app qui ne sert à rien ce matin-là.
    for (const tsb of [-60, -20, 0, 20]) {
      expect(advise({ tsb }).option).toBeDefined()
    }
  })

  it('dit ce qu’elle a écarté, et pourquoi', () => {
    const apres = advise({ tsb: -40 })
    for (const { option, reason } of apres.refused) {
      expect(option.choice).not.toBe('electrique')
      expect(reason.code).toBeTruthy()
    }
  })
})

describe('les trois réponses restent visibles', () => {
  const verdicts = (over: Partial<Context> = {}) => commuteVerdicts('2026-09-07', context(over))

  it('montre toujours les trois, quoi qu’il arrive', () => {
    // N'afficher que la recommandation faisait apparaître l'électrique
    // seulement après avoir posé le trajet musculaire, comme s'il venait
    // d'être inventé.
    for (const tsb of [-60, -20, 0, 20]) {
      expect(verdicts({ tsb })).toHaveLength(3)
    }
  })

  it('n’en recommande qu’une, la plus exigeante qui passe', () => {
    const frais = verdicts()
    expect(frais.filter((v) => v.advised)).toHaveLength(1)
    expect(frais[0]?.advised).toBe(true)

    const epuise = verdicts({ tsb: -40 })
    expect(epuise.filter((v) => v.advised)).toHaveLength(1)
    expect(epuise[2]?.advised).toBe(true)
  })

  it('donne la raison de chaque option écartée', () => {
    const epuise = verdicts({ tsb: -40 })
    expect(epuise[0]?.reason?.code).toBe('tsb-sous-plancher')
    expect(epuise[1]?.reason?.code).toBe('tsb-sous-plancher')
    expect(epuise[2]?.reason).toBeNull()
  })

  it('n’écarte jamais l’électrique', () => {
    for (const tsb of [-60, -40, -20, 0]) {
      expect(verdicts({ tsb })[2]?.reason).toBeNull()
    }
  })
})

describe('quand la question se pose', () => {
  it('du lundi au vendredi', () => {
    // 7 septembre 2026 est un lundi.
    expect(isWorkday('2026-09-07')).toBe(true)
    expect(isWorkday('2026-09-11')).toBe(true)
  })

  it('pas le week-end', () => {
    expect(isWorkday('2026-09-12')).toBe(false)
    expect(isWorkday('2026-09-13')).toBe(false)
  })
})
