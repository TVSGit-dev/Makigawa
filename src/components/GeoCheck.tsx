import { useState } from 'react'

type GeoState =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'ok'; latitude: number; longitude: number; accuracy: number }
  | { status: 'error'; message: string }

function describe(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Permission refusée. Autorise la localisation pour Bikeapp dans les paramètres du site.'
    case error.POSITION_UNAVAILABLE:
      return 'Position indisponible. Vérifie que le GPS du téléphone est activé.'
    case error.TIMEOUT:
      return 'Délai dépassé. En intérieur, le GPS peut mettre du temps à accrocher.'
    default:
      return error.message || 'Erreur inconnue.'
  }
}

/**
 * Le GPS est la brique de base d’une app vélo, et son comportement change entre
 * un onglet et une app installée : autant le vérifier dès le raccord.
 */
export function GeoCheck() {
  const [state, setState] = useState<GeoState>({ status: 'idle' })

  const locate = () => {
    if (!('geolocation' in navigator)) {
      setState({ status: 'error', message: 'Géolocalisation non supportée par ce navigateur.' })
      return
    }
    setState({ status: 'pending' })
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        setState({
          status: 'ok',
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        }),
      (error) => setState({ status: 'error', message: describe(error) }),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    )
  }

  return (
    <section className="card">
      <h2>Position</h2>
      <p className="muted">Vérifie que le téléphone accorde bien le GPS à l’app installée.</p>
      <button className="button" onClick={locate} disabled={state.status === 'pending'}>
        {state.status === 'pending' ? 'Recherche en cours…' : 'Tester le GPS'}
      </button>
      {state.status === 'ok' ? (
        <dl className="readout">
          <div>
            <dt>Latitude</dt>
            <dd>{state.latitude.toFixed(5)}</dd>
          </div>
          <div>
            <dt>Longitude</dt>
            <dd>{state.longitude.toFixed(5)}</dd>
          </div>
          <div>
            <dt>Précision</dt>
            <dd>{Math.round(state.accuracy)} m</dd>
          </div>
        </dl>
      ) : null}
      {state.status === 'error' ? <p className="error">{state.message}</p> : null}
    </section>
  )
}
