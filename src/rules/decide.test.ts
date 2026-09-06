import { describe, expect, it } from 'vitest'
import { propose, refuse, type Context } from './decide'
import type { DayRecord, PlannedSession } from './types'

/**
 * Un décor minimal. Toutes les journées sont légères sauf indication
 * contraire, ce qui isole la règle qu'on éprouve.
 */
const QUALITY = 90
const LIGHT = 35 // un aller-retour électrique
const CHARGED = 115 // un aller-retour musculaire

const quality = (over: Partial<PlannedSession> = {}): PlannedSession => ({
  id: 'seance',
  date: '2026-09-10',
  load: QUALITY,
  kind: 'endurance',
  ...over,
})

const observed = (date: string, load: number, peakSeconds = 0): DayRecord => ({
  date,
  observedLoad: load,
  peakSeconds,
})

const context = (over: Partial<Context> = {}): Context => ({
  today: '2026-09-10',
  days: [],
  planned: [],
  intent: 'normal',
  tsb: 0,
  ...over,
})

describe('refuse — la question centrale', () => {
  it('dit oui quand rien ne s’y oppose', () => {
    const session = quality()
    expect(refuse(session, session.date, context({ planned: [session] }))).toBeNull()
  })

  it('ne laisse pas une séance se bloquer elle-même', () => {
    // Une séance de qualité rend sa propre journée chargée : sans exclusion,
    // le contrôle du renfo la refuserait toujours.
    const session = quality({ kind: 'force' })
    expect(refuse(session, session.date, context({ planned: [session] }))).toBeNull()
  })

  it('refuse le lendemain d’une journée chargée', () => {
    const session = quality()
    const ctx = context({ planned: [session], days: [observed('2026-09-09', CHARGED)] })
    expect(refuse(session, session.date, ctx)?.code).toBe('veille-chargee')
  })

  it('refuse après deux journées au moins moyennes', () => {
    const session = quality()
    const ctx = context({
      planned: [session],
      days: [observed('2026-09-09', 69), observed('2026-09-08', 69)],
    })
    expect(refuse(session, session.date, ctx)?.code).toBe('deux-jours-charges')
  })

  it('refuse la veille d’une journée déjà chargée', () => {
    const session = quality()
    const ctx = context({ planned: [session], days: [observed('2026-09-11', CHARGED)] })
    expect(refuse(session, session.date, ctx)?.code).toBe('lendemain-charge')
  })

  it('refuse sous le plancher de TSB du mode', () => {
    const session = quality()
    const ctx = context({ planned: [session], tsb: -25 })
    const refusal = refuse(session, session.date, ctx)
    expect(refusal?.code).toBe('tsb-sous-plancher')
    expect(refusal).toMatchObject({ tsb: -25, floor: -20 })
  })

  it('tolère en ambitieux un TSB que le mode normal refuse', () => {
    const session = quality()
    expect(refuse(session, session.date, context({ planned: [session], tsb: -25 }))).not.toBeNull()
    expect(
      refuse(session, session.date, context({ planned: [session], tsb: -25, intent: 'ambitieux' })),
    ).toBeNull()
  })

  it('refuse une seconde séance de qualité en mode prudent', () => {
    const session = quality()
    const other = quality({ id: 'autre', date: '2026-09-13' })
    const ctx = context({ planned: [session, other], intent: 'prudent' })
    expect(refuse(session, session.date, ctx)?.code).toBe('une-seule-par-semaine')
  })

  it('refuse deux séances de qualité qui se suivent', () => {
    const session = quality()
    const other = quality({ id: 'autre', date: '2026-09-11' })
    const ctx = context({ planned: [session, other] })
    expect(refuse(session, session.date, ctx)?.code).toBe('lendemain-charge')
  })

  it('refuse un renfo trop proche d’une endurance, dans les deux sens', () => {
    // Deux jours d'écart : l'espacement des séances de qualité, qui n'exige
    // qu'un jour, ne les sépare plus. Seul l'entraînement concurrent le fait.
    const renfo = quality({ id: 'renfo', date: '2026-09-10', load: 60, kind: 'force' })
    const endurance = quality({ id: 'endu', date: '2026-09-12', load: 60 })
    const ctx = context({ planned: [renfo, endurance] })
    expect(refuse(renfo, renfo.date, ctx)?.code).toBe('force-trop-proche')
    expect(refuse(endurance, endurance.date, ctx)?.code).toBe('force-trop-proche')
  })

  it('accepte un renfo à trois jours d’une endurance', () => {
    const renfo = quality({ id: 'renfo', date: '2026-09-10', load: 60, kind: 'force' })
    const endurance = quality({ id: 'endu', date: '2026-09-13', load: 60 })
    const ctx = context({ planned: [renfo, endurance] })
    expect(refuse(renfo, renfo.date, ctx)).toBeNull()
  })

  it('laisse une mobilité cohabiter avec un renfo', () => {
    const renfo = quality({ id: 'renfo', load: 60, kind: 'force' })
    const mobilite = quality({ id: 'mob', date: '2026-09-11', load: 10, kind: 'endurance' })
    const ctx = context({ planned: [renfo, mobilite] })
    expect(refuse(renfo, renfo.date, ctx)).toBeNull()
  })

  it('refuse un renfo posé sur une journée chargée', () => {
    const renfo = quality({ kind: 'force' })
    const ctx = context({ planned: [renfo], days: [observed('2026-09-10', CHARGED)] })
    expect(refuse(renfo, renfo.date, ctx)?.code).toBe('renfo-sur-journee-chargee')
  })

  it('refuse au-delà du quota de journées chargées du mode', () => {
    const session = quality()
    const ctx = context({
      planned: [session],
      days: [observed('2026-09-06', CHARGED), observed('2026-09-08', CHARGED)],
    })
    const refusal = refuse(session, session.date, ctx)
    expect(refusal?.code).toBe('quota-hebdomadaire')
    expect(refusal).toMatchObject({ allowed: 2 })
  })
})

describe('propose — la cascade', () => {
  it('ne touche pas à ce qui n’est pas une séance de qualité', () => {
    const mobilite = quality({ load: 10 })
    const ctx = context({ planned: [mobilite], days: [observed('2026-09-09', CHARGED)] })
    expect(propose(mobilite, ctx)).toEqual({ action: 'garder' })
  })

  it('ne touche pas à une séance sans charge connue', () => {
    const inconnue = quality({ load: null })
    const ctx = context({ planned: [inconnue], days: [observed('2026-09-09', CHARGED)] })
    expect(propose(inconnue, ctx)).toEqual({ action: 'garder' })
  })

  it('garde une séance quand le jour convient', () => {
    const session = quality()
    expect(propose(session, context({ planned: [session] }))).toEqual({ action: 'garder' })
  })

  it('décale au premier jour qui convient', () => {
    const session = quality()
    const ctx = context({ planned: [session], days: [observed('2026-09-09', CHARGED)] })
    const proposal = propose(session, ctx)
    expect(proposal).toMatchObject({ action: 'decaler', to: '2026-09-11' })
  })

  it('ne cherche jamais au-delà de deux jours', () => {
    const session = quality()
    const ctx = context({
      planned: [session],
      days: [
        observed('2026-09-09', CHARGED),
        observed('2026-09-11', CHARGED),
        observed('2026-09-12', CHARGED),
      ],
    })
    // Le 13 conviendrait, mais il est hors de portée.
    expect(propose(session, ctx).action).not.toBe('decaler')
  })

  it('réduit de moitié quand aucun jour ne convient', () => {
    const session = quality({ load: 90 })
    const ctx = context({ planned: [session], tsb: -50 })
    expect(propose(session, ctx)).toMatchObject({ action: 'reduire', load: 45 })
  })

  it('abandonne quand la moitié reste refusée', () => {
    // 140, une belle balade : réduite elle pèse encore 70, toujours une
    // séance de qualité, et le TSB la refuse toujours.
    const session = quality({ load: 140 })
    const ctx = context({ planned: [session], tsb: -50 })
    expect(propose(session, ctx).action).toBe('abandonner')
  })

  it('dit toujours pourquoi', () => {
    const session = quality()
    const ctx = context({ planned: [session], days: [observed('2026-09-09', CHARGED)] })
    const proposal = propose(session, ctx)
    expect(proposal).toHaveProperty('because.code', 'veille-chargee')
  })
})

/**
 * Ce que l'app ne fait jamais (E.6). Ces interdictions priment sur toutes les
 * autres règles, et rien dans le moteur ne doit pouvoir les contourner.
 */
describe('les interdictions', () => {
  it('ne propose jamais autre chose que garder, décaler, réduire ou abandonner', () => {
    const actions = new Set<string>()
    for (const tsb of [0, -25, -50]) {
      for (const load of [10, 35, 90, 140]) {
        for (const yesterday of [LIGHT, CHARGED]) {
          const session = quality({ load })
          const ctx = context({
            planned: [session],
            tsb,
            days: [observed('2026-09-09', yesterday)],
          })
          actions.add(propose(session, ctx).action)
        }
      }
    }
    expect([...actions].sort()).toEqual(['abandonner', 'decaler', 'garder', 'reduire'])
  })

  it('ne rattrape jamais : réduire diminue la charge, ne l’augmente pas', () => {
    const session = quality({ load: 100 })
    const proposal = propose(session, context({ planned: [session], tsb: -50 }))
    if (proposal.action !== 'reduire') throw new Error('cas non couvert')
    expect(proposal.load).toBeLessThan(session.load ?? 0)
  })
})

/**
 * Deux règles dont l'atteignabilité méritait d'être prouvée : les contrôles
 * de veille et de lendemain interceptent la plupart des voisinages avant
 * elles.
 */
describe('les règles que les autres pourraient masquer', () => {
  it('refuse deux séances de qualité le même jour', () => {
    const session = quality()
    const jumelle = quality({ id: 'jumelle', date: '2026-09-10' })
    const ctx = context({ planned: [session, jumelle] })
    expect(refuse(session, session.date, ctx)?.code).toBe('qualite-voisine')
  })

  it('tolère un enchaînement de journées chargées en ambitieux', () => {
    const session = quality()
    const ctx = context({
      planned: [session],
      intent: 'ambitieux',
      days: [observed('2026-09-09', CHARGED)],
    })
    expect(refuse(session, session.date, ctx)).toBeNull()
  })

  it('reprend la règle au second enchaînement', () => {
    const session = quality()
    const ctx = context({
      planned: [session],
      intent: 'ambitieux',
      days: [
        observed('2026-09-09', CHARGED),
        observed('2026-09-06', CHARGED),
        observed('2026-09-05', CHARGED),
      ],
    })
    expect(refuse(session, session.date, ctx)?.code).toBe('veille-chargee')
  })
})
