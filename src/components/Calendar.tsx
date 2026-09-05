import { useCallback, useEffect, useState } from 'react'
import { fetchCalendarEvents, type CalendarEvent } from '../api/intervals'
import type { Credentials } from '../storage/credentials'
import { addDays, dayKeyOf, formatDay, formatDuration, toDayKey } from '../calendar/dates'

/** À partir d'aujourd'hui : la fin de cette semaine, et de quoi voir venir. */
const WINDOW_DAYS = 14

/**
 * Ce qui compte comme une séance. Le calendrier d'intervals.icu porte aussi
 * des repères qui ne sont pas des choses à faire — un SEASON_START y a été
 * constaté le 5 septembre. Liste établie sur ce qui a été vu, pas devinée :
 * elle s'allongera à mesure que le vocabulaire de l'API se révélera. Ce qui
 * n'y figure pas n'est pas masqué, seulement rangé à part.
 */
const SESSION_CATEGORIES = new Set(['WORKOUT'])

function isSession(event: CalendarEvent): boolean {
  return event.category === null || SESSION_CATEGORIES.has(event.category)
}

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; events: CalendarEvent[] }
  | { status: 'error'; title: string; detail: string }

type Props = {
  credentials: Credentials | null
}

export function Calendar({ credentials }: Props) {
  const [state, setState] = useState<State>({ status: 'idle' })

  const load = useCallback(async (valid: Credentials) => {
    setState({ status: 'loading' })
    const today = new Date()
    const outcome = await fetchCalendarEvents(valid, today, addDays(today, WINDOW_DAYS - 1))

    switch (outcome.kind) {
      case 'ok':
        setState({ status: 'ok', events: outcome.data })
        break
      case 'unauthorized':
        setState({
          status: 'error',
          title: 'Clé refusée',
          detail: 'intervals.icu a répondu, mais rejette ces identifiants.',
        })
        break
      case 'httpError':
        setState({
          status: 'error',
          title: `Erreur HTTP ${outcome.status}`,
          detail:
            outcome.status === 404
              ? 'intervals.icu ne connaît pas cette adresse : le nom du point d’entrée du calendrier est à corriger.'
              : outcome.detail || 'intervals.icu a répondu, mais pas ce qui était attendu.',
        })
        break
      case 'blocked':
        setState({
          status: 'error',
          title: 'Appel impossible',
          detail: `Le calendrier n’a pas pu être demandé. Détail : ${outcome.detail}`,
        })
        break
    }
  }, [])

  useEffect(() => {
    if (!credentials) {
      setState({ status: 'idle' })
      return
    }
    void load(credentials)
  }, [credentials, load])

  if (!credentials) {
    return (
      <section className="card">
        <h2>Séances à venir</h2>
        <p className="muted">
          Renseigne tes identifiants ci-dessus pour voir ton calendrier intervals.icu.
        </p>
      </section>
    )
  }

  return (
    <section className="card">
      <div className="card-head">
        <h2>Séances à venir</h2>
        <button
          className="button button-small button-ghost"
          onClick={() => void load(credentials)}
          disabled={state.status === 'loading'}
        >
          {state.status === 'loading' ? 'Chargement…' : 'Actualiser'}
        </button>
      </div>
      <p className="muted">Les {WINDOW_DAYS} prochains jours, lus dans intervals.icu.</p>

      {state.status === 'error' ? (
        <p className="error">
          <strong>{state.title}</strong>
          <br />
          {state.detail}
        </p>
      ) : null}

      {state.status === 'ok' ? <Days events={state.events} /> : null}
    </section>
  )
}

function Days({ events }: { events: CalendarEvent[] }) {
  const sessions = events.filter(isSession)
  const markers = events.filter((event) => !isSession(event))
  const byDay = new Map<string, CalendarEvent[]>()
  let undated = 0

  for (const event of sessions) {
    const key = dayKeyOf(event.startDateLocal)
    if (!key) {
      undated += 1
      continue
    }
    const sameDay = byDay.get(key)
    if (sameDay) sameDay.push(event)
    else byDay.set(key, [event])
  }

  // Aujourd'hui figure toujours, même vide. Les autres jours n'apparaissent
  // que s'ils portent quelque chose : une grille de jours vides n'apprend
  // rien et donne un air de reproche.
  const todayKey = toDayKey(new Date())
  const days = [...new Set([todayKey, ...byDay.keys()])].sort()

  return (
    <>
      {days.map((key) => (
        <div className={key === todayKey ? 'day day-today' : 'day'} key={key}>
          <p className="day-title">
            {key === todayKey ? 'Aujourd’hui' : formatDay(key)}
          </p>
          {(byDay.get(key) ?? []).map((event, index) => (
            <Event event={event} key={event.id ?? `${key}-${index}`} />
          ))}
          {byDay.has(key) ? null : <p className="muted">Rien de planifié.</p>}
        </div>
      ))}

      {undated > 0 ? (
        <p className="muted">
          {undated} événement{undated > 1 ? 's' : ''} sans date exploitable — à regarder dans
          les données brutes.
        </p>
      ) : null}

      <Markers markers={markers} />
      <Fields events={events} />
    </>
  )
}

/**
 * Les repères du calendrier — début de saison, et ce qu'on découvrira. Ils ne
 * se planifient pas et n'ont rien à faire dans la liste des séances, mais les
 * cacher tout à fait empêcherait de constater ce que l'API envoie.
 */
function Markers({ markers }: { markers: CalendarEvent[] }) {
  if (markers.length === 0) return null

  return (
    <details className="raw">
      <summary>
        {markers.length} repère{markers.length > 1 ? 's' : ''} de calendrier, hors séances
      </summary>
      <p className="muted">
        {markers
          .map((marker) => `${marker.name ?? 'sans nom'} (${marker.category ?? 'sans catégorie'})`)
          .join(', ')}
      </p>
    </details>
  )
}

function Event({ event }: { event: CalendarEvent }) {
  const chips = [
    event.type,
    event.category,
    event.movingTime === null ? null : formatDuration(event.movingTime),
    event.trainingLoad === null ? null : `charge ${Math.round(event.trainingLoad)}`,
  ].filter((chip): chip is string => chip !== null)

  return (
    <div className="event">
      <p className="event-name">{event.name ?? 'Séance sans nom'}</p>
      {chips.length > 0 ? (
        <p className="event-meta">
          {chips.map((chip) => (
            <span className="chip" key={chip}>
              {chip}
            </span>
          ))}
        </p>
      ) : null}
      {event.description ? <p className="event-steps">{event.description}</p> : null}
      <details className="raw">
        <summary>Données brutes</summary>
        <pre>{JSON.stringify(event.raw, null, 2)}</pre>
      </details>
    </div>
  )
}

/**
 * Ce que l'API renvoie réellement pour une séance planifiée. C'est la réserve
 * laissée ouverte dans CLAUDE.md : tant qu'elle n'est pas levée, la liste des
 * champs vaut mieux qu'une supposition.
 */
function Fields({ events }: { events: CalendarEvent[] }) {
  if (events.length === 0) return null
  const fields = [...new Set(events.flatMap((event) => Object.keys(event.raw)))].sort()

  return (
    <details className="raw">
      <summary>
        {fields.length} champs renvoyés par l’API, sur {events.length} événement
        {events.length > 1 ? 's' : ''}
      </summary>
      <pre>{fields.join('\n')}</pre>
    </details>
  )
}
