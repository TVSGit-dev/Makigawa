import { useState } from 'react'
import { fetchRecentActivities } from '../api/intervals'
import { clearCredentials, saveCredentials, type Credentials } from '../storage/credentials'

type TestState =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'ok'; count: number }
  | { status: 'error'; title: string; detail: string }

type Props = {
  credentials: Credentials | null
  /** Les identifiants vivent dans App : le calendrier en dépend aussi. */
  onCredentialsChange: (credentials: Credentials | null) => void
}

export function ConnectionCheck({ credentials: stored, onCredentialsChange }: Props) {
  const [athleteId, setAthleteId] = useState(stored?.athleteId ?? '')
  const [apiKey, setApiKey] = useState(stored?.apiKey ?? '')
  const [saved, setSaved] = useState(stored !== null)
  const [state, setState] = useState<TestState>({ status: 'idle' })

  const test = async () => {
    const credentials = { athleteId: athleteId.trim(), apiKey: apiKey.trim() }
    if (!credentials.athleteId || !credentials.apiKey) {
      setState({
        status: 'error',
        title: 'Champs incomplets',
        detail: 'Renseigne l’identifiant athlète et la clé API.',
      })
      return
    }

    setState({ status: 'pending' })
    setSaved(saveCredentials(credentials))
    const outcome = await fetchRecentActivities(credentials)

    switch (outcome.kind) {
      case 'ok':
        setState({ status: 'ok', count: outcome.data.length })
        // Seule une connexion établie fait charger le calendrier : inutile
        // de le lancer sur des identifiants qu'intervals.icu vient de refuser.
        onCredentialsChange(credentials)
        break
      case 'unauthorized':
        setState({
          status: 'error',
          title: 'Clé refusée',
          detail:
            'intervals.icu a répondu, mais rejette ces identifiants. Vérifie la clé et l’identifiant athlète (de la forme i123456).',
        })
        break
      case 'httpError':
        setState({
          status: 'error',
          title: `Erreur HTTP ${outcome.status}`,
          detail: outcome.detail || 'intervals.icu a répondu, mais pas ce qui était attendu.',
        })
        break
      case 'blocked':
        setState({
          status: 'error',
          title: 'Appel bloqué par le navigateur',
          detail: `intervals.icu n’autorise pas les appels directs depuis une page web (CORS). Il faudra un petit relais. Détail : ${outcome.detail}`,
        })
        break
    }
  }

  const forget = () => {
    clearCredentials()
    setAthleteId('')
    setApiKey('')
    setSaved(false)
    setState({ status: 'idle' })
    onCredentialsChange(null)
  }

  return (
    <section className="card">
      <h2>intervals.icu</h2>
      <p className="muted">
        Saisis une fois tes identifiants : ils restent sur ce téléphone et ne sont envoyés qu’à
        intervals.icu.
      </p>

      <label className="field">
        <span>Identifiant athlète</span>
        <input
          value={athleteId}
          onChange={(event) => setAthleteId(event.target.value)}
          placeholder="i123456"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          inputMode="text"
        />
      </label>

      <label className="field">
        <span>Clé API</span>
        <input
          type="password"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          placeholder="••••••••"
          autoComplete="off"
          spellCheck={false}
        />
      </label>

      <button className="button" onClick={test} disabled={state.status === 'pending'}>
        {state.status === 'pending' ? 'Test en cours…' : 'Tester la connexion'}
      </button>

      {state.status === 'ok' ? (
        <p className="success">
          Connexion établie — {state.count} activité{state.count > 1 ? 's' : ''} sur les 7 derniers
          jours.
        </p>
      ) : null}

      {state.status === 'error' ? (
        <p className="error">
          <strong>{state.title}</strong>
          <br />
          {state.detail}
        </p>
      ) : null}

      {saved ? (
        <button className="button button-small button-ghost" onClick={forget}>
          Oublier les identifiants
        </button>
      ) : null}
    </section>
  )
}
