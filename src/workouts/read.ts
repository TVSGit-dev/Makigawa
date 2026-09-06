/**
 * Relire une structure écrite dans intervals.icu.
 *
 * L'app compose des séances en pourcentage de FTP, mais le calendrier en
 * contient d'autres : celles de la bibliothèque, celles écrites à la main, en
 * zones plutôt qu'en pourcentages. Pour dessiner le profil d'une séance, il
 * faut savoir lire les deux.
 *
 * Rien n'est deviné : une ligne qu'on ne comprend pas est ignorée, et une
 * séance dont aucune ligne ne se lit n'a simplement pas de profil.
 */

import type { Block } from './families'

/** `- 20m 90%`, `- 90s z4`, `- 5m z2`. */
const LINE = /^\s*-\s*(\d+)\s*(m|s)\s+(?:(\d+)\s*%|z([1-6]))\s*$/i

/**
 * Le centre de chaque zone de puissance, en pourcentage de FTP.
 *
 * Une zone est un intervalle ; pour dessiner une barre il faut un nombre. Le
 * milieu est le choix le moins trompeur — et ces bornes sont celles
 * d'intervals.icu, relevées dans le profil de l'athlète, pas inventées ici.
 */
const ZONE_CENTRES: Record<number, number> = {
  1: 40,
  2: 65,
  3: 83,
  4: 98,
  5: 113,
  6: 135,
}

export function blocksOf(description: string | null): Block[] {
  if (!description) return []

  const blocks: Block[] = []
  for (const line of description.split('\n')) {
    const match = LINE.exec(line)
    if (!match) continue

    const [, amount, unit, percent, zone] = match
    if (!amount || !unit) continue

    const seconds = Number(amount) * (unit.toLowerCase() === 'm' ? 60 : 1)
    const target = percent ? Number(percent) : ZONE_CENTRES[Number(zone)]
    if (target === undefined) continue

    blocks.push({ seconds, percent: target })
  }

  return blocks
}
