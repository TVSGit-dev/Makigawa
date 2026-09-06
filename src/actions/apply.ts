/**
 * D'une proposition du moteur à une écriture dans intervals.icu.
 *
 * Le moteur dit quoi faire (E.3), l'athlète confirme (E.7), et c'est ici que
 * la confirmation devient un appel réseau. La décision est séparée de
 * l'écriture — `changeFor` est pure, donc testable, et `writeChange` ne fait
 * qu'obéir.
 */

import {
  deleteEvent,
  updateEvent,
  type ApiOutcome,
  type CalendarEvent,
} from '../api/intervals'
import type { Credentials } from '../storage/credentials'
import type { Proposal } from '../rules/decide'
import type { DayKey } from '../calendar/dates'

/** Ce que l'app s'apprête à écrire, une fois l'athlète d'accord. */
export type Change =
  | { kind: 'move'; to: DayKey; body: Record<string, unknown> }
  | { kind: 'shorten'; description: string; body: Record<string, unknown> }
  /** La réduction d'une sortie ouverte : sa charge visée, divisée par deux. */
  | { kind: 'lighten'; load: number; body: Record<string, unknown> }
  | { kind: 'drop' }
  /** Le moteur a tranché, mais l'app ne sait pas l'écrire sans inventer. */
  | { kind: 'byHand'; because: string }

/**
 * Une ligne de structure : `- 22m z2`, `- 30s z5`.
 *
 * Le préfixe, l'unité et tout ce qui suit la durée sont capturés tels quels
 * et recopiés sans y toucher. Seul le nombre change.
 */
const BLOCK = /^(\s*-\s*)(\d+)(m|s)(\s.*)?$/

/**
 * La même structure, deux fois plus courte.
 *
 * C'est la seule modification de contenu que le E.6 autorise, et elle est
 * volontairement mécanique : chaque durée est divisée par deux, **les zones
 * ne bougent pas**, l'ordre des blocs non plus, aucun bloc n'est ajouté ni
 * retiré. L'app ne compose pas une séance, elle met à l'échelle celle qui
 * existe — « durée de moitié, intensité inchangée », littéralement.
 *
 * Renvoie `null` dès qu'une ligne n'est pas comprise. Refuser est sûr,
 * deviner ne l'est pas : une structure à demi traduite serait pire qu'une
 * séance laissée entière.
 */
export function halveStructure(description: string | null): string | null {
  if (!description) return null

  const lines = description.split('\n')
  const halved: string[] = []
  let blocks = 0

  for (const line of lines) {
    if (line.trim() === '') {
      halved.push(line)
      continue
    }

    const match = BLOCK.exec(line)
    if (!match) return null

    const [, prefix, amount, unit, rest] = match
    // Math.round arrondit 0,5 vers le haut : un bloc d'une minute reste à une
    // minute plutôt que de disparaître.
    const shorter = Math.max(1, Math.round(Number(amount) / 2))
    halved.push(`${prefix}${shorter}${unit}${rest ?? ''}`)
    blocks += 1
  }

  return blocks > 0 ? halved.join('\n') : null
}

/**
 * L'écriture que suppose une proposition, ou `null` s'il n'y a rien à écrire.
 *
 * Le décalage ne touche qu'à la date, l'abandon supprime, et la réduction est
 * la seule à toucher au contenu — dans les limites strictes de
 * `halveStructure`. Quand cette dernière renonce, l'app le dit au lieu
 * d'écrire quelque chose d'approximatif.
 */
export function changeFor(event: CalendarEvent, proposal: Proposal): Change | null {
  switch (proposal.action) {
    case 'garder':
      return null

    case 'decaler':
      return {
        kind: 'move',
        to: proposal.to,
        // L'API a renvoyé la date sous la forme `2026-09-08T00:00:00` : on lui
        // rend la même forme, l'heure d'origine comprise quand elle existe.
        body: { start_date_local: `${proposal.to}${timeOf(event.startDateLocal)}` },
      }

    case 'reduire': {
      const description = halveStructure(event.description)
      if (description !== null) {
        return { kind: 'shorten', description, body: { description } }
      }

      // E.8 — sur une sortie ouverte, réduire ne peut pas raccourcir une
      // structure qui n'existe pas : c'est la charge visée qu'on divise par
      // deux. Rouler moitié moins ou moitié moins fort revient au même, et
      // l'athlète voit sur place.
      const lighter = lightenTarget(event)
      if (lighter) return lighter

      return {
        kind: 'byHand',
        because:
          'La structure de cette séance n’est pas en notation de zones : l’app ne sait pas la raccourcir sans réécrire son contenu, ce qu’elle ne fait jamais.',
      }
    }

    case 'abandonner':
      return { kind: 'drop' }
  }
}

/**
 * Une séance porte-t-elle une structure ?
 *
 * Une ligne de bloc (`- 20m z2`) ou une répétition (`3x`) en est une, même si
 * `halveStructure` ne sait pas la lire. La distinction compte : une séance
 * structurée tient sa charge de ses blocs — la lui réécrire à la main la
 * figerait — alors qu'une sortie ouverte n'a que sa charge visée.
 */
function looksStructured(description: string | null): boolean {
  if (!description) return false
  return description
    .split('\n')
    .some((line) => /^\s*-\s*\d/.test(line) || /^\s*\d+\s*x\b/i.test(line.trim()))
}

/** La sortie ouverte, allégée de moitié — nom compris quand il porte sa charge. */
function lightenTarget(event: CalendarEvent): Change | null {
  if (event.trainingLoad === null || looksStructured(event.description)) return null

  const load = Math.round(event.trainingLoad / 2)
  const body: Record<string, unknown> = { icu_training_load: load }

  // Le nom annonce la charge visée : le laisser tel quel le ferait mentir.
  const renamed = event.name?.replace(/·\s*\d+\s*$/, `· ${load}`)
  if (renamed && renamed !== event.name) body.name = renamed

  return { kind: 'lighten', load, body }
}

/** L'heure d'une date d'événement, `T00:00:00` par défaut. */
function timeOf(startDateLocal: string | null): string {
  const time = startDateLocal?.slice(10)
  return time && time.startsWith('T') ? time : 'T00:00:00'
}

/** L'appel qui correspond à un changement. Rien d'autre ne l'exécute. */
export async function writeChange(
  credentials: Credentials,
  eventId: string,
  change: Change,
): Promise<ApiOutcome<unknown>> {
  switch (change.kind) {
    case 'move':
    case 'shorten':
    case 'lighten':
      return updateEvent(credentials, eventId, change.body)
    case 'drop':
      return deleteEvent(credentials, eventId)
    case 'byHand':
      return { kind: 'ok', data: null }
  }
}
