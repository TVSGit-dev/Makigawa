/**
 * La FTP estimée, et ce qu'elle vaut la peine de dire (section 5, E.24).
 *
 * Le test FTP est la seule case jamais cochée du projet. En attendant,
 * intervals.icu estime une FTP en continu sur les efforts déjà produits, et
 * l'app la lit sans rien demander de plus (`estimatedFtpOf`).
 *
 * Ce module ne fait qu'une chose : décider s'il y a quelque chose à dire. Il ne
 * corrige rien — la FTP du profil appartient à intervals.icu, et le projet ne
 * recalcule jamais ce qu'il lit.
 */

/**
 * En dessous de cet écart, l'app se tait.
 *
 * Une estimation bouge d'un effort à l'autre ; trois pour cent d'écart n'est
 * pas une nouvelle, c'est le bruit de la méthode. Cinq pour cent sur une FTP de
 * 220 W, c'est onze watts — l'ordre de grandeur d'une vraie dérive.
 */
export const FTP_GAP_MIN = 0.05

export type FtpReading = {
  /** Ce que dit le profil d'intervals.icu. */
  profile: number | null
  /** Ce que disent les efforts, quand intervals.icu l'estime. */
  estimated: number | null
  /**
   * L'écart relatif, positif quand l'estimation dépasse le profil.
   *
   * `null` dès qu'il manque un des deux nombres : on ne compare pas ce qu'on
   * n'a pas.
   */
  gap: number | null
  /** Vrai quand l'écart dépasse le seuil et mérite d'être affiché. */
  worthSaying: boolean
}

export function readFtp(profile: number | null, estimated: number | null): FtpReading {
  const usable = profile !== null && profile > 0 && estimated !== null && estimated > 0
  const gap = usable ? (estimated - profile) / profile : null

  return {
    profile,
    estimated,
    gap,
    worthSaying: gap !== null && Math.abs(gap) >= FTP_GAP_MIN,
  }
}

/**
 * Le sens de l'écart, dit dans les termes de l'athlète.
 *
 * Une FTP de profil trop basse ne rend pas les séances « fausses » : elle les
 * rend **douces**, puisque toutes leurs cibles en sont un pourcentage. C'est
 * cette conséquence-là qui l'intéresse, pas le nombre.
 */
export function saySoftness(reading: FtpReading): string | null {
  if (!reading.worthSaying || reading.gap === null) return null
  const percent = Math.round(Math.abs(reading.gap) * 100)
  return reading.gap > 0
    ? `Tes séances sont donc environ ${percent} % trop douces.`
    : `Tes séances sont donc environ ${percent} % trop dures.`
}
