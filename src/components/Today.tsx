/**
 * Aujourd'hui, en un coup d'œil (section 5, E.17 et E.19).
 *
 * Deux questions, dans l'ordre où elles se posent réellement dans la journée.
 * **Le trajet d'abord** — six à sept fois par semaine contre une à deux
 * séances : c'est la décision la plus fréquente, et celle qui porte 60 à 100 %
 * de la charge. **La séance ensuite**, quand il y en a une.
 *
 * Depuis le E.19, rien ne s'écrit ici. L'app dit ce qui conviendrait ; les
 * trajets, eux, arrivent de Garmin comme ils l'ont toujours fait.
 */

import { commuteVerdicts, isWorkday, type CommuteOption } from '../actions/commute'
import type { CalendarEvent } from '../api/intervals'
import type { Suggestion } from '../workouts/week'
import type { Context, Proposal } from '../rules/decide'
import type { DayWeight } from '../rules/types'
import type { DayKey } from '../calendar/dates'
import { announce, explain, weightLabel } from './reasons'

type Props = {
  today: DayKey
  weight: DayWeight
  context: Context
  /** Ce qui est déjà au calendrier aujourd'hui. */
  planned: readonly { event: CalendarEvent; proposal: Proposal }[]
  /** La proposition du plan pour aujourd'hui, s'il y en a une. */
  suggestion: Suggestion | null
}

export function Today({ today, weight, context, planned, suggestion }: Props) {
  const verdicts = commuteVerdicts(today, context)
  const advised = verdicts.find((verdict) => verdict.advised)

  return (
    <section className="card">
      <div className="card-head">
        <h2>Aujourd’hui</h2>
        <span className={`weight weight-${weight}`}>{weightLabel(weight)}</span>
      </div>

      {isWorkday(today) ? (
        <div className="now">
          <p className="now-label">Ton trajet</p>
          <p className="now-answer">{advised ? answerOf(advised.option) : 'La batterie.'}</p>

          {/* Les trois, toujours. L'app dit laquelle elle recommande, pas
              laquelle est permise (E.17). */}
          <ul className="options">
            {verdicts.map(({ option, reason, advised: isAdvised }) => (
              <li className={isAdvised ? 'option option-on' : 'option'} key={option.choice}>
                <p className="option-name">
                  {option.label} <span className="option-load">· {option.load}</span>
                </p>
                {reason ? (
                  <p className="option-why">{explain(reason, context.intent, today)}</p>
                ) : null}
              </li>
            ))}
          </ul>
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
