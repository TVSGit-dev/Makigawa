/**
 * Les deux fenêtres de trajet, et comment s'habiller (section 5, E.31 et E.32).
 *
 * L'athlète part **entre 8 et 9 h** et rentre **entre 17 et 18 h**. La météo de
 * midi ne le concerne pas : il est au bureau.
 *
 * **Rien n'est calculé qui ne soit lu.** La température ressentie vient
 * d'Open-Meteo, qui y a déjà mis le vent et l'humidité ; les bandes
 * d'habillement sont relevées sur les guides du cyclisme, qui s'accordent à un
 * ou deux degrés près. Ce module choisit une fenêtre, compare deux nombres, et
 * décale d'un cran — rien de plus.
 */

import type { CommuteKind } from '../actions/commute'
import type { WeatherHour } from '../api/weather'
import type { DayKey } from '../calendar/dates'
import { garmentOf, lacks, type GarmentKey, type Wardrobe } from './garments'

/** Les heures que couvre chaque fenêtre, dans le fuseau de la prévision. */
export const MORNING_HOURS = [8, 9] as const
export const EVENING_HOURS = [17, 18] as const

export type Window = 'matin' | 'soir'

/** Ce qu'une fenêtre de trajet va offrir, une fois les heures ramassées. */
export type Sky = {
  /** Le ressenti le plus bas de la fenêtre, en °C. */
  felt: number | null
  /** La température de l'air la plus basse, en °C. */
  celsius: number | null
  /** La probabilité de pluie la plus haute, en pourcentage. */
  rainChance: number | null
  /** La rafale la plus forte, en km/h. */
  gust: number | null
  /** Le code WMO le plus sévère de la fenêtre. */
  code: number | null
}

/**
 * Les codes WMO, du plus clément au plus sévère.
 *
 * L'ordre du barème est déjà celui de la sévérité — zéro est un ciel clair,
 * quatre-vingt-dix-neuf un orage de grêle — donc le plus grand code d'une
 * fenêtre est bien le temps contre lequel on s'habille.
 */
const RAINY_FROM = 51
const SNOWY = new Set([71, 73, 75, 77, 85, 86])
const STORMY = new Set([95, 96, 99])
const FOGGY = new Set([45, 48])

/** À partir de quelle probabilité on s'habille pour la pluie. */
export const RAIN_LIKELY = 40

/**
 * Ce que la fenêtre va donner, en retenant **le plus défavorable** de ses
 * heures.
 *
 * Une moyenne lisserait précisément l'averse contre laquelle on s'habille : on
 * garde donc la température la plus basse, la pluie la plus probable et la
 * rafale la plus forte.
 */
export function skyOf(
  hours: readonly WeatherHour[],
  date: DayKey,
  window: Window,
): Sky | null {
  const wanted: readonly number[] = window === 'matin' ? MORNING_HOURS : EVENING_HOURS
  const inWindow = hours.filter((hour) => {
    if (!hour.time.startsWith(date)) return false
    return wanted.includes(Number(hour.time.slice(11, 13)))
  })
  if (inWindow.length === 0) return null

  const lowest = (pick: (hour: WeatherHour) => number | null): number | null => {
    const values = inWindow.map(pick).filter((one): one is number => one !== null)
    return values.length === 0 ? null : Math.min(...values)
  }
  const highest = (pick: (hour: WeatherHour) => number | null): number | null => {
    const values = inWindow.map(pick).filter((one): one is number => one !== null)
    return values.length === 0 ? null : Math.max(...values)
  }

  return {
    felt: lowest((hour) => hour.felt),
    celsius: lowest((hour) => hour.celsius),
    rainChance: highest((hour) => hour.rainChance),
    gust: highest((hour) => hour.gust),
    code: highest((hour) => hour.code),
  }
}

/** Le temps en un signe, pour tenir sous une colonne de la bande. */
export function signOf(sky: Sky | null): string {
  if (!sky || sky.code === null) return ''
  if (STORMY.has(sky.code)) return '⛈'
  if (SNOWY.has(sky.code)) return '❄'
  if (sky.code >= RAINY_FROM) return '🌧'
  if (FOGGY.has(sky.code)) return '🌫'
  if (sky.code >= 3) return '☁'
  if (sky.code >= 1) return '⛅'
  return '☀'
}

/** Le temps en un mot, quand la place le permet. */
export function wordOf(sky: Sky | null): string {
  if (!sky || sky.code === null) return 'temps inconnu'
  if (STORMY.has(sky.code)) return 'orage'
  if (SNOWY.has(sky.code)) return 'neige'
  if (sky.code >= 80) return 'averses'
  if (sky.code >= RAINY_FROM) return 'pluie'
  if (FOGGY.has(sky.code)) return 'brouillard'
  if (sky.code >= 3) return 'couvert'
  if (sky.code >= 1) return 'nuages'
  return 'dégagé'
}

/** Vrai quand il faut s'habiller pour l'eau. */
export function isWet(sky: Sky): boolean {
  const coded = sky.code !== null && sky.code >= RAINY_FROM
  const likely = sky.rainChance !== null && sky.rainChance >= RAIN_LIKELY
  return coded || likely
}

/**
 * Les bandes d'habillement, de la plus chaude à la plus froide.
 *
 * **Leurs bornes sont celles des guides d'habillement du cyclisme**, qui
 * s'accordent : manches courtes au-dessus de 20 °C, manchettes ou gilet entre
 * 16 et 20, sous-vêtement avec manchettes et jambières de 8 à 16, et le
 * thermique en dessous de 8. Elles ne sont pas inventées et elles ne se
 * déplacent pas au caprice : ce sont des repères publiés, et le seul jugement
 * du projet est de dire laquelle s'applique.
 *
 * **Une seule borne est ajoutée par le projet, celle de 3 °C.** Les guides
 * s'arrêtent à « sous 8 °C » ; à Bruxelles cela couvre tout l'hiver, et un
 * matin à 1 °C ne demande pas la même chose qu'un matin à 7. La coupure ne
 * change rien au-dessus de 8.
 */
export type Band = {
  /** Le ressenti à partir duquel la bande s'applique, en °C. */
  from: number
  name: string
  /**
   * Les catégories de pièces, jamais des noms libres.
   *
   * C'est ce qui permet à la garde-robe de s'y brancher : l'app dit la
   * catégorie, l'athlète dit laquelle des siennes la remplit.
   */
  wear: readonly GarmentKey[]
}

export const BANDS: readonly Band[] = [
  { from: 20, name: 'Doux', wear: ['manches-courtes', 'cuissard'] },
  { from: 16, name: 'Frais léger', wear: ['manches-courtes', 'manchettes'] },
  {
    from: 8,
    name: 'Frais',
    wear: ['sous-technique', 'manches-longues', 'jambieres', 'gants-legers'],
  },
  {
    from: 3,
    name: 'Froid',
    wear: ['sous-thermique', 'manches-longues', 'collant', 'gants', 'tour-de-cou'],
  },
  {
    from: -50,
    name: 'Grand froid',
    wear: [
      'sous-thermique',
      'coupe-vent',
      'collant',
      'gants-hiver',
      'couvre-chaussures',
      'bonnet',
    ],
  },
]

function bandIndex(felt: number): number {
  const found = BANDS.findIndex((band) => felt >= band.from)
  return found === -1 ? BANDS.length - 1 : found
}

/**
 * Ce que l'assistance retire de degrés, et **le seul nombre estimé de tout le
 * dispositif**.
 *
 * La direction est publiée : un vélo à assistance produit moins de chaleur
 * corporelle, donc il faut se couvrir davantage. La grandeur, elle, n'est
 * chiffrée nulle part, et les propres relevés de l'athlète sont ce qu'on a de
 * plus proche — 129 bpm en électrique contre 160 en musculaire, 35 de charge
 * contre 115, soit à peu près moitié moins de chaleur produite.
 *
 * Trois degrés, donc, et **délibérément moins que la bande de pluie** : celle-ci
 * vaut sept degrés et elle est mesurée, celle-ci est une estimation. Se
 * tromper vers le chaud est la faute la plus coûteuse — on part frais exprès,
 * et on se change au bureau.
 *
 * Un décalage en degrés plutôt qu'en bande, aussi : à 19 °C trois degrés ne
 * changent rien à ce qu'on met, à 11 °C ils changent tout. Sauter une bande
 * entière ferait le même écart aux deux endroits.
 */
export const ELECTRIC_DEGREES = 3

/**
 * Ce que la pluie retire de degrés, et **celui-là est publié**.
 *
 * Les guides le disent tel quel : *douze degrés sous la pluie en valent cinq*,
 * et on monte d'une bande quand la pluie est annoncée. Sept degrés, donc, pris
 * chez eux et non estimés ici.
 *
 * L'imperméable s'ajoute par-dessus sans que rien ne soit compté deux fois :
 * les guides recommandent les deux ensemble, la bande **et** la veste. Le vent,
 * lui, est déjà dans la température ressentie et n'entre pas ici.
 */
export const RAIN_DEGREES = 7

export type Dressing = {
  band: Band
  /** Le rang de la bande retenue : plus il est haut, plus il fait froid. */
  rank: number
  /**
   * Le ressenti pour lequel on s'habille réellement, en °C.
   *
   * Égal au ressenti annoncé pour un trajet musculaire ; plus bas en
   * électrique, plus bas encore sous la pluie. L'écran s'en sert pour
   * rapprocher les deux nombres — sans quoi « 12° » à côté d'une tenue de 9°
   * passe pour une erreur de l'app.
   */
  effective: number
  /** Les catégories à porter, la pluie comprise quand elle est annoncée. */
  wear: readonly GarmentKey[]
  /**
   * Ce que la bande demandait et qu'il n'a pas.
   *
   * Dit franchement plutôt que masqué : c'est la même règle que pour les
   * lectures manquantes d'intervals.icu. Une pièce absente ne se remplace pas
   * par une autre — l'app ne sait pas si son coupe-vent vaut un imperméable,
   * et le supposer serait exactement ce qu'elle s'interdit.
   */
  missing: readonly GarmentKey[]
  /** Ce qui a déplacé la bande, dit en clair. Vide quand rien ne l'a déplacée. */
  because: readonly string[]
}

/**
 * Comment s'habiller pour cette fenêtre.
 *
 * Deux corrections, comptées **toutes deux en degrés sur le même ressenti** :
 *
 * - **un trajet électrique en retire trois.** C'est contre-intuitif et c'est
 *   pourtant le sens juste : les guides sont écrits pour du vélo musculaire,
 *   donc ils supposent déjà la chaleur d'un effort. L'assistance en produit
 *   moins, le musculaire ne corrige rien puisqu'il est la référence. C'est le
 *   seul nombre estimé du dispositif — voir `ELECTRIC_DEGREES`.
 * - **la pluie en retire sept**, et ajoute l'imperméable. Celui-là est publié :
 *   douze degrés sous la pluie en valent cinq.
 *
 * **Un seul nombre en sort, et c'est lui qui choisit la bande.** Un premier
 * essai mélangeait les deux mécaniques — des degrés pour l'assistance, un saut
 * de bande pour la pluie — et l'écran affichait alors « comme pour 5° » à côté
 * d'une tenue de grand froid. Les deux nombres se contredisaient, ce qui est
 * pire que de se tromper : l'app ne savait plus dire ce qu'elle faisait.
 *
 * **La garde-robe ne change pas le raisonnement, seulement ce qui en sort.**
 * La bande est choisie sur des degrés, comme avant ; ce que l'athlète ne
 * possède pas est ensuite retiré de la tenue et nommé à part. Une pièce
 * manquante n'en fait pas glisser une autre à sa place : l'app ne sait pas ce
 * que ses affaires valent les unes par rapport aux autres.
 */
export function dressFor(
  sky: Sky | null,
  commute: CommuteKind,
  wardrobe: Wardrobe = {},
): Dressing | null {
  if (!sky || sky.felt === null || commute === 'aucun') return null

  const because: string[] = []
  let effective = sky.felt

  if (commute === 'chill') {
    effective -= ELECTRIC_DEGREES
    because.push('en électrique tu chauffes moins')
  }

  const wet = isWet(sky)
  if (wet) {
    effective -= RAIN_DEGREES
    because.push('la pluie refroidit vite')
  }

  const index = bandIndex(effective)
  const band = BANDS[index]!
  const asked: GarmentKey[] = wet ? [...band.wear, 'impermeable'] : [...band.wear]

  return {
    band,
    rank: index,
    effective,
    wear: asked.filter((key) => !lacks(wardrobe, key)),
    missing: asked.filter((key) => lacks(wardrobe, key)),
    because,
  }
}

/**
 * Ce que le soir demande **en plus** du matin.
 *
 * L'athlète se change au bureau mais ne peut pas transporter grand-chose : ce
 * qui doit tenir dans le sac est exactement cette différence-là. Rien à dire
 * quand les deux fenêtres tombent dans la même bande, et jamais rien à retirer
 * — enlever une couche ne se transporte pas.
 *
 * **La comparaison porte sur les bandes, pas sur les noms.** Une simple
 * différence d'ensembles ferait emporter des manches courtes pour un soir plus
 * doux que le matin, ce qui est le contraire de l'idée : on ne transporte que
 * ce qui protège en plus. Un soir plus clément ne demande donc rien — sauf la
 * pluie, qui ajoute sa veste sans changer de bande quand le froid est déjà au
 * fond du barème.
 */
export function toCarry(
  morning: Dressing | null,
  evening: Dressing | null,
): readonly GarmentKey[] {
  if (!morning || !evening) return []
  if (evening.rank < morning.rank) return []
  const already = new Set(morning.wear)
  return evening.wear.filter((piece) => !already.has(piece))
}

/**
 * Ce que le sac va peser, en un mot.
 *
 * Deux pièces de poche ne se remarquent pas ; deux pièces de sac, si. C'est la
 * seule chose que l'app puisse dire honnêtement d'un encombrement — elle ne
 * connaît ni la taille de son sac ni ce qu'il y met déjà.
 */
export function bagWeight(carry: readonly GarmentKey[]): 'rien' | 'poche' | 'sac' {
  if (carry.length === 0) return 'rien'
  return carry.some((key) => garmentOf(key).bulk === 'sac') ? 'sac' : 'poche'
}
