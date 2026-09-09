/**
 * Le vocabulaire des pièces, et rien de plus (E.32, second temps).
 *
 * **L'app fournit les catégories, l'athlète fournit les pièces.** C'est la
 * seule répartition qui respecte sa consigne — *ne rien inventer, ne rien
 * proposer au hasard*. Les catégories ci-dessous sont celles que nomment les
 * guides d'habillement du cyclisme ; ce qu'il possède dans chacune, lui seul le
 * sait, et il le dit dans l'écran de garde-robe.
 *
 * Une catégorie qu'il n'a pas remplie garde son nom générique — c'est le
 * comportement du premier temps, celui d'avant la garde-robe. Une catégorie
 * qu'il déclare ne pas posséder **cesse d'être proposée** : lui conseiller des
 * couvre-chaussures qu'il n'a pas ne l'aide pas à s'habiller.
 *
 * **Elles sont vingt depuis le 9 septembre 2026**, et non plus seize. Les
 * quatre ajoutées — bas de pluie, couvre-orteils, couvre-chaussures d'hiver,
 * tour de cou d'hiver — viennent du placard réel de l'athlète, où elles
 * n'avaient aucune case. Le sens de lecture compte : la garde-robe n'a pas été
 * pliée pour entrer dans les catégories, ce sont les catégories qui ont été
 * corrigées là où elles décrivaient mal ce qu'il porte.
 */

export type GarmentKey =
  | 'manches-courtes'
  | 'cuissard'
  | 'manchettes'
  | 'sous-technique'
  | 'manches-longues'
  | 'jambieres'
  | 'gants-legers'
  | 'couvre-orteils'
  | 'sous-thermique'
  | 'collant'
  | 'gants'
  | 'tour-de-cou'
  | 'couvre-chaussures'
  | 'coupe-vent'
  | 'gants-hiver'
  | 'tour-de-cou-hiver'
  | 'couvre-chaussures-hiver'
  | 'bonnet'
  | 'impermeable'
  | 'bas-pluie'

/** Où la pièce se porte. Sert à ranger l'écran, pas à décider. */
export type Part = 'buste' | 'jambes' | 'extremites' | 'dessus'

export type Garment = {
  key: GarmentKey
  /** Le nom des guides. Tient lieu de nom tant que l'athlète n'a rien dit. */
  name: string
  part: Part
  /** À quoi elle sert, pour que l'écran de garde-robe se comprenne seul. */
  what: string
  /**
   * Ce qu'elle prend de place dans le sac.
   *
   * L'athlète se change au bureau **mais ne transporte pas grand-chose** :
   * c'est ce qui distingue une paire de manchettes, qui tient dans une poche,
   * d'un collant thermique, qui prend un sac à lui seul.
   */
  bulk: 'poche' | 'sac'
}

export const GARMENTS: readonly Garment[] = [
  {
    key: 'manches-courtes',
    name: 'maillot manches courtes',
    part: 'buste',
    what: 'le maillot de base, au-dessus de 16 °C',
    bulk: 'poche',
  },
  {
    key: 'cuissard',
    name: 'cuissard',
    part: 'jambes',
    what: 'le bas court, au-dessus de 16 °C',
    bulk: 'poche',
  },
  {
    key: 'manchettes',
    name: 'manchettes ou gilet coupe-vent',
    part: 'buste',
    what: 'ce qui couvre les bras sans changer de maillot, de 16 à 20 °C',
    bulk: 'poche',
  },
  {
    key: 'sous-technique',
    name: 'sous-vêtement technique',
    part: 'buste',
    what: 'la première couche qui évacue la transpiration, sous 16 °C',
    bulk: 'poche',
  },
  {
    key: 'manches-longues',
    name: 'maillot manches longues',
    part: 'buste',
    what: 'le maillot d’en dessous de 16 °C',
    bulk: 'sac',
  },
  {
    key: 'jambieres',
    name: 'jambières',
    part: 'jambes',
    what: 'ce qui couvre les jambes par-dessus le cuissard, de 8 à 16 °C',
    bulk: 'poche',
  },
  {
    key: 'gants-legers',
    name: 'gants légers',
    part: 'extremites',
    what: 'les gants de mi-saison, de 8 à 16 °C',
    bulk: 'poche',
  },
  {
    key: 'couvre-orteils',
    name: 'couvre-orteils',
    part: 'extremites',
    what: 'ce qui couvre le bout du pied sans couvrir la chaussure, de 8 à 16 °C',
    bulk: 'poche',
  },
  {
    key: 'sous-thermique',
    name: 'sous-vêtement thermique',
    part: 'buste',
    what: 'la première couche chaude, sous 8 °C',
    bulk: 'sac',
  },
  {
    key: 'collant',
    name: 'collant thermique',
    part: 'jambes',
    what: 'le bas long et chaud, sous 8 °C',
    bulk: 'sac',
  },
  {
    key: 'gants',
    name: 'gants',
    part: 'extremites',
    what: 'les gants fermés, de 3 à 8 °C',
    bulk: 'poche',
  },
  {
    key: 'tour-de-cou',
    name: 'tour de cou',
    part: 'extremites',
    what: 'ce qui ferme le col, de 3 à 8 °C',
    bulk: 'poche',
  },
  {
    key: 'couvre-chaussures',
    name: 'couvre-chaussures',
    part: 'extremites',
    what: 'ce qui coupe le vent aux pieds, de 3 à 8 °C',
    bulk: 'sac',
  },
  {
    key: 'coupe-vent',
    name: 'veste coupe-vent',
    part: 'dessus',
    what: 'la veste qui arrête l’air, sous 3 °C',
    bulk: 'sac',
  },
  {
    key: 'gants-hiver',
    name: 'gants d’hiver',
    part: 'extremites',
    what: 'les gants épais, sous 3 °C',
    bulk: 'sac',
  },
  {
    key: 'tour-de-cou-hiver',
    name: 'tour de cou d’hiver',
    part: 'extremites',
    what: 'le cache-cou épais, sous 3 °C',
    bulk: 'poche',
  },
  {
    key: 'couvre-chaussures-hiver',
    name: 'couvre-chaussures d’hiver',
    part: 'extremites',
    what: 'ce qui protège les pieds du froid et de l’eau, sous 3 °C',
    bulk: 'sac',
  },
  {
    key: 'bonnet',
    name: 'sous-casque',
    part: 'extremites',
    what: 'ce qui couvre les oreilles sous le casque, sous 3 °C',
    bulk: 'poche',
  },
  {
    key: 'impermeable',
    name: 'veste imperméable',
    part: 'dessus',
    what: 'la veste de pluie, dès que la pluie est annoncée',
    bulk: 'sac',
  },
  {
    key: 'bas-pluie',
    name: 'bas de pluie',
    part: 'jambes',
    what: 'le sur-pantalon, dès que la pluie est annoncée',
    bulk: 'sac',
  },
]

const BY_KEY = new Map(GARMENTS.map((one) => [one.key, one]))

export function garmentOf(key: GarmentKey): Garment {
  return BY_KEY.get(key)!
}

/**
 * Ce que l'athlète possède, catégorie par catégorie.
 *
 * Trois états, et le troisième compte autant que les deux autres :
 *
 * - **absente** — il n'a rien dit. La pièce garde son nom générique.
 * - **une chaîne** — le nom qu'il donne à la sienne. C'est celui qui s'affiche.
 * - **`null`** — il déclare ne pas en avoir. La pièce **cesse d'être
 *   proposée**, parce que conseiller ce qu'on ne possède pas n'habille
 *   personne.
 */
export type Wardrobe = Partial<Record<GarmentKey, string | null>>

/** Vrai quand l'athlète a déclaré ne pas posséder cette pièce. */
export function lacks(wardrobe: Wardrobe, key: GarmentKey): boolean {
  return key in wardrobe && wardrobe[key] === null
}

/**
 * Le nom à afficher : le sien s'il l'a donné, celui des guides sinon.
 *
 * Le nom générique n'est pas un pis-aller. Une catégorie vide veut dire
 * « je n'ai pas encore répondu », et l'app doit continuer de conseiller
 * pendant ce temps-là — c'est exactement le premier temps du E.32.
 */
export function nameOf(wardrobe: Wardrobe, key: GarmentKey): string {
  const own = wardrobe[key]
  return typeof own === 'string' && own.trim().length > 0 ? own.trim() : garmentOf(key).name
}

/** Vrai quand l'athlète a nommé sa propre pièce dans cette catégorie. */
export function isOwned(wardrobe: Wardrobe, key: GarmentKey): boolean {
  const own = wardrobe[key]
  return typeof own === 'string' && own.trim().length > 0
}

/** Combien de catégories ont reçu une réponse, quelle qu'elle soit. */
export function answered(wardrobe: Wardrobe): number {
  return GARMENTS.filter((one) => one.key in wardrobe).length
}
