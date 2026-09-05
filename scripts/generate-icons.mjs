/**
 * Génère les icônes PNG de la PWA sans dépendance externe.
 *
 * Le motif (une roue de vélo) est dessiné analytiquement puis suréchantillonné,
 * et l’image est encodée en PNG à la main via zlib. Relancer avec `npm run icons`
 * après avoir changé les couleurs ou la forme.
 */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

const BG = [0x0b, 0x12, 0x20]
const FG = [0x3d, 0xdc, 0x97]

/** Suréchantillonnage : 4×4 sous-pixels, suffisant pour un rendu net. */
const SS = 4

// --- Encodage PNG -----------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, crc])
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // profondeur 8 bits
  ihdr[9] = 6 // RGBA
  const stride = size * 4
  // Chaque ligne est préfixée par son type de filtre (0 = aucun).
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y++) {
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// --- Geometrie --------------------------------------------------------------

/** Distance signée à un rectangle aux coins arrondis, centré sur l’origine. */
function sdRoundedBox(x, y, half, radius) {
  const qx = Math.abs(x) - half + radius
  const qy = Math.abs(y) - half + radius
  return (
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius
  )
}

/** Roue : jante, moyeu et rayons. Coordonnées relatives au centre. */
function inWheel(x, y, radius) {
  const d = Math.hypot(x, y)
  const rim = radius * 0.13
  if (d <= radius && d >= radius - rim) return true
  if (d <= radius * 0.17) return true

  const spokeReach = radius - rim * 0.5
  if (d > spokeReach) return false
  const angle = Math.atan2(y, x)
  const halfWidth = radius * 0.05
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3 + Math.PI / 6
    const delta = angle - a
    if (d * Math.cos(delta) > 0 && Math.abs(d * Math.sin(delta)) <= halfWidth) return true
  }
  return false
}

/**
 * Une icône `maskable` est rognée par Android en cercle, goutte ou squircle
 * selon le lanceur : le fond couvre tout le carré et le motif reste dans la
 * zone sûre (les 80 % centraux).
 */
function render(size, maskable) {
  const rgba = Buffer.alloc(size * size * 4)
  const half = size / 2
  const corner = size * 0.2237
  const wheelRadius = size * (maskable ? 0.3 : 0.355)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS - half
          const py = y + (sy + 0.5) / SS - half
          const inside = maskable || sdRoundedBox(px, py, half, corner) <= 0
          if (!inside) continue
          const color = inWheel(px, py, wheelRadius) ? FG : BG
          r += color[0]
          g += color[1]
          b += color[2]
          a += 255
        }
      }
      const samples = SS * SS
      const i = (y * size + x) * 4
      // Couleurs non prémultipliées : on moyenne sur les sous-pixels couverts.
      const covered = a / 255
      if (covered > 0) {
        rgba[i] = Math.round(r / covered)
        rgba[i + 1] = Math.round(g / covered)
        rgba[i + 2] = Math.round(b / covered)
      }
      rgba[i + 3] = Math.round(a / samples)
    }
  }
  return encodePng(size, rgba)
}

const TARGETS = [
  { path: 'public/icons/icon-192.png', size: 192, maskable: false },
  { path: 'public/icons/icon-512.png', size: 512, maskable: false },
  { path: 'public/icons/icon-maskable-512.png', size: 512, maskable: true },
  { path: 'public/apple-touch-icon.png', size: 180, maskable: false },
]

for (const { path, size, maskable } of TARGETS) {
  const file = join(ROOT, path)
  mkdirSync(dirname(file), { recursive: true })
  const png = render(size, maskable)
  writeFileSync(file, png)
  console.log(`${path} — ${size}x${size}${maskable ? ' (maskable)' : ''}, ${png.length} o`)
}
