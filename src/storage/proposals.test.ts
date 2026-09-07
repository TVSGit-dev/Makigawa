import { beforeEach, describe, expect, it } from 'vitest'
import { loadProposals, rememberProposals, type RememberedProposal } from './proposals'
import { heldProposals, realises } from '../rules/done'
import type { Activity } from '../api/intervals'

const store = new Map<string, string>()
globalThis.localStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => void store.set(key, value),
  removeItem: (key: string) => void store.delete(key),
  clear: () => store.clear(),
  key: (index: number) => [...store.keys()][index] ?? null,
  get length() {
    return store.size
  },
} as Storage

beforeEach(() => localStorage.clear())

const proposal = (over: Partial<RememberedProposal> = {}): RememberedProposal => ({
  date: '2026-09-07',
  zone: 'sweet-spot',
  seconds: 2520,
  work: 1440,
  name: 'Sweet spot 2 × 12 min',
  ...over,
})

const activity = (over: Partial<Activity> = {}): Activity => ({
  id: 'a1',
  name: 'Zwift',
  type: 'VirtualRide',
  startDateLocal: '2026-09-07T18:00:00',
  trainingLoad: 80,
  movingTime: 2520,
  pairedEventId: null,
  raw: {},
  ...over,
})

describe('ce que l’app se rappelle avoir proposé', () => {
  it('retient les propositions du jour', () => {
    rememberProposals('2026-09-07', [proposal()])
    expect(loadProposals()).toHaveLength(1)
  })

  it('ne retient pas les jours à venir', () => {
    // Ils changeront encore : rien ne sert de garder un brouillon.
    rememberProposals('2026-09-07', [proposal({ date: '2026-09-10' })])
    expect(loadProposals()).toEqual([])
  })

  it('ne réécrit pas le passé', () => {
    // Ce qui a été proposé lundi reste ce qui a été proposé lundi.
    rememberProposals('2026-09-07', [proposal()])
    rememberProposals('2026-09-08', [proposal({ date: '2026-09-08', zone: 'tempo' })])
    expect(loadProposals().map((one) => one.date)).toEqual(['2026-09-07', '2026-09-08'])
  })

  it('remplace la journée en cours plutôt que de l’empiler', () => {
    rememberProposals('2026-09-07', [proposal(), proposal({ name: 'Autre' })])
    rememberProposals('2026-09-07', [proposal()])
    expect(loadProposals()).toHaveLength(1)
  })

  it('oublie au bout de six semaines', () => {
    rememberProposals('2026-07-01', [proposal({ date: '2026-07-01' })])
    rememberProposals('2026-09-07', [proposal()])
    expect(loadProposals().map((one) => one.date)).toEqual(['2026-09-07'])
  })

  it('repart de zéro si le stockage est illisible', () => {
    localStorage.setItem('makigawa.propositions', 'pas du JSON')
    expect(loadProposals()).toEqual([])
  })
})

describe('reconnaître qu’une proposition a été faite (E.22)', () => {
  it('reconnaît une séance faite le jour dit, assez longtemps', () => {
    expect(realises(proposal(), activity())).toBe(true)
  })

  it('accepte 85 % du temps proposé, pas moins', () => {
    expect(realises(proposal(), activity({ movingTime: 2142 }))).toBe(true)
    expect(realises(proposal(), activity({ movingTime: 2100 }))).toBe(false)
  })

  it('ne reconnaît rien un autre jour', () => {
    expect(realises(proposal(), activity({ startDateLocal: '2026-09-08T18:00:00' }))).toBe(false)
  })

  it('ne prend jamais un trajet pour une séance', () => {
    // La règle critique tient ici comme partout.
    expect(realises(proposal(), activity({ type: 'EBikeRide' }))).toBe(false)
    expect(realises(proposal(), activity({ name: 'Hard Commute' }))).toBe(false)
  })

  it('exige une charge de qualité', () => {
    // Une heure de récupération ne fait pas monter un niveau de sweet spot.
    expect(realises(proposal(), activity({ trainingLoad: 30 }))).toBe(false)
  })

  it('ne compte pas deux propositions sur une seule sortie', () => {
    const deux = [proposal(), proposal({ zone: 'seuil', name: 'Seuil' })]
    expect(heldProposals(deux, [activity()])).toHaveLength(1)
  })

  it('ne dit rien sans durée mesurée', () => {
    expect(realises(proposal(), activity({ movingTime: null }))).toBe(false)
  })
})
