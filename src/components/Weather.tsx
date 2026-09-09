/**
 * La météo du trajet, et comment s'habiller (E.31 et E.32).
 *
 * Deux fenêtres seulement — 8-9 h et 17-18 h. La météo de midi ne concerne pas
 * l'athlète : il est au bureau, et une prévision de journée entière lui ferait
 * choisir sa veste sur des heures qu'il ne roulera pas.
 *
 * **L'app ne dit rien qu'elle n'ait lu.** Les degrés viennent d'Open-Meteo, les
 * bandes d'habillement des guides du cyclisme, et le seul jugement du projet
 * est de dire laquelle s'applique. Une prévision manquante ne bloque rien :
 * le bloc disparaît, et le plan reste ce qu'il était.
 */

import type { WeatherHour } from '../api/weather'
import { COMMUTE_LABELS, type CommuteKind } from '../actions/commute'
import type { DayKey } from '../calendar/dates'
import {
  dressFor,
  signOf,
  skyOf,
  toCarry,
  wordOf,
  type Sky,
  type Window,
} from '../rules/dress'

/** Le degré, arrondi. Une décimale sur un ressenti donnerait une fausse précision. */
function degrees(value: number | null): string {
  return value === null ? '—' : `${Math.round(value)}°`
}

/**
 * Les deux signes d'un jour, l'un au-dessus de l'autre.
 *
 * Sous une colonne de la bande il y a vingt-six pixels : un mot n'y tient pas,
 * deux signes empilés oui — et le matin au-dessus du soir se lit comme la
 * journée passe. Vide quand la prévision ne va pas jusque-là : sept jours de
 * météo pour quatorze jours de plan, et au-delà l'app se tait plutôt que de
 * deviner.
 */
export function SkyPair({
  hours,
  date,
}: {
  hours: readonly WeatherHour[]
  date: DayKey
}) {
  const matin = skyOf(hours, date, 'matin')
  const soir = skyOf(hours, date, 'soir')
  if (!matin && !soir) return <span className="sky sky-none" aria-hidden="true" />

  return (
    <span
      className="sky"
      title={`Matin : ${wordOf(matin)}, ${degrees(matin?.felt ?? null)} — Soir : ${wordOf(soir)}, ${degrees(soir?.felt ?? null)}`}
      aria-label={`Matin ${wordOf(matin)}, soir ${wordOf(soir)}`}
    >
      <i>{signOf(matin)}</i>
      <i>{signOf(soir)}</i>
    </span>
  )
}

/**
 * Une fenêtre de trajet, dépliée : le temps, les degrés, et la tenue.
 *
 * La tenue n'apparaît que si un trajet est marqué ce jour-là. Sans trajet il
 * n'y a rien à habiller, et proposer une tenue « au cas où » reviendrait à
 * supposer un déplacement que l'athlète n'a pas prévu.
 *
 * **La tenue du soir ne se répète pas quand elle est celle du matin.** La
 * bande la plus large des guides couvre huit degrés : un matin à 12° et un
 * soir à 18° y tombent tous les deux, et réimprimer la même liste ne dit rien
 * de plus que « rien à changer ».
 */
function WindowLine({
  sky,
  window,
  commute,
  same,
}: {
  sky: Sky | null
  window: Window
  commute: CommuteKind
  same?: boolean
}) {
  if (!sky) return null
  const dressing = dressFor(sky, commute)
  const shifted = dressing !== null && Math.round(dressing.effective) !== Math.round(sky.felt ?? 0)

  return (
    <div className="win">
      <p className="win-head">
        <span className="win-when">{window === 'matin' ? '8-9 h' : '17-18 h'}</span>
        <span className="win-sign">{signOf(sky)}</span>
        <span className="win-word">{wordOf(sky)}</span>
        <span className="win-deg">
          {degrees(sky.felt)}
          {sky.celsius !== null && sky.felt !== null && Math.round(sky.celsius) !== Math.round(sky.felt) ? (
            <em> ressenti, {degrees(sky.celsius)} au thermomètre</em>
          ) : (
            <em> ressenti</em>
          )}
        </span>
      </p>

      {dressing ? (
        <p className="win-wear">
          <strong>{dressing.band.name}</strong> —{' '}
          {same ? 'même tenue qu’au matin' : dressing.wear.join(', ')}
          {/* Le pont entre les deux nombres. Sans lui, « 12° » à côté d'une
              tenue de 9° passe pour une erreur de l'app plutôt que pour la
              correction qu'elle est. */}
          {shifted || dressing.because.length > 0 ? (
            <span className="muted">
              {' ('}
              {shifted ? `comme pour ${degrees(dressing.effective)}` : null}
              {shifted && dressing.because.length > 0 ? ' : ' : null}
              {dressing.because.join(', ')}
              {')'}
            </span>
          ) : null}
        </p>
      ) : null}
    </div>
  )
}

/**
 * Le bloc météo du jour ouvert sous la bande.
 *
 * Il porte les deux fenêtres, ce qu'il faut emporter, et le rappel qui compte :
 * on part un peu frais et c'est normal. L'athlète chauffe dans les premiers
 * kilomètres, et s'habiller pour être bien à l'arrêt revient à transpirer à
 * mi-chemin — avec, en hiver, le refroidissement qui suit.
 */
export function DayWeather({
  hours,
  date,
  commute,
}: {
  hours: readonly WeatherHour[]
  date: DayKey
  commute: CommuteKind
}) {
  const matin = skyOf(hours, date, 'matin')
  const soir = skyOf(hours, date, 'soir')
  if (!matin && !soir) return null

  const tenueMatin = dressFor(matin, commute)
  const tenueSoir = dressFor(soir, commute)
  const carry = toCarry(tenueMatin, tenueSoir)

  // « Même tenue » plutôt que la même liste deux fois : c'est la même chose,
  // dite une fois de moins.
  const identique =
    tenueMatin !== null &&
    tenueSoir !== null &&
    tenueMatin.wear.join('|') === tenueSoir.wear.join('|')

  return (
    <section className="weather">
      <p className="weather-head">
        {commute === 'aucun' ? 'Aucun trajet marqué — la météo seule' : `Trajet ${COMMUTE_LABELS[commute]}`}
      </p>

      <WindowLine sky={matin} window="matin" commute={commute} />
      <WindowLine sky={soir} window="soir" commute={commute} same={identique} />

      {carry.length > 0 ? (
        <p className="weather-carry">
          <strong>Dans le sac :</strong> {carry.join(', ')}.
        </p>
      ) : null}

      {commute !== 'aucun' ? (
        <p className="muted small">
          Habille-toi pour le kilomètre cinq, pas pour le pas de la porte : partir
          légèrement frais est le bon réglage.
        </p>
      ) : null}
    </section>
  )
}
