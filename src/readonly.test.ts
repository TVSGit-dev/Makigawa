import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Le garde-fou du E.19 : **l'app n'écrit plus dans intervals.icu**, sauf
 * supprimer.
 *
 * C'est une décision de fond, pas un détail d'implémentation, et elle se perd
 * exactement comme les autres — par un composant qui rappelle une fonction
 * restée disponible. Le test lit les fichiers d'interface plutôt que d'exécuter
 * quoi que ce soit : c'est le seul moyen de vérifier une absence.
 */

const UI = join(process.cwd(), 'src', 'components')

/**
 * Les fonctions d'écriture de l'API. La liste doit rester celle des fonctions
 * qui existent : chercher des fantômes ne garde rien.
 */
const WRITES = ['createEvent', 'updateEvent']

function uiFiles(): string[] {
  return readdirSync(UI)
    .filter((name) => name.endsWith('.tsx') && !name.endsWith('.test.tsx'))
    .map((name) => join(UI, name))
}

describe('l’app n’écrit plus (E.19)', () => {
  it('trouve bien les fichiers d’interface', () => {
    expect(uiFiles().length).toBeGreaterThan(5)
  })

  it('n’appelle aucune écriture depuis l’interface', () => {
    for (const file of uiFiles()) {
      const source = readFileSync(file, 'utf8')
      for (const write of WRITES) {
        expect(source.includes(write), `${file} appelle ${write}`).toBe(false)
      }
    }
  })

  it('ne garde qu’une écriture, et c’est la suppression', () => {
    const callers = uiFiles().filter((file) => readFileSync(file, 'utf8').includes('deleteEvent'))
    expect(callers.map((file) => file.split('/').at(-1))).toEqual(['Plan.tsx'])
  })
})
