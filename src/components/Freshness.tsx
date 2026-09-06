/**
 * Forme, fatigue, fraîcheur — et ce qu'il y a derrière.
 *
 * Les trois nombres viennent d'intervals.icu. L'app les affiche, elle ne les
 * recalcule pas : c'est la première des règles du projet. Ce qu'elle ajoute est
 * l'explication — d'où ils sortent, et sur quelles journées.
 */

import { useState } from 'react'
import { allowedIntent, INTENTS, MAX_AMBITIOUS_WEEKS, type Intent } from '../rules/intent'
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
        <Value
          label="Fraîcheur"
          value={freshness}
          signed
          tone={freshnessTone(freshness, intent)}
          open={open === 'freshness'}
          onToggle={() => toggle('freshness')}
        />
      </div>

      {open ? <Explain which={open} days={days} today={today} intent={intent} /> : null}

      {open === null ? (
        <p className="muted small">
          Les trois chiffres viennent d’intervals.icu. Tape l’un d’eux pour voir d’où il
          sort.
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

      <p className="muted small">{DESCRIPTIONS[intent]}</p>

      {forced && !nightDenied ? (
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
