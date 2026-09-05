import { useState } from 'react'
import { Calendar } from './components/Calendar'
import { ConnectionCheck } from './components/ConnectionCheck'
import { WriteCheck } from './components/WriteCheck'
import { StatusRow, type Tone } from './components/StatusRow'
import { loadCredentials, type Credentials } from './storage/credentials'
import { useDisplayMode } from './pwa/useDisplayMode'
import { useInstallPrompt } from './pwa/useInstallPrompt'
import { useOnline } from './pwa/useOnline'
import { useServiceWorker } from './pwa/useServiceWorker'

const BUILD_LABEL = new Date(__BUILD_TIME__).toLocaleString('fr-BE', {
  dateStyle: 'short',
  timeStyle: 'short',
})

export default function App() {
  const mode = useDisplayMode()
  const online = useOnline()
  const { offlineReady, needRefresh, applyUpdate, dismissUpdate } = useServiceWorker()
  const { canPrompt, installed, promptInstall } = useInstallPrompt()
  const [installOutcome, setInstallOutcome] = useState<string | null>(null)
  const [credentials, setCredentials] = useState<Credentials | null>(() => loadCredentials())

  const handleInstall = async () => {
    const outcome = await promptInstall()
    if (outcome === 'dismissed') setInstallOutcome('Installation annulée.')
  }

  const swTone: Tone = offlineReady ? 'ok' : 'warn'
  const installTone: Tone = installed ? 'ok' : canPrompt ? 'warn' : 'idle'

  return (
    <div className="app">
      {needRefresh ? (
        <div className="update" role="status">
          <span>Une nouvelle version est disponible.</span>
          <div className="update-actions">
            <button className="button button-small" onClick={applyUpdate}>
              Mettre à jour
            </button>
            <button className="button button-small button-ghost" onClick={dismissUpdate}>
              Plus tard
            </button>
          </div>
        </div>
      ) : null}

      <header className="header">
        <img className="logo" src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="" />
        <div>
          <h1>Makigawa</h1>
          <p className="muted">Build du {BUILD_LABEL}</p>
        </div>
      </header>

      <section className="card">
        <h2>Raccord</h2>
        <p className="muted">État de l’installation sur ce téléphone.</p>
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
          tone={swTone}
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
        />
        <StatusRow
          label="Contexte sécurisé"
          value={window.isSecureContext ? 'HTTPS' : 'Non sécurisé'}
          tone={window.isSecureContext ? 'ok' : 'bad'}
          hint={
            window.isSecureContext
              ? undefined
              : 'Sans HTTPS, ni le GPS ni le mode hors-ligne ne fonctionnent.'
          }
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
          <button className="button" onClick={handleInstall}>
            Installer sur l’écran d’accueil
          </button>
        ) : null}
        {installOutcome ? <p className="muted">{installOutcome}</p> : null}
      </section>

      <ConnectionCheck credentials={credentials} onCredentialsChange={setCredentials} />

      <Calendar credentials={credentials} />

      <WriteCheck credentials={credentials} />

      <footer className="footer">
        <p className="muted">
          Lecture seule. Les séances se créent dans intervals.icu ; Makigawa lit le calendrier
          et décidera du moment.
        </p>
      </footer>
    </div>
  )
}
