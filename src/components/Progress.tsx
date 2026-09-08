/**
 * Où l'athlète en est, zone par zone (section 5, E.15 et E.16).
 *
 * Deux choses, et une qui manque volontairement.
 *
 * Ce qu'on montre : les **niveaux atteints**, qui répondent à « pour
 * m'améliorer » de façon vérifiable, et **ce qui a été fait** — les séances
 * tenues et allégées.
 *
 * Ce qu'on ne montre pas : les séances absentes. C'est la contrainte
 * d'interface prise au mot — une séance abandonnée disparaît, elle ne laisse
 * pas de trace rouge, et un compteur d'assiduité serait exactement cette
 * trace. Elles servent en interne, à ne pas faire monter un niveau qu'on n'a
 * pas gagné.
 */

import type { Completion } from '../rules/done'
import type { Refusal } from '../rules/decide'
import { countByReason, JOURNAL_DAYS, type Journal } from '../storage/journal'
import { AFTER, BEFORE, mobilitySeconds, ROUTINE, STRENGTH, type Movement } from '../workouts/mobility'
import { LEVELS, ZONE_NAMES, ZONES, type Zone } from '../workouts/levels'
import { formatDay, shiftDayKey, type DayKey } from '../calendar/dates'

/** Ce qu'on montre du passé : deux semaines, pas les six qu'on lit. */
const SHOWN_DAYS = 14

type Props = {
  levels: Record<Zone, number>
  completions: readonly Completion[]
  today: DayKey
  /** Ce que les règles ont écarté ces trente derniers jours (E.21). */
  journal: Journal
}

/**
 * La reprise n'est pas annoncée ici mais dans l'en-tête, avec le mode qu'elle
 * force : la dire deux fois dans le même écran serait insister.
 */
export function Progress({ levels, completions, today, journal }: Props) {
  const reached = ZONES.filter((zone) => levels[zone] > 0)

  const shown = completions
    .filter((one) => one.outcome !== 'absente')
    .filter((one) => one.date >= shiftDayKey(today, -SHOWN_DAYS))
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <section className="card">
      <h2>Ce que tu construis</h2>

      {reached.length === 0 ? (
        <p className="muted small">
          Aucun niveau encore. Ils montent à la première séance tenue — l’app relit ce que
          tu as fait, tu n’as rien à cocher.
        </p>
      ) : (
        <div className="zones">
          {reached.map((zone) => (
            <div className="zone" key={zone}>
              <p className="zone-name">
                {ZONE_NAMES[zone]} <span className="zone-level">niveau {levels[zone]}</span>
              </p>
              <Rungs level={levels[zone]} />
            </div>
          ))}
        </div>
      )}

      {reached.length > 0 ? (
        <p className="muted small">
          Lu sur la plus grosse séance de chaque zone que tu as tenue ces six dernières
          semaines. La suivante vise un cran au-dessus.
        </p>
      ) : null}

      <Refusals journal={journal} />

      <Mobility />

      {shown.length > 0 ? (
        <details className="structure">
          <summary>Ce que tu as fait — {shown.length} séance{shown.length > 1 ? 's' : ''}</summary>
          <ul className="held">
            {shown.map((one) => (
              <li className="held-row" key={`${one.date}-${one.event.id ?? one.event.name}`}>
                <span className="held-day">{formatDay(one.date)}</span>
                <span className="held-name">{one.event.name ?? 'Séance'}</span>
                {one.outcome === 'allegee' ? (
                  <span className="held-mark">allégée</span>
                ) : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  )
}

/**
 * Ce que les règles ont écarté (E.21).
 *
 * De l'instrumentation sur l'app, jamais sur l'athlète : on n'y lit aucune
 * séance manquée, seulement des décisions que Makigawa a prises. C'est ce qui
 * permettra de dire, dans deux semaines, si la condition 2 du E.2 — retenue
 * avec réserve — bloque vraiment trop souvent.
 */
function Refusals({ journal }: { journal: Journal }) {
  const counts = countByReason(journal)
  if (counts.length === 0) return null

  const total = counts.reduce((sum, one) => sum + one.times, 0)

  return (
    <details className="structure">
      <summary>
        Ce que j’ai écarté — {total} fois en {JOURNAL_DAYS} jours
      </summary>
      <ul className="held">
        {counts.map(({ code, times }) => (
          <li className="held-row" key={code}>
            <span className="held-day">{times}×</span>
            <span className="held-name">{REASONS[code]}</span>
          </li>
        ))}
      </ul>
      <p className="muted small">
        Ce sont mes décisions, pas tes manquements — de quoi corriger un seuil qui bloquerait
        trop souvent plutôt que de le deviner.
      </p>
    </details>
  )
}

/** Chaque motif en trois mots. La phrase entière vit dans `reasons.ts`. */
const REASONS: Record<Refusal['code'], string> = {
  'jour-deja-charge': 'la journée était déjà chargée',
  'veille-chargee': 'la veille avait été chargée',
  'deux-jours-charges': 'les deux jours d’avant pesaient déjà',
  'lendemain-charge': 'le lendemain est chargé',
  'tsb-sous-plancher': 'la fraîcheur était sous le plancher',
  'variabilite-basse': 'la variabilité était sous la normale',
  'quota-hebdomadaire': 'le quota de la semaine était atteint',
  'une-seule-par-semaine': 'le mode prudent n’en garde qu’une',
  'qualite-voisine': 'une autre séance de qualité était trop proche',
  'force-trop-proche': 'du renfo était trop proche',
  'renfo-sur-journee-chargee': 'du renfo sur une journée chargée',
}

/**
 * La souplesse (E.13), en lecture.
 *
 * Le psoas et l'iliaque sont raccourcis à chaque coup de pédale et ne
 * s'allongent jamais pendant la sortie. Depuis le E.19 l'app ne pose plus
 * cette séance ; elle la montre, ce qui suffit — c'est une routine à faire,
 * pas un événement à planifier.
 */
function Mobility() {
  const minutes = Math.round(mobilitySeconds() / 60)

  return (
    <details className="structure">
      <summary>
        Ta souplesse — {ROUTINE.length} mouvements, {minutes} min
      </summary>
      <div className="routine">
        <Moves title="AVANT (mobilité, on bouge)" movements={BEFORE} />
        <Moves title="APRÈS (tenues longues, 60 à 90 s)" movements={AFTER} />
        <Moves title="RENFORCEMENT (sans lui, le reste ne tient pas)" movements={STRENGTH} />
      </div>
    </details>
  )
}

function Moves({ title, movements }: { title: string; movements: readonly Movement[] }) {
  return (
    <div className="routine-part">
      <p className="now-label">{title}</p>
      {movements.map((move) => (
        <div className="routine-move" key={move.name}>
          <p className="routine-name">
            {move.name}{' '}
            <span className="muted">
              — {move.seconds}s{move.bothSides ? ' par côté' : ''}
            </span>
          </p>
          <p className="routine-how muted small">{move.how}</p>
        </div>
      ))}
    </div>
  )
}

/** Dix crans, dont ceux atteints. La couleur dit où on en est, pas un score. */
function Rungs({ level }: { level: number }) {
  return (
    <span className="rungs" role="img" aria-label={`Niveau ${level} sur ${LEVELS}`}>
      {Array.from({ length: LEVELS }, (_, index) => (
        <span className={index < level ? 'rung rung-on' : 'rung'} key={index} />
      ))}
    </span>
  )
}
