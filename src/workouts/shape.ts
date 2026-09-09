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

  // « de travail », parce que l'en-tête annonce la durée totale : sans ce mot,
  // « 29 min » et « 15 min » sur deux lignes voisines se contredisent. Une
  // famille douce ne travaille pas, elle roule — et le dire autrement serait
  // annoncer une séance qu'elle n'est pas (E.25).
  const quoi = family.gentle ? 'de roulage' : 'de travail'
  // Sans récupération entre les blocs, ils se suivent sans coupure : les
  // compter séparément annoncerait un fractionné là où il n'y en a pas.
  const continu = family.between === 0
  const work = duration(blockSeconds(family, reps) * (continu ? sets : 1))
  const bloc = sets > 1 && !continu ? `${sets} × ${work} ${quoi}` : `${work} ${quoi}`

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

/** Une ligne du tableau de la séance : un intitulé, une valeur, sa note. */
export type Spec = { label: string; value: string; note?: string }

/**
 * Les chiffres d'une séance, en tableau plutôt qu'en phrases (9 septembre 2026).
 *
 * `shapeOf` dit la même chose en français, et c'est ce qu'il faut la première
 * fois. Une fois la notation connue, un tableau se lit plus vite : les mêmes
 * intitulés au même endroit d'une séance à l'autre, et l'œil va droit au
 * chiffre qui a changé.
 *
 * Rien de neuf n'y est calculé — les pourcentages viennent des familles, les
 * watts de la FTP d'intervals.icu, les durées de la structure composée.
 */
export function specsOf(workout: Workout, ftp: number | null): Spec[] {
  const { family, sets, reps } = workout
  const bloc = blockSeconds(family, reps)
  // Sans récupération entre eux, les blocs se suivent sans coupure : c'est un
  // seul bloc, et en annoncer plusieurs ferait croire à un fractionné (E.23).
  const continu = family.between === 0
  const blocs = continu ? 1 : sets

  const specs: Spec[] = [{ label: 'Travail', value: duration(bloc * sets) }]

  // Un seul bloc : « Découpe » répéterait « Travail » mot pour mot.
  if (blocs > 1) specs.push({ label: 'Découpe', value: `${blocs} × ${duration(bloc)}` })

  // Un palier par marche du motif. Deux marches sur un over-under, une seule
  // sur un bloc continu — le tableau suit la famille, il ne la normalise pas.
  const paliers = family.pattern.filter((block) => block.seconds > 0)
  for (const [index, block] of paliers.entries()) {
    specs.push({
      label:
        paliers.length === 1
          ? 'Intensité'
          : index === 0
            ? 'Premier palier'
            : index === paliers.length - 1
              ? 'Dernier palier'
              : `Palier ${index + 1}`,
      value: `${block.percent} %`,
      note: `${duration(block.seconds)}${wattsOf(block.percent, ftp) === null ? '' : ` · ${wattsOf(block.percent, ftp)} W`}`,
    })
  }

  if (blocs > 1 && family.between > 0) {
    specs.push({
      label: 'Récup',
      value: duration(family.between),
      note: `${family.betweenPercent} %`,
    })
  }

  return specs
}
