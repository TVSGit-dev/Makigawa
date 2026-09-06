import { describe, expect, it } from 'vitest'
import { firstTestDay, ftpTest, refuseTest } from './ftp-test'
import { toNotation } from './compose'
import type { Context } from '../rules/decide'
import type { DayRecord } from '../rules/types'

const observed = (date: string, load: number): DayRecord => ({
  date,
  observedLoad: load,
  peakSeconds: 0,
})

const context = (over: Partial<Context> = {}): Context => ({
  today: '2026-09-10',
  days: [],
  planned: [],
  intent: 'normal',
  tsb: 5,
  ...over,
})

describe('le protocole', () => {
  it('dure exactement ce que dure le fichier de l’athlète', () => {
    // 3820 secondes, relevées bloc par bloc sur son « 20 Minute FTP Test ».
    expect(ftpTest().seconds).toBe(3820)
  })

  it('contient l’effort de vingt minutes', () => {
    expect(toNotation(ftpTest())).toContain('- 20m 105%')
  })

  it('dit dans son nom qu’il s’agit de tout donner', () => {
    // Prescrire un pourcentage d'une FTP qu'on cherche justement à corriger
    // n'aurait pas de sens : le nom porte la consigne réelle.
    expect(ftpTest().name).toContain('tout donner')
  })

  it('n’écrit aucune intensité en watts', () => {
    expect(toNotation(ftpTest())).not.toMatch(/\d+\s*w\b/i)
  })
})

describe('les trois conditions du test', () => {
  it('accepte un jour dégagé et frais', () => {
    expect(refuseTest('2026-09-10', context())).toBeNull()
  })

  it('refuse une fraîcheur négative, même au-dessus du plancher du mode', () => {
    // Le mode normal tolère jusqu'à −20 pour une séance. Un test, non.
    const refusal = refuseTest('2026-09-10', context({ tsb: -5 }))
    expect(refusal).toEqual({ code: 'fraicheur-negative', tsb: -5 })
  })

  it('exige deux jours légers avant', () => {
    expect(refuseTest('2026-09-10', context({ days: [observed('2026-09-09', 115)] }))?.code).toBe(
      'veille-pas-legere',
    )
    expect(refuseTest('2026-09-10', context({ days: [observed('2026-09-08', 115)] }))?.code).toBe(
      'avant-veille-pas-legere',
    )
  })

  it('laisse passer des trajets les jours d’avant', () => {
    // Ils n'entament pas ce qu'un test sollicite.
    const trajets = context({ days: [observed('2026-09-09', 35), observed('2026-09-08', 35)] })
    expect(refuseTest('2026-09-10', trajets)).toBeNull()
  })

  it('refuse un jour déjà chargé', () => {
    // Les règles ordinaires le laissent passer ; pour un test, non.
    const ctx = context({ days: [observed('2026-09-10', 140)] })
    expect(refuseTest('2026-09-10', ctx)?.code).toBe('jour-deja-charge')
  })

  it('refuse la veille d’une journée chargée', () => {
    const ctx = context({ days: [observed('2026-09-11', 140)] })
    expect(refuseTest('2026-09-10', ctx)?.code).toBe('lendemain-charge')
  })

  it('s’en remet aux règles ordinaires pour le reste', () => {
    // Une séance de qualité trois jours plus loin : elle ne charge aucun des
    // jours que le test regarde, mais le mode prudent n'en garde qu'une par
    // semaine.
    const lointaine = { id: 'e1', date: '2026-09-13', load: 90, kind: 'endurance' as const }
    const ctx = context({ planned: [lointaine], intent: 'prudent' })
    expect(refuseTest('2026-09-10', ctx)?.code).toBe('regle-ordinaire')
  })
})

describe('le jour du test', () => {
  it('en propose un seul, le premier qui convient', () => {
    const ctx = context({ days: [observed('2026-09-10', 140)] })
    const day = firstTestDay('2026-09-10', 14, ctx)
    expect(day).toEqual({ date: '2026-09-13' })
  })

  it('dit ce qui manque quand aucun jour ne convient', () => {
    // Plutôt que de laisser chercher.
    const day = firstTestDay('2026-09-10', 14, context({ tsb: -5 }))
    expect(day).toEqual({ refusal: { code: 'fraicheur-negative', tsb: -5 } })
  })
})
