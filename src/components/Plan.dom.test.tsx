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
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
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

/**
 * Une prévision Open-Meteo, en colonnes comme le vrai service la rend.
 *
 * Aujourd'hui seulement, aux quatre heures qui comptent : c'est tout ce que
 * les deux fenêtres du E.31 vont regarder.
 */
function forecast() {
  const jour = shift(0)
  return {
    hourly: {
      time: [`${jour}T08:00`, `${jour}T09:00`, `${jour}T17:00`, `${jour}T18:00`],
      temperature_2m: [9, 10, 15, 15],
      apparent_temperature: [7, 8, 14, 14],
      precipitation_probability: [5, 5, 10, 10],
      precipitation: [0, 0, 0, 0],
      wind_speed_10m: [12, 12, 15, 15],
      wind_gusts_10m: [25, 26, 30, 30],
      weather_code: [0, 1, 3, 3],
    },
  }
}

/** Un `fetch` qui répond comme intervals.icu, et note ce qu'on lui envoie. */
function serve(overrides: { events?: unknown[]; fail?: boolean; weather?: boolean } = {}) {
  const calls: { method: string; url: string }[] = []

  const fetcher = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input)
    const method = init?.method ?? 'GET'
    calls.push({ method, url })

    if (overrides.fail) throw new TypeError('Failed to fetch')

    // La météo est le seul appel qui ne va pas chez intervals.icu. Elle ne
    // répond que si le test la demande : les autres n'ont pas à s'en occuper.
    if (url.includes('open-meteo')) {
      return new Response(JSON.stringify(overrides.weather ? forecast() : {}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

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
  it('affiche les quatorze jours de la bande, vides compris', async () => {
    serve()
    const { container } = plan()
    await waitFor(() => expect(container.querySelectorAll('.col')).toHaveLength(14))
  })

  it('n’écrit jamais dans intervals.icu (E.19)', async () => {
    // Le garde-fou statique lit les fichiers ; celui-ci regarde le réseau.
    const calls = serve()
    const { container } = plan()
    await waitFor(() => expect(container.querySelectorAll('.col')).toHaveLength(14))
    expect(calls.filter((call) => call.method !== 'GET')).toEqual([])
  })

  it('ne renvoie à aucun bouton qui n’existe pas', async () => {
    // « Poser une séance » a disparu avec l'écriture, et un texte y renvoyait
    // encore deux lots plus tard.
    serve()
    const { container } = plan()
    await waitFor(() => expect(container.querySelectorAll('.col')).toHaveLength(14))

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
    await waitFor(() => expect(container.querySelectorAll('.col')).toHaveLength(14))
    expect(container.textContent).not.toContain('absente')
    expect(container.textContent).not.toContain('manquée')
  })

  it('montre la dernière lecture plutôt qu’une erreur quand le réseau manque', async () => {
    // D'abord une lecture réussie, qui se garde.
    serve()
    const first = plan()
    await waitFor(() => expect(first.container.querySelectorAll('.col')).toHaveLength(14))
    cleanup()

    // Puis plus de réseau du tout.
    vi.unstubAllGlobals()
    serve({ fail: true })
    const { container } = plan()
    await waitFor(() => expect(container.textContent).toContain('Pas de réseau'))
    expect(container.querySelectorAll('.col')).toHaveLength(14)
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

describe('la bande des quatorze jours', () => {
  it('ouvre aujourd’hui, et change de jour quand on tape une colonne', async () => {
    // La bande a remplacé la liste verticale : elle montre les quatorze jours
    // repliés et n'en ouvre qu'un. Sans ce geste, treize d'entre eux
    // deviendraient inaccessibles.
    serve()
    const { container } = plan()
    await waitFor(() => expect(container.querySelectorAll('.col')).toHaveLength(14))

    const ouvert = () => container.querySelector('.sheet-when')?.textContent ?? ''
    expect(ouvert()).toContain('Aujourd’hui')

    const colonnes = container.querySelectorAll<HTMLButtonElement>('.col')
    fireEvent.click(colonnes[5]!)
    await waitFor(() => expect(ouvert()).not.toContain('Aujourd’hui'))
    expect(ouvert().length).toBeGreaterThan(0)
  })

  it('garde la marque de trajet tapable sous chaque jour (E.17)', async () => {
    // Le geste vivait sur la ligne du calendrier vertical, qui n'existe plus.
    serve()
    const { container } = plan()
    await waitFor(() => expect(container.querySelectorAll('.col')).toHaveLength(14))
    expect(container.querySelectorAll('.marks .mark')).toHaveLength(14)

    const marque = container.querySelector<HTMLButtonElement>('.marks .mark')!
    const avant = marque.textContent
    fireEvent.click(marque)
    await waitFor(() =>
      expect(container.querySelector('.marks .mark')?.textContent).not.toBe(avant),
    )
  })
})

describe('la météo du trajet (E.31, E.32)', () => {
  it('montre les deux fenêtres et la tenue du jour ouvert', async () => {
    serve({ weather: true })
    const { container } = plan()
    await waitFor(() => expect(container.querySelector('.weather')).not.toBeNull())

    const bloc = container.querySelector('.weather')!
    // Les deux fenêtres, nommées par leurs heures.
    expect(bloc.textContent).toContain('8-9 h')
    expect(bloc.textContent).toContain('17-18 h')
    // Le ressenti, pas la température de l'air : 7° le matin, pas 9°.
    expect(bloc.textContent).toContain('7°')
    // Et une tenue, puisque le jour porte un trajet électrique par défaut.
    expect(bloc.querySelectorAll('.win-wear').length).toBe(2)
  })

  it('pose deux signes par jour sous la bande', async () => {
    serve({ weather: true })
    const { container } = plan()
    await waitFor(() => expect(container.querySelectorAll('.skies .sky')).toHaveLength(14))

    // La prévision ne couvre qu'aujourd'hui : les treize autres restent vides
    // plutôt que de deviner.
    expect(container.querySelectorAll('.skies .sky-none')).toHaveLength(13)
  })

  it('ne dit rien du tout quand la météo ne répond pas', async () => {
    // Un échec météo ne doit jamais coûter le plan : c'est la même prudence
    // que pour les courbes cardiaques du E.21.
    serve()
    const { container } = plan()
    await waitFor(() => expect(container.querySelectorAll('.col')).toHaveLength(14))
    expect(container.querySelector('.weather')).toBeNull()
    expect(container.querySelector('.skies')).toBeNull()
  })

  it('n’envoie ni clé ni identifiant chez le météorologue', async () => {
    // Le second tiers du projet. Il ne reçoit que des coordonnées et des
    // dates — jamais la clé intervals.icu, jamais l'identifiant de l'athlète.
    const calls = serve({ weather: true })
    const { container } = plan()
    await waitFor(() => expect(container.querySelector('.weather')).not.toBeNull())

    const meteo = calls.filter((call) => call.url.includes('open-meteo'))
    expect(meteo.length).toBeGreaterThan(0)
    for (const call of meteo) {
      expect(call.method).toBe('GET')
      expect(call.url).not.toContain(credentials.apiKey)
      expect(call.url).not.toContain(credentials.athleteId)
    }
  })

  it('repart de la prévision gardée plutôt que du réseau', async () => {
    // Hors ligne, l'app doit ouvrir déjà habillée : c'est le cas du garage.
    const calls = serve({ weather: true })
    const first = plan()
    await waitFor(() => expect(first.container.querySelector('.weather')).not.toBeNull())
    const appels = calls.filter((call) => call.url.includes('open-meteo')).length
    cleanup()

    const { container } = plan()
    await waitFor(() => expect(container.querySelector('.weather')).not.toBeNull())
    expect(calls.filter((call) => call.url.includes('open-meteo'))).toHaveLength(appels)
  })
})

describe('ma garde-robe (E.32, second temps)', () => {
  it('propose toutes les catégories, et aucune n’est remplie au départ', async () => {
    // « Que tu n'inventes pas » : l'app fournit le vocabulaire, jamais les
    // pièces. Une garde-robe pré-remplie serait exactement ce qu'il a exclu.
    serve({ weather: true })
    const { container } = plan()
    await waitFor(() => expect(container.querySelector('.wardrobe')).not.toBeNull())

    expect(container.querySelectorAll('.piece')).toHaveLength(16)
    expect(container.querySelector('.wardrobe > summary')?.textContent).toContain('0 sur 16')
    for (const champ of container.querySelectorAll<HTMLInputElement>('.piece-edit input')) {
      expect(champ.value).toBe('')
    }
  })

  it('nomme les pièces de l’athlète dans le plan dès qu’il les a dites', async () => {
    localStorage.setItem(
      'makigawa.garde-robe',
      JSON.stringify({ 'gants-legers': 'gants Rogelli noirs' }),
    )
    serve({ weather: true })
    const { container } = plan()
    await waitFor(() => expect(container.querySelector('.weather')).not.toBeNull())

    const bloc = container.querySelector('.weather')!
    expect(bloc.textContent).toContain('gants Rogelli noirs')
    expect(bloc.textContent).not.toContain('gants légers')
  })

  it('cesse de proposer ce qu’il n’a pas, et le dit', async () => {
    // Le taire lui laisserait croire qu'il est couvert.
    localStorage.setItem('makigawa.garde-robe', JSON.stringify({ jambieres: null }))
    serve({ weather: true })
    const { container } = plan()
    await waitFor(() => expect(container.querySelector('.weather')).not.toBeNull())

    const bloc = container.querySelector('.weather')!
    expect(bloc.querySelector('.win-missing')?.textContent).toContain('jambières')
    expect(bloc.querySelector('.win-wear')?.textContent).not.toContain('jambières')
  })

  it('garde le nom générique tant qu’il n’a rien dit', async () => {
    // Une garde-robe vide ne casse rien : c'est le premier temps du E.32.
    serve({ weather: true })
    const { container } = plan()
    await waitFor(() => expect(container.querySelector('.weather')).not.toBeNull())
    expect(container.querySelector('.weather')?.textContent).toContain('gants légers')
  })

  it('retient ce qu’il tape, et le plan s’en sert aussitôt', async () => {
    serve({ weather: true })
    const { container } = plan()
    await waitFor(() => expect(container.querySelector('.weather')).not.toBeNull())

    const champ = [...container.querySelectorAll<HTMLInputElement>('.piece-edit input')].find(
      (one) => one.getAttribute('aria-label')?.includes('gants légers'),
    )!
    fireEvent.change(champ, { target: { value: 'gants Rogelli noirs' } })
    fireEvent.blur(champ)

    await waitFor(() =>
      expect(container.querySelector('.weather')?.textContent).toContain('gants Rogelli noirs'),
    )
    expect(localStorage.getItem('makigawa.garde-robe')).toContain('gants Rogelli noirs')
  })

  it('ne conseille jamais d’acheter ce qui manque', async () => {
    // L'app n'a pas d'avis sur ce qu'il devrait posséder, seulement sur ce
    // qu'il fait froid. Le contrôle porte sur le bloc du jour, qui est le seul
    // endroit où un conseil se donne — l'écran de garde-robe, lui, a le droit
    // de promettre qu'il n'en donnera pas.
    localStorage.setItem('makigawa.garde-robe', JSON.stringify({ jambieres: null }))
    serve({ weather: true })
    const { container } = plan()
    await waitFor(() => expect(container.querySelector('.weather')).not.toBeNull())

    const conseil = (container.querySelector('.weather')?.textContent ?? '').toLowerCase()
    expect(conseil).toContain('il te manque')
    for (const mot of ['achet', 'procure', 'investis', 'il te faudrait']) {
      expect(conseil, mot).not.toContain(mot)
    }
  })
})
