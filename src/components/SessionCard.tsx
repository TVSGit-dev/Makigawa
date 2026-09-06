/**
 * Une séance, et ce que l'app en pense.
 *
 * Le E.7 tient dans ce fichier : la proposition s'affiche avec sa raison, et
 * rien ne part vers intervals.icu avant un tap. Les deux boutons sont à
 * égalité — « Garder » n'est pas un refus qu'il faut justifier.
 */

import { formatDuration } from '../calendar/dates'
import type { CalendarEvent } from '../api/intervals'
import type { Change } from '../actions/apply'
import type { Proposal } from '../rules/decide'
import type { Intent } from '../rules/intent'
import type { DayKey } from '../calendar/dates'
import {
  actionLabel,
  activityLabel,
  activityTone,
  announce,
  confirmation,
  explain,
} from './reasons'

export type WriteState =
  | { status: 'idle' }
  | { status: 'writing' }
  | { status: 'done' }
  | { status: 'failed'; detail: string }

type Props = {
  event: CalendarEvent
  proposal: Proposal
  change: Change | null
  intent: Intent
  today: DayKey
  /** Vrai pour la journée du jour : sa structure s'affiche d'emblée. */
  open: boolean
  write: WriteState
  onApply: () => void
  onDismiss: () => void
}

export function SessionCard({
  event,
  proposal,
  change,
  intent,
  today,
  open,
  write,
  onApply,
  onDismiss,
}: Props) {
  const chips = [
    event.movingTime === null ? null : formatDuration(event.movingTime),
    event.trainingLoad === null ? null : `charge ${Math.round(event.trainingLoad)}`,
  ].filter((chip): chip is string => chip !== null)

  return (
    <article className="session">
      <p className="session-name">{event.name ?? 'Séance sans nom'}</p>

      <p className="session-meta">
        <span className={`chip ${activityTone(event.type)}`}>{activityLabel(event.type)}</span>
        {chips.map((chip) => (
          <span className="chip" key={chip}>
            {chip}
          </span>
        ))}
      </p>

      {event.description ? (
        <details className="structure" open={open}>
          <summary>La structure</summary>
          <pre>{event.description}</pre>
        </details>
      ) : null}

      {proposal.action !== 'garder' && change ? (
        <Suggestion
          proposal={proposal}
          change={change}
          intent={intent}
          today={today}
          write={write}
          onApply={onApply}
          onDismiss={onDismiss}
        />
      ) : null}
    </article>
  )
}

function Suggestion({
  proposal,
  change,
  intent,
  today,
  write,
  onApply,
  onDismiss,
}: {
  proposal: Exclude<Proposal, { action: 'garder' }>
  change: Change
  intent: Intent
  today: DayKey
  write: WriteState
  onApply: () => void
  onDismiss: () => void
}) {
  if (write.status === 'done') {
    return <p className="applied">{confirmation(proposal, today)}</p>
  }

  // La réduction que l'app ne sait pas écrire sans réécrire le contenu :
  // elle le dit et laisse la main, plutôt que d'approximer.
  if (change.kind === 'byHand') {
    return (
      <div className="suggestion">
        <p className="suggestion-head">{announce(proposal, today)}</p>
        <p className="suggestion-why">{explain(proposal.because, intent, today)}</p>
        <p className="suggestion-why">{change.because}</p>
        <div className="suggestion-actions">
          <button className="button button-small button-ghost" onClick={onDismiss}>
            Entendu
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="suggestion">
      <p className="suggestion-head">{announce(proposal, today)}</p>
      <p className="suggestion-why">{explain(proposal.because, intent, today)}</p>

      {write.status === 'failed' ? <p className="error small">{write.detail}</p> : null}

      <div className="suggestion-actions">
        <button
          className={
            proposal.action === 'abandonner'
              ? 'button button-small button-quiet'
              : 'button button-small'
          }
          onClick={onApply}
          disabled={write.status === 'writing'}
        >
          {write.status === 'writing' ? 'En cours…' : actionLabel(proposal)}
        </button>
        <button
          className="button button-small button-ghost"
          onClick={onDismiss}
          disabled={write.status === 'writing'}
        >
          Garder
        </button>
      </div>
    </div>
  )
}
