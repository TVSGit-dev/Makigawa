/**
 * Forme, fatigue, fraîcheur — et ce qu'il y a derrière.
 *
 * Les trois nombres viennent d'intervals.icu. L'app les affiche, elle ne les
 * recalcule pas : c'est la première des règles du projet. Ce qu'elle ajoute est
 * l'explication — d'où ils sortent, et sur quelles journées.
 */

import { useState } from 'react'
import { allowedIntent, INTENTS, MAX_AMBITIOUS_WEEKS, type Intent } from '../rules/intent'
import type { UnloadChoice } from '../storage/decharge'
import { levelOf } from '../rules/scale'
import { shiftDayKey, type DayKey } from '../calendar/dates'
import type { DayRecord } from '../rules/types'

const ORDER: Intent[] = ['prudent', 'normal', 'ambitieux']

const DESCRIPTIONS: Record<Intent, string> = {
  prudent: 'Une seule séance de qualité, et on s’arrête tôt.',
  normal: 'Deux journées chargées par semaine, jamais deux d’affilée.',
  ambitieux: 'Trois journées chargées, et deux peuvent se suivre.',
}

/** Combien de jours d'histoire l'explication montre. */
const HISTORY_DAYS = 14

type Props = {
  fitness: number | null
  fatigue: number | null
  intent: Intent
  /** Ce que l'athlète a demandé, avant les garde-fous. */
  wanted: Intent
  /** Les journées observées, pour montrer d'où viennent les chiffres. */
  days: readonly DayRecord[]
  today: DayKey
  /** La nuit démentie fait passer la journée en prudent (E.12). */
  nightDenied: boolean
  /** La reprise du E.5 : elle force le mode, comme le démenti de nuit. */
  reprise: boolean
  daysSinceQuality: number | null
  /** La décharge du E.18, acceptée pour cette semaine. */
  unloading: boolean
  /** Le cycle 2:1 en propose une, et l'athlète n'a pas encore répondu. */
  unloadOffered: boolean
  onAnswerUnload: (choice: UnloadChoice | null) => void
  sleepScore: number | null
  onIntentChange: (intent: Intent) => void
  onDenyNight: () => void
}

export function Freshness({
  fitness,
  fatigue,
  intent,
  wanted,
  days,
  today,
  nightDenied,
  reprise,
  daysSinceQuality,
  unloading,
  unloadOffered,
  onAnswerUnload,
  sleepScore,
  onIntentChange,
  onDenyNight,
}: Props) {
  const [open, setOpen] = useState<'fitness' | 'fatigue' | 'freshness' | null>(null)
  const freshness = fitness !== null && fatigue !== null ? fitness - fatigue : null
  const forced = wanted !== intent

  const toggle = (which: 'fitness' | 'fatigue' | 'freshness') =>
    setOpen((current) => (current === which ? null : which))

  return (
    <section className="card">
      <h2>Où tu en es</h2>

      {/* Un seul chiffre en grand, et deux satellites. La fraîcheur est celui
          qui décide — c'est elle que le E.2 consulte, et c'est à elle qu'on
          répond « je peux y aller ? ». La lire de loin, sans chercher, vaut
          mieux que trois nombres à égalité qu'il faut comparer. */}
      <button
        className={`hero ${freshnessTone(freshness, intent)}`}
        onClick={() => toggle('freshness')}
        aria-expanded={open === 'freshness'}
      >
        <span className="hero-number">
          {freshness === null ? '—' : `${freshness > 0 ? '+' : ''}${Math.round(freshness)}`}
        </span>
        <span className="hero-label">Fraîcheur</span>
        <span className="hero-read">{readFreshness(freshness, INTENTS[intent].tsbFloor)}</span>
      </button>

      <div className="readout">
        <Value
          label="Forme"
          value={fitness}
          open={open === 'fitness'}
          onToggle={() => toggle('fitness')}
        />
        <Value
          label="Fatigue"
          value={fatigue}
          open={open === 'fatigue'}
          onToggle={() => toggle('fatigue')}
        />
      </div>

      {open ? <Explain which={open} days={days} today={today} intent={intent} /> : null}

      {open === null ? (
        <p className="muted small">
          Les trois chiffres viennent d’intervals.icu. Tape l’un d’eux pour voir d’où il sort.
        </p>
      ) : null}

      <Night denied={nightDenied} score={sleepScore} onDeny={onDenyNight} />

      <div className="segmented" role="group" aria-label="Intention de la semaine">
        {ORDER.map((option) => (
          <button
            key={option}
            className={option === wanted ? 'segment segment-on' : 'segment'}
            aria-pressed={option === wanted}
            onClick={() => onIntentChange(option)}
          >
            {option}
          </button>
        ))}
      </div>

      {/* Le mode choisi et le mode appliqué peuvent différer : quatre
          garde-fous peuvent durcir le premier. Le dire ici, sous les boutons,
          plutôt que dans un bandeau plus bas — sans quoi taper « ambitieux »
          semble ne rien faire du tout. */}
      <p className="muted small">
        {forced ? (
          <>
            <strong>
              Tu as choisi {wanted}, l’app tient {intent}
            </strong>{' '}
            — {whyForced({ nightDenied, reprise, unloading })}.
            <br />
          </>
        ) : null}
        {DESCRIPTIONS[intent]}
      </p>

      {unloadOffered ? (
        <div className="offer">
          <p className="offer-title">Tu as chargé deux semaines. On allège ?</p>
          <p className="muted small">
            Une semaine sur trois, moitié moins de travail à la même intensité. Ce n’est pas
            une pause : c’est là que l’adaptation se fait. Rien de retiré ne compte comme
            manqué.
          </p>
          <div className="offer-actions">
            <button className="button button-small" onClick={() => onAnswerUnload('acceptee')}>
              D’accord, on allège
            </button>
            <button
              className="button button-small button-quiet"
              onClick={() => onAnswerUnload('ecartee')}
            >
              Pas cette semaine
            </button>
          </div>
        </div>
      ) : null}

      {unloading ? (
        <p className="notice notice-soft">
          <strong>Semaine de décharge.</strong>
          <br />
          Une seule séance, moitié moins de travail, la même intensité. Les trajets
          continuent — on ne peut pas les arrêter, et ce n’est pas grave.{' '}
          <button className="link" onClick={() => onAnswerUnload(null)}>
            Finalement non
          </button>
        </p>
      ) : null}

      {reprise && !unloading ? (
        <p className="notice notice-soft">
          <strong>Tu reprends.</strong>
          <br />
          {daysSinceQuality !== null && daysSinceQuality < 42
            ? `${daysSinceQuality} jours`
            : 'Plus de deux semaines'}{' '}
          sans séance de qualité, donc la semaine passe en prudent : une seule séance,
          au niveau où tu t’étais arrêté. Ce n’est pas la forme qui manque, ce sont les
          tissus qui se réadaptent plus lentement que les muscles — les deux premières
          semaines de retour sont celles où l’on se blesse.
        </p>
      ) : null}

      {forced && !nightDenied && !reprise && !unloading ? (
        <p className="notice">
          <strong>Le mode ambitieux passe la main.</strong>
          <br />
          Il tient {MAX_AMBITIOUS_WEEKS} semaines d’affilée, pas plus, et celle-ci est la
          troisième. La surcharge ne devient un progrès que si on en sort — c’est la seule
          règle que l’app impose au lieu de la proposer. Elle repasse en {intent}.
        </p>
      ) : null}
    </section>
  )
}

/**
 * La fraîcheur en une phrase.
 *
 * Le chiffre seul ne veut rien dire à qui ne le pratique pas tous les jours.
 * La phrase dit ce qu'il implique — et elle est calée sur le plancher du mode,
 * donc elle change avec lui.
 */
function readFreshness(freshness: number | null, floor: number): string {
  if (freshness === null) return 'intervals.icu ne l’a pas encore donnée'
  if (freshness < floor) return 'sous le plancher : pas de séance de qualité aujourd’hui'
  if (freshness < floor / 2) return 'tu creuses — encore de la marge, mais pas beaucoup'
  if (freshness < 0) return 'tu creuses un peu, ce qui est le but d’une semaine de charge'
  if (freshness < 10) return 'tu es à l’équilibre'
  return 'tu es frais — c’est le moment d’en faire quelque chose'
}

/**
 * Pourquoi le mode appliqué n'est pas celui qu'on a choisi.
 *
 * Les quatre garde-fous ne se relâchent jamais, ils ne font que durcir : le
 * plus récemment déclenché a le dernier mot, et c'est celui qu'on nomme.
 */
function whyForced({
  nightDenied,
  reprise,
  unloading,
}: {
  nightDenied: boolean
  reprise: boolean
  unloading: boolean
}): string {
  if (unloading) return 'tu as accepté une semaine de décharge'
  if (nightDenied) return 'tu as démenti ta nuit'
  if (reprise) return 'tu reprends après deux semaines sans séance de qualité'
  return `le mode ambitieux ne tient que ${MAX_AMBITIOUS_WEEKS} semaines d’affilée`
}

function Value({
  label,
  value,
  signed = false,
  tone = '',
  open,
  onToggle,
}: {
  label: string
  value: number | null
  signed?: boolean
  tone?: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <button className={open ? 'value value-open' : 'value'} onClick={onToggle} aria-expanded={open}>
      <span className="value-label">{label}</span>
      <span className={`value-number ${tone}`}>{show(value, signed)}</span>
    </button>
  )
}

/**
 * D'où sort le chiffre.
 *
 * Les constantes de temps sont celles du modèle que tout le monde emploie —
 * 42 jours pour la forme, 7 pour la fatigue. L'app ne refait pas le calcul :
 * elle montre les journées qui l'alimentent, ce qui suffit à comprendre
 * pourquoi le chiffre monte ou descend.
 */
function Explain({
  which,
  days,
  today,
  intent,
}: {
  which: 'fitness' | 'fatigue' | 'freshness'
  days: readonly DayRecord[]
  today: DayKey
  intent: Intent
}) {
  const history = Array.from({ length: HISTORY_DAYS }, (_, index) => {
    const date = shiftDayKey(today, index - (HISTORY_DAYS - 1))
    return { date, load: days.find((day) => day.date === date)?.observedLoad ?? 0 }
  })

  const peak = Math.max(1, ...history.map((day) => day.load))
  const total = Math.round(history.reduce((sum, day) => sum + day.load, 0))
  const week = Math.round(
    history.slice(-7).reduce((sum, day) => sum + day.load, 0),
  )

  return (
    <div className="explain">
      <p className="explain-text">{TEXTS[which](INTENTS[intent].tsbFloor)}</p>

      <div className="history" role="img" aria-label={`Charge des ${HISTORY_DAYS} derniers jours`}>
        {history.map((day, index) => (
          <span
            className={`history-bar ${index >= HISTORY_DAYS - 7 ? 'history-recent' : ''}`}
            key={day.date}
            style={{ height: `${Math.max(3, (day.load / peak) * 100)}%` }}
            title={`${day.date} — ${Math.round(day.load)}`}
          />
        ))}
      </div>

      <p className="muted small">
        {total} de charge sur {HISTORY_DAYS} jours, dont <strong>{week}</strong> sur les
        sept derniers {week > 0 ? `— journée moyenne de niveau ${levelOf(week / 7)}` : ''}. Les
        barres roses sont la semaine écoulée, celle qui pèse sur ta fatigue.
      </p>
    </div>
  )
}

const TEXTS: Record<'fitness' | 'fatigue' | 'freshness', (floor: number) => string> = {
  fitness: () =>
    'La forme est une moyenne de ta charge sur environ six semaines. Elle monte lentement et redescend lentement : c’est ce que ton corps a fini par encaisser. Une semaine sans rien ne l’efface pas, mais deux mois de trajets seuls la plafonnent — les trajets entretiennent, ils ne construisent plus.',
  fatigue: () =>
    'La fatigue est la même moyenne, mais sur une semaine. Elle réagit vite : une grosse sortie la fait bondir le jour même, et elle retombe en quelques jours. C’est elle qui explique qu’on se sente lourd le lendemain d’une belle journée.',
  freshness: (floor) =>
    `La fraîcheur est simplement la forme moins la fatigue — la seule soustraction que l’app fasse elle-même. Positive, tu es reposé ; négative, tu creuses. En dessous de ${floor}, le mode en cours refuse les séances de qualité.`,
}

/**
 * Le démenti de nuit (E.12).
 *
 * L'app montre ce que la montre a mesuré et laisse un tap la contredire. Les
 * jours où les deux s'accordent, il n'y a rien à saisir.
 */
function Night({
  denied,
  score,
  onDeny,
}: {
  denied: boolean
  score: number | null
  onDeny: () => void
}) {
  return (
    <div className={denied ? 'night night-denied' : 'night'}>
      <p className="night-text">
        {score === null
          ? 'La montre n’a rien dit de ta nuit.'
          : `La montre donne ${Math.round(score)} à ta nuit.`}
        {denied ? ' Tu dis le contraire : la journée passe en prudent.' : null}
      </p>
      <button className="button button-small button-ghost" onClick={onDeny}>
        {denied ? 'Finalement ça va' : 'Ma nuit a été mauvaise'}
      </button>
    </div>
  )
}

function show(value: number | null, signed = false): string {
  if (value === null) return '—'
  const rounded = Math.round(value)
  return signed && rounded > 0 ? `+${rounded}` : String(rounded)
}

/**
 * La fraîcheur se colore par rapport au plancher du mode en cours, pas dans
 * l'absolu : c'est ce plancher qui décide si une séance de qualité tient.
 */
function freshnessTone(freshness: number | null, intent: Intent): string {
  if (freshness === null) return ''
  const floor = INTENTS[intent].tsbFloor
  if (freshness < floor) return 'value-bad'
  if (freshness < floor / 2) return 'value-warn'
  return 'value-ok'
}

/** Le mode réellement appliqué cette semaine, garde-fou compris. */
export function effectiveIntent(wanted: Intent, previousWeeks: readonly Intent[]): Intent {
  return allowedIntent(wanted, previousWeeks)
}
