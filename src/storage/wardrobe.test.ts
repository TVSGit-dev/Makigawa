// @vitest-environment jsdom
/**
 * La garde-robe gardée dans le téléphone (E.32, second temps).
 *
 * Deux choses se vérifient ici, et la seconde est celle qui tient la
 * frontière du E.32 : la mécanique de rangement, et le fait que **l'athlète
 * l'emporte toujours** sur ce que l'app a posé au départ.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { GARMENTS } from '../rules/garments'
import { DECLARED, forget, loadWardrobe, markMissing, nameGarment, NAME_MAX } from './wardrobe'

/**
 * Un téléphone où la déclaration a déjà été posée.
 *
 * Sans elle, chaque test repartirait d'un premier démarrage et la déclaration
 * se réécrirait — ce qui n'est justement pas le comportement voulu.
 */
function dejaDeclaree(): void {
  // Poser la déclaration puis vider le placard : c'est exactement l'état d'un
  // athlète qui a tout effacé. Passer par `loadWardrobe` plutôt que d'écrire
  // la marque à la main évite de figer son numéro de version dans les tests.
  loadWardrobe()
  localStorage.removeItem('makigawa.garde-robe')
}

describe('la déclaration de départ', () => {
  beforeEach(() => localStorage.clear())

  it('est posée au premier démarrage', () => {
    expect(loadWardrobe()).toEqual(DECLARED)
  })

  it('ne nomme que des catégories qui existent', () => {
    // Une clé inventée traînerait une pièce que plus rien ne sait afficher.
    const connues = new Set<string>(GARMENTS.map((one) => one.key))
    for (const key of Object.keys(DECLARED)) expect(connues.has(key), key).toBe(true)
  })

  it('couvre les vingt catégories, et pas une de plus', () => {
    // Elle en couvrait dix-neuf jusqu'au 10 septembre 2026 : le sous-vêtement
    // thermique manquait, et l'athlète a fini par le nommer. Ce compte tient
    // le lien entre `docs/garde-robe.md` et le code — l'un ne peut plus
    // annoncer un chiffre que l'autre dément.
    expect(Object.keys(DECLARED)).toHaveLength(GARMENTS.length)
  })

  it('ne se repose jamais après le premier démarrage', () => {
    loadWardrobe()
    for (const one of GARMENTS) forget(one.key)
    // Il a tout effacé : l'app ne doit pas repasser derrière lui.
    expect(loadWardrobe()).toEqual({})
  })

  it('se pose malgré une garde-robe enregistrée mais vide', () => {
    // Le défaut du 9 septembre 2026, constaté sur le téléphone de l'athlète :
    // il voyait « 0 sur 20 ». Ouvrir l'écran et quitter un champ vide appelle
    // `forget`, qui enregistre `{}` — et `localStorage` en rend la *chaîne*
    // « {} », vraie en JavaScript. Le garde-fou « il en a déjà une » la lisait
    // comme un placard rempli et sautait la déclaration.
    localStorage.setItem('makigawa.garde-robe', '{}')
    expect(loadWardrobe()).toEqual(DECLARED)
  })

  it('rattrape un téléphone déjà marqué par la version précédente', () => {
    // Le même téléphone porte aussi la marque, posée avant le test qui a
    // échoué : sans numéro de version, il resterait vide pour toujours.
    localStorage.setItem('makigawa.garde-robe.declaree', '1')
    localStorage.setItem('makigawa.garde-robe', '{}')
    expect(loadWardrobe()).toEqual(DECLARED)
  })

  it('ne touche pas à une garde-robe déjà remplie à la main', () => {
    // Le téléphone de l'athlète en portait une avant que la déclaration
    // n'existe : l'écraser lui ferait perdre ce qu'il avait saisi.
    localStorage.setItem('makigawa.garde-robe', JSON.stringify({ cuissard: 'le mien' }))
    expect(loadWardrobe()).toEqual({ cuissard: 'le mien' })
  })

  it('cède devant un nom que l’athlète change', () => {
    loadWardrobe()
    nameGarment('cuissard', 'mon vieux cuissard')
    expect(loadWardrobe().cuissard).toBe('mon vieux cuissard')
  })

  it('cède aussi devant une pièce qu’il déclare absente', () => {
    loadWardrobe()
    markMissing('bas-pluie')
    expect(loadWardrobe()['bas-pluie']).toBeNull()
  })
})

describe('la garde-robe gardée', () => {
  beforeEach(() => {
    localStorage.clear()
    dejaDeclaree()
  })

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
