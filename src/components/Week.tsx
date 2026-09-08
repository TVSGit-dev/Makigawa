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

import { useState } from 'react'
import { COMMUTE_LABELS, COMMUTE_MARKS, type CommuteKind } from '../actions/commute'
import type { CalendarEvent } from '../api/intervals'
import type { Proposal } from '../rules/decide'
import type { Intent } from '../rules/intent'
import type { DayWeight } from '../rules/types'
import type { Ramp } from '../rules/ramp'
import type { Suggestion } from '../workouts/week'
import { toNotation, type Workout } from '../workouts/compose'
import { shapeOf } from '../workouts/shape'
import { STANDING_NAMES } from '../workouts/levels'
import { pointerFor } from '../workouts/zwift'
import { DISTANCES, paceFor, wattsOf } from '../rides/outing'
import { loadForDistance, pastWattsFor } from '../rides/history'
import { perDay, type Dose } from '../rules/dose'
import type { Activity } from '../api/intervals'
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
  /** La charge de la semaine : ce qui a été fait, ce qui reste (E.23). */
  dose: Dose
  /** La FTP du profil, pour afficher les pourcentages en watts (E.23). */
  ftp: number | null
  /** L'historique, pour lire ce que les sorties ont réellement coûté (E.23). */
  activities: readonly Activity[]
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
  dose,
  ftp,
  activities,
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

      <DoseBlock dose={dose} />

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

      <Outing ftp={ftp} activities={activities} />

      <div className="calendar">
        {days.map((day) => (
          <div
            className={`day${day.date === today ? ' day-today' : ''}${
              day.weight === 'chargee' ? ' day-heavy' : ''
            }`}
            key={day.date}
          >
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
              <Load weight={day.weight} />
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
                ftp={ftp}
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

/**
 * Le poids d'une journée, en trois crans plutôt qu'en un mot.
 *
 * Quatorze lignes disant « légère » sont quatorze fois du bruit. La jauge dit
 * la même chose d'un coup d'œil, dans la même couleur que partout ailleurs —
 * plus le rose est profond, plus c'est sévère. Le mot reste pour la journée
 * chargée, qui est la seule dont on veut être averti.
 */
function Load({ weight }: { weight: DayWeight }) {
  const filled = { legere: 1, moyenne: 2, chargee: 3 }[weight]

  return (
    <span className={`load load-${weight}`} title={WEIGHTS[weight]}>
      {weight === 'chargee' ? <span className="load-word">chargée</span> : null}
      <span className="load-gauge" role="img" aria-label={`Journée ${WEIGHTS[weight]}`}>
        {[1, 2, 3].map((step) => (
          <span className={step <= filled ? 'load-step load-step-on' : 'load-step'} key={step} />
        ))}
      </span>
    </span>
  )
}

/**
 * Où chercher cette séance dans Zwift (E.27).
 *
 * L'app nomme un rayon, pas un article : elle ne prétend pas que la séance
 * existe telle quelle. Si rien dans ce rayon ne ressemble à la dose proposée,
 * c'est le catalogue de Zwift qui décide, et l'athlète choisit au plus près —
 * c'était déjà sa méthode avant qu'elle en parle.
 */
function Pointer({ workout }: { workout: Workout }) {
  const pointer = pointerFor(workout)
  if (!pointer) return null

  return (
    <p className="pointer">
      <span className="pointer-path">Zwift → Workouts → {pointer.collection}</span>
      <span className="pointer-hint">{pointer.hint}</span>
    </p>
  )
}

/** Une séance que Makigawa propose. Elle n'existe que dans l'app. */
function Proposed({
  suggestion,
  first,
  ftp,
  onRefuse,
  onPostpone,
}: {
  suggestion: Suggestion
  first: boolean
  ftp: number | null
  onRefuse: (familyKey: string) => void
  onPostpone: (date: DayKey) => void
}) {
  return (
    <article className="suggested">
      <p className="suggested-name">
        {suggestion.workout.family.name}
        <span className="suggested-dose">
          {' · '}
          {formatDuration(suggestion.workout.seconds)}
        </span>
      </p>
      <p className="suggested-why">
        {suggestion.because}{' '}
        {/* Ce que vaut le cran proposé, par rapport au niveau tenu dans la
            zone (E.26). Sans ce mot, un refus se fait à l'aveugle. */}
        <span className={`standing standing-${suggestion.standing}`}>
          {STANDING_NAMES[suggestion.standing]}
        </span>
      </p>

      <Profile blocks={suggestion.workout.blocks} />

      {/* La forme, pas la recette : assez pour reconnaître une séance
          équivalente dans le catalogue de Zwift, pas assez pour la recopier
          (E.23). */}
      <ul className="shape">
        {shapeOf(suggestion.workout, ftp).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      {/* Le rayon, pas l'article (E.27). Zwift range ses séances sous les mêmes
          noms de zones ; nommer le bon évite de chercher à l'aveugle. */}
      <Pointer workout={suggestion.workout} />

      <div className="suggested-refuse">
        <Copy notation={toNotation(suggestion.workout)} />

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
 * La dose de la semaine (E.23).
 *
 * L'athlète l'a demandée aux deux mailles : la semaine, où la charge
 * s'accumule vraiment, et les jours qui viennent, où le reste se répartit.
 *
 * **Ce n'est pas un quota quotidien.** Une journée sans rien ne crée aucune
 * dette : le reste se redistribue sur les jours restants et le chiffre baisse
 * tout seul. Répartir n'est pas devoir.
 */
function DoseBlock({ dose }: { dose: Dose }) {
  if (dose.target === null) {
    return (
      <p className="muted small">
        Pas encore de semaine complète à comparer : l’objectif de charge arrivera quand il y
        aura de quoi le poser.
      </p>
    )
  }

  const share = perDay(dose)
  const part = (load: number) => `${Math.min(100, (load / dose.target!) * 100)}%`
  const jours = `${dose.daysLeft} jour${dose.daysLeft > 1 ? 's' : ''}`

  return (
    <div className="dose">
      <p className="now-label">La charge de la semaine</p>

      {/* Fait et prévu séparés (E.28) : un seul total les confondrait, alors
          que la différence est justement ce qui se lit d'un coup d'œil. */}
      <p className="dose-line">
        <span className="dose-number">{dose.done}</span>
        {dose.planned > 0 ? (
          <>
            <span className="muted"> fait · </span>
            <span className="dose-number dose-ahead">{dose.planned}</span>
            <span className="muted"> prévu</span>
          </>
        ) : null}
        <span className="muted"> sur </span>
        <span className="dose-number">{dose.target}</span>
      </p>

      <span
        className="dose-bar"
        role="img"
        aria-label={`${dose.done} de charge faite et ${dose.planned} prévue, sur ${dose.target} visés`}
      >
        <span className="dose-fill" style={{ width: part(dose.done) }} />
        <span className="dose-fill dose-fill-ahead" style={{ width: part(dose.planned) }} />
      </span>

      <p className="muted small">
        {dose.remaining === 0
          ? dose.planned > 0
            ? 'Ce que tu as marqué couvre déjà la semaine. Ce qui vient en plus est du bonus, pas une dette.'
            : 'La semaine est faite. Ce qui vient en plus est du bonus, pas une dette.'
          : `Il reste ${dose.remaining} à placer sur ${jours} — environ ${share} par jour. Un jour sans rien ne crée pas de dette : le reste se répartit tout seul.`}
      </p>

      <p className="muted small">
        Les semaines précédentes :{' '}
        {dose.past.map((one) => (one.load > 0 ? one.load : '—')).join(', ')}.
      </p>
    </div>
  )
}

/**
 * La sortie longue, dite en distance (E.23).
 *
 * L'athlète part de la distance. L'app rend l'allure — un pourcentage de FTP
 * affiché en watts — et ce que ses propres sorties comparables ont coûté.
 * Cette charge-là n'est jamais estimée : elle est lue.
 */
function Outing({ ftp, activities }: { ftp: number | null; activities: readonly Activity[] }) {
  const [km, setKm] = useState<number>(50)

  const percent = paceFor(km)
  const watts = wattsOf(percent, ftp)
  const past = loadForDistance(activities, km)
  const held = pastWattsFor(activities, km)

  return (
    <div className="dose">
      <p className="now-label">Une sortie longue</p>

      <div className="segmented" role="group" aria-label="Distance">
        {DISTANCES.map((one) => (
          <button
            key={one}
            className={one === km ? 'segment segment-on' : 'segment'}
            aria-pressed={one === km}
            onClick={() => setKm(one)}
          >
            {one} km
          </button>
        ))}
      </div>

      <p className="dose-line">
        <span className="dose-number">{watts === null ? `${percent} %` : `${watts} W`}</span>
        <span className="muted"> de moyenne</span>
      </p>

      <p className="muted small">
        {watts === null
          ? `Soit ${percent} % de ta FTP. Renseigne-la dans intervals.icu pour la voir en watts.`
          : `Soit ${percent} % de ta FTP. Le jour du test, ce chiffre se corrige tout seul.`}
      </p>

      <p className="muted small">
        {past === null
          ? 'Aucune sortie comparable dans ton historique : je ne sais pas encore ce qu’elle te coûtera.'
          : `Tes ${past.count} sortie${past.count > 1 ? 's' : ''} de cette distance ${past.count > 1 ? 'ont pesé' : 'a pesé'} ${past.low === past.high ? past.low : `${past.low} à ${past.high}`}${held === null ? '' : `, à ${held} W de moyenne`}.`}
      </p>
    </div>
  )
}

/**
 * Le raccourci qui ferme la boucle (E.22).
 *
 * L'app ne pose plus rien dans intervals.icu (E.19), donc faire la séance
 * demandait de la retaper. Un tap la met dans le presse-papier, prête à coller
 * dans l'éditeur d'intervals.icu — c'est l'athlète qui écrit, pas l'app.
 *
 * Et une séance ainsi posée devient un vrai événement du calendrier : le E.15
 * l'apparie alors comme n'importe quelle autre, sans la réserve du E.22.
 */
function Copy({ notation }: { notation: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(notation)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      // Presse-papier refusé — page non sécurisée, permission absente. On ne
      // ment pas : le bouton ne se met pas au vert.
      setCopied(false)
    }
  }

  return (
    <button
      className="button button-small button-ghost"
      onClick={() => void copy()}
      title="Copier la structure, prête à coller dans intervals.icu"
    >
      {copied ? 'Copiée ✓' : 'Copier'}
    </button>
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
