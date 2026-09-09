/**
 * La garde-robe de l'athlète (E.32, second temps).
 *
 * Elle vit dans le téléphone, comme tout ce que l'app sait de lui et qui ne
 * vient pas d'intervals.icu. Rien n'en part — ni vers intervals.icu, qui n'en
 * a que faire, ni vers le météorologue, qui ne reçoit que des coordonnées.
 *
 * **Elle n'a pas de date et ne se périme pas.** Un collant thermique reste un
 * collant thermique ; c'est la seule mémoire du projet qu'on ne nettoie pas au
 * bout de six semaines.
 */

import { GARMENTS, type GarmentKey, type Wardrobe } from '../rules/garments'

const KEY = 'makigawa.garde-robe'

/**
 * La marque qui dit que la déclaration a été posée.
 *
 * Séparée de la garde-robe elle-même, et c'est tout l'intérêt : une garde-robe
 * vide après que l'athlète a tout effacé n'est pas la même chose qu'une
 * garde-robe vide au premier démarrage. Sans cette marque, les deux seraient
 * indiscernables et l'app repasserait derrière lui.
 */
const SEEDED = 'makigawa.garde-robe.declaree'

const KNOWN = new Set<string>(GARMENTS.map((one) => one.key))

/** Ce qu'un nom peut peser sans devenir illisible à l'écran. */
export const NAME_MAX = 60

/**
 * Ce que l'athlète a déclaré posséder, relevé le 9 septembre 2026.
 *
 * **Ce ne sont pas des suggestions de l'app**, et la nuance est toute la
 * règle. Le E.32 interdit une liste pré-remplie parce qu'elle mettrait dans
 * son placard des affaires qu'il n'a pas — l'interdit porte sur l'app qui
 * *devine*, pas sur le fait qu'il y ait quelque chose au départ. Chacun de ces
 * noms vient de ses photos ou de sa liste ; le détail et les arbitrages sont
 * dans `docs/garde-robe.md`.
 *
 * `sous-thermique` n'y figure pas, et c'est la meilleure preuve que rien n'est
 * inventé : il n'a pas la pièce. Le sous-vêtement qu'il désignait est donné
 * 12-20 °C par son fabricant, donc il occupe `sous-technique` et n'a rien à
 * faire dans une bande qui commence sous 8.
 */
export const DECLARED: Wardrobe = {
  'manches-courtes': 'Castelli Espresso 2 Jersey',
  cuissard: 'Assos Mille GT C2',
  manchettes: 'Castelli Nano Flex 3G',
  'sous-technique': 'Assos Spring Fall LS Skin Layer P1',
  'manches-longues': 'Castelli Espresso Thermal Jersey',
  jambieres: 'jambières chaudes Van Rysel',
  'gants-legers': 'Castelli Perfetto RoS',
  'couvre-orteils': 'Assos Spring Fall P1',
  collant: 'Gorewear Spinshift thermique',
  gants: 'Castelli Perfetto Max',
  'tour-de-cou': 'Assos Spring Fall Neck Warmer P1',
  'couvre-chaussures': 'Castelli Entrata',
  'coupe-vent': 'Castelli Perfetto RoS 2',
  'gants-hiver': 'Castelli Perfetto Max',
  'tour-de-cou-hiver': 'Assos Winter Neck Warmer',
  'couvre-chaussures-hiver': 'GripGrab DryFoot Waterproof',
  bonnet: 'Craft Active Extreme X Wind Hat',
  impermeable: 'Castelli Emergency 3',
  'bas-pluie': 'Vaude Kuro Pro',
}

/**
 * Pose la déclaration, **une seule fois dans la vie du téléphone**.
 *
 * Après ce premier passage, le `localStorage` est seul maître : renommer,
 * déclarer absente ou effacer une pièce l'emporte définitivement. C'est ce qui
 * sépare une valeur de départ d'une valeur imposée — sans cela, une case qu'il
 * vide se remplirait à nouveau au rechargement suivant, et l'app aurait le
 * dernier mot sur son propre placard.
 */
function seedOnce(): void {
  try {
    if (localStorage.getItem(SEEDED)) return
    localStorage.setItem(SEEDED, '1')
    if (localStorage.getItem(KEY)) return
    localStorage.setItem(KEY, JSON.stringify(DECLARED))
  } catch {
    // Le quota peut refuser : l'app conseille alors des noms génériques,
    // c'est-à-dire exactement ce qu'elle faisait avant la garde-robe.
  }
}

export function loadWardrobe(): Wardrobe {
  try {
    seedOnce()
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {}

    const clean: Wardrobe = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (!KNOWN.has(key)) continue
      if (value === null) clean[key as GarmentKey] = null
      else if (typeof value === 'string') clean[key as GarmentKey] = value.slice(0, NAME_MAX)
    }
    return clean
  } catch {
    return {}
  }
}

function write(wardrobe: Wardrobe): Wardrobe {
  try {
    localStorage.setItem(KEY, JSON.stringify(wardrobe))
  } catch {
    // Le quota peut refuser : l'app conseille alors des noms génériques,
    // c'est-à-dire exactement ce qu'elle faisait avant la garde-robe.
  }
  return wardrobe
}

/** Nomme la pièce que l'athlète possède dans cette catégorie. */
export function nameGarment(key: GarmentKey, name: string): Wardrobe {
  const trimmed = name.trim().slice(0, NAME_MAX)
  const current = loadWardrobe()
  if (trimmed.length === 0) return forget(key)
  return write({ ...current, [key]: trimmed })
}

/** Déclare qu'il n'en a pas : l'app cesse de la proposer. */
export function markMissing(key: GarmentKey): Wardrobe {
  return write({ ...loadWardrobe(), [key]: null })
}

/** Revient à « je n'ai rien dit » : la pièce reprend son nom générique. */
export function forget(key: GarmentKey): Wardrobe {
  const next = { ...loadWardrobe() }
  delete next[key]
  return write(next)
}
