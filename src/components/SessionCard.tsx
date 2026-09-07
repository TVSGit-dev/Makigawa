/**
 * Une séance du calendrier, et ce que l'app en pense.
 *
 * Depuis le E.19 la proposition est **dite, pas appliquée** : l'app n'écrit
 * plus dans intervals.icu. Elle explique pourquoi le jour convient ou non, et
 * l'athlète fait ce qu'il veut de cet avis.
 *
 * Une seule écriture subsiste, et elle va dans le sens du retrait :
 * **supprimer**, derrière un appui long de deux secondes — un geste qu'on ne
 * fait pas par accident, sur une action qui ne se rattrape pas.
 */

import { useEffect, useRef, useState } from 'react'
import { formatDuration } from '../calendar/dates'
import type { CalendarEvent } from '../api/intervals'
import type { Proposal } from '../rules/decide'
import type { Intent } from '../rules/intent'
import type { DayKey } from '../calendar/dates'
import { Profile } from './Profile'
import { blocksOf } from '../workouts/read'
import { activityLabel, activityTone, announce, explain } from './reasons'

/** Deux secondes de doigt posé. En dessous, on supprime par accident. */
export const HOLD_MS = 2000

export type DeleteState =
  | { status: 'idle' }
  | { status: 'deleting' }
  | { status: 'failed'; detail: string }

type Props = {
  event: CalendarEvent
  proposal: Proposal
  intent: Intent
  today: DayKey
  /** Vrai pour la journée du jour : sa structure s'affiche d'emblée. */
  open: boolean
  remove: DeleteState
  onDelete: () => void
}

export function SessionCard({ event, proposal, intent, today, open, remove, onDelete }: Props) {
  const [armed, setArmed] = useState(false)
  const [holding, setHolding] = useState(false)
  const timer = useRef<number | null>(null)

  const clear = () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
    setHolding(false)
  }

  useEffect(() => clear, [])

  const start = () => {
    if (armed || !event.id) return
    setHolding(true)
    timer.current = window.setTimeout(() => {
      setHolding(false)
      setArmed(true)
    }, HOLD_MS)
  }

  const chips = [
    event.movingTime === null ? null : formatDuration(event.movingTime),
    event.trainingLoad === null ? null : `charge ${Math.round(event.trainingLoad)}`,
  ].filter((chip): chip is string => chip !== null)

  return (
    <article
      className={holding ? 'session session-holding' : 'session'}
      onPointerDown={start}
      onPointerUp={clear}
      onPointerLeave={clear}
      onPointerCancel={clear}
      onContextMenu={(fired) => fired.preventDefault()}
    >
      <p className="session-name">{event.name ?? 'Séance sans nom'}</p>

      <p className="session-meta">
        <span className={`chip ${activityTone(event.type)}`}>{activityLabel(event.type)}</span>
        {chips.map((chip) => (
          <span className="chip" key={chip}>
            {chip}
          </span>
        ))}
      </p>

      {event.description ? <Profile blocks={blocksOf(event.description)} /> : null}

      {event.description ? (
        <details className="structure" open={open}>
          <summary>La structure</summary>
          <pre>{event.description}</pre>
        </details>
      ) : null}

      {proposal.action !== 'garder' ? (
        <div className="suggestion">
          <p className="suggestion-head">{announce(proposal, today)}</p>
          <p className="suggestion-why">{explain(proposal.because, intent, today)}</p>
          <p className="suggestion-why">
            À toi de le faire dans intervals.icu si tu es d’accord — l’app n’y touche pas.
          </p>
        </div>
      ) : null}

      {remove.status === 'failed' ? <p className="error small">{remove.detail}</p> : null}

      {armed ? (
        <div className="suggestion-actions">
          <button
            className="button button-small button-quiet"
            onClick={onDelete}
            disabled={remove.status === 'deleting'}
          >
            {remove.status === 'deleting' ? 'Suppression…' : 'Supprimer du calendrier'}
          </button>
          <button
            className="button button-small button-ghost"
            onClick={() => setArmed(false)}
            disabled={remove.status === 'deleting'}
          >
            Annuler
          </button>
        </div>
      ) : holding ? (
        <p className="muted small">Garde le doigt appuyé pour supprimer…</p>
      ) : null}
    </article>
  )
}
