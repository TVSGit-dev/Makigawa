import { describe, expect, it } from 'vitest'
import { doseOf, perDay, DOSE_WEEKS } from './dose'
import { RAMP_SHARE } from './ramp'
import type { DayRecord, PlannedSession } from './types'

/** Une semaine entière à charge constante, du lundi au dimanche. */
const week = (monday: string, daily: number): DayRecord[] =>
  Array.from({ length: 7 }, (_, i) => {
    const date = new Date(`${monday}T00:00:00`)
    date.setDate(date.getDate() + i)
    return {
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      observedLoad: daily,
      peakSeconds: 0,
    }
  })

// Lundis : 17, 24, 31 août ; 7 septembre 2026. On se place le mercredi 9.
const TROIS = [...week('2026-08-17', 40), ...week('2026-08-24', 50), ...week('2026-08-31', 45)]

describe('la dose de la semaine', () => {
  it('additionne les charges d’intervals.icu, sans en calculer aucune', () => {
    const dose = doseOf({ days: TROIS, today: '2026-09-09' })
    expect(dose.past.map((one) => one.load)).toEqual([280, 350, 315])
    expect(dose.past).toHaveLength(DOSE_WEEKS)
  })

  it('vise dix pour cent de plus que la moyenne des semaines complètes', () => {
    const dose = doseOf({ days: TROIS, today: '2026-09-09' })
    const moyenne = (280 + 350 + 315) / 3
    expect(dose.target).toBe(Math.round(moyenne * (1 + RAMP_SHARE)))
  })

  it('tient l’objectif quand la forme monte déjà trop vite', () => {
    // Le plafond du E.20 gouverne aussi la dose : on ne progresse pas en
    // ajoutant à ce qui monte déjà.
    const monte = doseOf({ days: TROIS, today: '2026-09-09', hold: true })
    const libre = doseOf({ days: TROIS, today: '2026-09-09' })
    expect(monte.target).toBeLessThan(libre.target!)
    expect(monte.target).toBe(Math.round((280 + 350 + 315) / 3))
  })

  it('compte ce que la semaine en cours a déjà porté', () => {
    const days = [...TROIS, ...week('2026-09-07', 30)]
    expect(doseOf({ days, today: '2026-09-09' }).banked).toBe(210)
  })

  it('ne devine pas un objectif sans semaine observée', () => {
    const dose = doseOf({ days: [], today: '2026-09-09' })
    expect(dose.target).toBeNull()
    expect(dose.remaining).toBe(0)
  })

  it('ignore les semaines vides plutôt que de tirer la moyenne vers le bas', () => {
    const days = [...week('2026-08-31', 45)]
    expect(doseOf({ days, today: '2026-09-09' }).target).toBe(Math.round(315 * (1 + RAMP_SHARE)))
  })
})

describe('ce qu’il reste à placer', () => {
  it('ne descend jamais sous zéro : dépasser n’est pas une dette', () => {
    const days = [...TROIS, ...week('2026-09-07', 200)]
    const dose = doseOf({ days, today: '2026-09-09' })
    expect(dose.banked).toBeGreaterThan(dose.target!)
    expect(dose.remaining).toBe(0)
    expect(perDay(dose)).toBe(0)
  })

  it('répartit le reste sur les jours qui viennent', () => {
    // Mercredi : il reste mercredi, jeudi, vendredi, samedi, dimanche.
    const dose = doseOf({ days: TROIS, today: '2026-09-09' })
    expect(dose.daysLeft).toBe(5)
    expect(perDay(dose)).toBe(Math.round(dose.remaining / 5))
  })

  it('redistribue tout seul quand un jour passe sans rien', () => {
    // La part quotidienne monte parce qu'il reste moins de jours, pas parce
    // qu'une dette s'accumule : le total visé, lui, n'a pas bougé.
    const lundi = doseOf({ days: TROIS, today: '2026-09-07' })
    const vendredi = doseOf({ days: TROIS, today: '2026-09-11' })
    expect(vendredi.remaining).toBe(lundi.remaining)
    expect(perDay(vendredi)).toBeGreaterThan(perDay(lundi))
  })

  it('ne réclame plus rien le dernier jour passé', () => {
    const dimanche = doseOf({ days: TROIS, today: '2026-09-13' })
    expect(dimanche.daysLeft).toBe(1)
  })
})

/** Un jour isolé, tel que `toDayRecords` le produirait. */
const jour = (date: string, load: number): DayRecord => ({
  date,
  observedLoad: load,
  peakSeconds: 0,
})

/** Un trajet marqué, ou une séance posée dans intervals.icu. */
const prevu = (date: string, load: number): PlannedSession => ({
  id: `p:${date}`,
  date,
  load,
  kind: 'autre',
  commute: true,
})

describe('ce qui est prévu compte aussi (E.28)', () => {
  // On se place le mercredi 9 septembre 2026. La semaine court du lundi 7 au
  // dimanche 13.
  const today = '2026-09-09'

  it('compte les trajets marqués sur les jours qui restent', () => {
    // Sans eux la jauge affichait zéro six jours sur sept, alors que le E.2
    // pesait déjà ces mêmes journées comme chargées.
    const dose = doseOf({
      days: TROIS,
      today,
      planned: [prevu(today, 35), prevu('2026-09-10', 35), prevu('2026-09-11', 115)],
    })
    expect(dose.done).toBe(0)
    expect(dose.planned).toBe(185)
    expect(dose.banked).toBe(185)
  })

  it('ne projette rien sur le passé', () => {
    // Un trajet marqué mais non fait n'a rien pesé : intervals.icu tient la
    // vérité de ce qui a été fait (E.19).
    const dose = doseOf({ days: TROIS, today, planned: [prevu('2026-09-07', 115)] })
    expect(dose.planned).toBe(0)
    expect(dose.banked).toBe(0)
  })

  it('prend le plus grand des deux, jamais leur somme', () => {
    // Le trajet du matin peut être remonté quand celui du soir ne l'est pas,
    // et la marque vaut l'aller-retour.
    const dose = doseOf({
      days: [...TROIS, jour(today, 20)],
      today,
      planned: [prevu(today, 35)],
    })
    expect(dose.done).toBe(20)
    expect(dose.planned).toBe(15)
    expect(dose.banked).toBe(35)
  })

  it('ne rabote pas une journée plus lourde que prévu', () => {
    const dose = doseOf({
      days: [...TROIS, jour(today, 200)],
      today,
      planned: [prevu(today, 35)],
    })
    expect(dose.done).toBe(200)
    expect(dose.planned).toBe(0)
    expect(dose.banked).toBe(200)
  })

  it('retranche le prévu de ce qu’il reste à placer', () => {
    const sans = doseOf({ days: TROIS, today })
    const avec = doseOf({ days: TROIS, today, planned: [prevu(today, 35)] })
    expect(avec.remaining).toBe(sans.remaining - 35)
  })

  it('laisse les semaines passées telles quelles', () => {
    // L'objectif se calcule sur ce qui a été porté ; y mêler du prévu le
    // rendrait incomparable d'une semaine à l'autre.
    const dose = doseOf({ days: TROIS, today, planned: [prevu('2026-08-19', 500)] })
    expect(dose.past.map((one) => one.load)).toEqual([280, 350, 315])
  })

  it('ne compte pas une proposition, qui n’a pas de charge', () => {
    // L'app propose, l'athlète confirme (E.7) : compter d'avance ferait de
    // chaque proposition une dette.
    const proposition: PlannedSession = {
      id: 'candidate:makigawa',
      date: today,
      load: null,
      kind: 'endurance',
    }
    expect(doseOf({ days: TROIS, today, planned: [proposition] }).banked).toBe(0)
  })

  it('tombe à zéro à placer quand les trajets couvrent déjà la semaine', () => {
    // Le constat qui fonde le projet, enfin visible : ses trajets font
    // l'essentiel de son entraînement.
    const dose = doseOf({
      days: TROIS,
      today,
      planned: ['2026-09-09', '2026-09-10', '2026-09-11', '2026-09-12', '2026-09-13'].map((d) =>
        prevu(d, 115),
      ),
    })
    expect(dose.banked).toBeGreaterThan(dose.target!)
    expect(dose.remaining).toBe(0)
  })
})
