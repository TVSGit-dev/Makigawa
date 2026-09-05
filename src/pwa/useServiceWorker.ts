import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export type ServiceWorkerState = {
  /** Les ressources sont en cache : l’app se lance sans réseau. */
  offlineReady: boolean
  /** Une nouvelle version est téléchargée et attend un rechargement. */
  needRefresh: boolean
  /** Active la nouvelle version et recharge la page. */
  applyUpdate: () => void
  /** Masque la bannière de mise à jour sans l’appliquer. */
  dismissUpdate: () => void
}

export function useServiceWorker(): ServiceWorkerState {
  // L’appel enregistre le service worker ; on ne garde que `needRefresh`.
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  const [offlineReady, setOfflineReady] = useState(false)

  // Le `offlineReady` de useRegisterSW n’est pas un état mais un événement :
  // il ne passe à vrai qu’au moment où un service worker s’installe, donc à la
  // toute première visite. Aux lancements suivants plus rien ne s’installe, et
  // l’app affichait « Mise en cache… » indéfiniment alors que le cache était
  // en place. On interroge donc le navigateur, seul à connaître l’état réel :
  // `ready` se résout dès qu’un service worker est actif — tout de suite aux
  // lancements suivants, à la fin de l’installation à la première visite.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    let cancelled = false
    void navigator.serviceWorker.ready.then(() => {
      if (!cancelled) setOfflineReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return {
    offlineReady,
    needRefresh,
    applyUpdate: () => void updateServiceWorker(true),
    // Refuser une mise à jour ne change rien au fait que le cache est prêt :
    // seule la bannière disparaît.
    dismissUpdate: () => setNeedRefresh(false),
  }
}
