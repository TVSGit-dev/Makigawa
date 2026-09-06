/**
 * La séance de souplesse (section 5, E.13).
 *
 * Le psoas et l'iliaque sont **raccourcis à chaque coup de pédale** et ne
 * s'allongent jamais pendant la sortie. La recherche est nette sur trois
 * points : étirer seul ne suffit pas, les tenues doivent durer soixante à
 * quatre-vingt-dix secondes et non quinze, et l'ensemble ne vaut que combiné à
 * du renforcement des fessiers et du tronc.
 *
 * C'est la seule chose du catalogue **sans puissance, sans zone et sans
 * intensité**. Sa charge visée est volontairement basse — niveau 0 : elle ne
 * bloque rien, n'est jamais une séance de qualité, et se pose n'importe quel
 * jour. Y compris le lendemain d'une journée chargée, où elle sert le plus.
 */

import { createEvent, type ApiOutcome } from '../api/intervals'
import type { Credentials } from '../storage/credentials'
import type { DayKey } from '../calendar/dates'
import type { PlannedSession } from '../rules/types'
import { CANDIDATE_ID } from '../actions/place'

export type Movement = {
  name: string
  /** Ce que le mouvement va chercher. */
  target: string
  /** La consigne, en une phrase. */
  how: string
  /** Durée par côté, en secondes. */
  seconds: number
  /** Les deux côtés, ou une seule fois. */
  bothSides: boolean
}

/**
 * L'avant-sortie : de la mobilité, pas de l'étirement.
 *
 * Étirer longuement un muscle juste avant de lui demander de la force réduit
 * cette force. Avant, on bouge l'articulation dans toute son amplitude ; après,
 * on tient.
 */
export const BEFORE: readonly Movement[] = [
  {
    name: 'Cercles de hanche',
    target: 'toute l’articulation',
    how: 'Debout, genou levé, on dessine le plus grand cercle possible avec le genou. Lentement.',
    seconds: 30,
    bothSides: true,
  },
  {
    name: 'Balancers de jambe',
    target: 'psoas et ischio-jambiers',
    how: 'Appui sur un mur, la jambe balance d’avant en arrière. Sans forcer l’amplitude, on la laisse venir.',
    seconds: 30,
    bothSides: true,
  },
  {
    name: '90/90',
    target: 'rotation de hanche',
    how: 'Assis, une jambe devant à 90°, l’autre sur le côté à 90°. On bascule d’un côté à l’autre.',
    seconds: 60,
    bothSides: false,
  },
]

/**
 * L'après-sortie : les tenues longues.
 *
 * Soixante secondes au minimum. En dessous, l'effet sur la longueur du tissu
 * ne dure pas — c'est le point sur lequel la littérature est la plus nette, et
 * c'est celui que tout le monde rate.
 */
export const AFTER: readonly Movement[] = [
  {
    name: 'Fente à genou (couch stretch)',
    target: 'psoas — le principal',
    how: 'Un genou au sol, l’autre pied devant. On rentre le bassin sous soi avant d’avancer : sans cela on creuse le dos au lieu d’étirer la hanche. Le pied arrière peut monter sur un canapé pour aller plus loin.',
    seconds: 90,
    bothSides: true,
  },
  {
    name: 'Figure 4',
    target: 'fessier et piriforme',
    how: 'Allongé sur le dos, une cheville sur le genou opposé, on tire la cuisse vers soi.',
    seconds: 60,
    bothSides: true,
  },
  {
    name: 'Étirement des ischio-jambiers',
    target: 'arrière de cuisse',
    how: 'Allongé, la jambe tendue vers le plafond, une sangle ou une serviette au pied.',
    seconds: 60,
    bothSides: true,
  },
]

/**
 * Le renforcement, sans lequel le reste ne tient pas.
 *
 * Un psoas court l'est souvent parce que les fessiers ne font pas leur part.
 * Étirer sans renforcer revient à rallonger un muscle qui compense, et il se
 * raccourcira de nouveau.
 */
export const STRENGTH: readonly Movement[] = [
  {
    name: 'Pont fessier',
    target: 'fessiers',
    how: 'Allongé, pieds au sol, on monte le bassin en serrant les fessiers. Deux secondes en haut.',
    seconds: 60,
    bothSides: false,
  },
  {
    name: 'Dead bug',
    target: 'tronc profond',
    how: 'Allongé, bras et jambes en l’air, on descend un bras et la jambe opposée sans décoller le bas du dos.',
    seconds: 60,
    bothSides: false,
  },
]

/**
 * La charge visée, volontairement basse.
 *
 * En dessous du premier échelon du E.1, donc de niveau 0 : la séance ne pèse
 * sur aucune journée et ne bloque aucune règle. C'est voulu — elle doit pouvoir
 * se poser le lendemain d'une grosse sortie.
 */
export const MOBILITY_LOAD = 5

export const MOBILITY_NAME = 'Souplesse — hanches et psoas'

/** Le temps que la séance prend réellement, les deux côtés comptés. */
export function mobilitySeconds(movements: readonly Movement[] = ROUTINE): number {
  return movements.reduce(
    (total, move) => total + move.seconds * (move.bothSides ? 2 : 1),
    0,
  )
}

/** La routine complète, dans l'ordre où elle se fait. */
export const ROUTINE: readonly Movement[] = [...BEFORE, ...AFTER, ...STRENGTH]

/** La routine en texte, telle qu'elle part dans le calendrier. */
export function mobilityText(): string {
  const section = (title: string, movements: readonly Movement[]) =>
    [
      title,
      ...movements.map(
        (move) =>
          `- ${move.name} — ${move.seconds}s${move.bothSides ? ' par côté' : ''}. ${move.how}`,
      ),
    ].join('\n')

  return [
    section('AVANT (mobilité, on bouge)', BEFORE),
    '',
    section('APRÈS (tenues longues, 60 à 90 s)', AFTER),
    '',
    section('RENFORCEMENT (sans lui, le reste ne tient pas)', STRENGTH),
  ].join('\n')
}

/** La séance telle que les règles la liront : trop légère pour compter. */
export function asPlannedMobility(date: DayKey): PlannedSession {
  return { id: `${CANDIDATE_ID}:souplesse`, date, load: MOBILITY_LOAD, kind: 'autre' }
}

export function mobilityEvent(date: DayKey): Record<string, unknown> {
  return {
    category: 'WORKOUT',
    start_date_local: `${date}T00:00:00`,
    name: MOBILITY_NAME,
    // Ni Ride ni VirtualRide : il n'y a pas de vélo, pas de puissance, pas de
    // zone. Le type doit le dire.
    type: 'Workout',
    moving_time: mobilitySeconds(),
    icu_training_load: MOBILITY_LOAD,
    description: mobilityText(),
  }
}

export async function placeMobility(
  credentials: Credentials,
  date: DayKey,
): Promise<ApiOutcome<unknown>> {
  return createEvent(credentials, mobilityEvent(date))
}
