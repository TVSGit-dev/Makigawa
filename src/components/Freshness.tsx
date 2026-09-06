/**
 * Forme, fatigue, fraîcheur — et le curseur d'intention.
 *
 * Les trois nombres viennent d'intervals.icu. L'app les affiche, elle ne les
 * recalcule pas : c'est la première des règles du projet.
 */

import { allowedIntent, INTENTS, MAX_AMBITIOUS_WEEKS, type Intent } from '../rules/intent'

const ORDER: Intent[] = ['prudent', 'normal', 'ambitieux']

const DESCRIPTIONS: Record<Intent, string> = {
  prudent: 'Une seule séance de qualité, et on s’arrête tôt.',
  normal: 'Deux journées chargées par semaine, jamais deux d’affilée.',
  ambitieux: 'Trois journées chargées, et deux peuvent se suivre.',
}

type Props = {
  fitness: number | null
  fatigue: number | null
  intent: Intent
  /** Ce que l'athlète a demandé, avant le garde-fou des deux semaines. */
  wanted: Intent
  onIntentChange: (intent: Intent) => void
}

export function Freshness({ fitness, fatigue, intent, wanted, onIntentChange }: Props) {
  const freshness = fitness !== null && fatigue !== null ? fitness - fatigue : null
  const forced = wanted !== intent

  return (
    <section className="card">
      <h2>Où tu en es</h2>

      <div className="readout">
        <div>
          <dt>Forme</dt>
          <dd>{show(fitness)}</dd>
        </div>
        <div>
          <dt>Fatigue</dt>
          <dd>{show(fatigue)}</dd>
        </div>
        <div>
          <dt>Fraîcheur</dt>
          <dd className={freshnessTone(freshness, intent)}>{show(freshness, true)}</dd>
        </div>
      </div>

      <p className="muted small">
        Les trois chiffres viennent d’intervals.icu. Makigawa les lit, elle ne les calcule
        jamais.
      </p>

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

      {forced ? (
        <p className="notice">
          <strong>Le mode ambitieux passe la main.</strong>
          <br />
          Il tient {MAX_AMBITIOUS_WEEKS} semaines d’affilée, pas plus, et cette semaine est la
          troisième. La surcharge ne devient un progrès que si on en sort — c’est la seule
          règle que l’app impose au lieu de la proposer. Elle repasse en {intent}.
        </p>
      ) : null}
    </section>
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
