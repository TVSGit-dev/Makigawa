/**
 * Le test FTP (section 5, E.11).
 *
 * Le protocole est celui de l'athlète — son fichier « 20 Minute FTP Test » —
 * et Makigawa n'y touche pas. Ce qu'elle apporte est le **quand**.
 *
 * Un test passé sur des jambes lourdes ne mesure pas la FTP, il mesure la
 * fatigue. Et comme toutes les séances composées sont écrites en pourcentage
 * de cette FTP, une mauvaise mesure ne coûte pas une séance : elle coûte un
 * cycle. D'où trois conditions plus strictes que partout ailleurs.
 */

import { refuse, type Context } from '../rules/decide'
import { weighDay } from '../rules/scale'
import { shiftDayKey, type DayKey } from '../calendar/dates'
import type { PlannedSession } from '../rules/types'
import { CANDIDATE_ID } from '../actions/place'
import type { Block } from './families'
import type { Workout } from './compose'

/**
 * Le protocole, relevé bloc par bloc sur le fichier de l'athlète.
 *
 * L'effort de vingt minutes est écrit à 105 % — le milieu de la rampe
 * 100→110 % de son fichier. C'est un repère de départ, pas une consigne : le
 * principe d'un test est de donner tout ce qu'on peut tenir vingt minutes, et
 * prescrire un pourcentage d'une FTP qu'on cherche justement à corriger
 * n'aurait pas de sens. Le nom de la séance le dit.
 */
const PROTOCOL: Block[] = [
  { seconds: 240, percent: 45 },
  { seconds: 60, percent: 60 },
  { seconds: 60, percent: 68 },
  { seconds: 60, percent: 75 },
  { seconds: 60, percent: 83 },
  { seconds: 60, percent: 90 },
  { seconds: 120, percent: 55 },
  { seconds: 60, percent: 80 },
  { seconds: 60, percent: 55 },
  { seconds: 60, percent: 80 },
  { seconds: 60, percent: 55 },
  { seconds: 30, percent: 90 },
  { seconds: 30, percent: 55 },
  { seconds: 30, percent: 90 },
  { seconds: 30, percent: 55 },
  { seconds: 120, percent: 55 },
  { seconds: 20, percent: 130 },
  { seconds: 30, percent: 55 },
  { seconds: 20, percent: 130 },
  { seconds: 30, percent: 55 },
  { seconds: 180, percent: 55 },
  { seconds: 300, percent: 110 },
  { seconds: 300, percent: 55 },
  // L'effort. Tout ce qu'on peut tenir vingt minutes.
  { seconds: 1200, percent: 105 },
  { seconds: 300, percent: 55 },
  { seconds: 300, percent: 45 },
]

export const FTP_TEST_NAME = 'Test FTP — 20 minutes, tout donner'

/** Le test, sous la forme que le reste de l'app manipule. */
export function ftpTest(): Workout {
  return {
    name: FTP_TEST_NAME,
    // Le test n'appartient à aucune famille : il ne se compose pas, il se
    // recopie. La forme minimale suffit à le poser comme les autres.
    family: {
      key: 'test',
      name: 'Test FTP',
      purpose: 'Mesurer la FTP, pour que tout le reste soit juste.',
      pattern: PROTOCOL,
      reps: [1],
      sets: [1],
      between: 0,
      betweenPercent: 55,
      maxBlock: Number.MAX_SAFE_INTEGER,
      openers: true,
    },
    sets: 1,
    reps: 1,
    long: true,
    blocks: PROTOCOL,
    seconds: PROTOCOL.reduce((total, block) => total + block.seconds, 0),
  }
}

/** Ce qui empêche de tester ce jour-là. */
export type TestRefusal =
  | { code: 'fraicheur-negative'; tsb: number }
  | { code: 'jour-deja-charge' }
  | { code: 'veille-pas-legere' }
  | { code: 'avant-veille-pas-legere' }
  | { code: 'lendemain-charge' }
  /** Une des règles ordinaires du E.2 s'y oppose déjà. */
  | { code: 'regle-ordinaire' }

/**
 * Ce jour convient-il à un test ?
 *
 * Les conditions du E.2 d'abord, puis les trois qui s'y ajoutent. L'ordre
 * compte : la fraîcheur est examinée en premier parce que c'est elle qui
 * décide le plus souvent, et qu'elle est la plus parlante à expliquer.
 */
export function refuseTest(date: DayKey, context: Context): TestRefusal | null {
  if (context.tsb < 0) return { code: 'fraicheur-negative', tsb: context.tsb }

  const weightOn = (key: DayKey) =>
    weighDay(
      context.days.find((day) => day.date === key),
      key,
      context.planned,
    )

  // Le jour lui-même, d'abord. Les règles ordinaires laissent passer une
  // séance sur une journée déjà chargée — pour un test, c'est disqualifiant.
  if (weightOn(date) !== 'legere') return { code: 'jour-deja-charge' }

  if (weightOn(shiftDayKey(date, -1)) !== 'legere') return { code: 'veille-pas-legere' }
  if (weightOn(shiftDayKey(date, -2)) !== 'legere') return { code: 'avant-veille-pas-legere' }
  if (weightOn(shiftDayKey(date, 1)) === 'chargee') return { code: 'lendemain-charge' }

  const session: PlannedSession = { id: `${CANDIDATE_ID}:test`, date, load: null, kind: 'endurance' }
  if (refuse(session, date, context)) return { code: 'regle-ordinaire' }

  return null
}

export type TestDay = { date: DayKey } | { refusal: TestRefusal }

/**
 * Le premier jour qui convient, ou le motif du dernier refus.
 *
 * L'app ne propose pas quatorze jours pour un test, elle en propose un. Et
 * quand aucun ne convient, elle dit lequel des trois obstacles subsiste plutôt
 * que de laisser chercher.
 */
export function firstTestDay(today: DayKey, days: number, context: Context): TestDay {
  let last: TestRefusal = { code: 'regle-ordinaire' }

  for (let ahead = 0; ahead < days; ahead += 1) {
    const date = shiftDayKey(today, ahead)
    const refusal = refuseTest(date, context)
    if (!refusal) return { date }
    last = refusal
  }

  return { refusal: last }
}
