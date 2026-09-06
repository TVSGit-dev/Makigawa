/**
 * L'écran principal : ce qui est prévu, et ce que l'app en pense.
 *
 * Il n'affiche jamais le passé. Ce n'est pas une simplification mais une
 * contrainte du projet : une journée révolue affichée dans un plan devient un
 * reproche, et une séance qu'on a laissée tomber n'a pas à laisser de trace.
 * Le passé sert au moteur — il ne s'affiche que dans la raison d'une
 * proposition.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchActivities,
  fetchCalendarEvents,
  fetchWellness,
  type Activity,
  type ApiOutcome,
  type CalendarEvent,
  type Wellness,
} from '../api/intervals'
import { changeFor, writeChange, type Change } from '../actions/apply'
import { buildContext, isSession, toDayRecords } from '../rules/context'
import { daysSinceQuality, isReprise, matchCompletions } from '../rules/done'
import { heldFrom, levelsFrom } from '../workouts/levels'
import { propose, type Proposal } from '../rules/decide'
import { weighDay } from '../rules/scale'
import type { Intent } from '../rules/intent'
import type { DayRecord } from '../rules/types'
import type { Credentials } from '../storage/credentials'
import { dismiss, fingerprint, forgetOlderThan } from '../storage/preferences'
import {
  forgetStalePreferences,
  hasPlanPreferences,
  postponePlan,
  refuseFamily,
  refusedKeys,
  resetPlanPreferences,
  type PlanPreferences,
} from '../storage/plan'
import {
  addDays,
  dayKeyOf,
  formatDay,
  shiftDayKey,
  toDayKey,
  type DayKey,
} from '../calendar/dates'
import { Place } from './Place'
import { Progress } from './Progress'
import { Week } from './Week'
import { planWeek } from '../workouts/week'
import { SessionCard, type WriteState } from './SessionCard'
import { weightLabel } from './reasons'

/** Deux semaines devant : l'horizon de planification annoncé par le projet. */
const AHEAD_DAYS = 14
/**
 * Six semaines derrière.
 *
 * Deux suffisaient à peser les journées passées ; les niveaux du E.16 se
 * lisent sur six, parce que c'est le temps qu'une adaptation met à se perdre.
 * Le calendrier est lu aussi loin en arrière, sans quoi il n'y aurait rien à
 * comparer aux activités.
 */
const BEHIND_DAYS = 42

type Data = {
  events: CalendarEvent[]
  activities: Activity[]
  wellness: Wellness[]
  /** Ce qui n'a pas pu être lu, dit franchement plutôt que masqué. */
  gaps: string[]
}

type State =
  | { status: 'loading' }
  | { status: 'ok'; data: Data }
  | { status: 'error'; title: string; detail: string }

/** Ce que l'en-tête a besoin de savoir, lu une seule fois pour les deux écrans. */
export type Readout = {
  fitness: number | null
  fatigue: number | null
  sleepScore: number | null
  days: readonly DayRecord[]
  /**
   * La reprise du E.5, remontée plutôt qu'appliquée sur place.
   *
   * Elle force le mode prudent, et c'est `App` qui tient le mode : l'appliquer
   * ici laisserait l'en-tête afficher « normal » pendant que le moteur
   * travaille en prudent, ce que l'athlète verrait tout de suite.
   */
  reprise: boolean
  daysSinceQuality: number | null
}

type Props = {
  credentials: Credentials
  intent: Intent
  onReadout: (readout: Readout) => void
}

export function Plan({ credentials, intent, onReadout }: Props) {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [writes, setWrites] = useState<Record<string, WriteState>>({})
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set())
  // Ce que l'athlète a écarté ou repoussé du plan (E.14). Vit dans le
  // téléphone, ne part jamais dans intervals.icu.
  const [choices, setChoices] = useState<PlanPreferences>({ refused: {}, notBefore: null })

  const today = toDayKey(new Date())

  useEffect(() => {
    setDismissed(forgetOlderThan(today))
    setChoices(forgetStalePreferences(today))
  }, [today])

  const load = useCallback(async () => {
    setState({ status: 'loading' })
    setWrites({})

    const now = new Date()
    const [events, activities, wellness] = await Promise.all([
      fetchCalendarEvents(credentials, addDays(now, -BEHIND_DAYS), addDays(now, AHEAD_DAYS - 1)),
      fetchActivities(credentials, addDays(now, -BEHIND_DAYS), now),
      fetchWellness(credentials, addDays(now, -BEHIND_DAYS), now),
    ])

    // Le calendrier est indispensable : sans lui il n'y a rien à afficher.
    if (events.kind !== 'ok') {
      setState({ status: 'error', ...describe(events) })
      return
    }

    // Les deux autres enrichissent. Leur absence dégrade le jugement du
    // moteur sans l'empêcher, et vaut mieux qu'un écran vide.
    const gaps: string[] = []
    if (activities.kind !== 'ok') {
      gaps.push('Les activités réalisées n’ont pas pu être lues : les journées passées pèsent zéro pour le moteur.')
    }
    if (wellness.kind !== 'ok') {
      gaps.push('La forme et la fatigue n’ont pas pu être lues : la fraîcheur est prise comme neutre.')
    }

    setState({
      status: 'ok',
      data: {
        events: events.data,
        activities: activities.kind === 'ok' ? activities.data : [],
        wellness: wellness.kind === 'ok' ? wellness.data : [],
        gaps,
      },
    })
  }, [credentials])

  useEffect(() => {
    void load()
  }, [load])

  // La forme remonte vers App, qui la donne à l'en-tête : une seule lecture
  // du réseau sert les deux écrans.
  const wellness = state.status === 'ok' ? state.data.wellness : []
  const fitness =
    wellness
      .filter((day) => day.date !== null && day.date <= today && day.ctl !== null)
      .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
      .at(-1)?.ctl ?? null

  const observed = state.status === 'ok' ? toDayRecords(state.data.activities) : []

  // Ce que sont devenues les séances passées (E.15), et les niveaux qui s'y
  // lisent (E.16). Calculés avant le décor, parce que la reprise en dépend.
  const completions = useMemo(() => {
    if (state.status !== 'ok') return []
    return matchCompletions({
      events: state.data.events,
      activities: state.data.activities,
      today,
      since: shiftDayKey(today, -BEHIND_DAYS),
    })
  }, [state, today])

  const levels = useMemo(() => levelsFrom(heldFrom(completions)), [completions])

  const sinceQuality = useMemo(
    () =>
      state.status === 'ok'
        ? daysSinceQuality(state.data.activities, today, BEHIND_DAYS)
        : null,
    [state, today],
  )
  const reprise = isReprise(sinceQuality)

  useEffect(() => {
    const latest = wellness
      .filter((day) => day.date !== null && day.date <= today && day.ctl !== null)
      .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
      .at(-1)
    const night = wellness.find((day) => day.date === today)
    onReadout({
      fitness: latest?.ctl ?? null,
      fatigue: latest?.atl ?? null,
      sleepScore: night?.sleepScore ?? null,
      days: observed,
      reprise,
      daysSinceQuality: sinceQuality,
    })
    // `observed` est reconstruit à chaque rendu ; c'est `wellness` et l'état
    // qui disent quand il a vraiment changé.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wellness, state, today, reprise, sinceQuality, onReadout])

  const context = useMemo(() => {
    if (state.status !== 'ok') return null
    return buildContext({
      today,
      // Seulement l'à-venir : une séance passée ne doit pas entrer dans
      // l'espacement du E.4 et bloquer les jours qui viennent.
      events: state.data.events.filter((event) => (dayKeyOf(event.startDateLocal) ?? '') >= today),
      activities: state.data.activities,
      wellness: state.data.wellness,
      intent,
    })
  }, [state, today, intent])

  const days = useMemo(() => {
    if (state.status !== 'ok' || !context) return []
    return groupByDay(state.data.events, context, today)
  }, [state, context, today])

  const planned = days.reduce((total, day) => total + day.items.length, 0)

  // Le plan est recalculé en entier à chaque refus, jamais rapiécé : les
  // séances suivantes sont placées par rapport à la première (E.14).
  const suggestions = useMemo(
    () =>
      context
        ? planWeek({
            context,
            today,
            fitness,
            refused: refusedKeys(choices),
            notBefore: choices.notBefore,
            levels,
            reprise,
          })
        : [],
    [context, today, fitness, choices, levels, reprise],
  )

  const apply = async (event: CalendarEvent, change: Change) => {
    if (!event.id) return
    setWrites((current) => ({ ...current, [event.id!]: { status: 'writing' } }))

    const outcome = await writeChange(credentials, event.id, change)
    if (outcome.kind !== 'ok') {
      const { title, detail } = describe(outcome)
      setWrites((current) => ({
        ...current,
        [event.id!]: { status: 'failed', detail: `${title} — ${detail}` },
      }))
      return
    }

    setWrites((current) => ({ ...current, [event.id!]: { status: 'done' } }))
    // Le calendrier vient de changer : le relire est la seule façon d'être
    // sûr que les propositions suivantes portent sur l'état réel.
    window.setTimeout(() => void load(), 1200)
  }

  const forget = (eventId: string, proposal: Proposal) => {
    setDismissed(dismiss(fingerprint(eventId, proposal.action, today)))
  }

  if (state.status === 'loading') {
    return (
      <section className="card">
        <h2>Ta semaine</h2>
        <p className="muted">Lecture d’intervals.icu…</p>
      </section>
    )
  }

  if (state.status === 'error') {
    return (
      <section className="card">
        <div className="card-head">
          <h2>Ta semaine</h2>
          <button className="button button-small button-ghost" onClick={() => void load()}>
            Réessayer
          </button>
        </div>
        <p className="error">
          <strong>{state.title}</strong>
          <br />
          {state.detail}
        </p>
      </section>
    )
  }

  return (
    <>
    <section className="card">
      <div className="card-head">
        <h2>Ta semaine</h2>
        <button className="button button-small button-ghost" onClick={() => void load()}>
          Actualiser
        </button>
      </div>

      {state.data.gaps.map((gap) => (
        <p className="notice small" key={gap}>
          {gap}
        </p>
      ))}

      {/* Quand l'athlète a écarté ce qui restait, c'est `Week` qui le dit — et
          il le dit juste. `Empty` invoquerait la fraîcheur ou les jours pris,
          ce qui serait faux et se contredirait à l'écran. */}
      {planned === 0 && suggestions.length === 0 && !hasPlanPreferences(choices) ? (
        <Empty read={state.data.events.length} />
      ) : null}

      <Week
        credentials={credentials}
        suggestions={suggestions}
        fitness={fitness}
        today={today}
        empty={planned === 0}
        refusing={hasPlanPreferences(choices)}
        onPlaced={() => void load()}
        onRefuse={(family) => setChoices(refuseFamily(family, today))}
        onPostpone={(date) => setChoices(postponePlan(date))}
        onReset={() => setChoices(resetPlanPreferences())}
      />

      {days.map((day) => (
        <div className={day.date === today ? 'day day-today' : 'day'} key={day.date}>
          <p className="day-title">
            <span>{day.date === today ? 'Aujourd’hui' : formatDay(day.date)}</span>
            <span className={`weight weight-${day.weight}`}>{weightLabel(day.weight)}</span>
          </p>

          {day.items.length === 0 ? (
            <p className="muted">Rien de prévu. C’est une réponse valable.</p>
          ) : null}

          {day.items.map(({ event, proposal }) => {
            const id = event.id ?? ''
            const change = changeFor(event, proposal)
            const hidden = dismissed.has(fingerprint(id, proposal.action, today))

            return (
              <SessionCard
                key={id || `${day.date}-${event.name}`}
                event={event}
                proposal={hidden ? { action: 'garder' } : proposal}
                change={change}
                intent={intent}
                today={today}
                open={day.date === today}
                write={writes[id] ?? { status: 'idle' }}
                onApply={() => change && void apply(event, change)}
                onDismiss={() => forget(id, proposal)}
              />
            )
          })}
        </div>
      ))}

      {context ? (
        <Place
          credentials={credentials}
          context={context}
          intent={intent}
          today={today}
          onPlaced={() => void load()}
        />
      ) : null}

      {planned > 0 ? (
        <p className="muted small">
          L’app propose, tu confirmes. Rien n’est écrit dans intervals.icu sans un tap de ta
          part.
        </p>
      ) : null}
    </section>

    <Progress levels={levels} completions={completions} today={today} />
    </>
  )
}

/**
 * Ce que l'app affiche quand il n'y a rien à afficher.
 *
 * Un écran vide se lit comme une panne. Celui-ci dit ce qui manque, pourquoi
 * ce n'est pas une erreur, et ce qu'il faut faire — parce qu'une app sans
 * séances à placer est exactement aussi utile qu'un calendrier vide, et que
 * ce n'est pas à l'athlète de le deviner.
 */
function Empty({ read }: { read: number }) {
  return (
    <div className="empty">
      <p className="empty-head">Rien de prévu sur les {AHEAD_DAYS} prochains jours.</p>
      <p className="muted small">
        D’habitude elle te propose un plan d’elle-même. Là, elle n’a rien trouvé qui tienne
        — soit la fraîcheur est trop basse, soit les jours à venir sont déjà pris.{' '}
        <strong>Poser une séance</strong> ci-dessous passe outre si tu y tiens.
      </p>
      {read > 0 ? (
        <p className="muted small">
          {read} événement{read > 1 ? 's ont' : ' a'} bien été lu{read > 1 ? 's' : ''} sur cette
          période, mais aucun n’est une séance — ce sont des repères de calendrier, comme un
          début de saison.
        </p>
      ) : null}
    </div>
  )
}

type Day = {
  date: DayKey
  weight: string
  items: { event: CalendarEvent; proposal: Proposal }[]
}

/**
 * Les journées à afficher : aujourd'hui toujours, puis celles qui portent
 * quelque chose. Une grille de jours vides n'apprend rien et donne un air de
 * reproche.
 */
function groupByDay(
  events: readonly CalendarEvent[],
  context: ReturnType<typeof buildContext>,
  today: DayKey,
): Day[] {
  const byDay = new Map<DayKey, { event: CalendarEvent; proposal: Proposal }[]>()

  for (const event of events) {
    if (!isSession(event)) continue
    const date = dayKeyOf(event.startDateLocal)
    if (!date || date < today) continue

    const session = context.planned.find((planned) => planned.id === event.id)
    const proposal: Proposal = session ? propose(session, context) : { action: 'garder' }

    const sameDay = byDay.get(date)
    if (sameDay) sameDay.push({ event, proposal })
    else byDay.set(date, [{ event, proposal }])
  }

  return [...new Set([today, ...byDay.keys()])].sort().map((date) => ({
    date,
    weight: weighDay(
      context.days.find((day) => day.date === date),
      date,
      context.planned,
    ),
    items: byDay.get(date) ?? [],
  }))
}

/** Un échec d'API, rendu en une phrase qui dit quoi corriger. */
function describe(outcome: Exclude<ApiOutcome<unknown>, { kind: 'ok' }>): {
  title: string
  detail: string
} {
  switch (outcome.kind) {
    case 'unauthorized':
      return {
        title: 'Clé refusée',
        detail: 'intervals.icu a répondu, mais rejette ces identifiants.',
      }
    case 'httpError':
      return {
        title: `Erreur HTTP ${outcome.status}`,
        detail:
          outcome.status === 404
            ? 'intervals.icu ne connaît pas cette adresse.'
            : outcome.detail || 'intervals.icu a répondu, mais pas ce qui était attendu.',
      }
    case 'blocked':
      return {
        title: 'Appel impossible',
        detail: `Le navigateur ou le réseau a bloqué la demande. Détail : ${outcome.detail}`,
      }
  }
}
