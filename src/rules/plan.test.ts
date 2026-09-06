import { describe, expect, it } from 'vitest'
import { propose, type Context } from './decide'
import { levelOf, weighDay } from './scale'
import type { PlannedSession, SessionKind } from './types'

/**
 * Le planning de trois semaines proposé à l'athlète le 6 septembre 2026,
 * soumis au moteur de règles.
 *
 * Un planning qui ne passerait pas ses propres règles serait une proposition
 * malhonnête : l'app le démonterait dès le premier jour. Ce fichier vérifie
 * qu'il tient, et il tombera si les règles ou l'échelle changent — ce qui est
 * exactement ce qu'on attend de lui.
 *
 * Les trajets domicile-travail y figurent comme des séances de niveau 1 :
 * leur charge compte dans la journée, mais elle est trop faible pour en faire
 * des séances de qualité, donc les règles ne les déplacent jamais. C'est le
 * A.5 traduit en données.
 */

/** Un aller-retour en vélo électrique, relevé entre 30 et 40. */
const TRAJETS = 35

type Entry = { date: string; name: string; load: number; kind?: SessionKind }

const PLAN: Entry[] = [
  // ---- Semaine 1, du 7 au 13 septembre : charge ----
  { date: '2026-09-07', name: 'Trajets', load: TRAJETS, kind: 'autre' },
  { date: '2026-09-08', name: 'Trajets', load: TRAJETS, kind: 'autre' },
  { date: '2026-09-08', name: 'Endurance 45', load: 55 },
  { date: '2026-09-09', name: 'Trajets', load: TRAJETS, kind: 'autre' },
  { date: '2026-09-10', name: 'Trajets', load: TRAJETS, kind: 'autre' },
  { date: '2026-09-12', name: 'Sortie 35 km', load: 140 },

  // ---- Semaine 2, du 14 au 20 septembre : charge ----
  { date: '2026-09-14', name: 'Trajets', load: TRAJETS, kind: 'autre' },
  { date: '2026-09-15', name: 'Trajets', load: TRAJETS, kind: 'autre' },
  { date: '2026-09-15', name: 'Tempo 45', load: 70 },
  { date: '2026-09-16', name: 'Trajets', load: TRAJETS, kind: 'autre' },
  { date: '2026-09-17', name: 'Trajets', load: TRAJETS, kind: 'autre' },
  { date: '2026-09-17', name: 'Endurance 30', load: 35 },
  { date: '2026-09-19', name: 'Sortie 40 km', load: 160 },

  // ---- Semaine 3, du 21 au 27 septembre : décharge ----
  { date: '2026-09-21', name: 'Trajets', load: TRAJETS, kind: 'autre' },
  { date: '2026-09-22', name: 'Trajets', load: TRAJETS, kind: 'autre' },
  { date: '2026-09-22', name: 'Récupération 30', load: 20 },
  { date: '2026-09-23', name: 'Trajets', load: TRAJETS, kind: 'autre' },
  { date: '2026-09-24', name: 'Trajets', load: TRAJETS, kind: 'autre' },
  { date: '2026-09-26', name: 'Tempo 30', load: 45 },
]

const sessions: PlannedSession[] = PLAN.map((entry, index) => ({
  id: `${index}`,
  date: entry.date,
  load: entry.load,
  kind: entry.kind ?? 'endurance',
}))

const context: Context = {
  today: '2026-09-07',
  days: [],
  planned: sessions,
  intent: 'normal',
  tsb: 0,
}

describe('le planning de trois semaines', () => {
  it('ne se fait démonter par aucune règle', () => {
    const moved = sessions
      .map((session) => ({ session, proposal: propose(session, context) }))
      .filter(({ proposal }) => proposal.action !== 'garder')
      .map(({ session, proposal }) => {
        const name = PLAN[Number(session.id)]?.name
        return `${session.date} ${name} → ${proposal.action}`
      })

    expect(moved).toEqual([])
  })

  it('respecte le quota de deux journées chargées par semaine', () => {
    for (const [start, end] of [
      ['2026-09-07', '2026-09-13'],
      ['2026-09-14', '2026-09-20'],
      ['2026-09-21', '2026-09-27'],
    ]) {
      const days = [...new Set(PLAN.map((entry) => entry.date))]
        .filter((date) => date >= start && date <= end)
        .filter((date) => weighDay(undefined, date, sessions) === 'chargee')
      expect(days.length, `semaine du ${start}`).toBeLessThanOrEqual(2)
    }
  })

  it('n’enchaîne jamais deux journées chargées', () => {
    const charged = [...new Set(PLAN.map((entry) => entry.date))]
      .filter((date) => weighDay(undefined, date, sessions) === 'chargee')
      .sort()

    for (let i = 1; i < charged.length; i += 1) {
      const previous = new Date(`${charged[i - 1]}T00:00:00`)
      const current = new Date(`${charged[i]}T00:00:00`)
      const gap = (current.getTime() - previous.getTime()) / 86_400_000
      expect(gap, `${charged[i - 1]} et ${charged[i]}`).toBeGreaterThan(1)
    }
  })

  it('allège bien la troisième semaine', () => {
    const total = (start: string, end: string) =>
      PLAN.filter((entry) => entry.date >= start && entry.date <= end).reduce(
        (sum, entry) => sum + entry.load,
        0,
      )

    const charge = Math.max(total('2026-09-07', '2026-09-13'), total('2026-09-14', '2026-09-20'))
    const decharge = total('2026-09-21', '2026-09-27')

    // La section 5 demande 40 à 60 % de volume en moins sur une décharge.
    expect(decharge).toBeLessThan(charge * 0.6)
  })

  it('laisse les trajets hors des séances de qualité', () => {
    const trajets = PLAN.filter((entry) => entry.name === 'Trajets')
    expect(trajets.length).toBeGreaterThan(0)
    for (const trajet of trajets) {
      expect(levelOf(trajet.load), 'un trajet reste de niveau 1').toBe(1)
    }
  })
})
