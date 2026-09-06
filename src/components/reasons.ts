/**
 * Les phrases de l'app.
 *
 * Le E.7 demande que l'app affiche sa décision **avec sa raison**. Un code de
 * refus n'est pas une raison ; c'est ici qu'il en devient une.
 *
 * Deux règles de ton, qui viennent des contraintes d'interface : jamais de
 * reproche, et jamais de dette. Une séance qu'on laisse tomber n'a pas été
 * manquée — elle n'a simplement pas eu lieu.
 */

import { formatRelativeDay } from '../calendar/dates'
import type { Proposal, Refusal } from '../rules/decide'
import type { TestRefusal } from '../workouts/ftp-test'
import type { Intent } from '../rules/intent'
import type { DayKey } from '../calendar/dates'

const INTENT_NAMES: Record<Intent, string> = {
  prudent: 'prudent',
  normal: 'normal',
  ambitieux: 'ambitieux',
}

/** Pourquoi aujourd'hui n'est pas un bon jour pour cette séance. */
export function explain(refusal: Refusal, intent: Intent, today: DayKey): string {
  switch (refusal.code) {
    case 'veille-chargee':
      return 'La veille a été une journée chargée.'
    case 'deux-jours-charges':
      return 'Les deux derniers jours ont déjà demandé quelque chose.'
    case 'lendemain-charge':
      return 'Le lendemain est déjà une journée chargée.'
    case 'tsb-sous-plancher':
      return `Ta fraîcheur est à ${Math.round(refusal.tsb)}, sous le plancher de ${refusal.floor} du mode ${INTENT_NAMES[intent]}.`
    case 'quota-hebdomadaire':
      return `Cela ferait ${refusal.charged} journées chargées sur sept jours ; le mode ${INTENT_NAMES[intent]} en tient ${refusal.allowed}.`
    case 'une-seule-par-semaine':
      return 'Le mode prudent garde une seule séance de qualité par semaine, et elle est déjà placée.'
    case 'qualite-voisine':
      return `Une autre séance de qualité est prévue ${formatRelativeDay(refusal.date, today)} : deux ne se suivent jamais.`
    case 'force-trop-proche':
      return `Du renfo et de l’endurance demandent 48 h d’écart, et l’autre est ${formatRelativeDay(refusal.date, today)}.`
    case 'renfo-sur-journee-chargee':
      return 'Le renfo ne se pose pas sur une journée déjà chargée.'
  }
}

/** Ce que l'app propose, en une phrase qui dit ce qui va se passer. */
export function announce(proposal: Proposal, today: DayKey): string {
  switch (proposal.action) {
    case 'garder':
      return 'Le jour convient.'
    case 'decaler':
      return `La déplacer à ${formatRelativeDay(proposal.to, today)}`
    case 'reduire':
      return 'La faire en version courte, moitié moins longue'
    case 'abandonner':
      return 'La laisser tomber'
  }
}

/** Le bouton qui applique la proposition. Il dit ce qu'il fait, au présent. */
export function actionLabel(proposal: Proposal): string {
  switch (proposal.action) {
    case 'garder':
      return ''
    case 'decaler':
      return 'Déplacer'
    case 'reduire':
      return 'Raccourcir'
    case 'abandonner':
      return 'Laisser tomber'
  }
}

/**
 * Ce que l'app a écrit, une fois que c'est fait. Au passé et sans
 * félicitations : elle rend compte, elle ne récompense pas.
 */
export function confirmation(proposal: Proposal, today: DayKey): string {
  switch (proposal.action) {
    case 'garder':
      return ''
    case 'decaler':
      return `Déplacée à ${formatRelativeDay(proposal.to, today)}.`
    case 'reduire':
      return 'Raccourcie de moitié dans intervals.icu.'
    case 'abandonner':
      return 'Retirée du calendrier.'
  }
}

/**
 * Le type d'activité, dit en français.
 *
 * La distinction électrique / musculaire est une priorité déclarée du projet :
 * ce sont deux mondes qui ne se comparent pas, et l'app ne doit jamais laisser
 * confondre les deux.
 */
export function activityLabel(type: string | null): string {
  switch (type) {
    case 'EBikeRide':
      return 'électrique'
    case 'Ride':
      return 'musculaire'
    case 'VirtualRide':
      return 'home-trainer'
    case 'WeightTraining':
      return 'renfo'
    case 'Run':
      return 'course'
    case 'Walk':
    case 'Hike':
      return 'marche'
    case 'Swim':
      return 'natation'
    default:
      return type ?? 'séance'
  }
}

/** La classe CSS qui va avec, pour que la distinction se voie sans se lire. */
export function activityTone(type: string | null): string {
  if (type === 'EBikeRide') return 'chip-electric'
  if (type === 'Ride') return 'chip-muscular'
  if (type === 'VirtualRide') return 'chip-indoor'
  if (type === 'WeightTraining') return 'chip-force'
  return 'chip-other'
}

/**
 * Pourquoi aucun jour ne convient pour un test (E.11).
 *
 * Dire laquelle des quatre conditions manque, plutôt que de laisser chercher :
 * un test raté coûte un cycle, pas une séance.
 */
export function explainTest(refusal: TestRefusal): string {
  switch (refusal.code) {
    case 'fraicheur-negative':
      return `Ta fraîcheur est à ${Math.round(refusal.tsb)}. Pour un test il la faut positive — c’est la seule chose du projet qui exige mieux que « pas trop fatigué ».`
    case 'jour-deja-charge':
      return 'Chacun des jours à venir porte déjà du travail.'
    case 'veille-pas-legere':
      return 'Il faut deux journées légères avant, et la veille ne l’est jamais sur cette période.'
    case 'avant-veille-pas-legere':
      return 'Il faut deux journées légères avant, et l’avant-veille ne l’est jamais sur cette période.'
    case 'lendemain-charge':
      return 'Un test la veille d’une grosse journée gâche les deux.'
    case 'regle-ordinaire':
      return 'Les règles habituelles s’y opposent déjà — une séance de qualité trop proche, ou le quota de la semaine.'
  }
}

const WEIGHTS: Record<string, string> = {
  legere: 'journée légère',
  moyenne: 'journée moyenne',
  chargee: 'journée chargée',
}

export function weightLabel(weight: string): string {
  return WEIGHTS[weight] ?? weight
}
