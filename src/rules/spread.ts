/**
 * La répartition d'intensité (section 5, E.29).
 *
 * Les courbes cardiaques sont déjà lues, et depuis le E.29 elles rendent trois
 * nombres au lieu d'un. Les additionner sur la fenêtre mesurée dit la part de
 * l'effort passée facile, modérée et dure.
 *
 * **C'est un constat, jamais une cible.** La littérature la plus récente ne
 * tranche pas entre polarisé et pyramidal — 41 études, 797 cyclistes entraînés,
 * aucune différence significative — et le pyramidal conviendrait plutôt mieux
 * quand les heures sont comptées. Afficher un objectif « 80 / 20 » serait
 * prendre parti là où la recherche ne le fait pas.
 *
 * Ce que ça sert : le piège du cycliste peu disponible n'est pas de mal doser
 * le polarisé, c'est que **tout devienne modéré**. Trois pourcentages le
 * montrent d'un coup d'œil.
 */

import { shiftDayKey, type DayKey } from '../calendar/dates'
import { addBands, NO_BANDS, sharesOf, totalOf, type Bands } from './peak'
import type { DayRecord } from './types'

/**
 * La fenêtre sur laquelle la répartition se lit.
 *
 * La même que celle des courbes mesurées : au-delà, les journées n'ont pas de
 * bandes et la répartition serait celle d'un échantillon, pas d'une période.
 */
export const SPREAD_DAYS = 14

export type Spread = {
  /** Le temps de chaque bande, en secondes. */
  bands: Bands
  /** Les parts, en pourcentages entiers qui font cent. `null` si rien à répartir. */
  shares: Bands | null
  /** Le temps total mesuré, en secondes. */
  seconds: number
  /** Sur combien de jours les courbes ont été lues. */
  days: number
}

export function spreadOf(
  records: readonly DayRecord[],
  today: DayKey,
  window: number = SPREAD_DAYS,
): Spread {
  const from = shiftDayKey(today, -(window - 1))

  // Seules les journées dont la courbe a été lue comptent. Une journée sans
  // bandes n'est pas une journée facile : c'est une journée qu'on ne sait pas
  // lire, et la compter à zéro gonflerait la part du reste.
  const measured = records.filter(
    (day) => day.date >= from && day.date <= today && day.bands && totalOf(day.bands) > 0,
  )

  const bands = measured.reduce((total, day) => addBands(total, day.bands!), NO_BANDS)

  return {
    bands,
    shares: sharesOf(bands),
    seconds: totalOf(bands),
    days: measured.length,
  }
}
