// @vitest-environment jsdom
/**
 * La garde-robe gardée dans le téléphone (E.32, second temps).
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { forget, loadWardrobe, markMissing, nameGarment, NAME_MAX } from './wardrobe'

describe('la garde-robe gardée', () => {
  beforeEach(() => localStorage.clear())

  it('part vide, et n’invente rien', () => {
    expect(loadWardrobe()).toEqual({})
  })

  it('retient ce qu’il a nommé', () => {
    nameGarment('gants-legers', '  gants Rogelli noirs  ')
    expect(loadWardrobe()).toEqual({ 'gants-legers': 'gants Rogelli noirs' })
  })

  it('retient aussi ce qu’il n’a pas', () => {
    markMissing('couvre-chaussures')
    expect(loadWardrobe()).toEqual({ 'couvre-chaussures': null })
  })

  it('oublie sur demande, et la pièce reprend son nom générique', () => {
    nameGarment('cuissard', 'le noir')
    expect(forget('cuissard')).toEqual({})
    expect(loadWardrobe()).toEqual({})
  })

  it('traite un nom vidé comme un oubli', () => {
    nameGarment('cuissard', 'le noir')
    nameGarment('cuissard', '   ')
    expect(loadWardrobe()).toEqual({})
  })

  it('borne la longueur d’un nom', () => {
    nameGarment('collant', 'x'.repeat(200))
    expect(loadWardrobe().collant).toHaveLength(NAME_MAX)
  })

  it('jette ce qui n’est pas une catégorie connue', () => {
    // Une clé inconnue viendrait d'une version antérieure ou d'un bricolage :
    // la garder ferait traîner une pièce que plus rien ne sait afficher.
    localStorage.setItem(
      'makigawa.garde-robe',
      JSON.stringify({ cuissard: 'le noir', 'chapeau-melon': 'noir', gants: 42 }),
    )
    expect(loadWardrobe()).toEqual({ cuissard: 'le noir' })
  })

  it('ne casse pas sur un contenu abîmé', () => {
    localStorage.setItem('makigawa.garde-robe', 'pas du json')
    expect(loadWardrobe()).toEqual({})
  })
})
