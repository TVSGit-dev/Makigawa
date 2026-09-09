// @vitest-environment jsdom

/**
 * Ce que l'écran affiche vraiment (E.21).
 *
 * Les défauts d'interface de ce projet n'ont jamais été trouvés par les tests :
 * un bouton disparu dont un texte parlait encore, une phrase qui affirmait que
 * des séances passées n'étaient pas des séances. Tous vus à l'œil sur une
 * capture d'écran.
 *
 * Ces vérifications-ci montent un DOM et regardent le résultat. Elles ne
 * remplacent pas un coup d'œil — une date qui passe à la ligne ne se voit
 * qu'en image — mais elles attrapent ce qui se dit à l'écran.
 *
 * Seuls les fichiers `*.dom.test.tsx` montent un DOM, par la ligne en tête de
 * fichier : le reste des tests s'exécute sans, et c'est ce qui les garde
 * rapides.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, waitFor } from '@testing-library/react'
import { useCallback, useRef, useState } from 'react'
import { Plan, type Readout } from './Plan'
import type { Credentials } from '../storage/credentials'

const credentials: Credentials = { athleteId: 'i1', apiKey: 'k' }

const shift = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const activities = [
  {
    id: 'a1',
    type: 'EBikeRide',
    name: 'Chill Commute',
    start_date_local: `${shift(-1)}T08:00:00`,
    icu_training_load: 35,
    moving_time: 2400,
  },
]

const wellness = [
  { id: shift(-7), ctl: 20, atl: 18 },
  { id: shift(0), ctl: 21, atl: 20 },
]

/** Un `fetch` qui répond comme intervals.icu, et note ce qu'on lui envoie. */
function serve(overrides: { events?: unknown[]; fail?: boolean } = {}) {
  const calls: { method: string; url: string }[] = []

  const fetcher = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input)
    const method = init?.method ?? 'GET'
    calls.push({ method, url })

    if (overrides.fail) throw new TypeError('Failed to fetch')

    const body = url.includes('/events')
      ? (overrides.events ?? [])
      : url.includes('/wellness')
        ? wellness
        : url.includes('/streams')
          ? []
          : activities

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  })

  vi.stubGlobal('fetch', fetcher)
  return calls
}

beforeEach(() => localStorage.clear())
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const plan = () =>
  render(
    <Plan
      credentials={credentials}
      intent="normal"
      unloading={false}
      unloadedWeeks={new Set()}
      onReadout={() => {}}
    />,
  )

describe('l’écran du plan', () => {
  it('affiche les quatorze jours, vides compris', async () => {
    serve()
    const { container } = plan()
    await waitFor(() => expect(container.querySelectorAll('.day')).toHaveLength(14))
  })

  it('n’écrit jamais dans intervals.icu (E.19)', async () => {
    // Le garde-fou statique lit les fichiers ; celui-ci regarde le réseau.
    const calls = serve()
    const { container } = plan()
    await waitFor(() => expect(container.querySelectorAll('.day')).toHaveLength(14))
    expect(calls.filter((call) => call.method !== 'GET')).toEqual([])
  })

  it('ne renvoie à aucun bouton qui n’existe pas', async () => {
    // « Poser une séance » a disparu avec l'écriture, et un texte y renvoyait
    // encore deux lots plus tard.
    serve()
    const { container } = plan()
    await waitFor(() => expect(container.querySelectorAll('.day')).toHaveLength(14))

    const texte = container.textContent ?? ''
    for (const fantome of ['Poser une séance', 'Poser celle-ci', 'Tout accepter']) {
      expect(texte, fantome).not.toContain(fantome)
    }
  })

  it('n’affiche jamais une séance manquée', async () => {
    // La contrainte d'interface : une séance abandonnée ne laisse pas de
    // trace rouge.
    serve({
      events: [
        {
          id: 'ev1',
          category: 'WORKOUT',
          name: 'Sweet spot 2 × 10 min',
          type: 'VirtualRide',
          start_date_local: `${shift(-3)}T00:00:00`,
          icu_training_load: 80,
          description: '- 20m 90%',
        },
      ],
    })
    const { container } = plan()
    await waitFor(() => expect(container.querySelectorAll('.day')).toHaveLength(14))
    expect(container.textContent).not.toContain('absente')
    expect(container.textContent).not.toContain('manquée')
  })

  it('montre la dernière lecture plutôt qu’une erreur quand le réseau manque', async () => {
    // D'abord une lecture réussie, qui se garde.
    serve()
    const first = plan()
    await waitFor(() => expect(first.container.querySelectorAll('.day')).toHaveLength(14))
    cleanup()

    // Puis plus de réseau du tout.
    vi.unstubAllGlobals()
    serve({ fail: true })
    const { container } = plan()
    await waitFor(() => expect(container.textContent).toContain('Pas de réseau'))
    expect(container.querySelectorAll('.day')).toHaveLength(14)
  })

  it('reconnaît une séance qu’elle a proposée, sans passer par le calendrier', async () => {
    // Le trou du E.19 : sans cette reconnaissance, aucun niveau ne monte
    // jamais. Une proposition d'hier, une activité d'hier, et le niveau suit.
    localStorage.setItem(
      'makigawa.propositions',
      JSON.stringify([
        {
          date: shift(-1),
          zone: 'sweet-spot',
          seconds: 2520,
          work: 1440,
          name: 'Sweet spot 2 × 12 min',
        },
      ]),
    )
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request) => {
        const url = String(input)
        const body = url.includes('/events')
          ? []
          : url.includes('/wellness')
            ? wellness
            : url.includes('/streams')
              ? []
              : [
                  {
                    id: 'z1',
                    type: 'VirtualRide',
                    name: 'Zwift',
                    start_date_local: `${shift(-1)}T18:00:00`,
                    icu_training_load: 80,
                    moving_time: 2600,
                  },
                ]
        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }),
    )

    const { container } = plan()
    await waitFor(() => expect(container.textContent).toContain('Sweet spot'))
    expect(container.textContent).toContain('niveau')
  })

  it('dit franchement quand il n’y a rien, et rien de plus', async () => {
    serve({ fail: true })
    const { container } = plan()
    await waitFor(() => expect(container.textContent).toContain('Appel impossible'))
  })
})

describe('le rendu ne boucle pas', () => {
  /**
   * Le défaut trouvé le 8 septembre 2026, et le seul de sa famille : `App`
   * range dans son état ce que `Plan` lui remonte, donc **toute dépendance qui
   * change d'identité à chaque rendu fait boucler les deux composants**.
   *
   * En l'occurrence la lecture vide était écrite `: []`, un objet neuf à chaque
   * rendu. La boucle tournait tant que la lecture n'aboutissait pas — au
   * chargement, et sans fin sur l'écran d'erreur, où elle vidait la batterie.
   *
   * Le montage reproduit le câblage réel : un parent qui range la remontée.
   * Sans cela la sonde ne voit rien, ce qui est exactement ce qui s'était
   * passé la première fois.
   */
  const CREDS: Credentials = { athleteId: 'i1', apiKey: 'k' }
  const NO_WEEKS: ReadonlySet<string> = new Set()

  /** Compte les remontées, et coupe au-delà pour que le test rende la main. */
  function Parent({ onCount }: { onCount: (n: number) => void }) {
    const [, setReadout] = useState<Readout | null>(null)
    const seen = useRef(0)
    const onReadout = useCallback(
      (next: Readout) => {
        seen.current += 1
        onCount(seen.current)
        if (seen.current < 200) setReadout(next)
      },
      [onCount],
    )

    return (
      <Plan
        credentials={CREDS}
        intent="normal"
        unloading={false}
        unloadedWeeks={NO_WEEKS}
        onReadout={onReadout}
      />
    )
  }

  it('ne reboucle pas pendant que la lecture n’aboutit pas', async () => {
    // Une lecture qui ne répond jamais : l'app reste en « chargement ».
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    )
    let count = 0
    render(<Parent onCount={(n) => (count = n)} />)
    await new Promise((resolve) => setTimeout(resolve, 200))
    // Quelques remontées le temps que l'état se pose, pas trois cents.
    expect(count).toBeLessThan(10)
  })

  it('ne reboucle pas non plus quand la lecture échoue', async () => {
    // C'est le cas le plus grave : l'écran d'erreur reste affiché, donc la
    // boucle ne s'arrêtait jamais d'elle-même.
    vi.stubGlobal(
      'fetch',
      vi.fn(() => {
        throw new TypeError('Failed to fetch')
      }),
    )
    let count = 0
    render(<Parent onCount={(n) => (count = n)} />)
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(count).toBeLessThan(10)
  })
})
