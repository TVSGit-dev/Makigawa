/**
 * La bande des quatorze jours — l'écran d'accueil depuis le 9 septembre 2026.
 *
 * La liste verticale disait chaque jour correctement et ne disait rien du
 * **rythme** : il fallait faire défiler quatorze lignes pour voir où ça montait,
 * où c'était vide, où deux journées se suivaient. Une bande le donne d'un coup
 * d'œil, et c'est précisément ce qu'un plan d'entraînement est censé montrer.
 *
 * Ce que la bande encode, et rien d'autre :
 *
 * - la **hauteur** d'une colonne est une charge, celle d'intervals.icu pour les
 *   séances posées, celle relevée par l'athlète pour les trajets (E.13) ;
 * - la **ligne pointillée** est ce que chaque journée devrait porter pour tenir
 *   la semaine — le `perDay` du E.28 ;
 * - le **liseré au pied** marque une journée chargée au sens du E.1 ;
 * - le **capuchon hachuré** dit qu'une séance est proposée là.
 *
 * **Le capuchon n'a pas de hauteur proportionnelle, et c'est délibéré.** Une
 * séance composée n'a pas de charge — intervals.icu la calculerait depuis la
 * structure, et l'app ne lui envoie plus rien (E.19). Lui donner une hauteur
 * reviendrait à inventer un chiffre, ce que le projet s'interdit. Le capuchon
 * dit « il y a quelque chose ici », pas « ça pèse tant » — la même distinction
 * que le E.28 fait déjà dans la jauge de la semaine.
 */

import { COMMUTE_LABELS, COMMUTE_MARKS, type CommuteKind } from '../actions/commute'
import { formatDayShort, parseDayKey, type DayKey } from '../calendar/dates'
import type { DayWeight } from '../rules/types'

/** « MAR », « SAM » — trois lettres, tout ce qui tient sous une colonne. */
function shortDay(date: DayKey): string {
  const parsed = parseDayKey(date)
  if (!parsed) return '—'
  return parsed.toLocaleDateString('fr-BE', { weekday: 'short' }).replace('.', '').slice(0, 3)
}

export type StripDay = {
  date: DayKey
  weight: DayWeight
  commute: CommuteKind
  /** Ce que les trajets marqués pèsent ce jour-là (E.13). */
  commuteLoad: number
  /** Ce que les séances posées dans intervals.icu pèsent, trajets exclus. */
  sessionLoad: number
  /** Makigawa propose une séance ce jour-là. Sans charge : voir l'en-tête. */
  proposed: boolean
}

type Props = {
  days: readonly StripDay[]
  today: DayKey
  /** Ce qu'il faudrait porter chaque jour pour tenir la semaine (E.28). */
  perDay: number
  selected: DayKey
  onSelect: (date: DayKey) => void
  /** Un tap sur la marque fait défiler électrique → musculaire → rien (E.17). */
  onCommute: (date: DayKey) => void
}

/**
 * Le plafond de l'échelle, en charge.
 *
 * La plus grosse journée de la fenêtre, mais jamais moins du double de
 * l'objectif quotidien : sans ce plancher, une semaine calme écraserait la
 * ligne d'objectif tout en haut et la rendrait illisible.
 */
function ceilingOf(days: readonly StripDay[], perDay: number): number {
  const biggest = days.reduce((top, day) => Math.max(top, day.commuteLoad + day.sessionLoad), 0)
  return Math.max(biggest, perDay * 2, 60)
}

/** Le capuchon d'une proposition, en pixels : un repère, pas une valeur. */
const CAP_PX = 20

export function Strip({ days, today, perDay, selected, onSelect, onCommute }: Props) {
  const ceiling = ceilingOf(days, perDay)
  const part = (load: number) => `${Math.min(100, (load / ceiling) * 100)}%`

  return (
    <div className="strip-wrap">
      <div className="plot">
        {/* La ligne ne s'affiche que si l'objectif tient dans l'échelle :
            sans semaine complète observée, le E.28 ne donne aucun objectif. */}
        {perDay > 0 ? (
          <div className="target" style={{ bottom: part(perDay) }} aria-hidden="true" />
        ) : null}

        <div className="strip">
          {days.map((day, index) => {
            const total = day.commuteLoad + day.sessionLoad
            const classes = [
              'col',
              day.date === today ? 'col-today' : '',
              day.date === selected ? 'col-on' : '',
              day.weight === 'chargee' ? 'col-charged' : '',
              index === 7 ? 'col-split' : '',
            ]
              .filter(Boolean)
              .join(' ')

            return (
              <button
                type="button"
                className={classes}
                key={day.date}
                aria-pressed={day.date === selected}
                aria-label={`${formatDayShort(day.date)} — charge ${Math.round(total)}${
                  day.proposed ? ', une séance proposée' : ''
                }`}
                onClick={() => onSelect(day.date)}
              >
                {day.proposed ? <span className="bar bar-proposed" style={{ height: CAP_PX }} /> : null}
                {day.sessionLoad > 0 ? (
                  <span className="bar bar-session" style={{ height: part(day.sessionLoad) }} />
                ) : null}
                {day.commuteLoad > 0 ? (
                  <span
                    className={`bar bar-commute${day.commute === 'hard' ? ' bar-muscular' : ''}`}
                    style={{ height: part(day.commuteLoad) }}
                  />
                ) : null}
                {total === 0 && !day.proposed ? <span className="bar-empty" /> : null}
              </button>
            )
          })}
        </div>
      </div>

      <div className="ticks">
        {days.map((day) => (
          <span className={day.date === today ? 'tick tick-today' : 'tick'} key={day.date}>
            <b>{day.date === today ? 'AUJ.' : shortDay(day.date)}</b>
            {Number(day.date.slice(-2))}
          </span>
        ))}
      </div>

      {/* Les marques de trajet restent tapables, une par jour : c'est le geste
          du E.17 révisé, et il n'a pas d'autre place depuis que la liste
          verticale a disparu. */}
      <div className="marks">
        {days.map((day) => (
          <button
            type="button"
            className={`mark mark-${day.commute}`}
            key={day.date}
            aria-label={`Trajet du ${formatDayShort(day.date)} : ${COMMUTE_LABELS[day.commute]}. Taper pour changer.`}
            title={COMMUTE_LABELS[day.commute]}
            onClick={() => onCommute(day.date)}
          >
            {COMMUTE_MARKS[day.commute]}
          </button>
        ))}
      </div>
    </div>
  )
}
