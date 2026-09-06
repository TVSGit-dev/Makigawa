/**
 * Le planning de la semaine (section 5, E.10).
 *
 * L'athlète l'a demandé ainsi : *« je ne veux pas encoder moi-même, je veux
 * que, en fonction de la charge et la fatigue, Makigawa fasse le planning et
 * me propose des séances pour m'améliorer. »*
 *
 * Ce module est le pendant du moteur de règles. Le moteur répond « ce jour
 * convient-il à cette séance ? » ; celui-ci pose la même question à l'envers
 * — quelles séances, quels jours — et se sert du même `refuse` pour répondre.
 * Il reste pur : il propose, l'athlète confirme (E.7).
 */

import { refuse, type Context } from '../rules/decide'
import { INTENTS } from '../rules/intent'
import { shiftDayKey, type DayKey } from '../calendar/dates'
import type { PlannedSession } from '../rules/types'
import { CANDIDATE_ID } from '../actions/place'
import { type Workout } from './compose'
import { familyOf, type Family } from './families'
import { composeAtLevel, nextLevel, zoneOfFamily, type Zone } from './levels'

/** L'horizon sur lequel l'app propose. Le même que le plan. */
export const HORIZON_DAYS = 14

/**
 * Les familles ouvertes selon la forme, de la plus sûre à la plus exigeante.
 *
 * Une CTL basse veut dire un corps qui n'a pas encaissé de travail dur depuis
 * longtemps. Lui poser du VO2 max la première semaine est le meilleur moyen de
 * le blesser ou de le dégoûter — et la recherche de la partie A est nette :
 * les tissus conjonctifs se réadaptent plus lentement que les muscles, donc le
 * risque n'est pas de manquer de forme, c'est de se sentir capable avant
 * d'être prêt.
 */
export const LADDER: readonly { fitness: number; families: readonly string[] }[] = [
  { fitness: 0, families: ['endurance', 'tempo', 'sweet-spot'] },
  { fitness: 25, families: ['endurance', 'tempo', 'sweet-spot', 'seuil'] },
  {
    fitness: 40,
    families: ['endurance', 'tempo', 'sweet-spot', 'seuil', 'vo2-30-30', 'vo2-30-15', 'navette'],
  },
]

/** Les familles qu'on peut proposer à cette forme, de la plus douce à la plus dure. */
export function familiesFor(fitness: number | null): Family[] {
  const rung = [...LADDER].reverse().find((step) => (fitness ?? 0) >= step.fitness) ?? LADDER[0]!
  return rung.families
    .map((key) => familyOf(key))
    .filter((family): family is Family => family !== undefined)
}

export type Suggestion = {
  date: DayKey
  workout: Workout
  /** Pourquoi cette séance-là, ce jour-là. */
  because: string
}

export type WeekOptions = {
  context: Context
  today: DayKey
  /** La forme d'intervals.icu. Elle décide de ce qui est ouvert. */
  fitness: number | null
  horizon?: number
  /**
   * Les familles que l'athlète a écartées (E.14).
   *
   * On n'y revient pas pour avoir quelque chose à montrer : si tout est
   * écarté, l'app ne propose rien et le dit.
   */
  refused?: readonly string[]
  /**
   * Le jour avant lequel il ne veut rien (E.14).
   *
   * L'horizon repart de là plutôt que d'aujourd'hui : repousser ne doit pas
   * réduire ce que l'app peut proposer.
   */
  notBefore?: DayKey | null
  /**
   * Les niveaux atteints zone par zone (E.16), lus sur ce qui a été tenu.
   *
   * Absents, tout vaut zéro et l'app propose le premier échelon : c'est le
   * comportement d'un athlète dont on ne sait encore rien.
   */
  levels?: Partial<Record<Zone, number>>
  /** La reprise du E.5 : on repart au niveau tenu, sans le cran de plus. */
  reprise?: boolean
}

/**
 * Ce que Makigawa propose pour les jours qui viennent.
 *
 * La séance la plus exigeante passe en premier : elle est placée quand la
 * fraîcheur est la meilleure, et la reporter en fin de semaine reviendrait à
 * la faire sur des jambes déjà entamées.
 *
 * **Chaque séance retenue entre dans le décor de la suivante.** Sans cela
 * l'app en placerait deux le même jour, ou deux d'affilée, et se
 * contredirait au premier examen.
 *
 * Le plan est **recalculé en entier** à chaque refus plutôt que rapiécé
 * (E.14) : les séances suivantes sont placées par rapport à la première, donc
 * déplacer celle-ci sans replacer les autres produirait deux séances collées.
 */
export function planWeek({
  context,
  today,
  fitness,
  horizon = HORIZON_DAYS,
  refused = [],
  notBefore = null,
  levels = {},
  reprise = false,
}: WeekOptions): Suggestion[] {
  const quota = INTENTS[context.intent].chargedDaysPerWeek
  const available = familiesFor(fitness).filter((family) => !refused.includes(family.key))
  if (available.length === 0) return []

  // Un report déplace la fenêtre entière, il ne la rogne pas : le plan repart
  // du premier jour encore acceptable (E.14).
  const start = notBefore && notBefore > today ? notBefore : today

  const suggestions: Suggestion[] = []
  // Une copie du décor, qu'on enrichit à mesure : la deuxième séance doit voir
  // la première.
  let planned = [...context.planned]
  const taken: DayKey[] = []

  for (let index = 0; index < quota; index += 1) {
    // De la plus exigeante à la plus douce. Au-delà du nombre de familles
    // ouvertes, on redescend en boucle plutôt que de ne rien proposer.
    const family = available[Math.max(0, available.length - 1 - index) % available.length]!
    // La durée ne vient plus du rang de la séance dans la semaine mais du
    // niveau tenu dans sa zone : elle vise un cran au-dessus (E.16).
    const zone = zoneOfFamily(family.key)
    const level = zone ? (levels[zone] ?? 0) : 0
    const workout = composeAtLevel(family, nextLevel(level, reprise))

    const placed = firstFittingDay({ ...context, planned }, start, horizon, workout, taken)
    if (!placed) continue

    suggestions.push({
      date: placed,
      workout,
      because: reasonFor(family, index, fitness, level, reprise),
    })
    planned = [...planned, sessionFor(workout, placed)]
    taken.push(placed)
  }

  return suggestions
}

/**
 * Le premier jour de l'horizon où le E.2 dit oui, et où l'app n'a rien posé.
 *
 * Les deux contrôles sont nécessaires, et le second n'est pas une redondance.
 * Une séance que Makigawa vient de composer n'a **pas encore de charge** —
 * c'est intervals.icu qui la calculera — donc les règles ne la reconnaissent
 * pas comme une séance de qualité et ne l'espacent pas. Le planificateur tient
 * lui-même l'écart du E.4 sur ses propres propositions : un jour au minimum
 * entre deux.
 */
function firstFittingDay(
  context: Context,
  start: DayKey,
  horizon: number,
  workout: Workout,
  taken: readonly DayKey[],
): DayKey | null {
  for (let ahead = 0; ahead < horizon; ahead += 1) {
    const date = shiftDayKey(start, ahead)
    if (touchesTaken(date, taken)) continue
    if (!refuse(sessionFor(workout, date), date, context)) return date
  }
  return null
}

/** Le jour, ou l'un de ses deux voisins, porte-t-il déjà une proposition ? */
function touchesTaken(date: DayKey, taken: readonly DayKey[]): boolean {
  return taken.some(
    (other) =>
      other === date || other === shiftDayKey(date, -1) || other === shiftDayKey(date, 1),
  )
}

/**
 * La séance envisagée, telle que les règles la liront.
 *
 * Sa charge est inconnue — c'est intervals.icu qui la calculera depuis la
 * structure. Les jours restent examinés sur tout le reste : la veille chargée,
 * la séance de qualité voisine, le renfo trop proche.
 */
function sessionFor(workout: Workout, date: DayKey): PlannedSession {
  // Toutes les familles composées sollicitent la filière aérobie : aucune
  // n'est du renfo, dont l'espacement du E.4 est plus large.
  return { id: `${CANDIDATE_ID}:${workout.name}`, date, load: null, kind: 'endurance' }
}

/**
 * Pourquoi cette séance-là, ce jour-là.
 *
 * Le niveau passe avant le reste dès qu'il y en a un : c'est la réponse
 * concrète à « pour m'améliorer », et elle est vérifiable — l'athlète peut la
 * rapprocher de la séance qu'il a tenue la semaine d'avant.
 */
function reasonFor(
  family: Family,
  index: number,
  fitness: number | null,
  level: number,
  reprise: boolean,
): string {
  if (reprise) {
    return level > 0
      ? `Deux semaines sans séance de qualité : on repart au niveau ${level}, sans monter.`
      : `Deux semaines sans séance de qualité : on repart doucement.`
  }

  if (level > 0) {
    return `${family.name} niveau ${level} tenu la dernière fois : celle-ci vise le ${level + 1}.`
  }

  if (index === 0) {
    return fitness !== null && fitness < 25
      ? `Ta forme est encore basse : ${family.name.toLowerCase()} construit sans casser.`
      : `La séance la plus exigeante de la semaine, posée quand tu es le plus frais.`
  }
  return `Pour compléter la semaine, plus court et plus doux.`
}
