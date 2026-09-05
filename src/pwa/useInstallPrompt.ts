import { useCallback, useEffect, useState } from 'react'

/**
 * `beforeinstallprompt` n’est pas standardisé et n’existe pas dans lib.dom.
 * Chrome/Android le déclenche quand les critères d’installation sont remplis.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** Vrai quand l’app tourne depuis l’écran d’accueil plutôt que dans un onglet. */
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    // Safari iOS n’implémente pas display-mode.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(isStandalone)

  useEffect(() => {
    // On intercepte la bannière de Chrome pour la proposer au bon moment.
    const onBeforeInstall = (event: Event) => {
      event.preventDefault()
      setDeferred(event as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferred) return null
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    // L’événement n’est utilisable qu’une fois.
    setDeferred(null)
    return outcome
  }, [deferred])

  return { canPrompt: deferred !== null, installed, promptInstall }
}
