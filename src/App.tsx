import { useCallback, useState } from 'react'
import { ConnectionCheck } from './components/ConnectionCheck'
import { effectiveIntent, Freshness } from './components/Freshness'
import { Plan, type Readout } from './components/Plan'
import { Settings } from './components/Settings'
import { loadCredentials, type Credentials } from './storage/credentials'
import { loadIntents, saveIntent, weeksBefore } from './storage/preferences'
import { forgetNightsBefore, intentAfterNight, toggleDenial } from './storage/night'
import { intentAfterReprise } from './rules/done'
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

  const today = toDayKey(new Date())
  const week = mondayOf(today)
  const [intents, setIntents] = useState(() => loadIntents())
  const wanted: Intent = intents[week] ?? 'normal'

  const [nights, setNights] = useState(() => forgetNightsBefore(today))
  const nightDenied = nights.has(today)

  const [readout, setReadout] = useState<Readout>({
    fitness: null,
    fatigue: null,
    sleepScore: null,
    days: [],
    reprise: false,
    daysSinceQuality: null,
  })

  const handleReadout = useCallback((next: Readout) => setReadout(next), [])

  // Trois garde-fous se succèdent, chacun pouvant durcir le mode sans jamais
  // le relâcher : le A.3 borne le mode ambitieux à deux semaines, le E.12 fait
  // passer la journée en prudent si la nuit est démentie, et le E.5 fait de
  // même après quatorze jours sans séance de qualité.
  //
  // Ils se calculent ici, et non dans `Plan`, pour que le mode affiché soit
  // celui qui tourne : l'en-tête ne peut pas dire « normal » pendant que le
  // moteur travaille en prudent.
  const intent = intentAfterReprise(
    intentAfterNight(effectiveIntent(wanted, weeksBefore(intents, week)), nightDenied),
    readout.reprise,
  )

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
            fitness={readout.fitness}
            fatigue={readout.fatigue}
            intent={intent}
            wanted={wanted}
            days={readout.days}
            today={today}
            nightDenied={nightDenied}
            reprise={readout.reprise}
            daysSinceQuality={readout.daysSinceQuality}
            sleepScore={readout.sleepScore}
            onIntentChange={chooseIntent}
            onDenyNight={() => setNights(toggleDenial(today))}
          />

          <Plan credentials={credentials} intent={intent} onReadout={handleReadout} />

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
