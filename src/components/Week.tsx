/**
 * Ce que Makigawa propose pour la semaine (section 5, E.10).
 *
 * C'est le sens que l'athlète a demandé : au lieu d'attendre qu'on lui pose
 * une séance, l'app regarde la forme et la fatigue, choisit les séances et les
 * jours, et les montre. Rien n'est écrit avant un tap — le E.7 tient ici comme
 * partout ailleurs.
 *
 * Le bloc s'ouvre de lui-même quand rien n'est prévu : c'est précisément le
 * moment où l'athlète a besoin qu'on lui propose quelque chose.
 */

import { useState } from 'react'
import { createEvent, type ApiOutcome } from '../api/intervals'
import { eventFor, toNotation } from '../workouts/compose'
import type { Suggestion } from '../workouts/week'
import type { Credentials } from '../storage/credentials'
import { formatDuration, formatRelativeDay, type DayKey } from '../calendar/dates'
import { Profile } from './Profile'

type Writing =
  | { status: 'idle' }
  | { status: 'writing'; date: DayKey }
  | { status: 'failed'; detail: string }

type Props = {
  credentials: Credentials
  /** Les propositions, calculées par `Plan` : il en a besoin lui aussi. */
  suggestions: readonly Suggestion[]
  /** La forme d'intervals.icu, affichée pour dire sur quoi le choix repose. */
  fitness: number | null
  today: DayKey
  /** Vrai quand rien n'est prévu : le bloc s'ouvre alors de lui-même. */
  empty: boolean
  onPlaced: () => void
}

export function Week({ credentials, suggestions, fitness, today, empty, onPlaced }: Props) {
  const [open, setOpen] = useState(false)
  const [writing, setWriting] = useState<Writing>({ status: 'idle' })
  const [done, setDone] = useState<Set<string>>(new Set())

  const shown = open || empty

  if (suggestions.length === 0) {
    return null
  }

  const accept = async (suggestion: Suggestion) => {
    setWriting({ status: 'writing', date: suggestion.date })
    const outcome = await createEvent(credentials, eventFor(suggestion.workout, suggestion.date))
    if (outcome.kind !== 'ok') {
      setWriting({ status: 'failed', detail: describe(outcome) })
      return
    }
    setWriting({ status: 'idle' })
    setDone((current) => new Set(current).add(suggestion.date))
  }

  const acceptAll = async () => {
    for (const suggestion of suggestions) {
      if (done.has(suggestion.date)) continue
      await accept(suggestion)
    }
    onPlaced()
  }

  if (!shown) {
    return (
      <div className="place">
        <button className="button button-ghost" onClick={() => setOpen(true)}>
          Propose-moi un plan
        </button>
      </div>
    )
  }

  const left = suggestions.filter((suggestion) => !done.has(suggestion.date))

  return (
    <div className="week">
      <div className="place-head">
        <p className="place-title">Ce que je te propose</p>
        {left.length > 0 ? (
          <button
            className="button button-small"
            onClick={() => void acceptAll()}
            disabled={writing.status === 'writing'}
          >
            {writing.status === 'writing' ? 'En cours…' : 'Tout accepter'}
          </button>
        ) : null}
      </div>

      <p className="muted small">
        {fitness === null
          ? 'Choisi sur ce qui est déjà prévu. Rien n’est écrit avant que tu tapes.'
          : `Choisi sur ta forme (${Math.round(fitness)}) et ce qui est déjà prévu. Rien n’est écrit avant que tu tapes.`}
      </p>

      {writing.status === 'failed' ? <p className="error small">{writing.detail}</p> : null}

      {suggestions.map((suggestion) => (
        <article className="suggested" key={suggestion.date}>
          <p className="suggested-day">{formatRelativeDay(suggestion.date, today)}</p>
          <p className="suggested-name">{suggestion.workout.name}</p>
          <p className="suggested-why">{suggestion.because}</p>

          <Profile blocks={suggestion.workout.blocks} />

          <details className="structure">
            <summary>La structure — {formatDuration(suggestion.workout.seconds)}</summary>
            <pre>{toNotation(suggestion.workout)}</pre>
          </details>

          {done.has(suggestion.date) ? (
            <p className="applied">Posée dans ton calendrier.</p>
          ) : (
            <button
              className="button button-small button-ghost"
              onClick={() => void accept(suggestion).then(onPlaced)}
              disabled={writing.status === 'writing'}
            >
              {writing.status === 'writing' && writing.date === suggestion.date
                ? 'En cours…'
                : 'Poser celle-ci'}
            </button>
          )}
        </article>
      ))}
    </div>
  )
}

function describe(outcome: Exclude<ApiOutcome<unknown>, { kind: 'ok' }>): string {
  switch (outcome.kind) {
    case 'unauthorized':
      return 'intervals.icu rejette ces identifiants.'
    case 'httpError':
      return outcome.detail || `intervals.icu a répondu ${outcome.status}.`
    case 'blocked':
      return `Le navigateur ou le réseau a bloqué la demande. Détail : ${outcome.detail}`
  }
}
