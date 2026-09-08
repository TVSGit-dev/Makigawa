/**
 * Où chercher la séance dans Zwift (section 5, E.27).
 *
 * Le E.23 a fait de la proposition une intention : un style, une dose, la forme
 * des blocs. L'athlète va ensuite chercher l'équivalent dans le catalogue de
 * Zwift, et cette dernière étape restait entièrement à sa charge.
 *
 * Or il n'y a rien à inventer : **Zwift range ses séances dans des collections
 * qui portent le même vocabulaire que les zones du projet.** Il suffit de nommer
 * la bonne, et de dire quoi y chercher.
 *
 * C'est un **panneau indicateur**, pas une recette : l'app nomme un rayon, pas
 * un article. La frontière du E.9 tient — le contenu ne vient toujours pas de
 * Makigawa. Et elle ne prétend pas que la séance existe : si rien dans ce rayon
 * ne ressemble à la dose proposée, c'est le catalogue de Zwift qui décide.
 */

import { blockSeconds } from './families'
import type { Workout } from './compose'
import { zoneOfFamily, type Zone } from './levels'

/**
 * Les collections de Zwift, telles qu'elles s'appellent dans l'application.
 *
 * En anglais, parce que c'est ainsi qu'elles s'affichent — les traduire ferait
 * chercher un rayon qui n'existe pas.
 */
export const ZWIFT_COLLECTIONS: Record<Zone, string> = {
  recuperation: 'Recovery',
  endurance: 'Endurance',
  tempo: 'Tempo',
  'sweet-spot': 'Sweet Spot',
  seuil: 'Threshold',
  vo2: 'VO2 Max',
  anaerobie: 'Anaerobic',
}

export type Pointer = {
  /** Le rayon : « Sweet Spot ». */
  collection: string
  /** Ce qu'on y cherche : « ~45 min, des blocs de 15 min ». */
  hint: string
}

/** En dessous d'une minute, la longueur d'un bloc n'aide pas à reconnaître. */
const HINT_MIN_SECONDS = 60

/**
 * Le rayon de Zwift où chercher cette séance, et ce qu'on y cherche.
 *
 * `null` quand la famille n'a pas de zone : on ne montre pas un panneau qui ne
 * mène nulle part.
 */
export function pointerFor(workout: Workout): Pointer | null {
  const zone = zoneOfFamily(workout.family.key)
  if (!zone) return null

  const minutes = Math.round(workout.seconds / 60 / 5) * 5
  const parts = [`~${minutes} min`]

  // Sans récupération entre eux, les blocs se suivent sans coupure : c'est un
  // seul bloc, et en annoncer plusieurs ferait chercher un fractionné.
  const continu = workout.family.between === 0
  const block = blockSeconds(workout.family, workout.reps) * (continu ? workout.sets : 1)
  const long = Math.round(block / 60)

  // La longueur d'un bloc est ce qui distingue deux séances d'une même
  // collection ; sans elle, le panneau dit seulement la durée totale.
  if (block >= HINT_MIN_SECONDS) {
    parts.push(
      continu || workout.sets === 1
        ? `un bloc de ${long} min`
        : `${workout.sets} blocs de ${long} min`,
    )
  }

  return { collection: ZWIFT_COLLECTIONS[zone], hint: parts.join(', ') }
}
