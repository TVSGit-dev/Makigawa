import { useCallback, useState } from 'react'
import { ConnectionCheck } from './components/ConnectionCheck'
import { effectiveIntent, Freshness } from './components/Freshness'
import { Plan } from './components/Plan'
import { Settings } from './components/Settings'
import { loadCredentials, type Credentials } from './storage/credentials'
import { loadIntents, saveIntent, weeksBefore } from './storage/preferences'
import { mondayOf, toDayKey } from './calendar/dates'
import type { Intent } from './rules/intent'
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
  const [credentials, setCredentials] = useState<Credentials | null>(() => loadCredentials())

  const week = mondayOf(toDayKey(new Date()))
  const [intents, setIntents] = useState(() => loadIntents())
  const wanted: Intent = intents[week] ?? 'normal'
  // Le garde-fou du A.3 : le mode ambitieux ne tient pas trois semaines.
  const intent = effectiveIntent(wanted, weeksBefore(intents, week))

  const [fitness, setFitness] = useState<number | null>(null)
  const [fatigue, setFatigue] = useState<number | null>(null)

  const handleFitness = useCallback((ctl: number | null, atl: number | null) => {
    setFitness(ctl)
    setFatigue(atl)
  }, [])

  const handleInstall = () => void promptInstall()

  const chooseIntent = (choice: Intent) => setIntents(saveIntent(week, choice))

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
          <p className="muted small">
            Le calendrier dit <em>quoi</em>. L’app dit <em>quand</em> et <em>si</em>.
          </p>
        </div>
      </header>

      {credentials ? (
        <>
          <Freshness
            fitness={fitness}
            fatigue={fatigue}
            intent={intent}
            wanted={wanted}
            onIntentChange={chooseIntent}
          />

          <Plan credentials={credentials} intent={intent} onFitnessChange={handleFitness} />

          <Settings
            credentials={credentials}
            onCredentialsChange={setCredentials}
            mode={mode}
            online={online}
            offlineReady={offlineReady}
            installed={installed}
            canPrompt={canPrompt}
            onInstall={handleInstall}
            buildLabel={BUILD_LABEL}
          />
        </>
      ) : (
        <>
          <section className="card">
            <h2>Première fois</h2>
            <p className="muted">
              Makigawa lit ton calendrier intervals.icu et te dit, jour par jour, si une séance
              tombe bien. Il lui faut d’abord tes identifiants — ils restent sur ce téléphone.
            </p>
          </section>

          <ConnectionCheck credentials={credentials} onCredentialsChange={setCredentials} />
        </>
      )}
    </div>
  )
}
