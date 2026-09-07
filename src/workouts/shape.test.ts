import { describe, expect, it } from 'vitest'
import { intensity, shapeOf } from './shape'
import { compose } from './compose'
import { familyOf, FAMILIES } from './families'

const shape = (key: string, minutes = 45, ftp: number | null = 221) =>
  shapeOf(compose(familyOf(key)!, minutes), ftp)

describe('l’intensité', () => {
  it('s’affiche en watts quand la FTP est connue', () => {
    expect(intensity(95, 221)).toBe('95 % (210 W)')
  })

  it('reste un pourcentage quand elle ne l’est pas', () => {
    expect(intensity(95, null)).toBe('95 %')
  })

  it('suit la FTP, donc le test', () => {
    // C'est tout l'intérêt de décider en pourcentage : rien à réécrire.
    expect(intensity(95, 240)).toBe('95 % (228 W)')
  })
})

describe('la forme d’une séance', () => {
  it('tient sur une ligne quand il n’y a qu’un palier', () => {
    const lignes = shape('endurance')
    expect(lignes).toHaveLength(1)
    expect(lignes[0]).toMatch(/min de travail à 65 % \(\d+ W\)/)
  })

  it('décrit l’alternance d’un over-under', () => {
    const lignes = shape('sweet-spot')
    expect(lignes.join(' | ')).toContain('95 %')
    expect(lignes.join(' | ')).toContain('85 %')
    expect(lignes.join(' | ')).toContain('en alternance')
  })

  it('dit la récupération entre les blocs, quand il y en a', () => {
    expect(shape('sweet-spot').some((l) => l.startsWith('Récup'))).toBe(true)
    // L'endurance n'a pas de récupération : rien à dire.
    expect(shape('endurance').some((l) => l.startsWith('Récup'))).toBe(false)
  })

  it('écrit les secondes en secondes, les minutes en minutes', () => {
    expect(shape('vo2-30-30').join(' | ')).toContain('30 s')
    expect(shape('endurance').join(' | ')).toMatch(/\d+ min/)
  })

  it('dit « de travail », pour ne pas contredire la durée totale', () => {
    // L'en-tête annonce 29 min, la forme annonce 15 min : sans le mot, les
    // deux lignes voisines se contredisent.
    expect(shape('sweet-spot')[0]).toContain('de travail')
  })

  it('reste courte : on la lit, on ne la recopie pas', () => {
    for (const family of FAMILIES) {
      const lignes = shape(family.key)
      expect(lignes.length, family.name).toBeLessThanOrEqual(3)
      for (const ligne of lignes) {
        expect(ligne.length, `${family.name} — ${ligne}`).toBeLessThanOrEqual(90)
      }
    }
  })

  it('n’écrit aucun watt sans FTP', () => {
    for (const family of FAMILIES) {
      expect(shape(family.key, 45, null).join(' '), family.name).not.toContain('W')
    }
  })
})
