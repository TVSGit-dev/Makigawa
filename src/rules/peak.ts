/**
 * Ce que la courbe cardiaque dit (section 5, E.1, E.21 et E.29).
 *
 * Le E.1 fait basculer une journée en chargée dès **deux minutes cumulées
 * au-dessus de 175 bpm**. La règle existait depuis le début et n'avait jamais
 * fonctionné, faute de courbe.
 *
 * Depuis le E.29, la même lecture rend **trois nombres au lieu d'un**. Lire la
 * courbe entière pour n'en garder qu'une borne était du gâchis : les deux
 * autres bandes sont gratuites, et elles disent ce que le pic ne dit pas —
 * la part de la semaine passée facile, modérée, ou dure.
 *
 * Ce module compte, il n'estime rien : les battements viennent de la montre
 * via intervals.icu, et les seuils sont ceux des constantes athlète. Déduire
 * quoi que ce soit des zones d'intervals.icu reste exclu — les règles comparent
 * des bpm bruts, jamais un nom de zone.
 */

import { EFFORT_BPM, PEAK_BPM } from './scale'

/**
 * Le temps passé dans chaque bande, en secondes.
 *
 * Les bornes sont `EFFORT_BPM` et `PEAK_BPM`, prises strictement : un battement
 * exactement à 175 n'est pas au-dessus de 175, et `hard` reste donc exactement
 * ce que le E.1 comptait.
 */
export type Bands = {
  /** Sous le seuil de travail. */
  easy: number
  /** Entre les deux seuils. */
  moderate: number
  /** Au-dessus du seuil de pic — le pic du E.1, inchangé. */
  hard: number
}

export const NO_BANDS: Bands = { easy: 0, moderate: 0, hard: 0 }

/**
 * Le pas de temps d'un flux, en secondes.
 *
 * Garmin échantillonne à la seconde dans la quasi-totalité des cas. Quand ce
 * n'est pas vrai, la durée de l'activité rapportée à la longueur du flux le
 * dit — et c'est la seule façon de le savoir sans supposer.
 */
export function stepOf(beats: number, movingSeconds: number | null): number {
  if (!movingSeconds || beats <= 0) return 1
  const step = movingSeconds / beats
  // Un pas absurde vaut mieux ignoré qu'appliqué : on retombe sur la seconde.
  return step >= 0.5 && step <= 10 ? step : 1
}

/**
 * Les secondes passées dans chacune des trois bandes (E.29).
 *
 * Cumulées, pas consécutives : le E.1 parle bien d'un temps cumulé, et c'est
 * ce qui convient — trois pointes de quarante secondes coûtent ce que coûte
 * une pointe de deux minutes.
 */
export function bandsOf(
  beats: readonly number[],
  movingSeconds: number | null = null,
  effort: number = EFFORT_BPM,
  peak: number = PEAK_BPM,
): Bands {
  if (beats.length === 0) return NO_BANDS
  const step = stepOf(beats.length, movingSeconds)

  let easy = 0
  let moderate = 0
  let hard = 0
  for (const beat of beats) {
    if (beat > peak) hard += 1
    else if (beat > effort) moderate += 1
    else easy += 1
  }

  return {
    easy: Math.round(easy * step),
    moderate: Math.round(moderate * step),
    hard: Math.round(hard * step),
  }
}

/**
 * Les secondes au-dessus du seuil de pic.
 *
 * C'est la bande dure de `bandsOf`, et rien d'autre : le E.1 n'a pas bougé.
 */
export function peakSecondsOf(
  beats: readonly number[],
  movingSeconds: number | null = null,
  threshold: number = PEAK_BPM,
): number {
  return bandsOf(beats, movingSeconds, threshold, threshold).hard
}

/** Deux relevés qui s'ajoutent : deux sorties dans la même journée. */
export function addBands(a: Bands, b: Bands): Bands {
  return {
    easy: a.easy + b.easy,
    moderate: a.moderate + b.moderate,
    hard: a.hard + b.hard,
  }
}

export function totalOf(bands: Bands): number {
  return bands.easy + bands.moderate + bands.hard
}

/**
 * La part de chaque bande, en pourcentages entiers qui font cent.
 *
 * Les trois arrondis séparés ne tombent pas toujours juste ; le reste va à la
 * plus grosse part, qui est celle que l'erreur déforme le moins.
 */
export function sharesOf(bands: Bands): Bands | null {
  const total = totalOf(bands)
  if (total <= 0) return null

  const shares = {
    easy: Math.round((bands.easy / total) * 100),
    moderate: Math.round((bands.moderate / total) * 100),
    hard: Math.round((bands.hard / total) * 100),
  }

  const drift = 100 - (shares.easy + shares.moderate + shares.hard)
  if (drift !== 0) {
    const biggest = (['easy', 'moderate', 'hard'] as const).reduce((best, one) =>
      bands[one] > bands[best] ? one : best,
    )
    shares[biggest] += drift
  }
  return shares
}
