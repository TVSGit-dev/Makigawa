/**
 * Ce que l'app dit quand le jour demandé n'est pas celui qu'on obtient (E.14).
 */

import { describe, expect, it } from 'vitest'
import { explainSlip } from './reasons'

const AUJOURD_HUI = '2026-09-09'

describe('le report qui glisse', () => {
  it('ne dit rien quand le souhait est exaucé', () => {
    // Une app qui commente ce qui s'est bien passé fait du bruit.
    expect(explainSlip('2026-09-12', '2026-09-12', null, AUJOURD_HUI)).toBeNull()
  })

  it('nomme le jour demandé, celui obtenu, et le motif', () => {
    const dit = explainSlip('2026-09-12', '2026-09-14', 'jour-deja-charge', AUJOURD_HUI)!
    expect(dit).toContain('repoussé')
    expect(dit).toContain('parce que')
    expect(dit).toContain('déjà chargée')
  })

  it('se passe du motif quand le journal n’en a pas retenu', () => {
    // Aucune raison inventée pour combler : la phrase se termine sans elle.
    const dit = explainSlip('2026-09-12', '2026-09-14', null, AUJOURD_HUI)!
    expect(dit).not.toContain('parce que')
    expect(dit).not.toContain('undefined')
  })

  it('dit franchement quand plus rien ne se place', () => {
    const dit = explainSlip('2026-09-20', null, null, AUJOURD_HUI)!
    expect(dit).toContain('Rien ne se place')
  })

  it('ne reproche jamais rien, et ne parle jamais de retard', () => {
    // La contrainte d'interface : tolérante, pas culpabilisante.
    for (const dit of [
      explainSlip('2026-09-12', '2026-09-14', 'tsb-sous-plancher', AUJOURD_HUI),
      explainSlip('2026-09-20', null, null, AUJOURD_HUI),
    ]) {
      const texte = (dit ?? '').toLowerCase()
      for (const mot of ['retard', 'manqué', 'raté', 'dette', 'aurais']) {
        expect(texte, mot).not.toContain(mot)
      }
    }
  })
})
