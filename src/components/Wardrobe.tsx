/**
 * Ma garde-robe (E.32, second temps).
 *
 * **L'app fournit les catégories, l'athlète fournit les pièces.** C'est la
 * seule répartition qui respecte sa consigne — *ne rien inventer, ne rien
 * proposer au hasard*. Les catégories sont celles que nomment les guides
 * d'habillement du cyclisme, et l'app s'en servait déjà avant cet écran ; ce
 * qu'il possède dans chacune, lui seul le sait.
 *
 * Trois réponses par catégorie, et la troisième compte autant que les deux
 * autres :
 *
 * - **il la nomme** — c'est son nom qui s'affichera dans le plan ;
 * - **il déclare ne pas l'avoir** — l'app cesse de la proposer, et le dit
 *   plutôt que de la taire ;
 * - **il ne dit rien** — la pièce garde son nom générique, ce qui est le
 *   comportement d'avant cet écran. Une garde-robe vide ne casse rien.
 *
 * **Ce n'est pas une liste de courses.** L'app ne conseille pas d'acheter ce
 * qui manque : elle n'a pas d'avis sur ce qu'il devrait posséder, seulement
 * sur ce qu'il fait froid.
 */

import { useState } from 'react'
import {
  GARMENTS,
  answered,
  isOwned,
  lacks,
  nameOf,
  type GarmentKey,
  type Part,
  type Wardrobe as Closet,
} from '../rules/garments'
import { forget, markMissing, nameGarment, NAME_MAX } from '../storage/wardrobe'

const PARTS: Record<Part, string> = {
  buste: 'Le haut',
  jambes: 'Le bas',
  extremites: 'Les extrémités',
  dessus: 'Par-dessus',
}

const ORDER: readonly Part[] = ['buste', 'jambes', 'extremites', 'dessus']

type Props = {
  wardrobe: Closet
  onChange: (wardrobe: Closet) => void
}

export function Wardrobe({ wardrobe, onChange }: Props) {
  const rempli = answered(wardrobe)

  return (
    <details className="wardrobe">
      <summary>
        Ma garde-robe
        <span className="muted small">
          {' '}
          — {rempli} sur {GARMENTS.length}
        </span>
      </summary>

      <p className="muted small">
        Ces catégories viennent des guides d’habillement du cyclisme, et l’app s’en sert
        déjà. Dis-lui laquelle de tes affaires remplit chacune, ou qu’elle te manque : elle
        cessera alors de te la proposer. Ce que tu laisses vide garde son nom générique.
      </p>

      {ORDER.map((part) => (
        <section className="closet" key={part}>
          <h3>{PARTS[part]}</h3>
          {GARMENTS.filter((one) => one.part === part).map((one) => (
            <Line
              key={one.key}
              garmentKey={one.key}
              what={one.what}
              generic={one.name}
              wardrobe={wardrobe}
              onChange={onChange}
            />
          ))}
        </section>
      ))}

      <p className="muted small">
        Rien de tout ceci ne quitte ce téléphone. L’app ne te dira jamais d’acheter ce qui
        manque : elle n’a pas d’avis sur ce que tu devrais posséder.
      </p>
    </details>
  )
}

function Line({
  garmentKey,
  what,
  generic,
  wardrobe,
  onChange,
}: {
  garmentKey: GarmentKey
  what: string
  generic: string
  wardrobe: Closet
  onChange: (wardrobe: Closet) => void
}) {
  const owned = isOwned(wardrobe, garmentKey)
  const missing = lacks(wardrobe, garmentKey)
  const [draft, setDraft] = useState(owned ? nameOf(wardrobe, garmentKey) : '')

  const save = () => {
    const next = draft.trim()
    onChange(next.length > 0 ? nameGarment(garmentKey, next) : forget(garmentKey))
  }

  return (
    <div className={missing ? 'piece piece-missing' : 'piece'}>
      <p className="piece-head">
        <strong>{generic}</strong>
        <span className="muted small">{what}</span>
      </p>

      {missing ? (
        <p className="piece-none">
          Tu n’en as pas — elle ne te sera plus proposée.{' '}
          <button
            className="link"
            onClick={() => {
              setDraft('')
              onChange(forget(garmentKey))
            }}
          >
            Revenir là-dessus
          </button>
        </p>
      ) : (
        <div className="piece-edit">
          <input
            type="text"
            value={draft}
            maxLength={NAME_MAX}
            placeholder="la tienne, comme tu l’appelles"
            aria-label={`Ta pièce pour : ${generic}`}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={save}
          />
          <button
            className="button button-small button-ghost"
            onClick={() => {
              setDraft('')
              onChange(markMissing(garmentKey))
            }}
          >
            Je n’en ai pas
          </button>
        </div>
      )}
    </div>
  )
}
