import { describe, expect, it } from 'vitest'
import { doseOf, perDay, DOSE_WEEKS } from './dose'
import { RAMP_SHARE } from './ramp'
import type { DayRecord } from './types'

/** Une semaine entière à charge constante, du lundi au dimanche. */
const week = (monday: string, daily: number): DayRecord[] =>
  Array.from({ length: 7 }, (_, i) => {
    const date = new Date(`${monday}T00:00:00`)
    date.setDate(date.getDate() + i)
    return {
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      observedLoad: daily,
      peakSeconds: 0,
    }
  })

// Lundis : 17, 24, 31 août ; 7 septembre 2026. On se place le mercredi 9.
const TROIS = [...week('2026-08-17', 40), ...week('2026-08-24', 50), ...week('2026-08-31', 45)]

describe('la dose de la semaine', () => {
  it('additionne les charges d’intervals.icu, sans en calculer aucune', () => {
    const dose = doseOf({ days: TROIS, today: '2026-09-09' })
    expect(dose.past.map((one) => one.load)).toEqual([280, 350, 315])
    expect(dose.past).toHaveLength(DOSE_WEEKS)
  })

  it('vise dix pour cent de plus que la moyenne des semaines complètes', () => {
    const dose = doseOf({ days: TROIS, today: '2026-09-09' })
    const moyenne = (280 + 350 + 315) / 3
    expect(dose.target).toBe(Math.round(moyenne * (1 + RAMP_SHARE)))
  })

  it('tient l’objectif quand la forme monte déjà trop vite', () => {
    // Le plafond du E.20 gouverne aussi la dose : on ne progresse pas en
    // ajoutant à ce qui monte déjà.
    const monte = doseOf({ days: TROIS, today: '2026-09-09', hold: true })
    const libre = doseOf({ days: TROIS, today: '2026-09-09' })
    expect(monte.target).toBeLessThan(libre.target!)
    expect(monte.target).toBe(Math.round((280 + 350 + 315) / 3))
  })

  it('compte ce que la semaine en cours a déjà porté', () => {
    const days = [...TROIS, ...week('2026-09-07', 30)]
    expect(doseOf({ days, today: '2026-09-09' }).banked).toBe(210)
  })

  it('ne devine pas un objectif sans semaine observée', () => {
    const dose = doseOf({ days: [], today: '2026-09-09' })
    expect(dose.target).toBeNull()
    expect(dose.remaining).toBe(0)
  })

  it('ignore les semaines vides plutôt que de tirer la moyenne vers le bas', () => {
    const days = [...week('2026-08-31', 45)]
    expect(doseOf({ days, today: '2026-09-09' }).target).toBe(Math.round(315 * (1 + RAMP_SHARE)))
  })
})

describe('ce qu’il reste à placer', () => {
  it('ne descend jamais sous zéro : dépasser n’est pas une dette', () => {
    const days = [...TROIS, ...week('2026-09-07', 200)]
    const dose = doseOf({ days, today: '2026-09-09' })
    expect(dose.banked).toBeGreaterThan(dose.target!)
    expect(dose.remaining).toBe(0)
    expect(perDay(dose)).toBe(0)
  })

  it('répartit le reste sur les jours qui viennent', () => {
    // Mercredi : il reste mercredi, jeudi, vendredi, samedi, dimanche.
    const dose = doseOf({ days: TROIS, today: '2026-09-09' })
    expect(dose.daysLeft).toBe(5)
    expect(perDay(dose)).toBe(Math.round(dose.remaining / 5))
  })

  it('redistribue tout seul quand un jour passe sans rien', () => {
    // La part quotidienne monte parce qu'il reste moins de jours, pas parce
    // qu'une dette s'accumule : le total visé, lui, n'a pas bougé.
    const lundi = doseOf({ days: TROIS, today: '2026-09-07' })
    const vendredi = doseOf({ days: TROIS, today: '2026-09-11' })
    expect(vendredi.remaining).toBe(lundi.remaining)
    expect(perDay(vendredi)).toBeGreaterThan(perDay(lundi))
  })

  it('ne réclame plus rien le dernier jour passé', () => {
    const dimanche = doseOf({ days: TROIS, today: '2026-09-13' })
    expect(dimanche.daysLeft).toBe(1)
  })
})
