// @vitest-environment jsdom
/**
 * La prévision gardée dans le téléphone (E.31).
 */

import { beforeEach, describe, expect, it } from 'vitest'

import type { WeatherHour } from '../api/weather'
import { isFresh, loadWeather, saveWeather, WEATHER_MAX_HOURS } from './weather'

const HEURE = 3_600_000

function heure(time: string, felt: number): WeatherHour {
  return {
    time,
    celsius: felt + 1,
    felt,
    rainChance: 10,
    rain: 0,
    wind: 12,
    gust: 25,
    code: 1,
  }
}

describe('la prévision gardée', () => {
  beforeEach(() => localStorage.clear())

  it('rend ce qu’on lui a confié', () => {
    const heures = [heure('2026-09-09T08:00', 11), heure('2026-09-09T17:00', 16)]
    saveWeather(heures, 1_000)

    const relu = loadWeather(1_000)
    expect(relu?.at).toBe(1_000)
    expect(relu?.hours).toEqual(heures)
  })

  it('oublie une prévision de plus de vingt-quatre heures', () => {
    saveWeather([heure('2026-09-09T08:00', 11)], 0)
    expect(loadWeather((WEATHER_MAX_HOURS - 1) * HEURE)).not.toBeNull()
    expect(loadWeather((WEATHER_MAX_HOURS + 1) * HEURE)).toBeNull()
  })

  it('ne rappelle pas le réseau pour une prévision toute fraîche', () => {
    saveWeather([heure('2026-09-09T08:00', 11)], 0)
    expect(isFresh(loadWeather(HEURE), HEURE)).toBe(true)
    expect(isFresh(loadWeather(4 * HEURE), 4 * HEURE)).toBe(false)
    expect(isFresh(null)).toBe(false)
  })

  it('ne casse pas sur un contenu abîmé', () => {
    localStorage.setItem('makigawa.meteo', 'pas du json')
    expect(loadWeather()).toBeNull()

    localStorage.setItem('makigawa.meteo', JSON.stringify({ at: Date.now(), hours: ['bof'] }))
    expect(loadWeather()).toBeNull()
  })

  it('remplace les valeurs illisibles par rien, sans jeter l’heure', () => {
    localStorage.setItem(
      'makigawa.meteo',
      JSON.stringify({ at: 1_000, hours: [{ time: '2026-09-09T08:00', felt: 'doux' }] }),
    )
    const relu = loadWeather(1_000)
    expect(relu?.hours[0]?.time).toBe('2026-09-09T08:00')
    expect(relu?.hours[0]?.felt).toBeNull()
  })
})
