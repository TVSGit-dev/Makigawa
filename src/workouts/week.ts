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

import { refuse, type Context, type Refusal } from '../rules/decide'
import { INTENTS } from '../rules/intent'
import { shiftDayKey, type DayKey } from '../calendar/dates'
import { CANDIDATE_ID, type PlannedSession } from '../rules/types'
import { type Workout } from './compose'
import { familyOf, type Family } from './families'
import {
  composeAtLevel,
  nextLevel,
  standingOf,
  unloadLevel,
  zoneOfFamily,
  type Standing,
  type Zone,
} from './levels'

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
  { fitness: 0, families: ['recuperation', 'endurance', 'tempo', 'sweet-spot'] },
  {
    fitness: 25,
    families: ['recuperation', 'endurance', 'tempo', 'sweet-spot', 'seuil-continu', 'seuil'],
  },
  {
    fitness: 40,
    families: [
      'recuperation',
      'endurance',
      'tempo',
      'sweet-spot',
      'seuil-continu',
      'seuil',
      'vo2-30-30',
      'vo2-30-15',
      'vo2-long',
      'navette',
    ],
  },
]

/** Les familles qu'on peut proposer à cette forme, de la plus douce à la plus dure. */
export function familiesFor(fitness: number | null): Family[] {
  const rung = [...LADDER].reverse().find((step) => (fitness ?? 0) >= step.fitness) ?? LADDER[0]!
  return rung.families
    .map((key) => familyOf(key))
    .filter((family): family is Family => family !== undefined)
}

/**
 * Une famille qu'on peut faire un jour où le corps n'est pas prêt (E.30).
 *
 * Les deux zones qui ne demandent pas d'intensité, et elles seules : c'est la
 * même frontière que celle déclarée par `sessionFor`, et il vaut mieux qu'elle
 * n'existe qu'à un endroit.
 */
export function isGentle(family: Family): boolean {
  const zone = zoneOfFamily(family.key)
  return zone === 'recuperation' || zone === 'endurance'
}

export type Suggestion = {
  date: DayKey
  workout: Workout
  /** Pourquoi cette séance-là, ce jour-là. */
  because: string
  /**
   * Ce que vaut le cran proposé, par rapport au niveau tenu dans la zone
   * (E.26). Le planificateur connaît les deux nombres ; personne d'autre.
   */
  standing: Standing
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
  /** La décharge du E.18 : moitié moins de travail, intensité inchangée. */
  decharge?: boolean
  /**
   * Appelé pour chaque jour écarté, avec son motif (E.21).
   *
   * C'est ce qui alimente le journal : sans lui, personne ne peut dire si une
   * règle bloque six séances par semaine ou aucune. Le planificateur reste
   * déterministe — il rapporte ce qu'il a fait, il ne lit rien.
   */
  onRefused?: (refusal: { date: DayKey; code: Refusal['code']; what: string }) => void
  /**
   * La forme monte déjà au plafond (E.20) : le plan tient son niveau.
   *
   * Rien n'est retiré, rien n'est réduit — la semaine ressemble à la
   * précédente. On ne progresse pas en ajoutant à ce qui monte déjà.
   */
  hold?: boolean
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
  decharge = false,
  hold = false,
  onRefused,
}: WeekOptions): Suggestion[] {
  // Le quota est hebdomadaire ; l'horizon fait deux semaines. Le plan couvre
  // les deux (E.19) — le E.2 et le E.4 se chargent de les espacer.
  // Une décharge ne concerne que la semaine en cours (E.18) : on n'en étale
  // pas deux, la suivante repartira normalement.
  const weeks = decharge ? 1 : Math.max(1, Math.round(horizon / 7))
  const quota = INTENTS[context.intent].chargedDaysPerWeek * weeks
  const available = familiesFor(fitness)
    .filter((family) => !refused.includes(family.key))
    // Une variabilité basse ferme l'intensité, elle ne ferme pas la journée
    // (E.30). Sans ce filtre, le planificateur ne proposait que des familles
    // dures, le E.2 les refusait toutes, et l'app affichait « rien de prévu » —
    // ce qui se lit comme « ne bouge pas », exactement ce que la règle ne dit
    // pas.
    .filter((family) => !context.lowVariability || isGentle(family))
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
    const target =
      decharge && zone ? unloadLevel(zone, level) : nextLevel(level, reprise || hold, zone)
    const workout = composeAtLevel(family, target)

    const placed = firstFittingDay(
      { ...context, planned },
      start,
      horizon,
      workout,
      taken,
      INTENTS[context.intent].chargedDaysPerWeek,
      onRefused && ((date, code) => onRefused({ date, code, what: family.name })),
    )
    if (!placed) continue

    suggestions.push({
      date: placed,
      workout,
      because: reasonFor(family, index, fitness, level, reprise, decharge, hold),
      standing: standingOf(level, target, zone),
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
  perWeek: number,
  note?: (date: DayKey, code: Refusal['code']) => void,
): DayKey | null {
  for (let ahead = 0; ahead < horizon; ahead += 1) {
    const date = shiftDayKey(start, ahead)
    // Les deux premiers écarts sont l'affaire du planificateur, pas des
    // règles : les noter dirait « le E.2 a refusé » là où c'est lui-même qui
    // s'est fait de la place.
    if (touchesTaken(date, taken)) continue
    if (!fitsWeeklyQuota(date, taken, perWeek)) continue

    const refusal = refuse(sessionFor(workout, date), date, context)
    if (!refusal) return date
    note?.(date, refusal.code)
  }
  return null
}

/**
 * Le quota hebdomadaire, tenu par le planificateur lui-même.
 *
 * Le E.2 ne peut pas le faire ici : une séance composée n'a pas de charge —
 * intervals.icu la calculera depuis la structure — donc `weighDay` la voit
 * comme une journée vide et le quota du mode ne se déclenche jamais. C'est la
 * même raison qui oblige le planificateur à tenir son propre espacement.
 *
 * La règle est glissante : **aucune fenêtre de sept jours** ne doit porter plus
 * de séances que le mode n'en autorise. Sans elle, un plan de deux semaines
 * entasse tout au début de l'horizon — quatre séances en une semaine là où le
 * mode normal en tient deux.
 */
function fitsWeeklyQuota(date: DayKey, taken: readonly DayKey[], perWeek: number): boolean {
  const dates = [...taken, date]
  for (let back = 0; back < 7; back += 1) {
    const from = shiftDayKey(date, -back)
    const to = shiftDayKey(from, 6)
    if (dates.filter((one) => one >= from && one <= to).length > perWeek) return false
  }
  return true
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
  return {
    id: `${CANDIDATE_ID}:${workout.name}`,
    date,
    load: null,
    kind: 'endurance',
    // Ce qui demande de l'intensité au sens du E.30 : tout sauf les deux zones
    // qu'on peut faire un jour où le corps n'est pas prêt. Une séance composée
    // n'a pas de charge, donc le E.1 ne peut pas en juger — elle le dit.
    intensity: !isGentle(workout.family),
  }
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
  decharge: boolean,
  hold: boolean,
): string {
  if (decharge) {
    return level > 0
      ? `Semaine de décharge : la moitié du travail du niveau ${level}, à la même intensité.`
      : `Semaine de décharge : court, et sans forcer.`
  }

  if (reprise) {
    return level > 0
      ? `Deux semaines sans séance de qualité : on repart au niveau ${level}, sans monter.`
      : `Deux semaines sans séance de qualité : on repart doucement.`
  }

  if (hold) {
    return level > 0
      ? `Ta forme monte déjà vite : on reste au niveau ${level} cette fois.`
      : `Ta forme monte déjà vite : on ne rajoute rien pour l’instant.`
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
