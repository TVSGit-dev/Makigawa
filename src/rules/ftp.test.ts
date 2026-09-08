import { describe, expect, it } from 'vitest'
import { estimatedFtpOf, latestEstimatedFtp, type Wellness } from '../api/intervals'
import { FTP_GAP_MIN, readFtp, saySoftness } from './ftp'

const day = (date: string, raw: Record<string, unknown> = {}): Wellness => ({
  date,
  ctl: null,
  atl: null,
  sleepScore: null,
  sleepSeconds: null,
  raw,
})

describe('la forme du champ n’est pas encore constatée', () => {
  it('lit un tableau par sport', () => {
    const w = day('2026-09-08', {
      sportInfo: [
        { type: 'Run', eftp: 180 },
        { type: 'Ride', eftp: 240 },
      ],
    })
    expect(estimatedFtpOf(w)).toBe(240)
  })

  it('lit un objet indexé par sport', () => {
    const w = day('2026-09-08', { sportInfo: { Ride: { eftp: 236 } } })
    expect(estimatedFtpOf(w)).toBe(236)
  })

  it('ignore un autre sport que celui demandé', () => {
    const w = day('2026-09-08', { sportInfo: [{ type: 'Run', eftp: 180 }] })
    expect(estimatedFtpOf(w)).toBeNull()
  })

  it('rend null plutôt que de deviner, quand le champ manque', () => {
    // L'absence n'est pas une panne : sans estimation, l'app affiche la FTP du
    // profil comme elle le faisait avant.
    expect(estimatedFtpOf(day('2026-09-08'))).toBeNull()
    expect(estimatedFtpOf(day('2026-09-08', { sportInfo: null }))).toBeNull()
    expect(estimatedFtpOf(day('2026-09-08', { sportInfo: 'Ride' }))).toBeNull()
    expect(estimatedFtpOf(day('2026-09-08', { sportInfo: [{ type: 'Ride' }] }))).toBeNull()
  })

  it('refuse une estimation nulle ou négative', () => {
    expect(estimatedFtpOf(day('2026-09-08', { sportInfo: [{ type: 'Ride', eftp: 0 }] }))).toBeNull()
  })
})

describe('la plus récente qui en porte une', () => {
  it('remonte le temps jusqu’à trouver une estimation', () => {
    // intervals.icu ne la recalcule qu'après un effort qui la dépasse : la
    // journée d'hier peut n'en porter aucune.
    const wellness = [
      day('2026-09-06', { sportInfo: [{ type: 'Ride', eftp: 238 }] }),
      day('2026-09-08'),
      day('2026-09-07'),
    ]
    expect(latestEstimatedFtp(wellness)).toBe(238)
  })

  it('prend la plus récente quand plusieurs en portent', () => {
    const wellness = [
      day('2026-09-01', { sportInfo: [{ type: 'Ride', eftp: 230 }] }),
      day('2026-09-08', { sportInfo: [{ type: 'Ride', eftp: 244 }] }),
    ]
    expect(latestEstimatedFtp(wellness)).toBe(244)
  })

  it('rend null sur une fenêtre vide', () => {
    expect(latestEstimatedFtp([])).toBeNull()
  })
})

describe('l’écart doit valoir la peine', () => {
  it('mesure l’écart relatif au profil', () => {
    const reading = readFtp(221, 240)
    expect(reading.gap).toBeCloseTo(0.086, 3)
    expect(reading.worthSaying).toBe(true)
  })

  it('se tait sous le seuil', () => {
    const reading = readFtp(221, 225)
    expect(reading.worthSaying).toBe(false)
  })

  it('parle aussi quand l’estimation est plus basse', () => {
    const reading = readFtp(240, 221)
    expect(reading.gap).toBeLessThan(0)
    expect(reading.worthSaying).toBe(true)
  })

  it('ne compare pas ce qu’elle n’a pas', () => {
    expect(readFtp(221, null).gap).toBeNull()
    expect(readFtp(null, 240).worthSaying).toBe(false)
    expect(readFtp(0, 240).gap).toBeNull()
  })

  it('place le seuil exactement à FTP_GAP_MIN', () => {
    expect(readFtp(200, 200 * (1 + FTP_GAP_MIN)).worthSaying).toBe(true)
    expect(readFtp(200, 200 * (1 + FTP_GAP_MIN / 2)).worthSaying).toBe(false)
  })
})

describe('la conséquence, pas le nombre', () => {
  it('dit « trop douces » quand le profil est en dessous', () => {
    expect(saySoftness(readFtp(221, 240))).toContain('trop douces')
  })

  it('dit « trop dures » dans l’autre sens', () => {
    expect(saySoftness(readFtp(240, 221))).toContain('trop dures')
  })

  it('ne dit rien quand il n’y a rien à dire', () => {
    expect(saySoftness(readFtp(221, 225))).toBeNull()
    expect(saySoftness(readFtp(221, null))).toBeNull()
  })
})
