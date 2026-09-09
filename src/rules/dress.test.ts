import { describe, expect, it } from 'vitest'
import {
  BANDS,
  ELECTRIC_DEGREES,
  RAIN_DEGREES,
  dressFor,
  isWet,
  RAIN_LIKELY,
  signOf,
  skyOf,
  toCarry,
  wordOf,
  type Sky,
} from './dress'
import { garmentOf, type GarmentKey } from './garments'
import type { WeatherHour } from '../api/weather'

const heure = (time: string, over: Partial<WeatherHour> = {}): WeatherHour => ({
  time,
  celsius: 12,
  felt: 12,
  rainChance: 0,
  rain: 0,
  wind: 10,
  gust: 15,
  code: 0,
  ...over,
})

const ciel = (over: Partial<Sky> = {}): Sky => ({
  felt: 12,
  celsius: 12,
  rainChance: 0,
  gust: 15,
  code: 0,
  ...over,
})

describe('les deux fenêtres de trajet (E.31)', () => {
  const journee = [
    heure('2026-09-09T07:00', { felt: 5 }),
    heure('2026-09-09T08:00', { felt: 9, rainChance: 10 }),
    heure('2026-09-09T09:00', { felt: 11, rainChance: 60, code: 61 }),
    heure('2026-09-09T13:00', { felt: 22 }),
    heure('2026-09-09T17:00', { felt: 18, gust: 20 }),
    heure('2026-09-09T18:00', { felt: 16, gust: 45 }),
  ]

  it('ne regarde que 8 et 9 h le matin', () => {
    // La météo de 7 h et celle de midi ne le concernent pas : il n'est pas
    // encore parti, puis il est au bureau.
    expect(skyOf(journee, '2026-09-09', 'matin')!.felt).toBe(9)
  })

  it('ne regarde que 17 et 18 h le soir', () => {
    expect(skyOf(journee, '2026-09-09', 'soir')!.felt).toBe(16)
  })

  it('retient le plus défavorable de la fenêtre, jamais la moyenne', () => {
    // Une moyenne lisserait précisément l'averse contre laquelle on s'habille.
    const matin = skyOf(journee, '2026-09-09', 'matin')!
    expect(matin.felt).toBe(9)
    expect(matin.rainChance).toBe(60)
    expect(matin.code).toBe(61)
    expect(skyOf(journee, '2026-09-09', 'soir')!.gust).toBe(45)
  })

  it('ne rend rien pour un jour que la prévision ne couvre pas', () => {
    expect(skyOf(journee, '2026-09-20', 'matin')).toBeNull()
    expect(skyOf([], '2026-09-09', 'matin')).toBeNull()
  })

  it('ne confond pas deux jours', () => {
    const deux = [...journee, heure('2026-09-10T08:00', { felt: -3 })]
    expect(skyOf(deux, '2026-09-09', 'matin')!.felt).toBe(9)
    expect(skyOf(deux, '2026-09-10', 'matin')!.felt).toBe(-3)
  })
})

describe('le temps dit court', () => {
  it('donne un signe par sorte de temps', () => {
    expect(signOf(ciel({ code: 0 }))).toBe('☀')
    expect(signOf(ciel({ code: 3 }))).toBe('☁')
    expect(signOf(ciel({ code: 61 }))).toBe('🌧')
    expect(signOf(ciel({ code: 73 }))).toBe('❄')
    expect(signOf(ciel({ code: 95 }))).toBe('⛈')
  })

  it('ne dit rien plutôt que d’inventer', () => {
    expect(signOf(null)).toBe('')
    expect(signOf(ciel({ code: null }))).toBe('')
    expect(wordOf(null)).toBe('temps inconnu')
  })
})

describe('s’habiller pour l’eau', () => {
  it('suit le code du temps', () => {
    expect(isWet(ciel({ code: 61 }))).toBe(true)
    expect(isWet(ciel({ code: 3 }))).toBe(false)
  })

  it('suit aussi la probabilité, même sous un code sec', () => {
    // Un ciel « couvert » à 60 % de pluie mouille autant qu'un ciel « pluie ».
    expect(isWet(ciel({ code: 3, rainChance: RAIN_LIKELY }))).toBe(true)
    expect(isWet(ciel({ code: 3, rainChance: RAIN_LIKELY - 1 }))).toBe(false)
  })
})

describe('ce qu’une bande plus froide a le droit de retirer', () => {
  /**
   * La version plus chaude de chaque pièce, quand la bande suivante la
   * remplace au lieu de la garder.
   *
   * C'est la seule sortie légitime : un gant léger devient un gant fermé, un
   * cuissard et des jambières deviennent un collant. Tout le reste doit
   * rester. Une pièce qui n'est ni gardée ni remplacée **disparaît quand il
   * fait plus froid**, ce qui n'a jamais de sens et s'était produit trois fois
   * avant le 9 septembre 2026 — le maillot manches longues et le tour de cou
   * sous 3 °C, et le cuissard dès 20 °C.
   */
  const PLUS_CHAUD: Partial<Record<GarmentKey, GarmentKey>> = {
    'manches-courtes': 'manches-longues',
    manchettes: 'manches-longues',
    'sous-technique': 'sous-thermique',
    cuissard: 'collant',
    jambieres: 'collant',
    'gants-legers': 'gants',
    gants: 'gants-hiver',
    'tour-de-cou': 'tour-de-cou-hiver',
    'couvre-orteils': 'couvre-chaussures',
    'couvre-chaussures': 'couvre-chaussures-hiver',
  }

  it('ne laisse aucune pièce s’évaporer d’une bande à la suivante', () => {
    for (let i = 1; i < BANDS.length; i += 1) {
      const douce = BANDS[i - 1]!
      const froide = BANDS[i]!
      for (const piece of douce.wear) {
        const gardee = froide.wear.includes(piece)
        const remplacee = froide.wear.includes(PLUS_CHAUD[piece]!)
        expect(gardee || remplacee, `${douce.name} → ${froide.name} : ${piece}`).toBe(true)
      }
    }
  })

  it('couvre le buste, les jambes et les mains dans chaque bande', () => {
    // Une tenue sans bas n'est pas une tenue : c'est ce qui manquait entre
    // 8 et 20 °C, où le cuissard n'était nommé nulle part.
    for (const band of BANDS) {
      const parts = new Set(band.wear.map((key) => garmentOf(key).part))
      expect(parts.has('buste'), `${band.name} : rien sur le buste`).toBe(true)
      expect(parts.has('jambes'), `${band.name} : rien sur les jambes`).toBe(true)
    }
  })
})

describe('comment s’habiller (E.32)', () => {
  it('choisit la bande sur les bornes des guides', () => {
    // 20, 16 et 8 sont les bornes publiées, pas des nombres du projet.
    expect(dressFor(ciel({ felt: 22 }), 'hard')!.band.name).toBe('Doux')
    expect(dressFor(ciel({ felt: 18 }), 'hard')!.band.name).toBe('Frais léger')
    expect(dressFor(ciel({ felt: 12 }), 'hard')!.band.name).toBe('Frais')
    expect(dressFor(ciel({ felt: 5 }), 'hard')!.band.name).toBe('Froid')
    expect(dressFor(ciel({ felt: -8 }), 'hard')!.band.name).toBe('Grand froid')
  })

  it('ne corrige rien pour un trajet musculaire', () => {
    // C'est la référence des guides : ils sont écrits pour du vélo qui chauffe.
    const musculaire = dressFor(ciel({ felt: 12 }), 'hard')!
    expect(musculaire.band.name).toBe('Frais')
    expect(musculaire.effective).toBe(12)
    expect(musculaire.because).toEqual([])
  })

  it('retire trois degrés en électrique, pas une bande entière', () => {
    // Contre-intuitif, et pourtant le sens juste : l'assistance produit moins
    // de chaleur — 129 bpm contre 160 chez l'athlète.
    const electrique = dressFor(ciel({ felt: 12 }), 'chill')!
    expect(electrique.effective).toBe(12 - ELECTRIC_DEGREES)
    expect(electrique.because.join(' ')).toContain('chauffes moins')
  })

  it('ne sur-habille pas un trajet électrique doux', () => {
    // Le défaut qui a fait refaire les bandes : douze degrés en électrique
    // ressortaient en tenue d'hiver, tour de cou compris. Trois degrés en
    // moins restent dans la même bande, et c'est le résultat juste.
    const doux = dressFor(ciel({ felt: 12 }), 'chill')!
    expect(doux.band.name).toBe('Frais')
    expect(doux.wear).not.toContain('tour-de-cou')
    expect(doux.wear).not.toContain('collant')

    // À dix-neuf degrés, l'assistance ne change rien à ce qu'on met.
    expect(dressFor(ciel({ felt: 19 }), 'chill')!.band.name).toBe(
      dressFor(ciel({ felt: 19 }), 'hard')!.band.name,
    )
  })

  it('retire sept degrés sous la pluie, et ajoute l’imperméable', () => {
    // Celui-ci n'est pas une estimation : c'est l'exemple même des guides —
    // douze degrés sous la pluie en valent cinq, ce qui fait monter d'un cran.
    const sec = dressFor(ciel({ felt: 12 }), 'hard')!
    const mouille = dressFor(ciel({ felt: 12, code: 61 }), 'hard')!
    expect(sec.band.name).toBe('Frais')
    expect(mouille.effective).toBe(5)
    expect(mouille.band.name).toBe('Froid')
    expect(mouille.wear).toContain('impermeable')
    expect(sec.wear).not.toContain('impermeable')
  })

  it('cumule les deux corrections sur la même échelle', () => {
    const both = dressFor(ciel({ felt: 12, code: 61 }), 'chill')!
    expect(both.effective).toBe(12 - ELECTRIC_DEGREES - RAIN_DEGREES)
    expect(both.because).toHaveLength(2)
  })

  it('n’affiche jamais un degré qui contredit la bande', () => {
    // Le défaut vu à l'écran : « comme pour 5° » à côté d'une tenue de grand
    // froid, parce que la pluie sautait une bande sans toucher au nombre. Un
    // seul nombre choisit la bande, donc il l'explique toujours.
    for (const felt of [22, 18, 12, 8, 5, 1, -6]) {
      for (const commute of ['hard', 'chill'] as const) {
        for (const code of [0, 61]) {
          const tenue = dressFor(ciel({ felt, code }), commute)!
          expect(tenue.band, `${felt}° ${commute} code ${code}`).toBe(
            BANDS.find((band) => tenue.effective >= band.from) ?? BANDS[BANDS.length - 1],
          )
        }
      }
    }
  })

  it('ne descend jamais sous la bande la plus froide', () => {
    const glacial = dressFor(ciel({ felt: -20, code: 61 }), 'chill')!
    expect(glacial.band).toBe(BANDS[BANDS.length - 1])
  })

  it('ne dit rien un jour sans trajet, ni sans prévision', () => {
    expect(dressFor(ciel({ felt: 12 }), 'aucun')).toBeNull()
    expect(dressFor(null, 'hard')).toBeNull()
    expect(dressFor(ciel({ felt: null }), 'hard')).toBeNull()
  })
})

describe('ce qu’il faut emporter', () => {
  it('ne dit rien quand les deux fenêtres se ressemblent', () => {
    const matin = dressFor(ciel({ felt: 12 }), 'hard')
    const soir = dressFor(ciel({ felt: 13 }), 'hard')
    expect(toCarry(matin, soir)).toEqual([])
  })

  it('nomme ce que le soir demande en plus', () => {
    // C'est cela seul qui doit tenir dans le sac : il se change au bureau mais
    // ne peut pas transporter grand-chose.
    const matin = dressFor(ciel({ felt: 16 }), 'hard')
    const soir = dressFor(ciel({ felt: 7 }), 'hard')
    const sac = toCarry(matin, soir)
    expect(sac.length).toBeGreaterThan(0)
    expect(sac).toContain('gants')
  })

  it('ne demande jamais d’emporter ce qu’on portait déjà', () => {
    const matin = dressFor(ciel({ felt: 7 }), 'hard')!
    const soir = dressFor(ciel({ felt: 16 }), 'hard')
    // Le soir est plus doux : rien à ajouter, et retirer ne se transporte pas.
    expect(toCarry(matin, soir)).toEqual([])
    for (const piece of toCarry(matin, soir)) expect(matin.wear).not.toContain(piece)
  })

  it('ne dit rien quand une des deux fenêtres manque', () => {
    expect(toCarry(dressFor(ciel(), 'hard'), null)).toEqual([])
    expect(toCarry(null, dressFor(ciel(), 'hard'))).toEqual([])
  })

  it('emporte la pluie entière quand seul le soir est mouillé', () => {
    // Même bande de froid des deux côtés, mais la pluie n'arrive que le soir :
    // c'est le cas où une comparaison de bandes seule ne suffirait pas. Les
    // deux pièces partent ensemble — la veste ne sert à rien sans le bas.
    const matin = dressFor(ciel({ felt: -8, rainChance: 0, code: 0 }), 'hard')
    const soir = dressFor(ciel({ felt: -8, rainChance: 90, code: 61 }), 'hard')
    expect(matin?.rank).toBe(soir?.rank)
    expect(toCarry(matin, soir)).toEqual(['impermeable', 'bas-pluie'])
  })
})
