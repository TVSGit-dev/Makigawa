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
import type { CalendarEvent } from '../api/intervals'
import type { Proposal } from '../rules/decide'
import type { Intent } from '../rules/intent'
import type { DayWeight } from '../rules/types'
import type { Ramp } from '../rules/ramp'
import type { Suggestion } from '../workouts/week'
import { toNotation, type Workout } from '../workouts/compose'
import { specsOf } from '../workouts/shape'
import { Strip, type StripDay } from './Strip'
import { STANDING_NAMES } from '../workouts/levels'
import { pointerFor } from '../workouts/zwift'
import { DISTANCES, paceFor, wattsOf } from '../rides/outing'
import { loadForDistance, pastWattsFor } from '../rides/history'
import { perDay, type Dose } from '../rules/dose'
import { SPREAD_DAYS, type Spread } from '../rules/spread'
import type { Activity } from '../api/intervals'
import {
  formatDayShort,
  formatDuration,
  parseDayKey,
  shiftDayKey,
  type DayKey,
} from '../calendar/dates'
import { Profile } from './Profile'
import { SessionCard, type DeleteState } from './SessionCard'
import { DayWeather } from './Weather'
import type { WeatherHour } from '../api/weather'
import type { Wardrobe as Closet } from '../rules/garments'

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

export type CalendarDay = StripDay & {
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
  /** La répartition d'intensité des quatorze derniers jours (E.29). */
  spread: Spread
  /** La FTP du profil, pour afficher les pourcentages en watts (E.23). */
  ftp: number | null
  /** L'historique, pour lire ce que les sorties ont réellement coûté (E.23). */
  activities: readonly Activity[]
  /** La prévision du trajet, sur les sept jours qu'elle couvre (E.31). */
  weather: readonly WeatherHour[]
  /** Ce que l'athlète possède, pour nommer ses pièces plutôt que des catégories. */
  wardrobe: Closet
  /** Vrai si l'athlète a écarté ou repoussé quelque chose (E.14). */
  refusing: boolean
  /** Ce que le report a donné, quand ce n'est pas ce qui était demandé (E.14). */
  slip: string | null
  removals: Record<string, DeleteState>
  /** Le jour ouvert sous la bande. Il vit dans `Plan`, comme tout le reste. */
  selected: DayKey
  onSelect: (date: DayKey) => void
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
  spread,
  ftp,
  activities,
  weather,
  wardrobe,
  refusing,
  slip,
  removals,
  selected,
  onSelect,
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

      {/* La bande d'abord : c'est elle qui dit le rythme, et c'est pour elle
          qu'on ouvre l'app. Les mesures et la sortie longue viennent après. */}
      <Strip
        days={days}
        today={today}
        perDay={perDay(dose)}
        weather={weather}
        selected={selected}
        onSelect={onSelect}
        onCommute={onCommute}
      />

      <div className="legend">
        <span>
          <i className="swatch swatch-electric" /> électrique
        </span>
        <span>
          <i className="swatch swatch-muscular" /> musculaire
        </span>
        <span>
          <i className="swatch swatch-proposed" /> proposé
        </span>
        <span>
          <i className="swatch swatch-charged" /> chargée
        </span>
        <span>
          <i className="swatch swatch-target" /> objectif/jour
        </span>
      </div>

      <DaySheet
        day={days.find((one) => one.date === selected) ?? days[0]!}
        today={today}
        intent={intent}
        ftp={ftp}
        weather={weather}
        wardrobe={wardrobe}
        horizonEnd={days.at(-1)?.date ?? today}
        first={first?.date === selected}
        removals={removals}
        onRefuse={onRefuse}
        onPostpone={onPostpone}
        onDelete={onDelete}
      />

      {/* Le report n'a pas donné le jour demandé. Le dire est le prix d'un
          plancher qui n'est pas un rendez-vous (E.14). */}
      {slip ? <p className="notice small">{slip}</p> : null}

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

      {ramp ? <RampLine ramp={ramp} /> : null}

      <DoseBlock dose={dose} />

      <SpreadBlock spread={spread} />

      <Outing ftp={ftp} activities={activities} />
    </>
  )
}

/**
 * Ce que porte le jour choisi dans la bande (9 septembre 2026).
 *
 * La liste verticale montrait les quatorze jours dépliés ; la bande les montre
 * repliés et n'en ouvre qu'un. Rien n'est perdu — les séances réelles, leur
 * suppression par appui long, la proposition et ses refus vivent tous ici.
 *
 * Un jour vide n'est pas une page blanche : il dit qu'il reste de la place,
 * ce qui est une information et jamais un reproche (E.6).
 */
function DaySheet({
  day,
  today,
  intent,
  ftp,
  weather,
  wardrobe,
  horizonEnd,
  first,
  removals,
  onRefuse,
  onPostpone,
  onDelete,
}: {
  day: CalendarDay
  today: DayKey
  intent: Intent
  ftp: number | null
  weather: readonly WeatherHour[]
  wardrobe: Closet
  /** Le dernier jour de la bande : la liste de report s'y arrête (E.14). */
  horizonEnd: DayKey
  first: boolean
  removals: Record<string, DeleteState>
  onRefuse: (familyKey: string) => void
  onPostpone: (date: DayKey) => void
  onDelete: (eventId: string) => void
}) {
  const vide = day.items.length === 0 && day.suggestion === null

  return (
    <section className="sheet">
      <p className="sheet-head">
        <span className="sheet-when">
          {day.date === today ? 'Aujourd’hui' : formatDayShort(day.date)}
        </span>
        <Load weight={day.weight} />
      </p>

      <DayWeather
        hours={weather}
        date={day.date}
        commute={day.commute}
        wardrobe={wardrobe}
      />

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
          first={first}
          ftp={ftp}
          today={today}
          horizonEnd={horizonEnd}
          onRefuse={onRefuse}
          onPostpone={onPostpone}
        />
      ) : null}

      {vide ? (
        <p className="muted small sheet-empty">
          Rien ce jour-là. C’est de la place, pas un manque.
        </p>
      ) : null}
    </section>
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
  today,
  horizonEnd,
  onRefuse,
  onPostpone,
}: {
  suggestion: Suggestion
  first: boolean
  ftp: number | null
  today: DayKey
  /** Le dernier jour de l'horizon : repousser au-delà ne proposerait rien. */
  horizonEnd: DayKey
  onRefuse: (familyKey: string) => void
  onPostpone: (date: DayKey) => void
}) {
  const [picking, setPicking] = useState(false)
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
          (E.23). En tableau depuis le 9 septembre : les mêmes intitulés au même
          endroit d'une séance à l'autre, et l'œil va droit au chiffre qui a
          changé. */}
      <dl className="specs">
        {specsOf(suggestion.workout, ftp).map((spec) => (
          <div className="spec" key={spec.label}>
            <dt>{spec.label}</dt>
            <dd>
              {spec.value}
              {spec.note ? <small>{spec.note}</small> : null}
            </dd>
          </div>
        ))}
      </dl>

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
            placées par rapport à elle (E.14).

            Deux gestes depuis le 9 septembre. Le geste unique ne repoussait que
            d'un jour et se répétait : atteindre samedi depuis un mardi
            demandait quatre taps, et rien ne disait où l'on en était. */}
        {first ? (
          <>
            <button
              className="button button-small button-quiet"
              onClick={() => onPostpone(shiftDayKey(suggestion.date, 1))}
            >
              {/* « Demain » à côté d'une séance proposée jeudi serait un
                  mensonge : le libellé nomme alors le jour réel. */}
              {suggestion.date === today
                ? 'Demain'
                : dayName(shiftDayKey(suggestion.date, 1))}
            </button>

            <button
              className="button button-small button-quiet"
              aria-expanded={picking}
              onClick={() => setPicking((open) => !open)}
            >
              Un autre jour
            </button>
          </>
        ) : null}
      </div>

      {first && picking ? (
        <DayPicker
          from={shiftDayKey(suggestion.date, 2)}
          to={horizonEnd}
          onPick={(date) => {
            setPicking(false)
            onPostpone(date)
          }}
        />
      ) : null}
    </article>
  )
}

/** « MER 16 » — le jour, tel qu'il tient sur une pastille. */
function dayName(date: DayKey): string {
  const parsed = parseDayKey(date)
  if (!parsed) return date
  return parsed.toLocaleDateString('fr-BE', { weekday: 'long' })
}

/**
 * La liste des jours où reporter (E.14, révisé le 9 septembre 2026).
 *
 * Elle part du surlendemain : le lendemain a déjà son bouton, et le proposer
 * deux fois n'ajoute rien. Elle s'arrête au bout de l'horizon, parce qu'au-delà
 * le planificateur n'a rien à placer et qu'un jour qu'on peut choisir sans effet
 * est pire qu'un jour absent.
 */
function DayPicker({
  from,
  to,
  onPick,
}: {
  from: DayKey
  to: DayKey
  onPick: (date: DayKey) => void
}) {
  const days: DayKey[] = []
  for (let day = from; day <= to; day = shiftDayKey(day, 1)) days.push(day)

  if (days.length === 0) {
    return (
      <p className="muted small">
        L’horizon s’arrête là : il n’y a pas de jour plus loin où la poser.
      </p>
    )
  }

  return (
    <div className="picker">
      <p className="muted small">Repousser jusqu’à :</p>
      <div className="picker-days">
        {days.map((date) => {
          const parsed = parseDayKey(date)
          return (
            <button
              className="picker-day"
              key={date}
              onClick={() => onPick(date)}
              aria-label={`Repousser jusqu’à ${formatDayShort(date)}`}
            >
              <b>
                {parsed
                  ?.toLocaleDateString('fr-BE', { weekday: 'short' })
                  .replace('.', '')
                  .slice(0, 3) ?? '—'}
              </b>
              {Number(date.slice(-2))}
            </button>
          )
        })}
      </div>
    </div>
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
 * La répartition d'intensité (E.29).
 *
 * **Un constat, jamais une cible.** La recherche ne tranche pas entre polarisé
 * et pyramidal, donc l'app ne dit pas laquelle viser. Ce qu'elle montre est le
 * piège réel du cycliste peu disponible : que tout devienne modéré — jamais
 * assez facile pour récupérer, jamais assez dur pour progresser.
 */
function SpreadBlock({ spread }: { spread: Spread }) {
  if (!spread.shares) return null

  const parts = [
    { key: 'easy' as const, label: 'facile' },
    { key: 'moderate' as const, label: 'modéré' },
    { key: 'hard' as const, label: 'dur' },
  ]

  return (
    <div className="dose">
      <p className="now-label">Où est passé l’effort</p>

      <p className="spread-line">
        {parts.map((part, index) => (
          <span key={part.key}>
            {index > 0 ? <span className="muted"> · </span> : null}
            <span className="spread-number">{spread.shares![part.key]} %</span>
            <span className="muted"> {part.label}</span>
          </span>
        ))}
      </p>

      <span
        className="dose-bar"
        role="img"
        aria-label={parts
          .map((part) => `${spread.shares![part.key]} % ${part.label}`)
          .join(', ')}
      >
        {parts.map((part) => (
          <span
            className={`spread-fill spread-${part.key}`}
            key={part.key}
            style={{ width: `${spread.shares![part.key]}%` }}
          />
        ))}
      </span>

      <p className="muted small">
        Sous 150 bpm, entre 150 et 175, au-dessus — lu sur {spread.days} journée
        {spread.days > 1 ? 's' : ''} des {SPREAD_DAYS} derniers jours. C’est un constat, pas
        un objectif : la recherche ne dit pas quelle répartition viser.
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
      className="button button-small"
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
