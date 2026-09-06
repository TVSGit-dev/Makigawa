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
import { LEVELS, ZONE_NAMES, ZONES, type Zone } from '../workouts/levels'
import { formatDay, shiftDayKey, type DayKey } from '../calendar/dates'

/** Ce qu'on montre du passé : deux semaines, pas les six qu'on lit. */
const SHOWN_DAYS = 14

type Props = {
  levels: Record<Zone, number>
  completions: readonly Completion[]
  today: DayKey
}

/**
 * La reprise n'est pas annoncée ici mais dans l'en-tête, avec le mode qu'elle
 * force : la dire deux fois dans le même écran serait insister.
 */
export function Progress({ levels, completions, today }: Props) {
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
