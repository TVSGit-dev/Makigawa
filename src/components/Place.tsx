/**
 * Poser une séance de la bibliothèque sur un jour.
 *
 * L'app ne montre pas un calendrier vide en attendant qu'on choisisse : elle
 * pose la question du E.2 sur les quatorze jours d'un coup et **dit lesquels
 * conviennent**. C'est exactement son rôle — le contenu vient d'intervals.icu,
 * le moment vient d'elle — et c'est plus utile qu'un refus après coup.
 */

import { useState } from 'react'
import {
  fetchWorkoutLibrary,
  type ApiOutcome,
  type LibraryWorkout,
} from '../api/intervals'
import { placeWorkout, verdictsFor, type Verdict } from '../actions/place'
import type { Context } from '../rules/decide'
import type { Intent } from '../rules/intent'
import type { Credentials } from '../storage/credentials'
import { formatDuration, formatRelativeDay, type DayKey } from '../calendar/dates'
import { activityLabel, activityTone, explain } from './reasons'

/** Le même horizon que le plan : ce que l'app sait regarder. */
const AHEAD_DAYS = 14

type Library =
  | { status: 'closed' }
  | { status: 'loading' }
  | { status: 'ok'; workouts: LibraryWorkout[] }
  | { status: 'error'; detail: string }

type Placing =
  | { status: 'idle' }
  | { status: 'writing'; date: DayKey }
  | { status: 'failed'; detail: string }

type Props = {
  credentials: Credentials
  context: Context
  intent: Intent
  today: DayKey
  /** Le calendrier a changé : le plan doit se relire. */
  onPlaced: () => void
}

export function Place({ credentials, context, intent, today, onPlaced }: Props) {
  const [library, setLibrary] = useState<Library>({ status: 'closed' })
  const [chosen, setChosen] = useState<LibraryWorkout | null>(null)
  const [placing, setPlacing] = useState<Placing>({ status: 'idle' })

  const open = async () => {
    setLibrary({ status: 'loading' })
    const outcome = await fetchWorkoutLibrary(credentials)
    if (outcome.kind !== 'ok') {
      setLibrary({ status: 'error', detail: describe(outcome) })
      return
    }
    setLibrary({ status: 'ok', workouts: outcome.data })
  }

  const place = async (workout: LibraryWorkout, date: DayKey) => {
    setPlacing({ status: 'writing', date })
    const outcome = await placeWorkout(credentials, workout, date)
    if (outcome.kind !== 'ok') {
      setPlacing({ status: 'failed', detail: describe(outcome) })
      return
    }
    setPlacing({ status: 'idle' })
    setChosen(null)
    setLibrary({ status: 'closed' })
    onPlaced()
  }

  if (library.status === 'closed') {
    return (
      <div className="place">
        <button className="button" onClick={() => void open()}>
          Poser une séance
        </button>
        <p className="muted small">
          Depuis ta bibliothèque intervals.icu. L’app te dira quels jours conviennent avant
          que tu choisisses.
        </p>
      </div>
    )
  }

  if (library.status === 'loading') {
    return (
      <div className="place">
        <p className="muted">Lecture de ta bibliothèque…</p>
      </div>
    )
  }

  if (library.status === 'error') {
    return (
      <div className="place">
        <p className="error">
          <strong>La bibliothèque n’a pas pu être lue</strong>
          <br />
          {library.detail}
        </p>
        <button className="button button-small button-ghost" onClick={() => setLibrary({ status: 'closed' })}>
          Fermer
        </button>
      </div>
    )
  }

  if (!chosen) {
    return (
      <div className="place">
        <div className="place-head">
          <p className="place-title">Quelle séance ?</p>
          <button
            className="button button-small button-ghost"
            onClick={() => setLibrary({ status: 'closed' })}
          >
            Fermer
          </button>
        </div>

        {library.workouts.length === 0 ? (
          <p className="muted small">
            Ta bibliothèque intervals.icu est vide. C’est là que se créent les séances — le
            catalogue en donne seize, prêtes à recopier.
          </p>
        ) : null}

        {library.workouts.map((workout, index) => (
          <button
            className="choice"
            key={workout.id ?? `${workout.name}-${index}`}
            onClick={() => setChosen(workout)}
          >
            <span className="choice-name">{workout.name ?? 'Séance sans nom'}</span>
            <span className="choice-meta">
              <span className={`chip ${activityTone(workout.type)}`}>
                {activityLabel(workout.type)}
              </span>
              {workout.movingTime !== null ? (
                <span className="chip">{formatDuration(workout.movingTime)}</span>
              ) : null}
              {workout.folder ? <span className="chip">{workout.folder}</span> : null}
            </span>
          </button>
        ))}
      </div>
    )
  }

  const verdicts = verdictsFor(chosen, today, AHEAD_DAYS, context)
  const good = verdicts.filter((verdict) => verdict.refusal === null).length

  return (
    <div className="place">
      <div className="place-head">
        <p className="place-title">{chosen.name ?? 'Séance'}</p>
        <button className="button button-small button-ghost" onClick={() => setChosen(null)}>
          Changer
        </button>
      </div>

      <p className="muted small">
        {good === 0
          ? 'Aucun jour ne convient sur les deux prochaines semaines. Tu peux quand même la poser — l’app te le redira ensuite.'
          : good === AHEAD_DAYS
            ? 'Tous les jours conviennent. À toi de voir lequel t’arrange.'
            : `${good} jours conviennent, les autres portent leur raison. Tape celui que tu veux.`}
      </p>

      {placing.status === 'failed' ? <p className="error small">{placing.detail}</p> : null}

      {verdicts.map((verdict) => (
        <DayChoice
          key={verdict.date}
          verdict={verdict}
          intent={intent}
          today={today}
          busy={placing.status === 'writing' && placing.date === verdict.date}
          disabled={placing.status === 'writing'}
          onPlace={() => void place(chosen, verdict.date)}
        />
      ))}
    </div>
  )
}

function DayChoice({
  verdict,
  intent,
  today,
  busy,
  disabled,
  onPlace,
}: {
  verdict: Verdict
  intent: Intent
  today: DayKey
  busy: boolean
  disabled: boolean
  onPlace: () => void
}) {
  const refusal = verdict.refusal

  // Un jour qui convient tient sur une ligne. Répéter « ce jour convient »
  // quatorze fois ne dit rien : quand presque tout convient, l'information
  // est dans les exceptions, et c'est à elles de prendre la place.
  return (
    <button
      className={refusal ? 'choice' : 'choice choice-fits'}
      onClick={onPlace}
      disabled={disabled}
    >
      <span className="choice-name">{formatRelativeDay(verdict.date, today)}</span>
      {busy ? <span className="choice-why">En cours…</span> : null}
      {!busy && refusal ? (
        <span className="choice-why">{explain(refusal, intent, today)}</span>
      ) : null}
    </button>
  )
}

function describe(outcome: Exclude<ApiOutcome<unknown>, { kind: 'ok' }>): string {
  switch (outcome.kind) {
    case 'unauthorized':
      return 'intervals.icu rejette ces identifiants.'
    case 'httpError':
      return outcome.status === 404
        ? 'intervals.icu ne connaît pas cette adresse : le point d’entrée de la bibliothèque est à corriger.'
        : outcome.detail || `intervals.icu a répondu ${outcome.status}.`
    case 'blocked':
      return `Le navigateur ou le réseau a bloqué la demande. Détail : ${outcome.detail}`
  }
}
