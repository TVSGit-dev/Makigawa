/**
 * Le profil d'une séance : une barre par bloc.
 *
 * La hauteur est l'intensité, la largeur le temps. On reconnaît une séance
 * d'un coup d'œil — un 30/30 fait un peigne, un sweet spot continu fait deux
 * plateaux — là où lire quinze lignes de notation demande un effort.
 *
 * Rien n'y est calculé : les blocs sont ceux de la séance, et les
 * pourcentages ceux qu'intervals.icu résoudra.
 */

import type { Block } from '../workouts/families'

/**
 * De l'intensité vers la hauteur.
 *
 * L'échelle est volontairement tassée en haut : sans cela, un sprint à 200 %
 * écraserait tout le reste de la séance contre le sol, et c'est précisément le
 * reste qu'on veut lire.
 */
function heightOf(percent: number): number {
  if (percent <= 100) return 18 + percent * 0.62
  return Math.min(100, 80 + (percent - 100) * 0.2)
}

/** Six paliers, du plus facile au plus dur. La couleur double la hauteur. */
function toneOf(percent: number): string {
  if (percent < 56) return 'tone-1'
  if (percent < 76) return 'tone-2'
  if (percent < 91) return 'tone-3'
  if (percent < 106) return 'tone-4'
  if (percent < 121) return 'tone-5'
  return 'tone-6'
}

type Props = {
  blocks: readonly Block[]
  /** Une description pour qui n'a pas l'image. */
  label?: string
}

export function Profile({ blocks, label }: Props) {
  if (blocks.length === 0) return null

  return (
    <div
      className="profile"
      role="img"
      aria-label={label ?? describeShape(blocks)}
    >
      {blocks.map((block, index) => (
        <span
          className={`profile-bar ${toneOf(block.percent)}`}
          key={index}
          style={{ flexGrow: block.seconds, height: `${heightOf(block.percent)}%` }}
        />
      ))}
    </div>
  )
}

/** Ce que le dessin montre, dit en toutes lettres. */
function describeShape(blocks: readonly Block[]): string {
  const total = Math.round(blocks.reduce((sum, block) => sum + block.seconds, 0) / 60)
  const hardest = Math.max(...blocks.map((block) => block.percent))
  return `Profil de la séance : ${blocks.length} blocs, ${total} minutes, jusqu’à ${hardest} % de FTP.`
}
