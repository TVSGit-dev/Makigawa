/**
 * Ce que Makigawa propose pour la semaine (section 5, E.10 et E.14).
 *
 * C'est le sens que l'athlète a demandé : au lieu d'attendre qu'on lui pose
 * une séance, l'app regarde la forme et la fatigue, choisit les séances et les
 * jours, et les montre. Rien n'est écrit avant un tap — le E.7 tient ici comme
 * partout ailleurs.
 *
 * Et une proposition se refuse. Deux gestes, parce qu'une proposition a deux
 * axes : **« pas celle-ci »** écarte la famille, **« plus tard »** repousse le
 * jour. Le plan est alors recalculé en entier par `Plan`, pas rapiécé ici.
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
  /** Vrai si l'athlète a écarté ou repoussé quelque chose (E.14). */
  refusing: boolean
  onPlaced: () => void
  /** « Pas celle-ci » : la famille est écartée, le plan se recalcule. */
  onRefuse: (familyKey: string) => void
  /** « Plus tard » : rien avant le lendemain de ce jour-là. */
  onPostpone: (date: DayKey) => void
  /** Le geste qui remet tout en place. */
  onReset: () => void
}

export function Week({
  credentials,
  suggestions,
  fitness,
  today,
  empty,
  refusing,
  onPlaced,
  onRefuse,
  onPostpone,
  onReset,
}: Props) {
  const [open, setOpen] = useState(false)
  const [writing, setWriting] = useState<Writing>({ status: 'idle' })
  const [done, setDone] = useState<Set<string>>(new Set())

  const shown = open || empty

  if (suggestions.length === 0) {
    // Tout a été écarté. L'app ne va pas repêcher une famille refusée pour
    // avoir quelque chose à montrer — mais elle laisse toujours le retour.
    return refusing ? (
      <div className="week">
        <p className="place-title">Plus rien à proposer</p>
        <p className="muted small">
          Tu as écarté ce qui restait ouvert à ta forme. C’est une réponse valable — et elle
          se défait quand tu veux.
        </p>
        <button className="button button-small button-ghost" onClick={onReset}>
          Reprends tes propositions
        </button>
      </div>
    ) : null
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
  // Le report ne s'offre que sur la première : les suivantes sont placées par
  // rapport à elle, donc c'est elle qui commande la fenêtre (E.14).
  const first = suggestions.reduce((earliest, one) => (one.date < earliest.date ? one : earliest))

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

      {refusing ? (
        <p className="muted small">
          Ce plan tient compte de ce que tu as écarté.{' '}
          <button className="link" onClick={onReset}>
            Tout remettre
          </button>
        </p>
      ) : null}

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
            <div className="suggested-actions">
              <button
                className="button button-small button-ghost"
                onClick={() => void accept(suggestion).then(onPlaced)}
                disabled={writing.status === 'writing'}
              >
                {writing.status === 'writing' && writing.date === suggestion.date
                  ? 'En cours…'
                  : 'Poser celle-ci'}
              </button>

              {/* Les deux façons de dire non restent ensemble : séparées par un
                  retour à la ligne, elles se liraient comme deux choses sans
                  rapport. */}
              <div className="suggested-refuse">
                <button
                  className="button button-small button-quiet"
                  onClick={() => onRefuse(suggestion.workout.family.key)}
                  disabled={writing.status === 'writing'}
                >
                  Pas celle-ci
                </button>

                {suggestion.date === first.date ? (
                  <button
                    className="button button-small button-quiet"
                    onClick={() => onPostpone(suggestion.date)}
                    disabled={writing.status === 'writing'}
                  >
                    Plus tard
                  </button>
                ) : null}
              </div>
            </div>
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
