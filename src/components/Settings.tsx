/**
 * Les réglages, repliés.
 *
 * Tout ce qui servait à mettre l'app en place vit ici : les identifiants, et
 * l'état de l'installation sur ce téléphone. Ce sont des choses qu'on regarde
 * une fois, pas tous les matins — les laisser en évidence ferait de l'écran
 * d'accueil un tableau de bord technique plutôt qu'un plan d'entraînement.
 */

import { ConnectionCheck } from './ConnectionCheck'
import { StatusRow, type Tone } from './StatusRow'
import type { Credentials } from '../storage/credentials'

type Props = {
  credentials: Credentials | null
  onCredentialsChange: (credentials: Credentials | null) => void
  mode: string
  online: boolean
  offlineReady: boolean
  installed: boolean
  canPrompt: boolean
  onInstall: () => void
  buildLabel: string
}

export function Settings({
  credentials,
  onCredentialsChange,
  mode,
  online,
  offlineReady,
  installed,
  canPrompt,
  onInstall,
  buildLabel,
}: Props) {
  const installTone: Tone = installed ? 'ok' : canPrompt ? 'warn' : 'idle'

  return (
    <details className="settings">
      <summary>Réglages</summary>

      <ConnectionCheck credentials={credentials} onCredentialsChange={onCredentialsChange} />

      <section className="card">
        <h2>Ce téléphone</h2>

        <StatusRow
          label="Affichage"
          value={mode === 'standalone' ? 'App installée' : 'Onglet navigateur'}
          tone={mode === 'standalone' ? 'ok' : 'idle'}
          hint={
            mode === 'standalone'
              ? undefined
              : 'Ajoute Makigawa à l’écran d’accueil pour le plein écran.'
          }
        />
        <StatusRow
          label="Hors-ligne"
          value={offlineReady ? 'Prêt' : 'Mise en cache…'}
          tone={offlineReady ? 'ok' : 'warn'}
          hint={
            offlineReady
              ? 'L’app se lance même sans réseau.'
              : 'Le service worker termine la mise en cache, patiente quelques secondes.'
          }
        />
        <StatusRow
          label="Réseau"
          value={online ? 'En ligne' : 'Hors ligne'}
          tone={online ? 'ok' : 'warn'}
          hint={online ? undefined : 'Le calendrier affiché est celui de la dernière lecture.'}
        />
        <StatusRow
          label="Installation"
          value={installed ? 'Installée' : canPrompt ? 'Disponible' : 'Non proposée'}
          tone={installTone}
          hint={
            installed || canPrompt
              ? undefined
              : 'Chrome ne propose l’installation qu’une fois ses critères remplis, ou la masque si l’app est déjà installée. Sinon : menu ⋮ → Ajouter à l’écran d’accueil.'
          }
        />

        {!installed && canPrompt ? (
          <button className="button" onClick={onInstall}>
            Installer sur l’écran d’accueil
          </button>
        ) : null}

        <p className="muted small">Build du {buildLabel}</p>
      </section>
    </details>
  )
}
