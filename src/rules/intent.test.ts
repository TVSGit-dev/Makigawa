import { describe, expect, it } from 'vitest'
import { allowedIntent, INTENTS, MAX_AMBITIOUS_WEEKS } from './intent'

describe('les trois modes', () => {
  it('desserrent les seuils du prudent vers l’ambitieux', () => {
    expect(INTENTS.prudent.tsbFloor).toBeGreaterThan(INTENTS.normal.tsbFloor)
    expect(INTENTS.normal.tsbFloor).toBeGreaterThan(INTENTS.ambitieux.tsbFloor)
    expect(INTENTS.prudent.chargedDaysPerWeek).toBeLessThan(INTENTS.normal.chargedDaysPerWeek)
    expect(INTENTS.normal.chargedDaysPerWeek).toBeLessThan(INTENTS.ambitieux.chargedDaysPerWeek)
  })

  it('ne tolèrent deux journées chargées d’affilée qu’en ambitieux', () => {
    expect(INTENTS.prudent.allowsConsecutiveCharged).toBe(false)
    expect(INTENTS.normal.allowsConsecutiveCharged).toBe(false)
    expect(INTENTS.ambitieux.allowsConsecutiveCharged).toBe(true)
  })
})

/**
 * Le garde-fou du A.3 : la surcharge fonctionnelle ne devient un progrès que
 * si l'on en sort. C'est le seul endroit où l'app impose au lieu de suggérer.
 */
describe('le garde-fou de l’ambitieux', () => {
  it('laisse passer les deux premières semaines', () => {
    expect(allowedIntent('ambitieux', [])).toBe('ambitieux')
    expect(allowedIntent('ambitieux', ['ambitieux'])).toBe('ambitieux')
  })

  it('impose la décharge à la troisième', () => {
    expect(allowedIntent('ambitieux', ['ambitieux', 'ambitieux'])).toBe('prudent')
  })

  it('recompte à zéro après une semaine allégée', () => {
    expect(allowedIntent('ambitieux', ['ambitieux', 'ambitieux', 'normal'])).toBe('ambitieux')
  })

  it('ne borne que l’ambitieux', () => {
    const long = Array<'normal'>(10).fill('normal')
    expect(allowedIntent('normal', long)).toBe('normal')
    expect(allowedIntent('prudent', long)).toBe('prudent')
  })

  it('borne à la valeur annoncée', () => {
    const streak = Array<'ambitieux'>(MAX_AMBITIOUS_WEEKS).fill('ambitieux')
    expect(allowedIntent('ambitieux', streak)).toBe('prudent')
  })
})
