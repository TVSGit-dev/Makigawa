/**
 * Aujourd'hui, en un coup d'œil (section 5, E.17).
 *
 * La cinquième idée du 6 septembre, dite « le geste d'une seconde » : l'app
 * s'ouvre sur ce qui se décide maintenant, pas sur quinze jours de calendrier.
 *
 * Deux questions, dans l'ordre où elles se posent réellement dans la journée.
 * **Le trajet d'abord** — six à sept fois par semaine, contre une à deux
 * séances : c'est la décision la plus fréquente, et celle qui porte 60 à 100 %
 * de la charge. **La séance ensuite**, quand il y en a une.
 *
 * Le reste de l'écran ne disparaît pas : il passe dessous.
 */

import { useState } from 'react'
import type { ApiOutcome, CalendarEvent } from '../api/intervals'
import { adviseCommute, isWorkday, type CommuteOption } from '../actions/commute'
import { placeOpenRide } from '../actions/open-ride'
import { eventFor } from '../workouts/compose'
import { createEvent } from '../api/intervals'
import type { Suggestion } from '../workouts/week'
import type { Context, Proposal } from '../rules/decide'
import type { Credentials } from '../storage/credentials'
import type { DayWeight } from '../rules/types'
import type { DayKey } from '../calendar/dates'
import { announce, explain, weightLabel } from './reasons'

type Writing = { status: 'idle' } | { status: 'writing' } | { status: 'failed'; detail: string }

type Props = {
  credentials: Credentials
  today: DayKey
  weight: DayWeight
  context: Context
  /** Ce qui est déjà au calendrier aujourd'hui. */
  planned: readonly { event: CalendarEvent; proposal: Proposal }[]
  /** La proposition du planificateur pour aujourd'hui, s'il y en a une. */
  suggestion: Suggestion | null
  onPlaced: () => void
}

export function Today({
  credentials,
  today,
  weight,
  context,
  planned,
  suggestion,
  onPlaced,
}: Props) {
  const [writing, setWriting] = useState<Writing>({ status: 'idle' })
  const [done, setDone] = useState<Set<string>>(new Set())

  const advice = adviseCommute(today, context)

  const write = async (mark: string, call: () => Promise<ApiOutcome<unknown>>) => {
    setWriting({ status: 'writing' })
    const outcome = await call()
    if (outcome.kind !== 'ok') {
      setWriting({ status: 'failed', detail: describe(outcome) })
      return
    }
    setWriting({ status: 'idle' })
    setDone((current) => new Set(current).add(mark))
    onPlaced()
  }

  return (
    <section className="card">
      <div className="card-head">
        <h2>Aujourd’hui</h2>
        <span className={`weight weight-${weight}`}>{weightLabel(weight)}</span>
      </div>

      {writing.status === 'failed' ? <p className="error small">{writing.detail}</p> : null}

      {isWorkday(today) ? (
        <div className="now">
          <p className="now-label">Ton trajet</p>
          <p className="now-answer">{answerOf(advice.option)}</p>
          <p className="muted small">
            {advice.option.label} — {advice.option.load} de charge.{' '}
            {advice.refused.length > 0
              ? explain(advice.refused[0]!.reason, context.intent, today)
              : 'Rien ne s’y oppose aujourd’hui.'}
          </p>

          {done.has('trajet') ? (
            <p className="applied">Posé dans ton calendrier.</p>
          ) : (
            <button
              className="button button-small button-ghost"
              disabled={writing.status === 'writing'}
              onClick={() =>
                void write('trajet', () =>
                  placeOpenRide(credentials, advice.option.load, today, advice.option.where),
                )
              }
            >
              {writing.status === 'writing' ? 'En cours…' : 'Poser ce trajet'}
            </button>
          )}
        </div>
      ) : null}

      <div className="now">
        <p className="now-label">Ta séance</p>

        {planned.length > 0 ? (
          planned.map(({ event, proposal }) => (
            <div key={event.id ?? event.name}>
              <p className="now-answer">{event.name ?? 'Séance'}</p>
              <p className="muted small">
                {proposal.action === 'garder'
                  ? 'Le jour convient. Elle t’attend.'
                  : `${announce(proposal, today)} — ${explain(proposal.because, context.intent, today)}`}
              </p>
            </div>
          ))
        ) : suggestion && suggestion.date === today ? (
          <>
            <p className="now-answer">{suggestion.workout.name}</p>
            <p className="muted small">{suggestion.because}</p>
            {done.has('seance') ? (
              <p className="applied">Posée dans ton calendrier.</p>
            ) : (
              <button
                className="button button-small button-ghost"
                disabled={writing.status === 'writing'}
                onClick={() =>
                  void write('seance', () =>
                    createEvent(credentials, eventFor(suggestion.workout, suggestion.date)),
                  )
                }
              >
                {writing.status === 'writing' ? 'En cours…' : 'Poser celle-ci'}
              </button>
            )}
          </>
        ) : (
          <p className="muted">Rien de prévu. C’est une réponse valable.</p>
        )}
      </div>
    </section>
  )
}

/** La réponse en trois mots, celle qu'on lit sans lire. */
function answerOf(option: CommuteOption): string {
  switch (option.choice) {
    case 'aller-retour':
      return 'Tes jambes, les deux fois.'
    case 'un-seul':
      return 'Tes jambes, une fois sur deux.'
    case 'electrique':
      return 'La batterie.'
  }
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
