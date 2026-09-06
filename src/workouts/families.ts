/**
 * Les familles de séances, relevées sur les seize séances de l'athlète.
 *
 * **Tous les chiffres viennent d'intervals.icu, l'organisation vient de
 * Makigawa** — décision du 6 septembre 2026. Concrètement : les intensités
 * sont écrites en pourcentage de FTP, jamais en watts, donc c'est la FTP
 * d'intervals.icu qui les résout ; et la charge n'est jamais envoyée, c'est
 * intervals.icu qui la calcule depuis la structure.
 *
 * Ce que Makigawa apporte est l'organisation : combien de blocs, combien de
 * répétitions, quel échauffement, quelle progression d'une semaine à l'autre.
 *
 * Les motifs ci-dessous sont relevés tels quels sur les séances fournies. Deux
 * familles n'y figuraient pas — endurance et tempo — et sont ajoutées parce
 * qu'un catalogue qui ne contient que du seuil et au-dessus est inutilisable
 * une semaine de décharge, et contraire à la répartition d'intensité de la
 * partie B.
 */

/** Un bloc : une durée, et une cible en pourcentage de FTP. */
export type Block = {
  seconds: number
  percent: number
}

export type Family = {
  key: string
  name: string
  /** Ce que la séance construit, en une phrase. */
  purpose: string
  /**
   * Le motif répété. Une suite de blocs plutôt qu'un simple travail/repos :
   * la navette lactate en compte trois, et forcer la paire l'aurait exclue.
   */
  pattern: Block[]
  /** Répétitions du motif dans un bloc, du plus court au plus long. */
  reps: readonly number[]
  /** Nombre de blocs possibles. */
  sets: readonly number[]
  /** Récupération entre deux blocs, en secondes. */
  between: number
  /**
   * La longueur maximale d'un bloc de travail, en secondes.
   *
   * Relevée sur les séances fournies, où le plus long bloc continu fait vingt
   * minutes. Sans cette borne, chercher la durée la plus juste produisait des
   * monstres — trente minutes d'over-unders d'affilée là où la séance de
   * référence en fait deux fois quinze avec de la récupération entre. La durée
   * totale était bonne, la séance ne l'était pas.
   */
  maxBlock: number
  /** Les ouvertures courtes à l'échauffement, que les séances dures exigent. */
  openers: boolean
}

/** La longueur d'un bloc de travail, pour un nombre de répétitions donné. */
export function blockSeconds(family: Family, reps: number): number {
  return reps * family.pattern.reduce((total, block) => total + block.seconds, 0)
}

/**
 * L'échauffement commun, relevé à l'identique sur les séances de seuil et de
 * sweet spot : cinq minutes faciles, une rampe d'une minute par palier, puis
 * quatre minutes de récupération avant le travail.
 */
export const WARMUP: Block[] = [
  { seconds: 300, percent: 45 },
  { seconds: 60, percent: 60 },
  { seconds: 60, percent: 70 },
  { seconds: 60, percent: 80 },
  { seconds: 60, percent: 90 },
  { seconds: 240, percent: 65 },
]

/**
 * Les ouvertures : deux sprints très courts avant une séance dure.
 *
 * Relevées sur les trois séances de 30/30 et sur les deux tests. Elles ne
 * fatiguent pas — quinze secondes — mais elles réveillent le haut de la
 * filière avant qu'on lui demande de travailler.
 */
export const OPENERS: Block[] = [
  { seconds: 15, percent: 200 },
  { seconds: 60, percent: 55 },
  { seconds: 15, percent: 200 },
  { seconds: 60, percent: 55 },
]

/**
 * L'échauffement court, pour les séances de trente minutes.
 *
 * Les séances fournies duraient toutes une heure ou plus, et leur échauffement
 * en occupait treize minutes — sur trente, il ne resterait rien. Le raccourcir
 * fait partie de l'organisation, qui est la part de Makigawa.
 */
export const WARMUP_SHORT: Block[] = [
  { seconds: 180, percent: 45 },
  { seconds: 60, percent: 65 },
  { seconds: 60, percent: 80 },
  { seconds: 120, percent: 60 },
]

export const COOLDOWN: Block[] = [{ seconds: 300, percent: 45 }]

export const COOLDOWN_SHORT: Block[] = [{ seconds: 180, percent: 45 }]

/** La récupération qui précède immédiatement le retour au calme. */
export const SETTLE: Block = { seconds: 240, percent: 65 }

export const FAMILIES: readonly Family[] = [
  {
    key: 'endurance',
    name: 'Endurance',
    purpose: 'Construit la base sans coûter de fraîcheur. La séance par défaut.',
    pattern: [{ seconds: 600, percent: 65 }],
    reps: [1],
    sets: [1, 2, 3, 4, 5, 6],
    between: 0,
    maxBlock: 3600,
    openers: false,
  },
  {
    key: 'tempo',
    name: 'Tempo',
    purpose: 'Le premier vrai travail : soutenu, mais tenable longtemps.',
    pattern: [{ seconds: 480, percent: 80 }],
    reps: [1],
    sets: [1, 2, 3, 4],
    between: 240,
    maxBlock: 600,
    openers: false,
  },
  {
    key: 'sweet-spot',
    name: 'Sweet spot',
    purpose:
      'Le meilleur rapport rendement / temps. Alterne juste au-dessus et juste en dessous du seuil.',
    pattern: [
      { seconds: 90, percent: 95 },
      { seconds: 90, percent: 85 },
    ],
    reps: [4, 5, 6, 7],
    sets: [1, 2, 3],
    between: 240,
    maxBlock: 1200,
    openers: false,
  },
  {
    key: 'seuil',
    name: 'Seuil',
    purpose:
      'Repousse la FTP elle-même. Les pointes au-dessus obligent à recycler le lactate en roulant.',
    pattern: [
      { seconds: 120, percent: 95 },
      { seconds: 30, percent: 110 },
    ],
    reps: [3, 4, 6, 8],
    sets: [1, 2, 3],
    between: 300,
    maxBlock: 1200,
    openers: false,
  },
  {
    key: 'vo2-30-30',
    name: 'VO2 max 30/30',
    purpose:
      'Trente secondes ne suffisent pas à saturer le lactate, mais le cœur, lui, reste au plafond.',
    pattern: [
      { seconds: 30, percent: 115 },
      { seconds: 30, percent: 65 },
    ],
    reps: [6, 8, 10, 12],
    sets: [1, 2, 3],
    between: 180,
    maxBlock: 720,
    openers: true,
  },
  {
    key: 'vo2-30-15',
    name: 'VO2 max 30/15',
    purpose: 'La même chose, avec deux fois moins de répit. Plus court, plus dur.',
    pattern: [
      { seconds: 30, percent: 115 },
      { seconds: 15, percent: 65 },
    ],
    reps: [8, 10, 12],
    sets: [1, 2, 3],
    between: 240,
    maxBlock: 540,
    openers: true,
  },
  {
    key: 'navette',
    name: 'Navette lactate',
    purpose:
      'Une pointe, un long soutenu, une pointe maximale : apprend au corps à brûler le lactate qu’il vient de produire.',
    pattern: [
      { seconds: 20, percent: 150 },
      { seconds: 140, percent: 85 },
      { seconds: 20, percent: 200 },
    ],
    reps: [1],
    sets: [2, 3, 5, 6],
    between: 180,
    maxBlock: 180,
    openers: true,
  },
]

export function familyOf(key: string): Family | undefined {
  return FAMILIES.find((family) => family.key === key)
}
