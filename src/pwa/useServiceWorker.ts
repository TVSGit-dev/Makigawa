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
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  return {
    offlineReady,
    needRefresh,
    applyUpdate: () => void updateServiceWorker(true),
    dismissUpdate: () => {
      setOfflineReady(false)
      setNeedRefresh(false)
    },
  }
}
