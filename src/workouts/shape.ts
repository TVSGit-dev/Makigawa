/**
 * Une séance dite en style, en dose et en forme (section 5, E.23).
 *
 * L'athlète ne recopie plus la notation : il lit une intention, puis cherche
 * dans le catalogue de Zwift une séance qui y ressemble. Ce module écrit cette
 * intention.
 *
 * **Les pourcentages s'accompagnent de leur équivalent en watts** quand la FTP
 * est connue. Zwift affiche des watts ; une intention illisible dans l'unité de
 * l'outil n'est pas une intention. La décision, elle, reste un pourcentage —
 * le jour du test FTP, tout se recalibre sans qu'une séance ne bouge.
 */

import { blockSeconds } from './families'
import type { Workout } from './compose'
import { wattsOf } from '../rides/outing'

/** « 90 s », « 12 min », « 2 min 20 ». */
function duration(seconds: number): string {
  if (seconds < 60) return `${seconds} s`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return rest === 0 ? `${minutes} min` : `${minutes} min ${rest}`
}

/** « 95 % (210 W) », ou « 95 % » quand la FTP est inconnue. */
export function intensity(percent: number, ftp: number | null): string {
  const watts = wattsOf(percent, ftp)
  return watts === null ? `${percent} %` : `${percent} % (${watts} W)`
}

/**
 * La forme de la séance, en une à trois lignes.
 *
 * Assez pour reconnaître une séance équivalente dans un catalogue, pas assez
 * pour la recopier — c'est exactement ce qui a été demandé.
 */
export function shapeOf(workout: Workout, ftp: number | null): string[] {
  const { family, sets, reps } = workout
  const lines: string[] = []

  const work = duration(blockSeconds(family, reps))
  // « de travail », parce que l'en-tête annonce la durée totale : sans ce mot,
  // « 29 min » et « 15 min » sur deux lignes voisines se contredisent.
  const bloc = sets > 1 ? `${sets} × ${work} de travail` : `${work} de travail`

  if (family.pattern.length === 1) {
    // Un seul palier : tout tient sur une ligne.
    lines.push(`${bloc} à ${intensity(family.pattern[0]!.percent, ftp)}`)
  } else {
    lines.push(bloc)
    lines.push(
      family.pattern
        .map((block) => `${duration(block.seconds)} à ${intensity(block.percent, ftp)}`)
        .join(', puis ') + (reps > 1 ? ', en alternance' : ''),
    )
  }

  if (sets > 1 && family.between > 0) {
    lines.push(`Récup ${duration(family.between)} à ${intensity(family.betweenPercent, ftp)}`)
  }

  return lines
}
