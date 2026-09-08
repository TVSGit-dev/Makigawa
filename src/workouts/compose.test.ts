import { describe, expect, it } from 'vitest'
import { blocksOf } from './read'
import {
  build,
  compose,
  durationsFor,
  DURATIONS,
  toNotation,
  TOLERANCE_MINUTES,
} from './compose'
import {
  blockSeconds,
  COOLDOWN,
  familyOf,
  FAMILIES,
  OPENERS,
  WARMUP,
  WARMUP_EASY,
  WARMUP_EASY_SHORT,
  WARMUP_SHORT,
} from './families'
import {
  composeAtLevel,
  MAX_MINUTES,
  MIN_WORK_BLOCK,
  nextLevel,
  WORK_FLOOR,
  zoneOfBlocks,
  zoneOfFamily,
} from './levels'

const sweetSpot = familyOf('sweet-spot')!
const vo2 = familyOf('vo2-30-30')!
const endurance = familyOf('endurance')!
const recuperation = familyOf('recuperation')!
const seuilContinu = familyOf('seuil-continu')!
const vo2Long = familyOf('vo2-long')!

describe('la division des rôles', () => {
  it('n’écrit jamais une intensité en watts', () => {
    // « Tous les chiffres viennent d'intervals.icu » : une cible en pourcentage
    // est résolue par la FTP d'intervals.icu, une cible en watts la figerait.
    for (const family of FAMILIES) {
      const notation = toNotation(compose(family, 45))
      expect(notation, family.name).not.toMatch(/\d+\s*w\b/i)
      expect(notation, family.name).toMatch(/%/)
    }
  })

  it('déduit la durée des blocs, sans jamais la saisir', () => {
    const workout = build(sweetSpot, 2, 5)
    const sum = workout.blocks.reduce((total, block) => total + block.seconds, 0)
    expect(workout.seconds).toBe(sum)
  })
})

describe('composer une séance', () => {
  it('tombe près de chaque durée qu’elle annonce savoir tenir', () => {
    for (const family of FAMILIES) {
      for (const minutes of durationsFor(family)) {
        const workout = compose(family, minutes)
        const ecart = Math.abs(workout.seconds / 60 - minutes)
        expect(
          ecart,
          `${family.name} en ${minutes} min → ${workout.seconds / 60}`,
        ).toBeLessThanOrEqual(TOLERANCE_MINUTES)
      }
    }
  })

  it('n’annonce pas une durée qu’elle ne sait pas remplir', () => {
    // Promettre soixante-quinze minutes de navette lactate demanderait
    // d'inventer un volume absent des séances de référence.
    const navette = familyOf('navette')!
    expect(durationsFor(navette)).not.toContain(75)
    expect(durationsFor(familyOf('endurance')!)).toEqual([...DURATIONS])
  })

  it('laisse chaque famille utilisable sur au moins deux durées', () => {
    for (const family of FAMILIES) {
      expect(durationsFor(family).length, family.name).toBeGreaterThanOrEqual(2)
    }
  })

  it('monte en volume quand on demande plus long', () => {
    const court = compose(sweetSpot, 30)
    const long = compose(sweetSpot, 75)
    expect(long.seconds).toBeGreaterThan(court.seconds)
    expect(long.sets * long.reps).toBeGreaterThan(court.sets * court.reps)
  })

  it('commence toujours par un échauffement, et finit par un retour au calme', () => {
    // L'échauffement fait partie de la recherche : trente minutes n'en
    // supportent pas treize. Ce qui ne change jamais, c'est qu'il y en ait un.
    for (const family of FAMILIES) {
      for (const minutes of durationsFor(family)) {
        const { blocks, long } = compose(family, minutes)
        // Une famille douce a le sien, sans rampe : la rampe monte à 90 %, ce
        // qui serait plus dur que son travail (E.25).
        const attendu = family.gentle
          ? long
            ? WARMUP_EASY
            : WARMUP_EASY_SHORT
          : long
            ? WARMUP
            : WARMUP_SHORT
        expect(blocks.slice(0, attendu.length), `${family.name} ${minutes}`).toEqual(attendu)
        expect(blocks.at(-1)?.percent, `${family.name} ${minutes}`).toBe(45)
      }
    }
  })

  it('raccourcit l’échauffement plutôt que de déborder', () => {
    expect(compose(sweetSpot, 30).long).toBe(false)
    expect(compose(sweetSpot, 75).long).toBe(true)
  })

  it('ajoute les ouvertures aux séances dures, et à elles seules', () => {
    const dure = compose(vo2, 45).blocks
    expect(dure.some((block) => block.percent === OPENERS[0]!.percent)).toBe(true)
    expect(compose(sweetSpot, 45).blocks.some((block) => block.percent >= 150)).toBe(false)
  })

  it('ne met pas de récupération après le dernier bloc', () => {
    // Trois blocs, donc deux récupérations entre eux — pas trois.
    const workout = build(sweetSpot, 3, 5)
    const attendus =
      WARMUP.length + 3 * 5 * sweetSpot.pattern.length + 2 + 1 + COOLDOWN.length
    expect(workout.blocks).toHaveLength(attendus)
  })

  it('nomme une séance par ce qu’elle contient', () => {
    // La convention de l'athlète : « 2 x 15m Sweet Spot », pas « 2 × 5 ».
    expect(build(sweetSpot, 2, 5).name).toBe('Sweet spot 2 × 15 min')
    // L'endurance porte sa durée totale : sa séance entière est du travail,
    // et « Endurance 10 min » sur une sortie de trente-deux ne veut rien dire.
    const sortie = build(endurance, 3, 1)
    expect(sortie.name).toBe(`Endurance ${Math.round(sortie.seconds / 60)} min`)
  })
})

describe('la structure écrite', () => {
  it('donne une ligne par bloc, en notation d’intervals.icu', () => {
    const lignes = toNotation(build(sweetSpot, 2, 5)).split('\n')
    expect(lignes[0]).toBe('- 5m 45%')
    expect(lignes[6]).toBe('- 90s 95%')
  })

  it('fusionne les blocs voisins de même intensité', () => {
    // Un bloc continu de vingt minutes est construit à partir de quatre unités
    // de cinq, mais il s'écrit « - 20m 90% », comme le coach de l'athlète
    // l'écrit. La séance est la même ; elle se lit mieux.
    const continu = familyOf('sweet-spot-continu')!
    const notation = toNotation(build(continu, 2, 4))
    expect(notation).toContain('- 20m 90%')
    expect(notation).not.toContain('- 5m 90%\n- 5m 90%')
  })

  it('descend à 40 % entre deux blocs longs, comme les séances de référence', () => {
    const continu = familyOf('sweet-spot-continu')!
    expect(toNotation(build(continu, 2, 4))).toContain('- 5m 40%')
    // Les over-unders, eux, récupèrent à 65 %.
    expect(toNotation(build(sweetSpot, 2, 5))).toContain('- 4m 65%')
  })

  it('écrit les secondes en secondes, les minutes en minutes', () => {
    const notation = toNotation(compose(vo2, 45))
    expect(notation).toContain('- 30s 115%')
    expect(notation).toContain('- 5m 45%')
  })

  it('produit une structure que l’app sait relire', () => {
    // Le niveau d'une séance tenue se lit sur sa notation (E.16) : une séance
    // composée que l'app ne saurait pas relire serait une impasse.
    for (const family of FAMILIES) {
      const workout = compose(family, 45)
      const relus = blocksOf(toNotation(workout))
      expect(relus.length, family.name).toBeGreaterThan(0)
      expect(
        relus.reduce((total, block) => total + block.seconds, 0),
        family.name,
      ).toBe(workout.seconds)
    }
  })
})

describe('la forme d’une séance', () => {
  it('ne fait jamais un bloc plus long que la famille n’en fait', () => {
    // Trente minutes d'over-unders d'affilée tiennent la bonne durée totale,
    // mais ce n'est pas la séance : les références coupent en blocs.
    for (const family of FAMILIES) {
      for (const minutes of durationsFor(family)) {
        const { reps } = compose(family, minutes)
        expect(blockSeconds(family, reps), `${family.name} ${minutes}`).toBeLessThanOrEqual(
          family.maxBlock,
        )
      }
    }
  })

  it('coupe en blocs plutôt que de faire d’un seul tenant', () => {
    // À durée égale, la récupération entre les blocs est ce qui permet de
    // tenir l'intensité jusqu'au dernier.
    expect(compose(familyOf('sweet-spot')!, 45).sets).toBeGreaterThan(1)
  })

  it('garde le motif exact des séances de référence', () => {
    // 90 s au-dessus, 90 s en dessous : relevé tel quel sur les fichiers de
    // sweet spot. L'app organise, elle ne réécrit pas le motif.
    const notation = toNotation(compose(familyOf('sweet-spot')!, 45))
    expect(notation).toContain('- 90s 95%\n- 90s 85%')
  })
})

describe('les trois familles qui manquaient (E.25)', () => {
  it('ne met rien de dur dans une récupération', () => {
    // C'est toute la définition de la famille : si un seul bloc dépasse le
    // plancher de l'endurance, la séance n'est plus une récupération. La rampe
    // de l'échauffement commun monte à 90 %, d'où son propre échauffement.
    for (const minutes of durationsFor(recuperation)) {
      const { blocks } = compose(recuperation, minutes)
      const dur = blocks.filter((block) => block.percent >= WORK_FLOOR.endurance)
      expect(dur, `${minutes} min`).toEqual([])
    }
  })

  it('écrit le seuil continu d’un seul tenant', () => {
    // Quatre unités de cinq minutes se lisent « 20m 98% », comme le coach de
    // l'athlète l'écrit — c'est la fusion des blocs voisins.
    const long = composeAtLevel(seuilContinu, 9)
    expect(toNotation(long)).toContain('- 20m 98%')
    expect(zoneOfBlocks(long.blocks)).toBe('seuil')
  })

  it('donne au VO2 long des blocs de trois minutes', () => {
    const seance = compose(vo2Long, 60)
    // Les ouvertures sont à 200 % mais ne durent que quinze secondes : ce
    // n'est pas du travail.
    const travail = seance.blocks.filter(
      (block) => block.percent >= WORK_FLOOR.vo2 && block.seconds >= MIN_WORK_BLOCK,
    )
    expect(travail.length).toBeGreaterThan(0)
    expect(travail.every((block) => block.seconds === 180)).toBe(true)
    expect(zoneOfBlocks(seance.blocks)).toBe('vo2')
  })

  it('range les trois dans les zones qu’on attend', () => {
    expect(zoneOfFamily('recuperation')).toBe('recuperation')
    expect(zoneOfFamily('seuil-continu')).toBe('seuil')
    expect(zoneOfFamily('vo2-long')).toBe('vo2')
  })

  it('ne fait jamais monter le niveau de récupération', () => {
    // Faire plus long à 50 % ne prouve rien : la zone reste au premier
    // échelon, quel que soit ce qui a été tenu.
    expect(nextLevel(6, false, 'recuperation')).toBe(1)
    expect(nextLevel(6, false, 'endurance')).toBe(7)
  })

  it('tient toutes les trois sous le plafond de temps', () => {
    for (const family of [recuperation, seuilContinu, vo2Long]) {
      for (let level = 1; level <= 10; level += 1) {
        const seance = composeAtLevel(family, level)
        expect(seance.seconds / 60, `${family.name} niveau ${level}`).toBeLessThanOrEqual(
          MAX_MINUTES,
        )
      }
    }
  })
})
