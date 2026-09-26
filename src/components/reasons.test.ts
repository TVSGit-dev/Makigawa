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
    const dit = nightLine(null, 'mauvaise')
    expect(dit).not.toContain('le contraire')
    expect(dit).toContain('C’est toi qui la dis mauvaise')
    expect(dit).toContain('prudent')
  })

  it('dément bien un score, quand il y en a un', () => {
    const dit = nightLine(82, 'mauvaise')
    expect(dit).toContain('82')
    expect(dit).toContain('Tu dis le contraire')
    expect(dit).toContain('prudent')
  })

  it('ne parle de prudent que si l’athlète a tapé', () => {
    // Rien à saisir les jours où les deux s'accordent : la phrase se tait.
    for (const dit of [nightLine(82, null), nightLine(null, null)]) {
      expect(dit).not.toContain('prudent')
      expect(dit).not.toContain('toi')
    }
  })

  it('dit toujours d’où vient le chiffre, ou qu’il manque', () => {
    expect(nightLine(null, null)).toContain('n’a rien dit')
    expect(nightLine(0, null)).toContain('La montre donne 0')
    expect(nightLine(78.6, 'mauvaise')).toContain('79')
  })

  it('ne reproche rien, ici non plus', () => {
    for (const dit of [nightLine(null, 'mauvaise'), nightLine(82, 'mauvaise'), nightLine(null, null)]) {
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
    const dit = nightLine(null, 'mauvaise', true)
    expect(dit).toContain('déjà en prudent')
    expect(dit).not.toContain('passe en prudent')
  })

  it('le promet quand il l’a', () => {
    const dit = nightLine(null, 'mauvaise', false)
    expect(dit).toContain('passe en prudent')
    expect(dit).not.toContain('déjà')
  })

  it('garde le bon geste dans les deux cas', () => {
    expect(nightLine(null, 'mauvaise', true)).toContain('C’est toi qui la dis mauvaise')
    expect(nightLine(82, 'mauvaise', true)).toContain('Tu dis le contraire')
  })

  it('ne dit rien de prudent tant que rien n’est tapé', () => {
    expect(nightLine(82, null, true)).not.toContain('prudent')
  })
})

describe('le second cran, « atroce » (E.12)', () => {
  it('fait toujours quelque chose, même sur une semaine déjà prudente', () => {
    // C'est précisément le cas qui l'a fait naître : prudent étant le mode le
    // plus doux, le premier cran n'avait plus rien à serrer.
    const dit = nightLine(null, 'atroce', true)
    expect(dit).toContain('pas d’intensité')
    expect(dit).not.toContain('rien ne change')
  })

  it('annonce les deux effets sur une semaine qui ne l’est pas', () => {
    const dit = nightLine(null, 'atroce', false)
    expect(dit).toContain('prudent')
    expect(dit).toContain('sans intensité')
  })

  it('se dit atroce, pas mauvaise, quand la montre s’est tue', () => {
    expect(nightLine(null, 'atroce', false)).toContain('atroce')
    expect(nightLine(null, 'atroce', false)).not.toContain('la dis mauvaise')
  })

  it('reste un démenti quand la montre a parlé', () => {
    expect(nightLine(70, 'atroce', false)).toContain('Tu dis le contraire')
    expect(nightLine(70, 'atroce', false)).toContain('70')
  })

  it('ne reproche rien, ici non plus', () => {
    for (const dit of [nightLine(null, 'atroce', true), nightLine(70, 'atroce', false)]) {
      const texte = dit.toLowerCase()
      for (const mot of ['retard', 'manqué', 'raté', 'dette', 'aurais', 'repose-toi']) {
        expect(texte, mot).not.toContain(mot)
      }
    }
  })
})

describe('la typographie française des phrases de nuit', () => {
  it('met une espace devant chaque deux-points', () => {
    // Relevé à l'écran : « la dis atroce: la journée ». L'espace fine avant le
    // deux-points est la règle en français, et les autres phrases la tiennent.
    const toutes = [
      nightLine(null, 'mauvaise', false),
      nightLine(null, 'atroce', false),
      nightLine(null, 'atroce', true),
      nightLine(82, 'mauvaise', false),
      nightLine(82, 'atroce', false),
      nightLine(82, 'atroce', true),
    ]
    for (const dit of toutes) {
      expect(dit, dit).not.toMatch(/\S:/)
    }
  })
})
