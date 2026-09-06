/**
 * Les niveaux par zone (section 5, E.16).
 *
 * Empruntés aux *Progression Levels* de TrainerRoad, et la vraie réponse à
 * « propose-moi des séances pour m'améliorer » : jusqu'ici l'app choisissait
 * sur la CTL seule, ce qui dit ce que le corps encaisse en général, pas ce
 * qu'il tient dans une zone donnée.
 *
 * **Le niveau ne se stocke pas, il se lit** — sur la plus grosse séance de la
 * zone que l'athlète a tenue ces six dernières semaines (E.15). Rien ne dérive,
 * rien n'est à migrer, et une séance manquée ne retire jamais de niveau : un
 * niveau ne retombe que parce que la séance qui le portait sort de la fenêtre.
 */

import type { Completion } from '../rules/done'
import { compose, type Workout } from './compose'
import type { Block, Family } from './families'
import { blocksOf } from './read'

export type Zone = 'endurance' | 'tempo' | 'sweet-spot' | 'seuil' | 'vo2' | 'anaerobie'

export const ZONES: readonly Zone[] = [
  'endurance',
  'tempo',
  'sweet-spot',
  'seuil',
  'vo2',
  'anaerobie',
]

export const ZONE_NAMES: Record<Zone, string> = {
  endurance: 'Endurance',
  tempo: 'Tempo',
  'sweet-spot': 'Sweet spot',
  seuil: 'Seuil',
  vo2: 'VO2 max',
  anaerobie: 'Anaérobie',
}

/**
 * Deux familles d'une même zone partagent leur niveau : elles construisent la
 * même chose, et tenir un 30/15 prouve quelque chose sur le 30/30.
 */
const ZONE_OF_FAMILY: Record<string, Zone> = {
  endurance: 'endurance',
  tempo: 'tempo',
  'sweet-spot': 'sweet-spot',
  'sweet-spot-continu': 'sweet-spot',
  seuil: 'seuil',
  'vo2-30-30': 'vo2',
  'vo2-30-15': 'vo2',
  navette: 'anaerobie',
}

export function zoneOfFamily(key: string): Zone | null {
  return ZONE_OF_FAMILY[key] ?? null
}

/**
 * La zone d'une séance, reconnue à son nom.
 *
 * C'est Makigawa qui écrit ces noms, donc ils sont fiables pour ses propres
 * séances. Une séance venue d'ailleurs et nommée autrement ne fait monter
 * aucun niveau — sous-estimation assumée du E.16 : l'app propose alors plus
 * doux que ce que l'athlète tient.
 */
const NAME_MARKS: readonly (readonly [string, Zone])[] = [
  ['navette', 'anaerobie'],
  ['vo2', 'vo2'],
  ['sweet spot', 'sweet-spot'],
  ['sweetspot', 'sweet-spot'],
  ['seuil', 'seuil'],
  ['threshold', 'seuil'],
  ['tempo', 'tempo'],
  ['endurance', 'endurance'],
]

function plain(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function zoneOfName(name: string | null): Zone | null {
  if (!name) return null
  const flat = plain(name)
  return NAME_MARKS.find(([mark]) => flat.includes(mark))?.[1] ?? null
}

/**
 * À partir de quelle intensité un bloc compte comme du travail, par zone.
 *
 * Les seuils suivent les motifs des familles, relevés chez l'athlète : le
 * « under » d'un over-under sweet spot est à 85 %, donc le plancher est plus
 * bas ; la récupération d'un 30/30 est à 65 %, donc il est bien plus haut.
 */
export const WORK_FLOOR: Record<Zone, number> = {
  endurance: 56,
  tempo: 76,
  'sweet-spot': 84,
  seuil: 92,
  vo2: 105,
  anaerobie: 120,
}

/**
 * En dessous de vingt secondes, un bloc n'est pas du travail.
 *
 * C'est ce qui écarte les ouvertures — deux sprints de quinze secondes avant
 * une séance dure, qui réveillent sans fatiguer — tout en gardant les vingt
 * secondes de la navette lactate, qui sont bel et bien le travail.
 */
export const MIN_WORK_BLOCK = 20

/** Le temps de travail d'une séance : les blocs d'effort, le reste exclu. */
export function workSeconds(blocks: readonly Block[], zone: Zone): number {
  const floor = WORK_FLOOR[zone]
  return blocks
    .filter((block) => block.percent >= floor && block.seconds >= MIN_WORK_BLOCK)
    .reduce((total, block) => total + block.seconds, 0)
}

export const LEVELS = 10

/**
 * Les dix échelons de chaque zone, en secondes de travail.
 *
 * Ce sont des durées, pas des intensités : c'est de l'organisation, ce que
 * Makigawa a le droit de décider. Les intensités restent celles des familles,
 * relevées chez l'athlète, et la FTP qui les résout reste celle
 * d'intervals.icu.
 *
 * Les échelles diffèrent d'une zone à l'autre parce que les zones ne se
 * travaillent pas aux mêmes durées : dix minutes de VO2 max sont beaucoup, dix
 * minutes d'endurance ne sont rien.
 *
 * **Le sommet de chaque échelle est ce qui tient en soixante-quinze minutes**,
 * pas ce que l'athlète peut encaisser. Sa contrainte n'est pas sa forme, c'est
 * son agenda — deux enfants en bas âge. Les blocs de 4 × 30 min de son coach
 * dépassent ce plafond, et c'est le plafond qui gagne.
 */
export const LADDERS: Record<Zone, readonly number[]> = {
  endurance: [1200, 1500, 1800, 2100, 2400, 2700, 3000, 3300, 3600, 4000],
  tempo: [600, 780, 960, 1140, 1320, 1500, 1680, 1860, 1980, 2040],
  'sweet-spot': [720, 900, 1140, 1380, 1620, 1860, 2100, 2340, 2580, 2760],
  seuil: [450, 700, 900, 1150, 1350, 1600, 1800, 2100, 2400, 2700],
  vo2: [240, 300, 360, 420, 480, 600, 720, 840, 960, 1080],
  anaerobie: [80, 100, 120, 140, 160, 180, 200, 220, 230, 240],
}

/** Le niveau d'un temps de travail, de 0 — rien de tenu — à dix. */
export function levelOfWork(zone: Zone, seconds: number): number {
  return LADDERS[zone].filter((rung) => seconds >= rung).length
}

/** Une séance tenue, réduite à ce qui fait un niveau. */
export type Held = {
  zone: Zone
  seconds: number
}

/**
 * Ce que les séances tenues valent, zone par zone.
 *
 * Seules les **tenues** comptent. Une séance allégée a été faite à moins de
 * 85 % de ce qui était prévu, mais son temps de travail se lit sur la
 * structure prévue : la compter au prix fort ferait monter un niveau qui n'a
 * pas été gagné.
 */
export function heldFrom(completions: readonly Completion[]): Held[] {
  const held: Held[] = []

  for (const completion of completions) {
    if (completion.outcome !== 'tenue') continue
    const zone = zoneOfName(completion.event.name)
    if (!zone) continue

    const seconds = workSeconds(blocksOf(completion.event.description), zone)
    if (seconds > 0) held.push({ zone, seconds })
  }

  return held
}

/** Le niveau atteint dans une zone. Zéro tant que rien n'y a été tenu. */
export function levelIn(zone: Zone, held: readonly Held[]): number {
  return held
    .filter((one) => one.zone === zone)
    .reduce((best, one) => Math.max(best, levelOfWork(zone, one.seconds)), 0)
}

export function levelsFrom(held: readonly Held[]): Record<Zone, number> {
  return Object.fromEntries(ZONES.map((zone) => [zone, levelIn(zone, held)])) as Record<
    Zone,
    number
  >
}

/**
 * Le niveau que la prochaine séance vise.
 *
 * Un cran au-dessus de ce qui a été tenu : c'est la définition d'une
 * progression, et la seule façon de rester sous le plafond de +10 % par
 * semaine du E.5. Pendant une reprise, on repart au niveau tenu sans le cran —
 * on reprend là où on s'était arrêté, on ne progresse pas le premier jour.
 */
export function nextLevel(level: number, reprise = false): number {
  return Math.min(LEVELS, Math.max(1, reprise ? level : level + 1))
}

/**
 * Le plafond de temps, en minutes, et les durées explorées pour l'atteindre.
 *
 * Aucune séance proposée ne dépasse soixante-quinze minutes, quel que soit le
 * niveau atteint.
 */
export const MAX_MINUTES = 75
const CANDIDATE_MINUTES = [30, 35, 40, 45, 50, 55, 60, 65, 70, MAX_MINUTES] as const

/**
 * La séance de cette famille qui vise ce niveau.
 *
 * La plus **courte** qui atteigne le temps de travail voulu : au-delà, on
 * ajouterait de l'échauffement sans ajouter de travail. Quand aucune ne
 * l'atteint — le niveau dépasse ce qui tient dans le plafond — on prend celle
 * qui en fait le plus.
 */
export function composeAtLevel(family: Family, level: number): Workout {
  const zone = zoneOfFamily(family.key)
  if (!zone) return compose(family, 45)

  const target = LADDERS[zone][Math.min(LEVELS, Math.max(1, level)) - 1] ?? 0
  const candidates = CANDIDATE_MINUTES.map((minutes) => compose(family, minutes))

  const reaching = candidates.filter((workout) => workSeconds(workout.blocks, zone) >= target)
  if (reaching.length > 0) {
    return reaching.reduce((best, one) => (one.seconds < best.seconds ? one : best))
  }

  return candidates.reduce((best, one) =>
    workSeconds(one.blocks, zone) > workSeconds(best.blocks, zone) ? one : best,
  )
}
