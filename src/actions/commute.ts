/**
 * Le compagnon de trajet (section 5, E.17).
 *
 * L'athlète fait six à sept trajets par semaine et ils portent **60 à 100 % de
 * sa charge hebdomadaire** : c'est, de loin, la décision qu'il prend le plus
 * souvent. Elle se prenait sans l'app.
 *
 * La question n'est pas « est-ce que j'y vais ? » — il y va de toute façon.
 * C'est **tes jambes, ou la batterie ?**
 *
 * **Aucune règle nouvelle ici.** Un trajet musculaire est une séance de qualité
 * dès qu'il atteint le niveau 2 du E.1, donc les quatre conditions du E.2 s'y
 * appliquent déjà. Ce module pose la même question à un autre endroit.
 */

import { refuse, type Context, type Refusal } from '../rules/decide'
import { DEFAULT_SCALE, isQuality } from '../rules/scale'
import type { DayKey, PlannedSession } from '../rules/types'
import { parseDayKey } from '../calendar/dates'
import { CANDIDATE_ID } from './place'
import { COMMUTE_TARGETS, type Where } from './open-ride'

export type CommuteChoice = 'aller-retour' | 'un-seul' | 'electrique'

export type CommuteOption = {
  choice: CommuteChoice
  /** La charge relevée par l'athlète, jamais estimée (E.13). */
  load: number
  /** Musculaire ou électrique : ce que l'app écrira dans le calendrier. */
  where: Where
  label: string
}

/**
 * Les trois réponses, de la plus exigeante à la plus économe.
 *
 * Les charges viennent des relevés du E.13. L'électrique ferme la marche et
 * passe toujours : il n'est jamais une séance de qualité, donc le E.2 n'a rien
 * à lui refuser.
 */
export const COMMUTE_OPTIONS: readonly CommuteOption[] = [
  {
    choice: 'aller-retour',
    load: COMMUTE_TARGETS.hard[1]!.load,
    where: 'hard',
    label: 'Aller-retour à la force des jambes',
  },
  {
    choice: 'un-seul',
    load: COMMUTE_TARGETS.hard[0]!.load,
    where: 'hard',
    label: 'Un seul des deux à la force des jambes',
  },
  {
    choice: 'electrique',
    load: COMMUTE_TARGETS.chill[1]!.load,
    where: 'chill',
    label: 'Aller-retour en électrique',
  },
]

export type CommuteAdvice = {
  option: CommuteOption
  /** Ce que le E.2 a répondu aux options plus exigeantes, dans l'ordre. */
  refused: readonly { option: CommuteOption; reason: Refusal }[]
}

/** Le trajet envisagé, tel que les règles le liront. */
function asPlanned(option: CommuteOption, date: DayKey): PlannedSession {
  return {
    id: `${CANDIDATE_ID}:trajet`,
    date,
    load: option.load,
    // Un trajet musculaire sollicite la filière aérobie ; l'électrique ne
    // sollicite rien, mais sa charge compte quand même.
    kind: option.where === 'hard' ? 'endurance' : 'autre',
  }
}

/**
 * Ce que l'app recommande pour aujourd'hui.
 *
 * La réponse la plus exigeante que le E.2 accepte. L'électrique est le dernier
 * recours et il ne peut pas échouer, donc il y a toujours une réponse.
 */
export function adviseCommute(date: DayKey, context: Context): CommuteAdvice {
  const scale = context.scale ?? DEFAULT_SCALE
  const refused: { option: CommuteOption; reason: Refusal }[] = []

  for (const option of COMMUTE_OPTIONS) {
    const planned = asPlanned(option, date)

    // Le premier principe du E.0 : les règles ne gouvernent que les séances de
    // qualité. En dessous, une chose cohabite avec tout — et c'est précisément
    // le cas de l'électrique, qui doit toujours rester possible. Le garde-fou
    // vit dans `propose` ; l'oublier ici ferait refuser un trajet qu'aucune
    // règle ne peut refuser.
    if (!isQuality(planned, scale)) return { option, refused }

    const reason = refuse(planned, date, context)
    if (!reason) return { option, refused }
    refused.push({ option, reason })
  }

  // Inatteignable en pratique — l'électrique n'est jamais une séance de
  // qualité — mais on ne renvoie pas `null` d'une question dont il existe
  // toujours une réponse : il va au travail de toute façon.
  return { option: COMMUTE_OPTIONS[COMMUTE_OPTIONS.length - 1]!, refused }
}

/**
 * Un jour de semaine.
 *
 * Ce sont des trajets domicile-travail : les proposer le dimanche serait du
 * bruit. C'est un choix d'affichage, pas une règle sur la vie de l'athlète —
 * poser un trajet un samedi reste possible par le menu ordinaire.
 */
export function isWorkday(date: DayKey): boolean {
  const day = parseDayKey(date)?.getDay()
  return day !== undefined && day >= 1 && day <= 5
}
