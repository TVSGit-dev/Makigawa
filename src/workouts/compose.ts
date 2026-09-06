/**
 * L'organisation d'une séance (section 5, E.9).
 *
 * C'est la part de Makigawa dans la division que l'athlète a posée le
 * 6 septembre 2026 : **tous les chiffres viennent d'intervals.icu,
 * l'organisation vient de Makigawa.**
 *
 * Ce module ne choisit aucune intensité — elles viennent des familles, elles
 * sont écrites en pourcentage de FTP, et c'est la FTP d'intervals.icu qui les
 * résout. Il ne calcule aucune charge non plus : la structure part telle
 * quelle, intervals.icu en déduit la charge, et l'app la relit ensuite.
 *
 * Ce qu'il décide est le reste : combien de blocs, combien de répétitions,
 * quel échauffement, et comment tout cela tient dans le temps disponible.
 */

import {
  blockSeconds,
  COOLDOWN,
  COOLDOWN_SHORT,
  OPENERS,
  SETTLE,
  WARMUP,
  WARMUP_SHORT,
  type Block,
  type Family,
} from './families'

export type Workout = {
  name: string
  family: Family
  sets: number
  reps: number
  /** Un échauffement long met treize minutes ; le court en met sept. */
  long: boolean
  blocks: Block[]
  /** Durée totale, en secondes. Déduite des blocs, jamais saisie. */
  seconds: number
}

/**
 * Les durées que l'athlète peut demander.
 *
 * Trente et quarante-cinq minutes d'abord : avec deux enfants en bas âge,
 * c'est la contrainte qui décide, et les séances fournies duraient toutes
 * une heure ou plus.
 */
export const DURATIONS = [30, 45, 60, 75] as const

/** La séance qu'on obtient pour un nombre de blocs et de répétitions donné. */
export function build(family: Family, sets: number, reps: number, long = true): Workout {
  const blocks: Block[] = [...(long ? WARMUP : WARMUP_SHORT)]
  if (family.openers) blocks.push(...OPENERS, { seconds: 120, percent: 65 })

  for (let set = 0; set < sets; set += 1) {
    for (let rep = 0; rep < reps; rep += 1) blocks.push(...family.pattern)
    // Pas de récupération après le dernier bloc : le retour au calme la fait.
    if (set < sets - 1 && family.between > 0) {
      blocks.push({ seconds: family.between, percent: 65 })
    }
  }

  blocks.push(SETTLE, ...(long ? COOLDOWN : COOLDOWN_SHORT))

  return {
    name: nameOf(family, sets, reps),
    family,
    sets,
    reps,
    long,
    blocks,
    seconds: blocks.reduce((total, block) => total + block.seconds, 0),
  }
}

/**
 * La séance de cette famille la plus proche du temps demandé.
 *
 * Toutes les combinaisons possibles sont construites, et on garde celle dont
 * la durée réelle tombe le plus près. Chercher la combinaison plutôt que de
 * l'imposer est ce qui permet de demander « quarante-cinq minutes » sans
 * savoir combien de répétitions cela fait.
 */
export function compose(family: Family, minutes: number): Workout {
  const target = minutes * 60
  let best: Workout | null = null

  for (const long of [true, false]) {
    for (const sets of family.sets) {
      for (const reps of family.reps) {
        // Un bloc trop long fait une séance que la famille ne fait pas.
        if (blockSeconds(family, reps) > family.maxBlock) continue

        const candidate = build(family, sets, reps, long)
        if (!best || better(candidate, best, target)) best = candidate
      }
    }
  }

  // Chaque famille déclare au moins un `sets` et un `reps` : la boucle produit
  // toujours au moins une séance.
  return best as Workout
}

function gap(workout: Workout, target: number): number {
  return Math.abs(workout.seconds - target)
}

/**
 * À durée égale, la séance coupée en blocs l'emporte sur la séance d'un seul
 * tenant : la récupération entre les blocs est ce qui permet de tenir
 * l'intensité jusqu'au dernier, et c'est la forme qu'ont les séances de
 * référence.
 */
function better(candidate: Workout, best: Workout, target: number): boolean {
  const écart = gap(candidate, target)
  const meilleur = gap(best, target)
  if (écart !== meilleur) return écart < meilleur
  return candidate.sets > best.sets
}

/**
 * L'écart qu'on accepte entre le temps demandé et le temps réel.
 *
 * Les motifs sont indivisibles — on ne coupe pas une navette lactate en deux —
 * donc viser au quart d'heure près est le mieux qu'on puisse promettre.
 */
export const TOLERANCE_MINUTES = 12

/**
 * Les durées que cette famille sait réellement tenir.
 *
 * Toutes ne savent pas tout faire : la navette lactate ne monte pas à
 * soixante-quinze minutes sans qu'on lui invente un volume que les séances
 * de référence ne contiennent pas. Proposer une durée qu'on ne sait pas
 * remplir serait promettre à faux — l'app n'offre que ce qu'elle tient.
 */
export function durationsFor(family: Family): number[] {
  return DURATIONS.filter(
    (minutes) => Math.abs(compose(family, minutes).seconds / 60 - minutes) <= TOLERANCE_MINUTES,
  )
}

/**
 * La structure, dans la notation qu'intervals.icu attend.
 *
 * Les répétitions sont écrites en toutes lettres, un bloc par ligne, plutôt
 * qu'avec une syntaxe de boucle. C'est plus long à lire mais c'est la seule
 * forme dont la lecture ait été constatée sur le calendrier réel — et c'est
 * aussi celle que la réduction de moitié du E.3 sait raccourcir.
 */
export function toNotation(workout: Workout): string {
  return workout.blocks.map((block) => `- ${duration(block.seconds)} ${block.percent}%`).join('\n')
}

function duration(seconds: number): string {
  return seconds % 60 === 0 ? `${seconds / 60}m` : `${seconds}s`
}

function nameOf(family: Family, sets: number, reps: number): string {
  if (family.key === 'endurance') return `${family.name} ${Math.round((sets * 600) / 60)}`
  if (reps === 1) return `${family.name} ${sets} × ${Math.round(family.pattern[0]!.seconds / 60)}m`
  return `${family.name} ${sets} × ${reps}`
}

/** L'événement de calendrier que devient une séance composée. */
export function eventFor(workout: Workout, date: string): Record<string, unknown> {
  return {
    category: 'WORKOUT',
    start_date_local: `${date}T00:00:00`,
    name: workout.name,
    type: 'VirtualRide',
    moving_time: workout.seconds,
    description: toNotation(workout),
    // Aucune charge n'est envoyée : intervals.icu la calcule depuis la
    // structure, et une charge écrite à la main serait figée.
  }
}
