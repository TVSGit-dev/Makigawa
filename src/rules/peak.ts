/**
 * Le pic cardiaque (section 5, E.1 et E.21).
 *
 * Le E.1 fait basculer une journée en chargée dès **deux minutes cumulées
 * au-dessus de 175 bpm**. La règle existait depuis le début et n'avait jamais
 * fonctionné, faute de courbe.
 *
 * Ce module compte, il n'estime rien : les battements viennent de la montre
 * via intervals.icu, et le seuil est celui du E.1. Déduire le pic des zones
 * d'intervals.icu reste exclu — les règles comparent des bpm bruts, jamais un
 * nom de zone.
 */

import { PEAK_BPM } from './scale'

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
 * Les secondes passées au-dessus du seuil.
 *
 * Cumulées, pas consécutives : le E.1 parle bien d'un temps cumulé, et c'est
 * ce qui convient — trois pointes de quarante secondes coûtent ce que coûte
 * une pointe de deux minutes.
 */
export function peakSecondsOf(
  beats: readonly number[],
  movingSeconds: number | null = null,
  threshold: number = PEAK_BPM,
): number {
  if (beats.length === 0) return 0
  const step = stepOf(beats.length, movingSeconds)
  const above = beats.filter((beat) => beat > threshold).length
  return Math.round(above * step)
}
