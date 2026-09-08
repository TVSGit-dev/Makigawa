/**
 * Tout le catalogue, ouvert (section 5, E.27).
 *
 * L'athlète ne voyait jamais que ce qui lui était proposé. Les onze familles
 * existent, l'app en connaît le rôle, et rien de tout cela ne lui était
 * accessible.
 *
 * C'est le E.7 poussé d'un cran : l'app propose, l'athlète confirme — et s'il
 * n'est d'accord avec rien, il choisit lui-même au lieu de refuser trois fois.
 *
 * **Ce n'est pas un éditeur de séance** : rien ne s'y compose et rien ne s'y
 * écrit. On y lit ce que l'app sait déjà, dans l'ordre où elle le sait.
 */

import { FAMILIES } from '../workouts/families'
import {
  composeAtLevel,
  FLAT_ZONE,
  nextLevel,
  zoneOfFamily,
  ZONE_NAMES,
  type Zone,
} from '../workouts/levels'
import { shapeOf } from '../workouts/shape'
import { pointerFor } from '../workouts/zwift'
import { formatDuration } from '../calendar/dates'

type Props = {
  /** Les niveaux tenus zone par zone (E.16). */
  levels: Record<Zone, number>
  /** La FTP du profil, pour lire les pourcentages en watts (E.23). */
  ftp: number | null
}

export function Catalogue({ levels, ftp }: Props) {
  return (
    <details className="catalogue">
      <summary>Tout ce qu’elle sait proposer</summary>

      <p className="muted small">
        Les {FAMILIES.length} familles, avec ce que chacune construit et où la chercher dans
        Zwift. La dose montrée est celle qu’elle proposerait aujourd’hui, d’après ce que tu
        as tenu dans la zone.
      </p>

      <ul className="catalogue-list">
        {FAMILIES.map((family) => {
          const zone = zoneOfFamily(family.key)
          const held = zone ? levels[zone] : 0
          const workout = composeAtLevel(family, nextLevel(held, false, zone))
          const pointer = pointerFor(workout)

          return (
            <li className="catalogue-item" key={family.key}>
              <p className="catalogue-name">
                {family.name}
                <span className="suggested-dose">
                  {' · '}
                  {formatDuration(workout.seconds)}
                </span>
              </p>
              <p className="catalogue-purpose">{family.purpose}</p>

              <ul className="shape">
                {shapeOf(workout, ftp).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>

              {/* Le niveau tenu situe la famille sans rien reprocher : zéro
                  veut dire « rien encore », pas « en retard ». La récupération
                  n'en a pas — elle ne se compte pas (E.25) — et une zone qui
                  porte le nom de sa famille ne se répète pas. */}
              {zone && zone !== FLAT_ZONE ? (
                <p className="catalogue-zone">
                  {[
                    ZONE_NAMES[zone] === family.name ? null : ZONE_NAMES[zone],
                    held > 0 ? `niveau ${held} tenu` : 'rien de tenu encore',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              ) : null}

              {pointer ? (
                <p className="pointer">
                  <span className="pointer-path">Zwift → Workouts → {pointer.collection}</span>
                  <span className="pointer-hint">{pointer.hint}</span>
                </p>
              ) : null}
            </li>
          )
        })}
      </ul>
    </details>
  )
}
