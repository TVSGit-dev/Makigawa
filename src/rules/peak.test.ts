import { describe, expect, it } from 'vitest'
import { peakSecondsOf, stepOf } from './peak'
import { PEAK_BPM, PEAK_MIN_SECONDS } from './scale'

const flat = (beat: number, seconds: number) => Array.from({ length: seconds }, () => beat)

describe('le pic cardiaque', () => {
  it('compte les secondes au-dessus du seuil, pas les autres', () => {
    const beats = [...flat(150, 600), ...flat(180, 90)]
    expect(peakSecondsOf(beats)).toBe(90)
  })

  it('cumule les pointes plutôt que d’exiger une seule', () => {
    // Le E.1 parle d'un temps cumulé : trois pointes de quarante secondes
    // coûtent ce que coûte une pointe de deux minutes.
    const beats = [...flat(180, 40), ...flat(120, 300), ...flat(180, 40), ...flat(120, 300), ...flat(180, 40)]
    expect(peakSecondsOf(beats)).toBe(120)
    expect(peakSecondsOf(beats)).toBeGreaterThanOrEqual(PEAK_MIN_SECONDS)
  })

  it('ne compte pas le seuil lui-même', () => {
    expect(peakSecondsOf(flat(PEAK_BPM, 300))).toBe(0)
    expect(peakSecondsOf(flat(PEAK_BPM + 1, 300))).toBe(300)
  })

  it('vaut zéro sans courbe', () => {
    // Un échec de lecture ne bloque rien : la journée pèse par sa charge.
    expect(peakSecondsOf([])).toBe(0)
  })
})

describe('le pas de temps', () => {
  it('vaut une seconde par défaut', () => {
    expect(stepOf(3600, null)).toBe(1)
    expect(stepOf(3600, 3600)).toBe(1)
  })

  it('se déduit de la durée quand le flux est plus grossier', () => {
    // Un point toutes les quatre secondes sur une heure.
    expect(stepOf(900, 3600)).toBe(4)
    expect(peakSecondsOf(flat(180, 900), 3600)).toBe(3600)
  })

  it('ignore un pas absurde plutôt que de l’appliquer', () => {
    expect(stepOf(10, 3600)).toBe(1)
    expect(stepOf(0, 3600)).toBe(1)
  })
})
