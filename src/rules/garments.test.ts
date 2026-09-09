/**
 * La garde-robe (E.32, second temps).
 *
 * Ce qui se vérifie ici est moins une mécanique qu'une frontière : l'app
 * fournit les catégories, l'athlète fournit les pièces, et rien de ce qu'il
 * n'a pas déclaré ne se devine.
 */

import { describe, expect, it } from 'vitest'
import { BANDS, RAIN_WEAR, bagWeight, dressFor, toCarry, type Sky } from './dress'
import { GARMENTS, answered, garmentOf, isOwned, lacks, nameOf, type Wardrobe } from './garments'

const ciel = (over: Partial<Sky> = {}): Sky => ({
  felt: 12,
  celsius: 13,
  rainChance: 0,
  gust: 20,
  code: 1,
  ...over,
})

describe('le vocabulaire des pièces', () => {
  it('couvre tout ce que les bandes demandent, et rien de plus', () => {
    // Une bande qui nommerait une catégorie absente du vocabulaire donnerait
    // une tenue que la garde-robe ne peut pas remplir.
    // La pluie n'appartient à aucune bande : elle s'ajoute par-dessus, et
    // `RAIN_WEAR` est la seule liste qui la dise.
    const parBandes = new Set([...BANDS.flatMap((band) => band.wear), ...RAIN_WEAR])
    const connues = new Set(GARMENTS.map((one) => one.key))

    for (const key of parBandes) expect(connues.has(key), key).toBe(true)
    for (const key of connues) expect(parBandes.has(key), key).toBe(true)
  })

  it('donne à chaque pièce un nom, un usage et un encombrement', () => {
    for (const one of GARMENTS) {
      expect(one.name.length, one.key).toBeGreaterThan(2)
      expect(one.what.length, one.key).toBeGreaterThan(10)
      expect(['poche', 'sac']).toContain(one.bulk)
      expect(garmentOf(one.key)).toBe(one)
    }
  })
})

describe('ce que l’athlète a dit', () => {
  it('garde le nom des guides tant qu’il n’a rien dit', () => {
    expect(nameOf({}, 'gants-legers')).toBe('gants légers')
    expect(isOwned({}, 'gants-legers')).toBe(false)
    expect(lacks({}, 'gants-legers')).toBe(false)
  })

  it('affiche le sien dès qu’il l’a nommé', () => {
    const garde: Wardrobe = { 'gants-legers': 'gants Rogelli noirs' }
    expect(nameOf(garde, 'gants-legers')).toBe('gants Rogelli noirs')
    expect(isOwned(garde, 'gants-legers')).toBe(true)
  })

  it('ne prend pas un blanc pour une réponse', () => {
    expect(nameOf({ 'gants-legers': '   ' }, 'gants-legers')).toBe('gants légers')
    expect(isOwned({ 'gants-legers': '   ' }, 'gants-legers')).toBe(false)
  })

  it('distingue « je n’en ai pas » de « je n’ai rien dit »', () => {
    expect(lacks({ 'couvre-chaussures': null }, 'couvre-chaussures')).toBe(true)
    expect(lacks({}, 'couvre-chaussures')).toBe(false)
  })

  it('compte les catégories répondues, refus compris', () => {
    expect(answered({})).toBe(0)
    expect(answered({ cuissard: 'le noir', 'couvre-chaussures': null })).toBe(2)
  })
})

describe('la tenue quand la garde-robe est connue', () => {
  it('cesse de proposer ce qu’il n’a pas, et le dit', () => {
    // Conseiller des couvre-chaussures qu'il n'a pas n'habille personne ; les
    // taire sans rien dire lui laisserait croire qu'il est couvert.
    const garde: Wardrobe = { 'couvre-chaussures-hiver': null }
    const tenue = dressFor(ciel({ felt: -5 }), 'hard', garde)!

    expect(tenue.wear).not.toContain('couvre-chaussures-hiver')
    expect(tenue.missing).toEqual(['couvre-chaussures-hiver'])
  })

  it('ne remplace jamais une pièce manquante par une autre', () => {
    // L'app ne sait pas si son coupe-vent vaut un imperméable. Le supposer
    // serait exactement ce qu'elle s'interdit.
    const garde: Wardrobe = { impermeable: null }
    const tenue = dressFor(ciel({ felt: 12, code: 61 }), 'hard', garde)!

    expect(tenue.missing).toEqual(['impermeable'])
    // La bande est intacte et le bas de pluie reste : rien n'a pris la place
    // de la veste, ni une pièce de la bande ni l'autre moitié de la pluie.
    expect(tenue.wear).toEqual([...tenue.band.wear, 'bas-pluie'])
  })

  it('ne change pas la bande : la garde-robe n’entre pas dans le calcul', () => {
    // Les degrés décident, la garde-robe ne fait que filtrer ce qui en sort.
    const nu = dressFor(ciel({ felt: 5 }), 'chill')!
    const equipe = dressFor(ciel({ felt: 5 }), 'chill', { collant: 'mon collant Decathlon' })!

    expect(equipe.band).toBe(nu.band)
    expect(equipe.effective).toBe(nu.effective)
    expect(equipe.wear).toEqual(nu.wear)
  })

  it('n’emporte pas non plus ce qu’il n’a pas', () => {
    const garde: Wardrobe = { gants: null }
    const matin = dressFor(ciel({ felt: 16 }), 'hard', garde)
    const soir = dressFor(ciel({ felt: 7 }), 'hard', garde)
    expect(toCarry(matin, soir)).not.toContain('gants')
  })
})

describe('ce que le sac va peser', () => {
  it('ne dit rien quand il n’y a rien à emporter', () => {
    expect(bagWeight([])).toBe('rien')
  })

  it('distingue la poche du sac', () => {
    expect(bagWeight(['manchettes', 'gants-legers'])).toBe('poche')
    expect(bagWeight(['manchettes', 'collant'])).toBe('sac')
  })
})
