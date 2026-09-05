import { useState } from 'react'
import {
  createEvent,
  deleteEvent,
  fetchCalendarEvents,
  updateEvent,
  type ApiOutcome,
} from '../api/intervals'
import type { Credentials } from '../storage/credentials'
import { toDayKey } from '../calendar/dates'

/**
 * Vérifie que Makigawa peut écrire dans le calendrier — créer, modifier,
 * supprimer. C'est le dernier inconnu technique : la lecture est acquise,
 * mais l'écriture emploie d'autres méthodes HTTP, donc un contrôle CORS
 * distinct du navigateur.
 *
 * L'événement de test est une **note** et non une séance : même si le ménage
 * échouait, une note ne porte aucune charge et ne fausse ni la forme ni la
 * fatigue. Elle est posée aujourd'hui, à vue, plutôt qu'à une date lointaine :
 * un oubli qui se voit vaut mieux qu'un oubli caché.
 */

const TEST_NAME = 'Makigawa — test d’écriture'
const TEST_RENAMED = 'Makigawa — test d’écriture (modifié)'

type StepStatus = 'waiting' | 'running' | 'ok' | 'failed'

type Step = {
  key: string
  label: string
  status: StepStatus
  detail?: string
}

const STEPS: Step[] = [
  { key: 'create', label: 'Créer une note', status: 'waiting' },
  { key: 'find', label: 'Retrouver son identifiant', status: 'waiting' },
  { key: 'update', label: 'La renommer', status: 'waiting' },
  { key: 'delete', label: 'La supprimer', status: 'waiting' },
  { key: 'verify', label: 'Vérifier qu’elle a disparu', status: 'waiting' },
]

type Props = {
  credentials: Credentials | null
}

/** Un échec, rendu en une phrase qui dit quoi corriger. */
function describe(outcome: Exclude<ApiOutcome<unknown>, { kind: 'ok' }>): string {
  switch (outcome.kind) {
    case 'unauthorized':
      return 'intervals.icu rejette ces identifiants.'
    case 'httpError':
      return outcome.status === 404
        ? 'Adresse inconnue d’intervals.icu : le chemin d’écriture est à corriger.'
        : `HTTP ${outcome.status}. ${outcome.detail}`.trim()
    case 'blocked':
      return `Le navigateur a bloqué l’appel : le contrôle CORS des méthodes d’écriture ne passe pas, là où la lecture passait. Un relais deviendrait nécessaire. Détail : ${outcome.detail}`
  }
}

export function WriteCheck({ credentials }: Props) {
  const [steps, setSteps] = useState<Step[]>(STEPS)
  const [running, setRunning] = useState(false)
  const [leftover, setLeftover] = useState<string | null>(null)

  const mark = (key: string, status: StepStatus, detail?: string) =>
    setSteps((current) =>
      current.map((step) => (step.key === key ? { ...step, status, detail } : step)),
    )

  const run = async () => {
    if (!credentials) return
    setSteps(STEPS)
    setLeftover(null)
    setRunning(true)

    const today = toDayKey(new Date())
    let eventId: string | null = null

    try {
      // 1. Créer
      mark('create', 'running')
      const created = await createEvent(credentials, {
        start_date_local: `${today}T00:00:00`,
        category: 'NOTE',
        name: TEST_NAME,
        description:
          'Note posée par Makigawa pour vérifier l’écriture, puis supprimée dans la foulée.',
      })
      if (created.kind !== 'ok') {
        mark('create', 'failed', describe(created))
        return
      }
      eventId = created.data?.id ?? null
      mark('create', 'ok', 'La note est posée sur aujourd’hui.')

      // 2. Retrouver l'identifiant si la création ne l'a pas renvoyé.
      mark('find', 'running')
      if (eventId) {
        mark('find', 'ok', `Renvoyé par la création : ${eventId}.`)
      } else {
        const now = new Date()
        const listed = await fetchCalendarEvents(credentials, now, now)
        if (listed.kind !== 'ok') {
          mark('find', 'failed', describe(listed))
          return
        }
        eventId = listed.data.find((event) => event.name === TEST_NAME)?.id ?? null
        if (!eventId) {
          mark('find', 'failed', 'Note introuvable dans le calendrier juste après sa création.')
          return
        }
        mark('find', 'ok', `Retrouvé en relisant le calendrier : ${eventId}.`)
      }

      // 3. Modifier
      mark('update', 'running')
      const updated = await updateEvent(credentials, eventId, { name: TEST_RENAMED })
      if (updated.kind !== 'ok') {
        mark('update', 'failed', describe(updated))
        return
      }
      mark('update', 'ok', 'Renommée.')

      // 4. Supprimer
      mark('delete', 'running')
      const removed = await deleteEvent(credentials, eventId)
      if (removed.kind !== 'ok') {
        mark('delete', 'failed', describe(removed))
        return
      }
      eventId = null
      mark('delete', 'ok', 'Supprimée.')

      // 5. Vérifier — un 200 sur la suppression ne prouve pas la disparition.
      mark('verify', 'running')
      const now = new Date()
      const after = await fetchCalendarEvents(credentials, now, now)
      if (after.kind !== 'ok') {
        mark('verify', 'failed', describe(after))
        return
      }
      const survivor = after.data.some(
        (event) => event.name === TEST_NAME || event.name === TEST_RENAMED,
      )
      if (survivor) {
        mark('verify', 'failed', 'La note est toujours dans le calendrier après suppression.')
        return
      }
      mark('verify', 'ok', 'Le calendrier est revenu à son état initial.')
    } finally {
      // Créée mais pas supprimée : le dire, avec de quoi la retrouver.
      if (eventId) {
        setLeftover(
          `Une note « ${TEST_RENAMED} » ou « ${TEST_NAME} » est peut-être restée sur le ${today} dans intervals.icu. Elle ne porte aucune charge, mais tu peux la supprimer à la main.`,
        )
      }
      setRunning(false)
    }
  }

  if (!credentials) return null

  const finished = steps.every((step) => step.status === 'ok')

  return (
    <section className="card">
      <h2>Écriture</h2>
      <p className="muted">
        Dernier inconnu technique : Makigawa peut lire ton calendrier, mais peut-elle y écrire ?
        Ce test pose une note sur aujourd’hui, la renomme, puis la supprime. Une note, pas une
        séance : elle ne porte aucune charge, et rien ne reste.
      </p>

      <button className="button" onClick={() => void run()} disabled={running}>
        {running ? 'Test en cours…' : 'Lancer le test d’écriture'}
      </button>

      {steps.map((step) => (
        <div className="row" key={step.key}>
          <div className="row-main">
            <span className="row-label">{step.label}</span>
            <span className={`badge badge-${toneOf(step.status)}`}>
              <span className="dot" aria-hidden="true" />
              {labelOf(step.status)}
            </span>
          </div>
          {step.detail ? <p className="row-hint">{step.detail}</p> : null}
        </div>
      ))}

      {finished ? (
        <p className="success">
          Écriture confirmée. Makigawa peut décaler, dégrader et abandonner des séances.
        </p>
      ) : null}

      {leftover ? (
        <p className="error">
          <strong>Ménage incomplet</strong>
          <br />
          {leftover}
        </p>
      ) : null}
    </section>
  )
}

function toneOf(status: StepStatus): string {
  if (status === 'ok') return 'ok'
  if (status === 'failed') return 'bad'
  if (status === 'running') return 'warn'
  return 'idle'
}

function labelOf(status: StepStatus): string {
  if (status === 'ok') return 'Fait'
  if (status === 'failed') return 'Échec'
  if (status === 'running') return 'En cours…'
  return 'En attente'
}
