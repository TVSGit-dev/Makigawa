/**
 * L'écran principal : le plan des deux prochaines semaines.
 *
 * Il lit intervals.icu — le calendrier, les activités que Garmin y verse, la
 * forme et la fatigue — et n'y écrit rien, sauf supprimer (E.19). Le plan vit
 * ici, et se recalcule à chaque lecture.
 *
 * Il n'affiche jamais le passé. Ce n'est pas une simplification mais une
 * contrainte du projet : une journée révolue affichée dans un plan devient un
 * reproche, et une séance qu'on a laissée tomber n'a pas à laisser de trace.
 * Le passé sert au moteur, et ne se montre que dans « Ce que tu construis ».
 */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  deleteEvent,
  fetchActivities,
  fetchCalendarEvents,
  fetchFtp,
  latestEstimatedFtp,
  fetchHeartRate,
  fetchWellness,
  type Activity,
  type ApiOutcome,
  type CalendarEvent,
  type Wellness,
} from '../api/intervals'
import { buildContext, isSession, toDayRecords } from '../rules/context'
import { daysSinceQuality, heldProposals, isReprise, matchCompletions } from '../rules/done'
import {
  loadProposals,
  rememberProposals,
  type RememberedProposal,
} from '../storage/proposals'
import { workSeconds, zoneOfFamily } from '../workouts/levels'
import { shouldUnload } from '../rules/decharge'
import { heldFrom, levelsFrom, type Held } from '../workouts/levels'
import { propose, type Proposal } from '../rules/decide'
import { weighDay } from '../rules/scale'
import type { Intent } from '../rules/intent'
import type { DayRecord } from '../rules/types'
import type { Credentials } from '../storage/credentials'
import { rampOf, holdsLevel } from '../rules/ramp'
import { doseOf } from '../rules/dose'
import { spreadOf } from '../rules/spread'
import { variabilityOf, type Variability } from '../rules/variability'
import { bandsOf } from '../rules/peak'
import { describeAge, loadRead, saveRead } from '../storage/cache'
import { loadPeaks, savePeaks, type Peaks } from '../storage/peaks'
import { loadJournal, recordRefusals, type Journal, type JournalEntry } from '../storage/journal'
import {
  forgetStalePreferences,
  hasPlanPreferences,
  postponePlan,
  refuseFamily,
  refusedKeys,
  resetPlanPreferences,
  type PlanPreferences,
} from '../storage/plan'
import {
  addDays,
  dayKeyOf,
  formatDuration,
  formatRelativeDay,
  shiftDayKey,
  toDayKey,
  type DayKey,
} from '../calendar/dates'
import { Progress } from './Progress'
import { Week, type CalendarDay } from './Week'
import { asPlannedCommute } from '../actions/commute'
import { commuteOn, cycleCommute, forgetOldCommutes, type CommuteMarks } from '../storage/commutes'
import { planWeek } from '../workouts/week'
import { firstTestDay, ftpTest, FTP_TEST_NAME } from '../workouts/ftp-test'
import { readFtp, saySoftness } from '../rules/ftp'
import { Catalogue } from './Catalogue'
import { toNotation } from '../workouts/compose'
import { Profile } from './Profile'
import { type DeleteState } from './SessionCard'
import { explainTest } from './reasons'

/** Deux semaines devant : l'horizon de planification annoncé par le projet. */
const AHEAD_DAYS = 14

/**
 * Les lectures vides, d'identité stable.
 *
 * Un `[]` littéral est un objet neuf à chaque rendu. Placé dans les dépendances
 * d'un effet qui remonte quelque chose au parent, il suffit à faire boucler le
 * rendu indéfiniment. Une constante coupe le problème à la racine.
 */
const NOTHING_READ: readonly Wellness[] = []
const NO_DAYS: readonly DayRecord[] = []
/**
 * Six semaines derrière.
 *
 * Deux suffisaient à peser les journées passées ; les niveaux du E.16 se
 * lisent sur six, parce que c'est le temps qu'une adaptation met à se perdre.
 * Le calendrier est lu aussi loin en arrière, sans quoi il n'y aurait rien à
 * comparer aux activités.
 */
const BEHIND_DAYS = 42

type Data = {
  events: CalendarEvent[]
  activities: Activity[]
  wellness: Wellness[]
  /** La FTP du profil : elle ne décide rien, elle affiche des watts (E.23). */
  ftp: number | null
  /** Ce qui n'a pas pu être lu, dit franchement plutôt que masqué. */
  gaps: string[]
  /**
   * Quand cette lecture date, si elle vient du cache (E.21).
   *
   * `null` pour une lecture fraîche. Un plan d'hier vaut mieux que pas de
   * plan, à condition de dire qu'il date.
   */
  cachedAt: number | null
}

type State =
  | { status: 'loading' }
  | { status: 'ok'; data: Data }
  | { status: 'error'; title: string; detail: string }

/** Ce que l'en-tête a besoin de savoir, lu une seule fois pour les deux écrans. */
export type Readout = {
  fitness: number | null
  fatigue: number | null
  sleepScore: number | null
  days: readonly DayRecord[]
  /**
   * La reprise du E.5, remontée plutôt qu'appliquée sur place.
   *
   * Elle force le mode prudent, et c'est `App` qui tient le mode : l'appliquer
   * ici laisserait l'en-tête afficher « normal » pendant que le moteur
   * travaille en prudent, ce que l'athlète verrait tout de suite.
   */
  reprise: boolean
  daysSinceQuality: number | null
  /** Le cycle 2:1 arrive à sa troisième semaine (E.18). */
  unloadSuggested: boolean
  /** Où en est la variabilité du matin, et si la base tient encore (E.30). */
  variability: Variability
}

type Props = {
  credentials: Credentials
  intent: Intent
  /** La décharge acceptée pour cette semaine, décidée par `App` (E.18). */
  unloading: boolean
  /** Les semaines déjà passées en décharge : le cycle les saute. */
  unloadedWeeks: ReadonlySet<DayKey>
  onReadout: (readout: Readout) => void
  /**
   * Ce qui se glisse entre « Aujourd'hui » et « Ta semaine ».
   *
   * `App` y met la carte de forme : elle a besoin de données que `Plan` lit,
   * et `Plan` a besoin d'ouvrir l'écran. Le passer en enfant règle les deux
   * sans faire descendre une carte entière en propriétés.
   */
  children?: ReactNode
}

export function Plan({
  credentials,
  intent,
  unloading,
  unloadedWeeks,
  onReadout,
  children,
}: Props) {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [removals, setRemovals] = useState<Record<string, DeleteState>>({})
  /** Les pics cardiaques mesurés, par activité (E.21). */
  const [peaks, setPeaks] = useState<Peaks>(() => loadPeaks())
  // Ce que l'athlète a écarté ou repoussé du plan (E.14). Vit dans le
  // téléphone, ne part jamais dans intervals.icu.
  const [choices, setChoices] = useState<PlanPreferences>({ refused: {}, notBefore: null })
  // Les jours de trajet marqués par l'athlète (E.17 révisé). Ils changent le
  // poids d'une journée, donc le plan se recalcule autour.
  const [commutes, setCommutes] = useState<CommuteMarks>({})

  const today = toDayKey(new Date())

  useEffect(() => {
    setChoices(forgetStalePreferences(today))
    setCommutes(forgetOldCommutes(today))
  }, [today])

  const load = useCallback(async () => {
    setState({ status: 'loading' })
    setRemovals({})

    const now = new Date()
    const [events, activities, wellness, ftp] = await Promise.all([
      fetchCalendarEvents(credentials, addDays(now, -BEHIND_DAYS), addDays(now, AHEAD_DAYS - 1)),
      fetchActivities(credentials, addDays(now, -BEHIND_DAYS), now),
      fetchWellness(credentials, addDays(now, -BEHIND_DAYS), now),
      fetchFtp(credentials),
    ])

    // Le calendrier est indispensable. Sans lui, la dernière lecture réussie
    // vaut mieux qu'un écran d'erreur : c'est le cas du garage sans réseau,
    // c'est-à-dire exactement là où l'on regarde son plan avant de partir.
    if (events.kind !== 'ok') {
      const kept = loadRead()
      if (kept) {
        setState({
          status: 'ok',
          data: {
            events: kept.events,
            activities: kept.activities,
            wellness: kept.wellness,
            ftp: kept.ftp ?? null,
            gaps: [],
            cachedAt: kept.at,
          },
        })
        return
      }
      setState({ status: 'error', ...describe(events) })
      return
    }

    // Les deux autres enrichissent. Leur absence dégrade le jugement du
    // moteur sans l'empêcher, et vaut mieux qu'un écran vide.
    const gaps: string[] = []
    if (activities.kind !== 'ok') {
      gaps.push('Les activités réalisées n’ont pas pu être lues : les journées passées pèsent zéro pour le moteur.')
    }
    if (wellness.kind !== 'ok') {
      gaps.push('La forme et la fatigue n’ont pas pu être lues : la fraîcheur est prise comme neutre.')
    }

    const data: Data = {
      events: events.data,
      activities: activities.kind === 'ok' ? activities.data : [],
      wellness: wellness.kind === 'ok' ? wellness.data : [],
      ftp: ftp.kind === 'ok' ? ftp.data : null,
      gaps,
      cachedAt: null,
    }

    // On ne garde qu'une lecture complète : une lecture partielle rejouée hors
    // ligne ferait passer une absence de données pour une journée vide.
    if (activities.kind === 'ok' && wellness.kind === 'ok') {
      saveRead({
        events: data.events,
        activities: data.activities,
        wellness: data.wellness,
        ftp: data.ftp,
      })
    }

    setState({ status: 'ok', data })

    // Les courbes cardiaques ensuite, une par activité et une seule fois
    // (E.21). Elles arrivent après coup : le plan s'affiche sans les
    // attendre, puis se corrige quand elles sont là.
    void measurePeaks(credentials, data.activities, today).then(setPeaks)
  }, [credentials, today])

  useEffect(() => {
    void load()
  }, [load])

  // La forme remonte vers App, qui la donne à l'en-tête : une seule lecture
  // du réseau sert les deux écrans.
  //
  // **La lecture vide est une constante, et ce n'est pas cosmétique.** Écrite
  // `: []`, elle changeait d'identité à chaque rendu ; l'effet qui remonte la
  // lecture en dépend, il rappelait `onReadout`, `App` rangeait un objet neuf,
  // et le rendu repartait. La boucle tournait tant que la lecture n'aboutissait
  // pas — au chargement, et sans fin sur l'écran d'erreur.
  const wellness = state.status === 'ok' ? state.data.wellness : NOTHING_READ
  const fitness =
    wellness
      .filter((day) => day.date !== null && day.date <= today && day.ctl !== null)
      .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
      .at(-1)?.ctl ?? null

  // Les bandes mesurées entrent ici : sans elles, chaque journée en serait
  // dépourvue et la répartition du E.29 n'aurait rien à additionner.
  //
  // Mémorisé : depuis le E.29 cette lecture agrège trois nombres par activité,
  // et la refaire à chaque rendu ne servait à rien.
  const observed = useMemo(
    () => (state.status === 'ok' ? toDayRecords(state.data.activities, peaks) : NO_DAYS),
    [state, peaks],
  )

  /**
   * Où en est la variabilité ce matin (E.30).
   *
   * Elle voyage dans la réponse de `/wellness` que le plan lit déjà : aucun
   * appel supplémentaire, comme la FTP estimée du E.24.
   */
  const variability = useMemo(() => variabilityOf(wellness, today), [wellness, today])

  // Ce que sont devenues les séances passées (E.15), et les niveaux qui s'y
  // lisent (E.16). Calculés avant le décor, parce que la reprise en dépend.
  const completions = useMemo(() => {
    if (state.status !== 'ok') return []
    return matchCompletions({
      events: state.data.events,
      activities: state.data.activities,
      today,
      since: shiftDayKey(today, -BEHIND_DAYS),
    })
  }, [state, today])

  /**
   * Ce que l'app a proposé les six dernières semaines (E.22).
   *
   * Sans cette mémoire, une séance proposée et faite ne laissait aucune trace :
   * elle n'est pas dans le calendrier d'intervals.icu, donc le E.15 ne pouvait
   * pas l'apparier, donc aucun niveau ne montait jamais.
   */
  const [remembered, setRemembered] = useState<RememberedProposal[]>(() => loadProposals())

  /**
   * Les propositions que les activités ont réalisées, et ce qu'elles valent.
   *
   * **Les jours passés seulement.** Une proposition d'aujourd'hui qui ferait
   * monter un niveau changerait le plan d'aujourd'hui, donc la proposition,
   * donc le niveau : l'app tournerait en rond. Ce que tu fais ce soir compte
   * demain, et ne coûte rien puisque le plan du jour est déjà rendu.
   */
  const heldFromProposals = useMemo((): Held[] => {
    if (state.status !== 'ok') return []
    const passees = remembered.filter((one) => one.date < today)
    return heldProposals(passees, state.data.activities).map((one) => ({
      zone: one.zone,
      seconds: one.work,
    }))
  }, [remembered, state, today])

  const levels = useMemo(
    () => levelsFrom([...heldFrom(completions), ...heldFromProposals]),
    [completions, heldFromProposals],
  )

  /** Les jours qui ont porté une séance tenue, par l'un ou l'autre chemin. */
  const heldDays = useMemo(() => {
    if (state.status !== 'ok') return []
    const fromCalendar = completions.filter((one) => one.outcome === 'tenue').map((one) => one.date)
    const passees = remembered.filter((one) => one.date < today)
    const fromApp = heldProposals(passees, state.data.activities).map((one) => one.date)
    return [...new Set([...fromCalendar, ...fromApp])]
  }, [completions, remembered, state, today])

  const sinceQuality = useMemo(
    () =>
      state.status === 'ok'
        ? daysSinceQuality(state.data.activities, today, BEHIND_DAYS)
        : null,
    [state, today],
  )
  const reprise = isReprise(sinceQuality)

  // La vitesse à laquelle la forme monte, et son plafond (E.20). Au plafond,
  // le plan tient son niveau plutôt que de le monter d'un cran.
  const ramp = useMemo(
    () => (state.status === 'ok' ? rampOf(state.data.wellness, today) : null),
    [state, today],
  )
  const hold = holdsLevel(ramp)

  const unloadSuggested = useMemo(
    () => shouldUnload({ held: heldDays, today, unloaded: unloadedWeeks }),
    [heldDays, today, unloadedWeeks],
  )

  useEffect(() => {
    const latest = wellness
      .filter((day) => day.date !== null && day.date <= today && day.ctl !== null)
      .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
      .at(-1)
    const night = wellness.find((day) => day.date === today)
    onReadout({
      fitness: latest?.ctl ?? null,
      fatigue: latest?.atl ?? null,
      sleepScore: night?.sleepScore ?? null,
      days: observed,
      reprise,
      daysSinceQuality: sinceQuality,
      unloadSuggested,
      variability,
    })
    // `observed` est reconstruit à chaque rendu ; c'est `wellness` et l'état
    // qui disent quand il a vraiment changé.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wellness, state, today, reprise, sinceQuality, unloadSuggested, variability, onReadout])

  // Seulement l'à-venir : une séance passée ne doit pas entrer dans
  // l'espacement du E.4 et bloquer les jours qui viennent. Le calendrier est lu
  // six semaines en arrière pour le E.15, mais le moteur n'en veut rien.
  const upcoming = useMemo(
    () =>
      state.status === 'ok'
        ? state.data.events.filter((event) => (dayKeyOf(event.startDateLocal) ?? '') >= today)
        : [],
    [state, today],
  )

  /**
   * Les trajets à venir, tels que les règles les liront (E.17 révisé).
   *
   * Ils ne partent nulle part : ce sont des intentions locales. Mais ils
   * portent 60 à 100 % de la charge hebdomadaire de l'athlète, donc un plan
   * qui les ignore planifie dans le vide.
   */
  const commuteSessions = useMemo(
    () =>
      Array.from({ length: AHEAD_DAYS }, (_, ahead) => shiftDayKey(today, ahead))
        .map((date) => asPlannedCommute(commuteOn(commutes, date), date))
        .filter((session): session is NonNullable<typeof session> => session !== null),
    [commutes, today],
  )

  const context = useMemo(() => {
    if (state.status !== 'ok') return null
    const base = buildContext({
      today,
      events: upcoming,
      activities: state.data.activities,
      wellness: state.data.wellness,
      intent,
      peaks,
    })
    return {
      ...base,
      planned: [...base.planned, ...commuteSessions],
      // Le seul signal du jour dont le moteur dispose (E.30). Faux tant que la
      // ligne de base n'est pas faite : sans donnée, l'app ne devine pas.
      lowVariability: variability.low,
    }
  }, [state, today, intent, upcoming, commuteSessions, peaks, variability])

  /**
   * La charge de la semaine : ce qui est fait, ce qui est prévu, ce qu'il reste
   * (E.23, révisé en E.28).
   *
   * Les trajets marqués et les séances posées comptent d'avance : sans eux la
   * jauge affichait zéro six jours sur sept, alors que le E.2 pesait déjà ces
   * mêmes journées comme chargées.
   */
  /**
   * La répartition d'intensité (E.29), lue sur les courbes déjà mesurées.
   *
   * `observed` porte les bandes de chaque journée depuis que `measurePeaks`
   * les compte : la répartition ne coûte donc aucune lecture de plus.
   */
  const spread = useMemo(
    () => spreadOf(observed, today),
    // Même raison que la dose : `observed` est reconstruit à chaque rendu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, today, peaks],
  )

  const dose = useMemo(
    () => doseOf({ days: observed, today, planned: context?.planned ?? [], hold }),
    // `observed` est reconstruit à chaque rendu ; c'est l'état qui dit quand
    // il a vraiment changé.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, today, hold, context],
  )

  // Le plan est recalculé en entier à chaque refus, jamais rapiécé : les
  // séances suivantes sont placées par rapport à la première (E.14).
  const planned2 = useMemo(() => {
    const refusals: JournalEntry[] = []
    const suggestions = context
      ? planWeek({
          context,
          today,
          fitness,
          refused: refusedKeys(choices),
          notBefore: choices.notBefore,
          levels,
          reprise,
          decharge: unloading,
          hold,
          onRefused: (refusal) => refusals.push(refusal),
        })
      : []
    return { suggestions, refusals }
  }, [context, today, fitness, choices, levels, reprise, unloading, hold])

  const suggestions = planned2.suggestions

  // Le journal se tient à part du calcul : `planWeek` reste déterministe, et
  // l'écriture dans le téléphone est un effet, donc elle vit dans un effet.
  const [journal, setJournal] = useState<Journal>(() => loadJournal())
  useEffect(() => {
    if (state.status !== 'ok') return
    setJournal(recordRefusals(today, planned2.refusals))

    // Ce qui est proposé aujourd'hui se retient : c'est la seule trace qui
    // restera si l'athlète le fait sans rien encoder (E.22).
    const next = rememberProposals(
      today,
      planned2.suggestions.flatMap((one) => {
        const zone = zoneOfFamily(one.workout.family.key)
        if (!zone) return []
        return [
          {
            date: one.date,
            zone,
            seconds: one.workout.seconds,
            work: workSeconds(one.workout.blocks, zone),
            name: one.workout.name,
          },
        ]
      }),
    )

    // Ne remplacer l'état que si le contenu a changé : un nouveau tableau à
    // chaque rendu relancerait le calcul des niveaux, donc du plan, donc de
    // cet effet — l'app tournerait en rond sans jamais se stabiliser.
    setRemembered((current) =>
      JSON.stringify(current) === JSON.stringify(next) ? current : next,
    )
  }, [state.status, today, planned2])

  const days = useMemo(() => {
    if (state.status !== 'ok' || !context) return []
    return buildCalendar({
      events: state.data.events,
      context,
      today,
      commutes,
      suggestions,
    })
  }, [state, context, today, commutes, suggestions])

  const planned = days.reduce((total, day) => total + day.items.length, 0)

  /**
   * La seule écriture qui reste (E.19).
   *
   * Elle va dans le sens du retrait : elle défait ce qui a été écrit avant, et
   * elle demande un appui long de deux secondes côté carte.
   */
  const remove = async (eventId: string) => {
    setRemovals((current) => ({ ...current, [eventId]: { status: 'deleting' } }))

    const outcome = await deleteEvent(credentials, eventId)
    if (outcome.kind !== 'ok') {
      const { title, detail } = describe(outcome)
      setRemovals((current) => ({
        ...current,
        [eventId]: { status: 'failed', detail: `${title} — ${detail}` },
      }))
      return
    }

    // Le calendrier vient de changer : le relire est la seule façon d'être
    // sûr que le plan porte sur l'état réel.
    window.setTimeout(() => void load(), 800)
  }

  if (state.status === 'loading') {
    return (
      <>
        {children}
        <section className="card">
          <h2>Ta semaine</h2>
          <p className="muted">Lecture d’intervals.icu…</p>
        </section>
      </>
    )
  }

  if (state.status === 'error') {
    return (
      <>
        {children}
        <section className="card">
          <div className="card-head">
            <h2>Ta semaine</h2>
            <button className="button button-small button-ghost" onClick={() => void load()}>
              Réessayer
            </button>
          </div>
          <p className="error">
            <strong>{state.title}</strong>
            <br />
            {state.detail}
          </p>
        </section>
      </>
    )
  }

  return (
    <>
    {children}

    <section className="card">
      <div className="card-head">
        <h2>Les deux prochaines semaines</h2>
        <button className="button button-small button-ghost" onClick={() => void load()}>
          Actualiser
        </button>
      </div>

      {state.data.cachedAt !== null ? (
        <p className="notice small">
          <strong>Pas de réseau.</strong> Voici ta dernière lecture, {describeAge(state.data.cachedAt)}
          . Ce que tu as fait depuis n’y est pas.
        </p>
      ) : null}

      {state.data.gaps.map((gap) => (
        <p className="notice small" key={gap}>
          {gap}
        </p>
      ))}

      {/* Quand l'athlète a écarté ce qui restait, c'est `Week` qui le dit — et
          il le dit juste. `Empty` invoquerait la fraîcheur ou les jours pris,
          ce qui serait faux et se contredirait à l'écran. */}
      {planned === 0 && suggestions.length === 0 && !hasPlanPreferences(choices) ? (
        <Empty read={upcoming.length} />
      ) : null}

      <Week
        days={days}
        today={today}
        intent={intent}
        fitness={fitness}
        ramp={ramp}
        dose={dose}
        spread={spread}
        ftp={state.data.ftp}
        activities={state.data.activities}
        refusing={hasPlanPreferences(choices)}
        removals={removals}
        onCommute={(date) => setCommutes(cycleCommute(date))}
        onRefuse={(family) => setChoices(refuseFamily(family, today))}
        onPostpone={(date) => setChoices(postponePlan(date))}
        onReset={() => setChoices(resetPlanPreferences())}
        onDelete={(id) => void remove(id)}
      />

      {/* Le catalogue s'ouvre : l'app propose, mais si rien ne convient
          l'athlète choisit lui-même au lieu de refuser trois fois (E.27). */}
      <Catalogue levels={levels} ftp={state.data.ftp} />

      {context ? (
        <TestDay
          today={today}
          context={context}
          ftp={state.data.ftp}
          estimated={latestEstimatedFtp(wellness)}
        />
      ) : null}

      <p className="muted small">
        La pastille de chaque jour dit ton trajet — <strong>É</strong> pour électrique,
        <strong> M</strong> pour musculaire. Un tap la change, et le plan se recalcule autour.
      </p>

      <p className="muted small">
        Makigawa n’écrit rien dans intervals.icu. Elle lit ce que Garmin y verse, tient ce
        plan, et le corrige à chaque lecture. Un appui long de deux secondes sur une séance
        du calendrier fait apparaître de quoi la supprimer.
      </p>
    </section>

    <Progress levels={levels} completions={completions} today={today} journal={journal} />
    </>
  )
}

/**
 * Combien de jours en arrière le pic est mesuré.
 *
 * Quatorze, pas quarante-deux : au-delà, une journée ne pèse plus sur aucune
 * décision, et chaque courbe coûte un appel réseau.
 */
const PEAK_DAYS = 14

/** Combien de courbes on lit en parallèle. Assez pour ne pas traîner, assez
 *  peu pour ne pas noyer un téléphone en 4G. */
const PEAK_BATCH = 4

/**
 * Mesure le pic des activités récentes qui n'ont pas encore le leur (E.21).
 *
 * Une courbe ne change jamais : ce qui a été mesuré est gardé et jamais relu.
 * Un échec ne bloque rien — l'activité garde un pic inconnu, donc nul, et sa
 * journée pèse par sa charge seule.
 */
async function measurePeaks(
  credentials: Credentials,
  activities: readonly Activity[],
  today: DayKey,
): Promise<Peaks> {
  const known = loadPeaks()
  const floor = shiftDayKey(today, -PEAK_DAYS)

  const missing = activities.filter(
    (activity) =>
      activity.id !== null &&
      known[activity.id] === undefined &&
      (dayKeyOf(activity.startDateLocal) ?? '') >= floor,
  )
  if (missing.length === 0) return known

  const measured: Peaks = {}
  for (let from = 0; from < missing.length; from += PEAK_BATCH) {
    const batch = missing.slice(from, from + PEAK_BATCH)
    await Promise.all(
      batch.map(async (activity) => {
        const outcome = await fetchHeartRate(credentials, activity.id!)
        if (outcome.kind !== 'ok') return
        measured[activity.id!] = bandsOf(outcome.data, activity.movingTime)
      }),
    )
  }

  return savePeaks(measured)
}

/**
 * Le jour du test FTP (E.11), dit et non posé — et ce que les efforts en disent
 * déjà (E.24).
 *
 * Il reste la dernière inconnue du projet, et toutes les séances composées sont
 * écrites en pourcentage de cette FTP : corriger le profil les recalibre toutes
 * d'un coup.
 *
 * L'estimation d'intervals.icu ne corrige rien et ne change aucun watt affiché.
 * Elle dit seulement de combien le profil a dérivé, donc à quel point le test
 * devient urgent.
 */
function TestDay({
  today,
  context,
  ftp,
  estimated,
}: {
  today: DayKey
  context: ReturnType<typeof buildContext>
  ftp: number | null
  estimated: number | null
}) {
  const found = firstTestDay(today, AHEAD_DAYS, context)
  const protocole = ftpTest()
  const reading = readFtp(ftp, estimated)
  const softness = saySoftness(reading)

  return (
    <div className="now">
      <p className="now-label">Le test qui manque</p>
      <p className="muted small">
        <strong>{FTP_TEST_NAME}</strong>
        <br />
        {'date' in found
          ? `Il tiendrait ${formatRelativeDay(found.date, today)}.`
          : explainTest(found.refusal)}{' '}
        Le jour où tu corriges ta FTP, toutes les séances proposées se recalibrent d’un
        coup, puisqu’elles sont écrites en pourcentage.
      </p>

      {softness ? (
        <p className="muted small">
          Ton profil dit <strong>{reading.profile} W</strong>. Tes efforts disent{' '}
          <strong>{Math.round(reading.estimated!)} W</strong>. {softness} C’est une
          estimation d’intervals.icu, pas une mesure : elle ne corrige rien toute seule.
        </p>
      ) : null}

      <Profile blocks={protocole.blocks} />

      <details className="structure">
        <summary>Le protocole — {formatDuration(protocole.seconds)}</summary>
        <pre>{toNotation(protocole)}</pre>
      </details>
    </div>
  )
}

/**
 * Ce que l'app affiche quand il n'y a rien à afficher.
 *
 * Un écran vide se lit comme une panne. Celui-ci dit ce qui manque, pourquoi
 * ce n'est pas une erreur, et ce qu'il faut faire — parce qu'une app sans
 * séances à placer est exactement aussi utile qu'un calendrier vide, et que
 * ce n'est pas à l'athlète de le deviner.
 */
function Empty({ read }: { read: number }) {
  return (
    <div className="empty">
      <p className="empty-head">Rien de prévu sur les {AHEAD_DAYS} prochains jours.</p>
      <p className="muted small">
        D’habitude elle te propose un plan d’elle-même. Là, elle n’a rien trouvé qui tienne —
        soit la fraîcheur est trop basse, soit les jours à venir sont déjà pris, soit tes
        trajets suffisent à charger la semaine. Elle en propose moins plutôt que de proposer
        mal.
      </p>
      {read > 0 ? (
        <p className="muted small">
          {read} événement{read > 1 ? 's ont' : ' a'} bien été lu{read > 1 ? 's' : ''} sur cette
          période, mais aucun n’est une séance — ce sont des repères de calendrier, comme un
          début de saison.
        </p>
      ) : null}
    </div>
  )
}

/**
 * Les quatorze jours, tous, y compris les vides.
 *
 * Une grille de jours vides donnait « un air de reproche » tant que l'app
 * proposait d'écrire. Elle ne propose plus rien à écrire : un jour vide est
 * devenu une information — c'est là qu'il reste de la place — et le rythme
 * d'une semaine ne se lit que sur la suite complète.
 */
function buildCalendar({
  events,
  context,
  today,
  commutes,
  suggestions,
}: {
  events: readonly CalendarEvent[]
  context: ReturnType<typeof buildContext>
  today: DayKey
  commutes: CommuteMarks
  suggestions: readonly import('../workouts/week').Suggestion[]
}): CalendarDay[] {
  const byDay = new Map<DayKey, { event: CalendarEvent; proposal: Proposal }[]>()

  for (const event of events) {
    if (!isSession(event)) continue
    const date = dayKeyOf(event.startDateLocal)
    if (!date || date < today) continue

    const session = context.planned.find((planned) => planned.id === event.id)
    const proposal: Proposal = session ? propose(session, context) : { action: 'garder' }

    const sameDay = byDay.get(date)
    if (sameDay) sameDay.push({ event, proposal })
    else byDay.set(date, [{ event, proposal }])
  }

  return Array.from({ length: AHEAD_DAYS }, (_, ahead) => {
    const date = shiftDayKey(today, ahead)
    return {
      date,
      weight: weighDay(
        context.days.find((day) => day.date === date),
        date,
        context.planned,
      ),
      commute: commuteOn(commutes, date),
      items: byDay.get(date) ?? [],
      suggestion: suggestions.find((one) => one.date === date) ?? null,
    }
  })
}

/** Un échec d'API, rendu en une phrase qui dit quoi corriger. */
function describe(outcome: Exclude<ApiOutcome<unknown>, { kind: 'ok' }>): {
  title: string
  detail: string
} {
  switch (outcome.kind) {
    case 'unauthorized':
      return {
        title: 'Clé refusée',
        detail: 'intervals.icu a répondu, mais rejette ces identifiants.',
      }
    case 'httpError':
      return {
        title: `Erreur HTTP ${outcome.status}`,
        detail:
          outcome.status === 404
            ? 'intervals.icu ne connaît pas cette adresse.'
            : outcome.detail || 'intervals.icu a répondu, mais pas ce qui était attendu.',
      }
    case 'blocked':
      return {
        title: 'Appel impossible',
        detail: `Le navigateur ou le réseau a bloqué la demande. Détail : ${outcome.detail}`,
      }
  }
}
