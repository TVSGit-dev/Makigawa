import { describe, expect, it } from 'vitest'
import { pointerFor, ZWIFT_COLLECTIONS } from './zwift'
import { compose, build } from './compose'
import { familyOf, FAMILIES } from './families'
import { zoneOfFamily, ZONES } from './levels'

describe('le rayon de Zwift (E.27)', () => {
  it('nomme une collection pour chaque famille du catalogue', () => {
    // Une famille sans panneau enverrait chercher à l'aveugle, ce qui est
    // exactement l'état d'avant.
    for (const family of FAMILIES) {
      const pointer = pointerFor(compose(family, 45))
      expect(pointer, family.name).not.toBeNull()
      expect(pointer!.collection.length, family.name).toBeGreaterThan(0)
    }
  })

  it('couvre toutes les zones', () => {
    for (const zone of ZONES) {
      expect(ZWIFT_COLLECTIONS[zone], zone).toBeTruthy()
    }
  })

  it('envoie le sweet spot dans le rayon Sweet Spot', () => {
    expect(pointerFor(compose(familyOf('sweet-spot')!, 45))?.collection).toBe('Sweet Spot')
  })

  it('envoie les deux familles de seuil dans le même rayon', () => {
    // Elles partagent leur zone (E.16) : elles partagent leur rayon.
    expect(zoneOfFamily('seuil')).toBe(zoneOfFamily('seuil-continu'))
    expect(pointerFor(compose(familyOf('seuil')!, 60))?.collection).toBe('Threshold')
    expect(pointerFor(compose(familyOf('seuil-continu')!, 60))?.collection).toBe('Threshold')
  })

  it('dit la durée et la longueur des blocs', () => {
    // C'est la longueur d'un bloc qui distingue deux séances d'un même rayon ;
    // sans elle le panneau ne dirait que la durée totale.
    const hint = pointerFor(build(familyOf('seuil-continu')!, 2, 4))?.hint
    expect(hint).toContain('min')
    expect(hint).toContain('2 blocs de 20 min')
  })

  it('ne compte pas des blocs séparés quand rien ne les sépare', () => {
    // La récupération n'a pas de coupure entre ses blocs : annoncer « 3 blocs »
    // ferait croire à un fractionné.
    const hint = pointerFor(build(familyOf('recuperation')!, 3, 1))?.hint
    expect(hint).not.toContain('3 blocs')
    expect(hint).toContain('un bloc de 30 min')
  })
})
