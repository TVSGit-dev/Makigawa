/**
 * L'écran principal : ce qui est prévu, et ce que l'app en pense.
 *
 * Il n'affiche jamais le passé. Ce n'est pas une simplification mais une
 * contrainte du projet : une journée révolue affichée dans un plan devient un
 * reproche, et une séance qu'on a laissée tomber n'a pas à laisser de trace.
 * Le passé sert au moteur — il ne s'affiche que dans la raison d'une
 * proposition.
 */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  deleteEvent,
  fetchActivities,
  fetchCalendarEvents,
  fetchWellness,
  type Activity,
  type ApiOutcome,
  type CalendarEvent,
  type Wellness,
} from '../api/intervals'
import { buildContext, isSession, toDayRecords } from '../rules/context'
import { daysSinceQuality, isReprise, matchCompletions } from '../rules/done'
import { shouldUnload } from '../rules/decharge'
import { heldFrom, levelsFrom } from '../workouts/levels'
import { propose, type Proposal } from '../rules/decide'
import { weighDay } from '../rules/scale'
import type { Intent } from '../rules/intent'
import type { DayRecord, DayWeight } from '../rules/types'
import type { Credentials } from '../storage/credentials'
import { rampOf, holdsLevel } from '../rules/ramp'
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
  formatRelativeDay,
  shiftDayKey,
  toDayKey,
  type DayKey,
} from '../calendar/dates'
import { Progress } from './Progress'
import { Today } from './Today'
import { Week } from './Week'
import { planWeek } from '../workouts/week'
import { firstTestDay, FTP_TEST_NAME } from '../workouts/ftp-test'
import { SessionCard, type DeleteState } from './SessionCard'
import { explainTest, weightLabel } from './reasons'

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
  /** Le cycle 2:1 arrive à sa troisième semaine (E.18). */
  unloadSuggested: boolean
}

type Props = {
  credentials: Credentials
  intent: Intent
  /** La décharge acceptée pour cette semaine, décidée par `App` (E.18). */
  unloading: boolean
  /** Les semaines déjà passées en décharge : le cycle les saute. */
  unloadedWeeks: ReadonlySet<DayKey>
  onReadout: (readout: Readout) => void
  /**
   * Ce qui se glisse entre « Aujourd'hui » et « Ta semaine ».
   *
   * `App` y met la carte de forme : elle a besoin de données que `Plan` lit,
   * et `Plan` a besoin d'ouvrir l'écran. Le passer en enfant règle les deux
   * sans faire descendre une carte entière en propriétés.
   */
  children?: ReactNode
}

export function Plan({
  credentials,
  intent,
  unloading,
  unloadedWeeks,
  onReadout,
  children,
}: Props) {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [removals, setRemovals] = useState<Record<string, DeleteState>>({})
  // Ce que l'athlète a écarté ou repoussé du plan (E.14). Vit dans le
  // téléphone, ne part jamais dans intervals.icu.
  const [choices, setChoices] = useState<PlanPreferences>({ refused: {}, notBefore: null })

  const today = toDayKey(new Date())

  useEffect(() => {
    setChoices(forgetStalePreferences(today))
  }, [today])

  const load = useCallback(async () => {
    setState({ status: 'loading' })
    setRemovals({})

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

  // La vitesse à laquelle la forme monte, et son plafond (E.20). Au plafond,
  // le plan tient son niveau plutôt que de le monter d'un cran.
  const ramp = useMemo(
    () => (state.status === 'ok' ? rampOf(state.data.wellness, today) : null),
    [state, today],
  )
  const hold = holdsLevel(ramp)

  const unloadSuggested = useMemo(
    () => shouldUnload({ completions, today, unloaded: unloadedWeeks }),
    [completions, today, unloadedWeeks],
  )

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
      unloadSuggested,
    })
    // `observed` est reconstruit à chaque rendu ; c'est `wellness` et l'état
    // qui disent quand il a vraiment changé.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wellness, state, today, reprise, sinceQuality, unloadSuggested, onReadout])

  // Seulement l'à-venir : une séance passée ne doit pas entrer dans
  // l'espacement du E.4 et bloquer les jours qui viennent. Le calendrier est lu
  // six semaines en arrière pour le E.15, mais le moteur n'en veut rien.
  const upcoming = useMemo(
    () =>
      state.status === 'ok'
        ? state.data.events.filter((event) => (dayKeyOf(event.startDateLocal) ?? '') >= today)
        : [],
    [state, today],
  )

  const context = useMemo(() => {
    if (state.status !== 'ok') return null
    return buildContext({
      today,
      events: upcoming,
      activities: state.data.activities,
      wellness: state.data.wellness,
      intent,
    })
  }, [state, today, intent, upcoming])

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
            decharge: unloading,
            hold,
          })
        : [],
    [context, today, fitness, choices, levels, reprise, unloading, hold],
  )

  /**
   * La seule écriture qui reste (E.19).
   *
   * Elle va dans le sens du retrait : elle défait ce qui a été écrit avant, et
   * elle demande un appui long de deux secondes côté carte.
   */
  const remove = async (eventId: string) => {
    setRemovals((current) => ({ ...current, [eventId]: { status: 'deleting' } }))

    const outcome = await deleteEvent(credentials, eventId)
    if (outcome.kind !== 'ok') {
      const { title, detail } = describe(outcome)
      setRemovals((current) => ({
        ...current,
        [eventId]: { status: 'failed', detail: `${title} — ${detail}` },
      }))
      return
    }

    // Le calendrier vient de changer : le relire est la seule façon d'être
    // sûr que le plan porte sur l'état réel.
    window.setTimeout(() => void load(), 800)
  }

  if (state.status === 'loading') {
    return (
      <>
        {children}
        <section className="card">
          <h2>Ta semaine</h2>
          <p className="muted">Lecture d’intervals.icu…</p>
        </section>
      </>
    )
  }

  if (state.status === 'error') {
    return (
      <>
        {children}
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
      </>
    )
  }

  const todayDay = days.find((day) => day.date === today)

  return (
    <>
    {context ? (
      <Today
        today={today}
        weight={(todayDay?.weight ?? 'legere') as DayWeight}
        context={context}
        planned={todayDay?.items ?? []}
        suggestion={suggestions.find((one) => one.date === today) ?? null}
      />
    ) : null}

    {children}

    <section className="card">
      <div className="card-head">
        <h2>Les deux prochaines semaines</h2>
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
        <Empty read={upcoming.length} />
      ) : null}

      <Week
        suggestions={suggestions}
        fitness={fitness}
        ramp={ramp}
        today={today}
        refusing={hasPlanPreferences(choices)}
        onRefuse={(family) => setChoices(refuseFamily(family, today))}
        onPostpone={(date) => setChoices(postponePlan(date))}
        onReset={() => setChoices(resetPlanPreferences())}
      />

      {context ? <TestDay today={today} context={context} /> : null}

      {/* Aujourd'hui est déjà en tête d'écran : le répéter ici ferait deux
          fois la même journée sur un seul défilement. */}
      {days
        .filter((day) => day.date !== today)
        .map((day) => (
          <div className="day" key={day.date}>
            <p className="day-title">
              <span>{formatDay(day.date)}</span>
              <span className={`weight weight-${day.weight}`}>{weightLabel(day.weight)}</span>
            </p>

            {day.items.map(({ event, proposal }) => {
              const id = event.id ?? ''
              return (
                <SessionCard
                  key={id || `${day.date}-${event.name}`}
                  event={event}
                  proposal={proposal}
                  intent={intent}
                  today={today}
                  open={false}
                  remove={removals[id] ?? { status: 'idle' }}
                  onDelete={() => id && void remove(id)}
                />
              )
            })}
          </div>
        ))}

      <p className="muted small">
        Makigawa n’écrit rien dans intervals.icu. Elle lit ce que Garmin y verse, tient ce
        plan, et le corrige à chaque lecture. Un appui long de deux secondes sur une séance
        du calendrier fait apparaître de quoi la supprimer.
      </p>
    </section>

    <Progress levels={levels} completions={completions} today={today} />
    </>
  )
}

/**
 * Le jour du test FTP (E.11), dit et non posé.
 *
 * Il reste la dernière inconnue du projet : la FTP du profil est à 221 W,
 * Garmin en estime 240, et toutes les séances composées sont écrites en
 * pourcentage — corriger le profil les recalibre toutes d'un coup.
 */
function TestDay({ today, context }: { today: DayKey; context: ReturnType<typeof buildContext> }) {
  const found = firstTestDay(today, AHEAD_DAYS, context)

  return (
    <p className="muted small">
      <strong>{FTP_TEST_NAME}</strong>
      <br />
      {'date' in found
        ? `Il tiendrait ${formatRelativeDay(found.date, today)}. À toi de le lancer depuis intervals.icu.`
        : explainTest(found.refusal)}
    </p>
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

  // « Aujourd'hui » est toujours dans la liste, même vide, parce que le poids
  // de la journée s'y lit — sauf quand la carte du haut le dit déjà.
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
