/**
 * Ce que l'app dit quand le jour demandé n'est pas celui qu'on obtient (E.14).
 */

import { describe, expect, it } from 'vitest'
import { explainSlip, nightLine } from './reasons'

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

describe('le bloc de nuit (E.12)', () => {
  it('ne dément jamais un silence', () => {
    // Le défaut vu sur une capture le 20 septembre 2026 : « La montre n'a rien
    // dit de ta nuit. Tu dis le contraire » — contredire un silence n'a aucun
    // sens, et une phrase qui n'en a pas se lit comme une panne.
    const dit = nightLine(null, true)
    expect(dit).not.toContain('le contraire')
    expect(dit).toContain('C’est toi qui la dis mauvaise')
    expect(dit).toContain('prudent')
  })

  it('dément bien un score, quand il y en a un', () => {
    const dit = nightLine(82, true)
    expect(dit).toContain('82')
    expect(dit).toContain('Tu dis le contraire')
    expect(dit).toContain('prudent')
  })

  it('ne parle de prudent que si l’athlète a tapé', () => {
    // Rien à saisir les jours où les deux s'accordent : la phrase se tait.
    for (const dit of [nightLine(82, false), nightLine(null, false)]) {
      expect(dit).not.toContain('prudent')
      expect(dit).not.toContain('toi')
    }
  })

  it('dit toujours d’où vient le chiffre, ou qu’il manque', () => {
    expect(nightLine(null, false)).toContain('n’a rien dit')
    expect(nightLine(0, false)).toContain('La montre donne 0')
    expect(nightLine(78.6, true)).toContain('79')
  })

  it('ne reproche rien, ici non plus', () => {
    for (const dit of [nightLine(null, true), nightLine(82, true), nightLine(null, false)]) {
      const texte = dit.toLowerCase()
      for (const mot of ['retard', 'manqué', 'raté', 'dette', 'aurais', 'mal dormi']) {
        expect(texte, mot).not.toContain(mot)
      }
    }
  })
})

describe('le démenti sur une semaine déjà prudente (E.12)', () => {
  it('ne promet pas un effet qu’il n’a pas', () => {
    // Le cas vu sur la capture du 20 septembre 2026 : l'athlète avait déjà
    // choisi prudent pour la semaine, donc le démenti ne durcissait rien. Dire
    // « la journée passe en prudent » laissait croire à un geste qui agissait.
    const dit = nightLine(null, true, true)
    expect(dit).toContain('déjà en prudent')
    expect(dit).not.toContain('passe en prudent')
  })

  it('le promet quand il l’a', () => {
    const dit = nightLine(null, true, false)
    expect(dit).toContain('passe en prudent')
    expect(dit).not.toContain('déjà')
  })

  it('garde le bon geste dans les deux cas', () => {
    expect(nightLine(null, true, true)).toContain('C’est toi qui la dis mauvaise')
    expect(nightLine(82, true, true)).toContain('Tu dis le contraire')
  })

  it('ne dit rien de prudent tant que rien n’est tapé', () => {
    expect(nightLine(82, false, true)).not.toContain('prudent')
  })
})
