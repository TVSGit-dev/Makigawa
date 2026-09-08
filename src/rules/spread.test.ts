import { describe, expect, it } from 'vitest'
import { spreadOf, SPREAD_DAYS } from './spread'
import { bandsOf, NO_BANDS, sharesOf } from './peak'
import { EFFORT_BPM, PEAK_BPM } from './scale'
import type { Bands } from './peak'
import type { DayRecord } from './types'

const jour = (date: string, bands?: Bands): DayRecord => ({
  date,
  observedLoad: 40,
  peakSeconds: bands?.hard ?? 0,
  bands,
})

describe('les trois bandes d’une courbe (E.29)', () => {
  it('range chaque battement dans sa bande', () => {
    const beats = [120, 120, 160, 160, 160, 190]
    expect(bandsOf(beats, 6)).toEqual({ easy: 2, moderate: 3, hard: 1 })
  })

  it('prend les bornes strictement', () => {
    // Un battement exactement à 175 n'est pas au-dessus de 175 : la bande dure
    // reste exactement ce que le E.1 comptait.
    expect(bandsOf([PEAK_BPM], 1)).toEqual({ easy: 0, moderate: 1, hard: 0 })
    expect(bandsOf([EFFORT_BPM], 1)).toEqual({ easy: 1, moderate: 0, hard: 0 })
  })

  it('tient compte du pas quand la montre n’échantillonne pas à la seconde', () => {
    // Trois points pour six secondes : chaque point vaut deux secondes.
    expect(bandsOf([120, 160, 190], 6)).toEqual({ easy: 2, moderate: 2, hard: 2 })
  })

  it('rend trois zéros sur une courbe vide', () => {
    expect(bandsOf([], 100)).toEqual(NO_BANDS)
  })
})

describe('les parts', () => {
  it('fait toujours cent', () => {
    // Trois arrondis séparés ne tombent pas juste ; le reste va à la plus
    // grosse part, celle que l'erreur déforme le moins.
    for (const bands of [
      { easy: 1, moderate: 1, hard: 1 },
      { easy: 100, moderate: 33, hard: 33 },
      { easy: 7, moderate: 11, hard: 13 },
      { easy: 3600, moderate: 700, hard: 120 },
    ]) {
      const shares = sharesOf(bands)!
      expect(shares.easy + shares.moderate + shares.hard, JSON.stringify(bands)).toBe(100)
    }
  })

  it('ne répartit rien quand il n’y a rien', () => {
    expect(sharesOf(NO_BANDS)).toBeNull()
  })
})

describe('la répartition de la fenêtre (E.29)', () => {
  const today = '2026-09-09'

  it('additionne les journées mesurées', () => {
    const spread = spreadOf(
      [
        jour('2026-09-08', { easy: 1800, moderate: 300, hard: 0 }),
        jour(today, { easy: 1200, moderate: 600, hard: 120 }),
      ],
      today,
    )
    expect(spread.bands).toEqual({ easy: 3000, moderate: 900, hard: 120 })
    expect(spread.days).toBe(2)
    expect(spread.shares!.easy + spread.shares!.moderate + spread.shares!.hard).toBe(100)
  })

  it('ignore une journée dont la courbe n’a pas été lue', () => {
    // Une journée sans bandes n'est pas une journée facile : c'est une journée
    // qu'on ne sait pas lire. La compter à zéro gonflerait le reste.
    const spread = spreadOf(
      [jour('2026-09-08'), jour(today, { easy: 600, moderate: 600, hard: 0 })],
      today,
    )
    expect(spread.days).toBe(1)
    expect(spread.shares).toEqual({ easy: 50, moderate: 50, hard: 0 })
  })

  it('ne regarde ni au-delà de la fenêtre ni dans le futur', () => {
    const vieux = jour('2026-08-01', { easy: 99999, moderate: 0, hard: 0 })
    const demain = jour('2026-09-10', { easy: 99999, moderate: 0, hard: 0 })
    const spread = spreadOf(
      [vieux, demain, jour(today, { easy: 600, moderate: 300, hard: 100 })],
      today,
    )
    expect(spread.days).toBe(1)
    expect(spread.bands.easy).toBe(600)
  })

  it('couvre bien la fenêtre entière, dernier jour compris', () => {
    const premier = jour('2026-08-27', { easy: 600, moderate: 0, hard: 0 })
    expect(spreadOf([premier], today, SPREAD_DAYS).days).toBe(1)

    const trop = jour('2026-08-26', { easy: 600, moderate: 0, hard: 0 })
    expect(spreadOf([trop], today, SPREAD_DAYS).days).toBe(0)
  })

  it('ne rend aucune part quand rien n’a été mesuré', () => {
    const spread = spreadOf([], today)
    expect(spread.shares).toBeNull()
    expect(spread.seconds).toBe(0)
  })
})
