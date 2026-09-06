import { describe, expect, it } from 'vitest'
import {
  build,
  compose,
  durationsFor,
  DURATIONS,
  eventFor,
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
  WARMUP_SHORT,
} from './families'
import { halveStructure } from '../actions/apply'

const sweetSpot = familyOf('sweet-spot')!
const vo2 = familyOf('vo2-30-30')!
const endurance = familyOf('endurance')!

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

  it('n’envoie jamais de charge : c’est intervals.icu qui la calcule', () => {
    const event = eventFor(compose(sweetSpot, 45), '2026-09-12')
    expect(event).not.toHaveProperty('icu_training_load')
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
        const attendu = long ? WARMUP : WARMUP_SHORT
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
    expect(build(endurance, 3, 1).name).toBe('Endurance 30 min')
  })
})

describe('la structure écrite', () => {
  it('donne une ligne par bloc, en notation d’intervals.icu', () => {
    const lignes = toNotation(build(sweetSpot, 2, 5)).split('\n')
    expect(lignes[0]).toBe('- 5m 45%')
    expect(lignes).toHaveLength(build(sweetSpot, 2, 5).blocks.length)
  })

  it('écrit les secondes en secondes, les minutes en minutes', () => {
    const notation = toNotation(compose(vo2, 45))
    expect(notation).toContain('- 30s 115%')
    expect(notation).toContain('- 5m 45%')
  })

  it('produit une structure que la réduction de moitié sait relire', () => {
    // Le E.3 doit pouvoir raccourcir ce que l'app vient de composer : une
    // séance générée qui ne se réduirait pas serait une impasse.
    for (const family of FAMILIES) {
      const notation = toNotation(compose(family, 45))
      expect(halveStructure(notation), family.name).not.toBeNull()
    }
  })

  it('recopie la structure dans l’événement, sans y toucher', () => {
    const workout = compose(sweetSpot, 45)
    expect(eventFor(workout, '2026-09-12')).toMatchObject({
      category: 'WORKOUT',
      start_date_local: '2026-09-12T00:00:00',
      description: toNotation(workout),
      moving_time: workout.seconds,
    })
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
