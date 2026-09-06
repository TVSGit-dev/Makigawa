/**
 * Le curseur d'intention (section 5, partie D).
 *
 * L'athlète choisit son mode à la semaine. Le mode ne change pas les règles,
 * il en déplace les seuils.
 */

export type Intent = 'prudent' | 'normal' | 'ambitieux'

export type IntentRules = {
  /** Sous ce TSB, plus aucune séance de qualité n'est tenue. */
  tsbFloor: number
  /** Journées chargées planifiées tolérées sur sept jours. */
  chargedDaysPerWeek: number
  /** Une seule séance de qualité par semaine. */
  oneQualityPerWeek: boolean
  /** Deux journées chargées consécutives tolérées. */
  allowsConsecutiveCharged: boolean
}

export const INTENTS: Record<Intent, IntentRules> = {
  prudent: {
    tsbFloor: -10,
    chargedDaysPerWeek: 1,
    oneQualityPerWeek: true,
    allowsConsecutiveCharged: false,
  },
  normal: {
    tsbFloor: -20,
    chargedDaysPerWeek: 2,
    oneQualityPerWeek: false,
    allowsConsecutiveCharged: false,
  },
  ambitieux: {
    tsbFloor: -30,
    chargedDaysPerWeek: 3,
    oneQualityPerWeek: false,
    allowsConsecutiveCharged: true,
  },
}

/**
 * Le garde-fou du A.3, non négociable : le mode ambitieux est borné à deux
 * semaines consécutives et suivi d'une décharge.
 *
 * La surcharge fonctionnelle ne devient un progrès que si l'on en sort.
 * Creuser sans remonter ne creuse pas plus profond — ça change d'état, et
 * l'autre état se paie en mois. L'app impose donc ici, là où elle suggère
 * ailleurs : la perte de lucidité fait partie des symptômes.
 */
export const MAX_AMBITIOUS_WEEKS = 2

/**
 * Le mode autorisé pour la semaine qui vient, au vu des précédentes. Les
 * semaines sont données de la plus ancienne à la plus récente.
 */
export function allowedIntent(wanted: Intent, recentWeeks: readonly Intent[]): Intent {
  if (wanted !== 'ambitieux') return wanted

  const streak = trailingAmbitiousWeeks(recentWeeks)
  return streak >= MAX_AMBITIOUS_WEEKS ? 'prudent' : 'ambitieux'
}

function trailingAmbitiousWeeks(weeks: readonly Intent[]): number {
  let streak = 0
  for (let i = weeks.length - 1; i >= 0 && weeks[i] === 'ambitieux'; i -= 1) streak += 1
  return streak
}
