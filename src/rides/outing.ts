/**
 * La sortie longue, dite en distance (section 5, E.23).
 *
 * L'athlète part de la distance — c'est ainsi qu'il pense ses sorties. L'app
 * lui rend deux choses : une **allure à tenir**, ici, et ce que ses propres
 * sorties comparables ont réellement coûté, dans `history.ts`.
 *
 * La distinction entre les deux est le partage entre les deux fichiers.
 * L'allure est **décidée** par l'app, en pourcentage de FTP, et seulement
 * *affichée* en watts. La charge, elle, n'est **jamais décidée** : elle se lit.
 */

/** Les distances que l'athlète envisage, en kilomètres. */
export const DISTANCES = [30, 40, 50, 60, 80] as const

/**
 * L'allure d'une sortie longue, en pourcentage de FTP.
 *
 * Elle baisse quand la sortie s'allonge, ce qui est la seule chose que la
 * physiologie impose ici : on ne tient pas trois heures à l'allure d'une.
 * Les valeurs encadrent l'endurance et le bas du tempo — la zone où une sortie
 * longue se roule.
 */
const PACES: readonly { km: number; percent: number }[] = [
  { km: 30, percent: 78 },
  { km: 40, percent: 75 },
  { km: 50, percent: 72 },
  { km: 60, percent: 70 },
  { km: 80, percent: 66 },
]

export function paceFor(km: number): number {
  const found = [...PACES].reverse().find((one) => km >= one.km)
  return found?.percent ?? PACES[0]!.percent
}

/**
 * Le pourcentage résolu en watts, ou `null` si la FTP est inconnue.
 *
 * L'app ne décide jamais en watts : elle décide en pourcentage et affiche des
 * watts. Le jour du test FTP, tout se recalibre sans qu'une seule séance ne
 * bouge.
 */
export function wattsOf(percent: number, ftp: number | null): number | null {
  if (ftp === null || ftp <= 0) return null
  return Math.round((percent / 100) * ftp)
}
