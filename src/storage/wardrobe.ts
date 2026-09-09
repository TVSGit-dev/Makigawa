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

const KNOWN = new Set<string>(GARMENTS.map((one) => one.key))

/** Ce qu'un nom peut peser sans devenir illisible à l'écran. */
export const NAME_MAX = 60

export function loadWardrobe(): Wardrobe {
  try {
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
