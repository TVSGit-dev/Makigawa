/**
 * Le calendrier des deux prochaines semaines (E.10, E.14, E.17, E.19, E.20).
 *
 * Depuis le 7 septembre c'est **le produit** : le plan vit ici, Makigawa le
 * tient et le corrige à chaque lecture d'intervals.icu. Rien n'en part.
 *
 * Une ligne par jour, toutes les quatorze. Un jour vide est une information —
 * c'est là qu'il reste de la place — et il faut le voir pour lire le rythme
 * d'une semaine.
 *
 * Chaque jour porte sa **marque de trajet** (E.17 révisé). Un tap la fait
 * défiler, et le plan se recalcule autour : un aller-retour musculaire est une
 * journée chargée, et le E.2 s'en écarte comme de n'importe quelle autre.
 */

import { COMMUTE_LABELS, COMMUTE_MARKS, type CommuteKind } from '../actions/commute'
import type { CalendarEvent } from '../api/intervals'
import type { Proposal } from '../rules/decide'
import type { Intent } from '../rules/intent'
import type { DayWeight } from '../rules/types'
import type { Ramp } from '../rules/ramp'
import type { Suggestion } from '../workouts/week'
import { toNotation } from '../workouts/compose'
import { formatDayShort, formatDuration, type DayKey } from '../calendar/dates'
import { Profile } from './Profile'
import { SessionCard, type DeleteState } from './SessionCard'

/**
 * Le poids d'une journée, en un mot.
 *
 * `weightLabel` dit « journée chargée », ce qui est juste dans une phrase et
 * répétitif quatorze fois de suite. Ici la colonne dit déjà qu'on parle de
 * journées.
 */
const WEIGHTS: Record<DayWeight, string> = {
  legere: 'légère',
  moyenne: 'moyenne',
  chargee: 'chargée',
}

export type CalendarDay = {
  date: DayKey
  weight: DayWeight
  commute: CommuteKind
  items: readonly { event: CalendarEvent; proposal: Proposal }[]
  suggestion: Suggestion | null
}

type Props = {
  days: readonly CalendarDay[]
  today: DayKey
  intent: Intent
  /** La forme d'intervals.icu, affichée pour dire sur quoi le choix repose. */
  fitness: number | null
  /** La vitesse à laquelle la forme monte, et son plafond (E.20). */
  ramp: Ramp | null
  /** Vrai si l'athlète a écarté ou repoussé quelque chose (E.14). */
  refusing: boolean
  removals: Record<string, DeleteState>
  onCommute: (date: DayKey) => void
  onRefuse: (familyKey: string) => void
  onPostpone: (date: DayKey) => void
  onReset: () => void
  onDelete: (eventId: string) => void
}

export function Week({
  days,
  today,
  intent,
  fitness,
  ramp,
  refusing,
  removals,
  onCommute,
  onRefuse,
  onPostpone,
  onReset,
  onDelete,
}: Props) {
  const proposed = days.filter((day) => day.suggestion !== null)
  const first = proposed[0] ?? null

  return (
    <>
      <p className="muted small">
        {fitness === null
          ? 'Choisi sur ce qui est déjà prévu.'
          : `Choisi sur ta forme (${Math.round(fitness)}), tes trajets et ce qui est déjà prévu.`}{' '}
        Le plan vit ici : rien n’est écrit dans intervals.icu.
      </p>

      {ramp ? <RampLine ramp={ramp} /> : null}

      {proposed.length === 0 && refusing ? (
        <p className="muted small">
          Tu as écarté ce qui restait ouvert à ta forme.{' '}
          <button className="link" onClick={onReset}>
            Reprends tes propositions
          </button>
        </p>
      ) : null}

      {refusing && proposed.length > 0 ? (
        <p className="muted small">
          Ce plan tient compte de ce que tu as écarté.{' '}
          <button className="link" onClick={onReset}>
            Tout remettre
          </button>
        </p>
      ) : null}

      <div className="calendar">
        {days.map((day) => (
          <div className={day.date === today ? 'day day-today' : 'day'} key={day.date}>
            <p className="day-title">
              <button
                className={`mark mark-${day.commute}`}
                onClick={() => onCommute(day.date)}
                aria-label={`Trajet du jour : ${COMMUTE_LABELS[day.commute]}. Taper pour changer.`}
                title={COMMUTE_LABELS[day.commute]}
              >
                {COMMUTE_MARKS[day.commute]}
              </button>
              <span className="day-name">
                {day.date === today ? 'Aujourd’hui' : formatDayShort(day.date)}
              </span>
              <span className={`weight weight-${day.weight}`}>{WEIGHTS[day.weight]}</span>
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
                  open={day.date === today}
                  remove={removals[id] ?? { status: 'idle' }}
                  onDelete={() => id && onDelete(id)}
                />
              )
            })}

            {day.suggestion ? (
              <Proposed
                suggestion={day.suggestion}
                first={first?.date === day.date}
                onRefuse={onRefuse}
                onPostpone={onPostpone}
              />
            ) : null}
          </div>
        ))}
      </div>
    </>
  )
}

/** Une séance que Makigawa propose. Elle n'existe que dans l'app. */
function Proposed({
  suggestion,
  first,
  onRefuse,
  onPostpone,
}: {
  suggestion: Suggestion
  first: boolean
  onRefuse: (familyKey: string) => void
  onPostpone: (date: DayKey) => void
}) {
  return (
    <article className="suggested">
      <p className="suggested-name">{suggestion.workout.name}</p>
      <p className="suggested-why">{suggestion.because}</p>

      <Profile blocks={suggestion.workout.blocks} />

      <details className="structure">
        <summary>La structure — {formatDuration(suggestion.workout.seconds)}</summary>
        <pre>{toNotation(suggestion.workout)}</pre>
      </details>

      <div className="suggested-refuse">
        <button
          className="button button-small button-quiet"
          onClick={() => onRefuse(suggestion.workout.family.key)}
        >
          Pas celle-ci
        </button>

        {/* Le report ne s'offre que sur la première : les suivantes sont
            placées par rapport à elle (E.14). */}
        {first ? (
          <button
            className="button button-small button-quiet"
            onClick={() => onPostpone(suggestion.date)}
          >
            Plus tard
          </button>
        ) : null}
      </div>
    </article>
  )
}

/**
 * La vitesse de montée, dite en clair (E.20).
 *
 * C'est ce qui rend la progression vérifiable : l'athlète voit à quelle
 * vitesse sa forme monte et ce que l'app s'autorise, avant de lire ce qu'elle
 * propose.
 */
function RampLine({ ramp }: { ramp: Ramp }) {
  const holding = ramp.rate >= ramp.cap
  const rate = ramp.rate.toFixed(1).replace('.', ',')
  const cap = ramp.cap.toFixed(1).replace('.', ',')

  return (
    <p className={holding ? 'notice notice-soft small' : 'muted small'}>
      {ramp.rate <= 0
        ? `Ta forme ne monte pas cette semaine (${rate} sur sept jours). Il y a de la place pour en rajouter.`
        : `Ta forme monte de ${rate} par semaine ; le plafond est ${cap}.`}
      {holding ? ' On tient le niveau : on ne progresse pas en ajoutant à ce qui monte déjà.' : ''}
    </p>
  )
}
