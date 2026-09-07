/**
 * Ce que l'app a proposé, gardé pour se relire (section 5, E.22).
 *
 * Depuis le E.19 les propositions n'existent nulle part dans intervals.icu.
 * Sans mémoire, l'app ne pouvait donc jamais reconnaître qu'une séance
 * proposée avait été faite — et les niveaux du E.16 comme le cycle du E.18
 * restaient inertes pour toujours.
 *
 * Ce n'est pas une écriture au sens du E.19 : rien ne part vers intervals.icu,
 * et la mémoire ne sert qu'à se relire.
 */

import { shiftDayKey, type DayKey } from '../calendar/dates'
import type { Zone } from '../workouts/levels'

const KEY = 'makigawa.propositions'

/** Six semaines, comme la fenêtre des niveaux : au-delà, plus rien à en tirer. */
export const PROPOSAL_DAYS = 42

export type RememberedProposal = {
  date: DayKey
  /** La zone, pour savoir quel niveau ferait monter cette séance. */
  zone: Zone
  /** La durée totale proposée, en secondes : c'est elle qu'on compare. */
  seconds: number
  /** Le temps de travail, qui donne le niveau une fois la séance tenue. */
  work: number
  name: string
}

const ZONES = new Set<string>([
  'endurance',
  'tempo',
  'sweet-spot',
  'seuil',
  'vo2',
  'anaerobie',
])

function isProposal(value: unknown): value is RememberedProposal {
  const one = value as Partial<RememberedProposal>
  return (
    typeof one?.date === 'string' &&
    typeof one?.zone === 'string' &&
    ZONES.has(one.zone) &&
    typeof one?.seconds === 'number' &&
    typeof one?.work === 'number' &&
    typeof one?.name === 'string'
  )
}

export function loadProposals(): RememberedProposal[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isProposal) : []
  } catch {
    return []
  }
}

/**
 * Retient les propositions du jour.
 *
 * Comme le journal des refus, la journée en cours est **remplacée** et non
 * complétée : le plan se recalcule à chaque ouverture, et empiler ferait
 * croire à dix propositions là où il n'y en a qu'une.
 *
 * Les jours passés, eux, ne bougent plus : ce qui a été proposé lundi reste ce
 * qui a été proposé lundi, même si le plan de mardi ne le propose plus.
 */
export function rememberProposals(
  today: DayKey,
  proposals: readonly RememberedProposal[],
): RememberedProposal[] {
  const floor = shiftDayKey(today, -PROPOSAL_DAYS)
  const kept = loadProposals().filter((one) => one.date >= floor && one.date < today)
  // Seules les propositions d'aujourd'hui sont figées : celles des jours à
  // venir changeront encore, et rien ne sert de garder un brouillon.
  const remembered = [...kept, ...proposals.filter((one) => one.date === today)]

  try {
    localStorage.setItem(KEY, JSON.stringify(remembered))
  } catch {
    // Rien à faire : sans mémoire, les niveaux ne monteront pas, mais l'app
    // continue de proposer.
  }
  return remembered
}
