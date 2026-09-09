import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Le garde-fou des tiers (E.31).
 *
 * Jusqu'au 9 septembre 2026 l'app ne parlait qu'à intervals.icu, et c'était
 * une propriété si évidente que rien ne la gardait. La météo en fait un second
 * — le premier qui ne demande aucune clé — et une seconde adresse en autorise
 * une troisième par simple ajout d'une ligne.
 *
 * Deux choses tiennent ici, toutes deux écrites dans `CLAUDE.md` :
 *
 * - **la liste des tiers est close.** Strava est nommément exclu, les polices
 *   sont servies depuis le dépôt, et rien de ce que fait l'athlète n'a à
 *   passer ailleurs qu'à intervals.icu.
 * - **la clé n'est jamais dans le code**, ni en dur ni derrière un préfixe
 *   `VITE_` — ce préfixe l'embarquerait dans le JavaScript servi au
 *   navigateur.
 *
 * Le test lit les fichiers plutôt que d'exécuter quoi que ce soit : c'est le
 * seul moyen de vérifier une absence.
 */

const SRC = join(process.cwd(), 'src')

/** Les seules adresses que l'app a le droit d'appeler. */
const ALLOWED = new Set(['https://intervals.icu', 'https://api.open-meteo.com'])

/**
 * Tous les fichiers de code, **sauf celui-ci**.
 *
 * Un garde-fou nomme forcément ce qu'il interdit : sans cette exception il se
 * dénoncerait lui-même, et le seul moyen de le faire taire serait de ne plus
 * dire ce qu'il garde.
 */
function sources(dir = SRC): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return sources(full)
    if (entry.name === 'hosts.test.ts') return []
    return /\.tsx?$/.test(entry.name) ? [full] : []
  })
}

describe('les tiers que l’app appelle', () => {
  it('trouve bien les fichiers', () => {
    expect(sources().length).toBeGreaterThan(40)
  })

  it('n’en connaît que deux, et pas un de plus', () => {
    const found = new Set<string>()
    for (const file of sources()) {
      const matches = readFileSync(file, 'utf8').match(/https?:\/\/[a-zA-Z0-9.-]+/g) ?? []
      for (const one of matches) found.add(one)
    }
    expect([...found].sort()).toEqual([...ALLOWED].sort())
  })

  it('ne nomme Strava nulle part — il est volontairement exclu', () => {
    for (const file of sources()) {
      expect(readFileSync(file, 'utf8').toLowerCase().includes('strava'), file).toBe(false)
    }
  })

  it('ne met la clé ni en dur ni dans une variable de compilation', () => {
    for (const file of sources()) {
      const source = readFileSync(file, 'utf8')
      // `import.meta.env.VITE_…` embarquerait la valeur dans le bundle servi.
      expect(/import\.meta\.env\.VITE_/.test(source), file).toBe(false)
    }
  })
})
