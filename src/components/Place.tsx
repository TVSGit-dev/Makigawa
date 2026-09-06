/**
 * Poser une séance.
 *
 * Quatre styles, relevés par l'athlète le 6 septembre 2026 — ce sont les
 * siens, pas une taxonomie : une sortie longue dehors, une séance Zwift dure
 * de trente ou quarante-cinq minutes, une Zwift libre, et les trajets. Les
 * trajets n'apparaissent pas : ils ne se posent pas, ils arrivent de Garmin.
 *
 * Quel que soit le style, l'app pose la question du E.2 sur les quatorze jours
 * d'un coup et **dit lesquels conviennent**. Poser d'avance vaut mieux que
 * refuser après coup.
 */

import { useState } from 'react'
import {
  createEvent,
  fetchWorkoutLibrary,
  type ApiOutcome,
  type LibraryWorkout,
} from '../api/intervals'
import {
  asPlanned,
  eventFor as libraryEvent,
  verdictsFor,
  type Candidate,
  type Verdict,
} from '../actions/place'
import {
  openRideEvent,
  OPEN_RIDE_TARGETS,
  type Where,
} from '../actions/open-ride'
import {
  compose,
  durationsFor,
  eventFor as composedEvent,
  toNotation,
  type Workout,
} from '../workouts/compose'
import { FAMILIES, type Family } from '../workouts/families'
import { firstTestDay, ftpTest } from '../workouts/ftp-test'
import type { Context } from '../rules/decide'
import type { Intent } from '../rules/intent'
import type { Credentials } from '../storage/credentials'
import { formatDuration, formatRelativeDay, type DayKey } from '../calendar/dates'
import { activityLabel, activityTone, explain, explainTest } from './reasons'

/** Le même horizon que le plan : ce que l'app sait regarder. */
const AHEAD_DAYS = 14

/** Ce qu'on s'apprête à poser, quelle qu'en soit la provenance. */
type Plan =
  | { kind: 'composee'; workout: Workout }
  | { kind: 'ouverte'; load: number; where: Where }
  | { kind: 'bibliotheque'; workout: LibraryWorkout }

type Step =
  | { at: 'closed' }
  | { at: 'styles' }
  | { at: 'famille' }
  | { at: 'duree'; family: Family }
  | { at: 'charges'; where: Where }
  | { at: 'bibliotheque'; workouts: LibraryWorkout[] }
  | { at: 'test' }
  | { at: 'jours'; plan: Plan }
  | { at: 'chargement' }
  | { at: 'erreur'; detail: string }

type Writing = { status: 'idle' } | { status: 'writing'; date: DayKey } | { status: 'failed'; detail: string }

type Props = {
  credentials: Credentials
  context: Context
  intent: Intent
  today: DayKey
  onPlaced: () => void
}

export function Place({ credentials, context, intent, today, onPlaced }: Props) {
  const [step, setStep] = useState<Step>({ at: 'closed' })
  const [writing, setWriting] = useState<Writing>({ status: 'idle' })

  const openLibrary = async () => {
    setStep({ at: 'chargement' })
    const outcome = await fetchWorkoutLibrary(credentials)
    if (outcome.kind !== 'ok') {
      setStep({ at: 'erreur', detail: describe(outcome) })
      return
    }
    setStep({ at: 'bibliotheque', workouts: outcome.data })
  }

  const place = async (plan: Plan, date: DayKey) => {
    setWriting({ status: 'writing', date })
    const outcome = await createEvent(credentials, bodyFor(plan, date))
    if (outcome.kind !== 'ok') {
      setWriting({ status: 'failed', detail: describe(outcome) })
      return
    }
    setWriting({ status: 'idle' })
    setStep({ at: 'closed' })
    onPlaced()
  }

  const close = () => {
    setStep({ at: 'closed' })
    setWriting({ status: 'idle' })
  }

  if (step.at === 'closed') {
    return (
      <div className="place">
        <button className="button" onClick={() => setStep({ at: 'styles' })}>
          Poser une séance
        </button>
        <p className="muted small">
          Makigawa la compose ou la reprend de ta bibliothèque, et te dit quels jours
          conviennent avant que tu choisisses.
        </p>
      </div>
    )
  }

  if (step.at === 'chargement') {
    return (
      <div className="place">
        <p className="muted">Lecture de ta bibliothèque…</p>
      </div>
    )
  }

  if (step.at === 'erreur') {
    return (
      <Panel title="La bibliothèque n’a pas pu être lue" onBack={close} backLabel="Fermer">
        <p className="error small">{step.detail}</p>
      </Panel>
    )
  }

  if (step.at === 'styles') {
    return (
      <Panel title="Quel genre de séance ?" onBack={close} backLabel="Fermer">
        <Choice
          name="Séance Zwift"
          why="Composée par Makigawa, de trente minutes à une heure quinze. Pour tout donner."
          onPick={() => setStep({ at: 'famille' })}
        />
        <Choice
          name="Sortie longue"
          why="Dehors, sans structure : le terrain commande. Tu vises une charge."
          onPick={() => setStep({ at: 'charges', where: 'dehors' })}
        />
        <Choice
          name="Zwift libre"
          why="Sur le home-trainer, sans consigne. Tu vises une charge."
          onPick={() => setStep({ at: 'charges', where: 'zwift' })}
        />
        <Choice
          name="Test FTP"
          why="Vingt minutes à fond, pour que toutes les autres séances soient justes."
          onPick={() => setStep({ at: 'test' })}
        />
        <Choice
          name="Depuis ta bibliothèque"
          why="Les séances que tu as créées dans intervals.icu."
          onPick={() => void openLibrary()}
        />
        <p className="muted small">
          Les trajets n’y sont pas : ils ne se posent pas, ils arrivent tout seuls de Garmin.
          Leur charge compte quand même dans la journée.
        </p>
      </Panel>
    )
  }

  if (step.at === 'famille') {
    return (
      <Panel title="Qu’est-ce qu’on travaille ?" onBack={() => setStep({ at: 'styles' })}>
        {FAMILIES.map((family) => (
          <Choice
            key={family.key}
            name={family.name}
            why={family.purpose}
            onPick={() => setStep({ at: 'duree', family })}
          />
        ))}
      </Panel>
    )
  }

  if (step.at === 'duree') {
    const family = step.family
    return (
      <Panel title={family.name} onBack={() => setStep({ at: 'famille' })}>
        <p className="muted small">Combien de temps as-tu ?</p>
        {durationsFor(family).map((minutes) => {
          const workout = compose(family, minutes)
          return (
            <Choice
              key={minutes}
              name={`${minutes} minutes`}
              why={`${workout.name} — ${formatDuration(workout.seconds)} en vrai`}
              onPick={() => setStep({ at: 'jours', plan: { kind: 'composee', workout } })}
            />
          )
        })}
      </Panel>
    )
  }

  if (step.at === 'charges') {
    const where = step.where
    return (
      <Panel
        title={where === 'dehors' ? 'Sortie longue' : 'Zwift libre'}
        onBack={() => setStep({ at: 'styles' })}
      >
        <p className="muted small">Quelle charge vises-tu ?</p>
        {OPEN_RIDE_TARGETS.map((target) => (
          <Choice
            key={target.load}
            name={`Charge ${target.load}`}
            why={target.hint}
            onPick={() =>
              setStep({ at: 'jours', plan: { kind: 'ouverte', load: target.load, where } })
            }
          />
        ))}
      </Panel>
    )
  }

  if (step.at === 'test') {
    const workout = ftpTest()
    const day = firstTestDay(today, AHEAD_DAYS, context)

    return (
      <Panel title="Test FTP" onBack={() => setStep({ at: 'styles' })}>
        <p className="muted small">
          Un test passé sur des jambes lourdes ne mesure pas ta FTP, il mesure ta fatigue —
          et comme toutes tes séances sont écrites en pourcentage de cette FTP, un mauvais
          chiffre coûte un cycle. L’app ne te propose donc qu’un jour, pas quatorze.
        </p>

        <details className="structure">
          <summary>La structure — {formatDuration(workout.seconds)}</summary>
          <pre>{toNotation(workout)}</pre>
        </details>

        {writing.status === 'failed' ? <p className="error small">{writing.detail}</p> : null}

        {'date' in day ? (
          <button
            className="choice choice-fits"
            onClick={() => void place({ kind: 'composee', workout }, day.date)}
            disabled={writing.status === 'writing'}
          >
            <span className="choice-name">{formatRelativeDay(day.date, today)}</span>
            <span className="choice-why">
              {writing.status === 'writing' ? 'En cours…' : 'Le premier jour qui remplit les quatre conditions'}
            </span>
          </button>
        ) : (
          <p className="notice small">
            <strong>Aucun jour ne convient sur les {AHEAD_DAYS} prochains.</strong>
            <br />
            {explainTest(day.refusal)}
          </p>
        )}
      </Panel>
    )
  }

  if (step.at === 'bibliotheque') {
    return (
      <Panel title="Quelle séance ?" onBack={() => setStep({ at: 'styles' })}>
        {step.workouts.length === 0 ? (
          <p className="muted small">
            Ta bibliothèque intervals.icu est vide. Tu peux quand même faire composer une
            séance Zwift à Makigawa — elle n’a besoin de rien.
          </p>
        ) : null}

        {step.workouts.map((workout, index) => (
          <button
            className="choice"
            key={workout.id ?? `${workout.name}-${index}`}
            onClick={() => setStep({ at: 'jours', plan: { kind: 'bibliotheque', workout } })}
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
      </Panel>
    )
  }

  const plan = step.plan
  const candidate = candidateOf(plan)
  const verdicts = verdictsFor(candidate, today, AHEAD_DAYS, context)
  const good = verdicts.filter((verdict) => verdict.refusal === null).length

  return (
    <Panel title={titleOf(plan)} onBack={() => setStep({ at: 'styles' })} backLabel="Changer">
      {plan.kind === 'composee' ? (
        <details className="structure">
          <summary>La structure — {formatDuration(plan.workout.seconds)}</summary>
          <pre>{toNotation(plan.workout)}</pre>
        </details>
      ) : null}

      <p className="muted small">
        {candidate.load === null
          ? 'Sa charge sera calculée par intervals.icu une fois posée : les jours sont examinés sur tout le reste.'
          : good === 0
            ? 'Aucun jour ne convient sur les deux prochaines semaines. Tu peux quand même la poser — l’app te le redira ensuite.'
            : good === AHEAD_DAYS
              ? 'Tous les jours conviennent. À toi de voir lequel t’arrange.'
              : `${good} jours conviennent, les autres portent leur raison.`}
      </p>

      {writing.status === 'failed' ? <p className="error small">{writing.detail}</p> : null}

      {verdicts.map((verdict) => (
        <DayChoice
          key={verdict.date}
          verdict={verdict}
          intent={intent}
          today={today}
          busy={writing.status === 'writing' && writing.date === verdict.date}
          disabled={writing.status === 'writing'}
          onPlace={() => void place(plan, verdict.date)}
        />
      ))}
    </Panel>
  )
}

function Panel({
  title,
  onBack,
  backLabel = 'Retour',
  children,
}: {
  title: string
  onBack: () => void
  backLabel?: string
  children: React.ReactNode
}) {
  return (
    <div className="place">
      <div className="place-head">
        <p className="place-title">{title}</p>
        <button className="button button-small button-ghost" onClick={onBack}>
          {backLabel}
        </button>
      </div>
      {children}
    </div>
  )
}

function Choice({ name, why, onPick }: { name: string; why: string; onPick: () => void }) {
  return (
    <button className="choice" onClick={onPick}>
      <span className="choice-name">{name}</span>
      <span className="choice-why">{why}</span>
    </button>
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

/** Ce que les règles liront de la séance envisagée. */
function candidateOf(plan: Plan): Candidate {
  switch (plan.kind) {
    case 'composee':
      // Pas de charge : intervals.icu la calculera depuis la structure.
      return { load: null, kind: 'endurance' }
    case 'ouverte':
      return { load: plan.load, kind: 'endurance' }
    case 'bibliotheque':
      return asPlanned(plan.workout, plan.workout.id ?? '')
  }
}

function titleOf(plan: Plan): string {
  switch (plan.kind) {
    case 'composee':
      return plan.workout.name
    case 'ouverte':
      return `${plan.where === 'dehors' ? 'Sortie longue' : 'Zwift libre'} · ${plan.load}`
    case 'bibliotheque':
      return plan.workout.name ?? 'Séance'
  }
}

function bodyFor(plan: Plan, date: DayKey): Record<string, unknown> {
  switch (plan.kind) {
    case 'composee':
      return composedEvent(plan.workout, date)
    case 'ouverte':
      return openRideEvent(plan.load, date, plan.where)
    case 'bibliotheque':
      return libraryEvent(plan.workout, date)
  }
}

function describe(outcome: Exclude<ApiOutcome<unknown>, { kind: 'ok' }>): string {
  switch (outcome.kind) {
    case 'unauthorized':
      return 'intervals.icu rejette ces identifiants.'
    case 'httpError':
      return outcome.status === 404
        ? 'intervals.icu ne connaît pas cette adresse : le point d’entrée est à corriger.'
        : outcome.detail || `intervals.icu a répondu ${outcome.status}.`
    case 'blocked':
      return `Le navigateur ou le réseau a bloqué la demande. Détail : ${outcome.detail}`
  }
}
