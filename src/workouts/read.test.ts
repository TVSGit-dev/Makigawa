import { describe, expect, it } from 'vitest'
import { blocksOf } from './read'
import { compose, toNotation } from './compose'
import { familyOf, FAMILIES } from './families'

describe('relire une structure', () => {
  it('lit ce que l’app écrit elle-même', () => {
    // Un profil qui ne saurait pas relire les séances composées par l'app
    // serait une impasse.
    for (const family of FAMILIES) {
      const workout = compose(family, 45)
      expect(blocksOf(toNotation(workout)).length, family.name).toBeGreaterThan(0)
    }
  })

  it('lit aussi la notation en zones du calendrier réel', () => {
    // « - 5m z2 », constaté le 5 septembre sur son calendrier.
    expect(blocksOf('- 5m z2\n- 5m z4')).toEqual([
      { seconds: 300, percent: 65 },
      { seconds: 300, percent: 98 },
    ])
  })

  it('lit les secondes comme les minutes', () => {
    expect(blocksOf('- 30s 115%')).toEqual([{ seconds: 30, percent: 115 }])
  })

  it('ignore une ligne qu’elle ne comprend pas, sans renoncer au reste', () => {
    expect(blocksOf('3x 5m z4\n- 10m z2')).toEqual([{ seconds: 600, percent: 65 }])
  })

  it('ne rend rien sur une séance sans structure', () => {
    expect(blocksOf('Sortie libre, sans structure. Objectif : 140 de charge.')).toEqual([])
    expect(blocksOf(null)).toEqual([])
  })

  it('garde l’ordre et le nombre des blocs qu’elle a compris', () => {
    const workout = compose(familyOf('vo2-30-30')!, 45)
    const relus = blocksOf(toNotation(workout))
    expect(relus[0]?.seconds).toBe(workout.blocks[0]?.seconds)
    expect(relus.at(-1)?.percent).toBe(workout.blocks.at(-1)?.percent)
  })
})
