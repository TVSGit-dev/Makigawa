/**
 * Le plan des deux prochaines semaines (section 5, E.10, E.14, E.19, E.20).
 *
 * Depuis le 7 septembre, **c'est le produit**, plus une antichambre. Le plan
 * vit ici : Makigawa le tient, le montre, et le corrige à chaque lecture
 * d'intervals.icu. Il ne part nulle part.
 *
 * Ce que l'athlète peut encore faire dessus n'écrit rien non plus : **« pas
 * celle-ci »** écarte la famille, **« plus tard »** repousse le jour, et le
 * plan se recalcule en entier autour (E.14).
 */

import type { Suggestion } from '../workouts/week'
import type { Ramp } from '../rules/ramp'
import { toNotation } from '../workouts/compose'
import { formatDuration, formatRelativeDay, type DayKey } from '../calendar/dates'
import { Profile } from './Profile'

type Props = {
  suggestions: readonly Suggestion[]
  /** La forme d'intervals.icu, affichée pour dire sur quoi le choix repose. */
  fitness: number | null
  /** La vitesse à laquelle la forme monte, et son plafond (E.20). */
  ramp: Ramp | null
  today: DayKey
  /** Vrai si l'athlète a écarté ou repoussé quelque chose (E.14). */
  refusing: boolean
  onRefuse: (familyKey: string) => void
  onPostpone: (date: DayKey) => void
  onReset: () => void
}

export function Week({
  suggestions,
  fitness,
  ramp,
  today,
  refusing,
  onRefuse,
  onPostpone,
  onReset,
}: Props) {
  if (suggestions.length === 0) {
    // Tout a été écarté. L'app ne va pas repêcher une famille refusée pour
    // avoir quelque chose à montrer — mais elle laisse toujours le retour.
    return refusing ? (
      <div className="week">
        <p className="place-title">Plus rien à proposer</p>
        <p className="muted small">
          Tu as écarté ce qui restait ouvert à ta forme. C’est une réponse valable — et elle
          se défait quand tu veux.
        </p>
        <button className="button button-small button-ghost" onClick={onReset}>
          Reprends tes propositions
        </button>
      </div>
    ) : (
      <div className="week">
        <p className="muted small">
          Rien à proposer pour l’instant : soit la fraîcheur est trop basse, soit les jours à
          venir sont déjà pris. L’app en propose moins plutôt que de proposer mal.
        </p>
      </div>
    )
  }

  // Le report ne s'offre que sur la première : les suivantes sont placées par
  // rapport à elle, donc c'est elle qui commande la fenêtre (E.14).
  const first = suggestions.reduce((earliest, one) => (one.date < earliest.date ? one : earliest))

  return (
    <div className="week">
      <p className="place-title">Ce que je te propose</p>

      <p className="muted small">
        {fitness === null
          ? 'Choisi sur ce qui est déjà prévu.'
          : `Choisi sur ta forme (${Math.round(fitness)}) et ce qui est déjà prévu.`}{' '}
        Le plan vit ici : rien n’est écrit dans intervals.icu.
      </p>

      {ramp ? <RampLine ramp={ramp} /> : null}

      {refusing ? (
        <p className="muted small">
          Ce plan tient compte de ce que tu as écarté.{' '}
          <button className="link" onClick={onReset}>
            Tout remettre
          </button>
        </p>
      ) : null}

      {suggestions.map((suggestion) => (
        <article className="suggested" key={suggestion.date}>
          <p className="suggested-day">{formatRelativeDay(suggestion.date, today)}</p>
          <p className="suggested-name">{suggestion.workout.name}</p>
          <p className="suggested-why">{suggestion.because}</p>

          <Profile blocks={suggestion.workout.blocks} />

          <details className="structure">
            <summary>La structure — {formatDuration(suggestion.workout.seconds)}</summary>
            <pre>{toNotation(suggestion.workout)}</pre>
          </details>

          <div className="suggested-actions">
            <div className="suggested-refuse">
              <button
                className="button button-small button-quiet"
                onClick={() => onRefuse(suggestion.workout.family.key)}
              >
                Pas celle-ci
              </button>

              {suggestion.date === first.date ? (
                <button
                  className="button button-small button-quiet"
                  onClick={() => onPostpone(suggestion.date)}
                >
                  Plus tard
                </button>
              ) : null}
            </div>
          </div>
        </article>
      ))}
    </div>
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
        ? `Ta forme ne monte pas cette semaine (${rate} point${Math.abs(ramp.rate) >= 2 ? 's' : ''} sur sept jours). Il y a de la place pour en rajouter.`
        : `Ta forme monte de ${rate} par semaine ; le plafond est ${cap}.`}
      {holding
        ? ' On tient le niveau : on ne progresse pas en ajoutant à ce qui monte déjà.'
        : ''}
    </p>
  )
}
