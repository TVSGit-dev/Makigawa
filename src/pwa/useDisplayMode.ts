import { useEffect, useState } from 'react'
import { isStandalone } from './useInstallPrompt'

/** Suit en direct le passage onglet ↔ écran d’accueil. */
export function useDisplayMode(): 'standalone' | 'browser' {
  const [mode, setMode] = useState<'standalone' | 'browser'>(() =>
    isStandalone() ? 'standalone' : 'browser',
  )

  useEffect(() => {
    const query = window.matchMedia('(display-mode: standalone)')
    const update = () => setMode(isStandalone() ? 'standalone' : 'browser')
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return mode
}
