import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { deflateSync } from 'node:zlib'

import { PROJECT_NODES } from '../src/pages/Galaxy/data/projects.js'

const WIDTH = 1200
const HEIGHT = 630
const output = resolve('dist', 'galaxy', 'social')

const FONT = Object.freeze({
  A:['01110','10001','10001','11111','10001','10001','10001'],
  B:['11110','10001','10001','11110','10001','10001','11110'],
  C:['01111','10000','10000','10000','10000','10000','01111'],
  D:['11110','10001','10001','10001','10001','10001','11110'],
  E:['11111','10000','10000','11110','10000','10000','11111'],
  F:['11111','10000','10000','11110','10000','10000','10000'],
  G:['01111','10000','10000','10111','10001','10001','01111'],
  H:['10001','10001','10001','11111','10001','10001','10001'],
  I:['11111','00100','00100','00100','00100','00100','11111'],
  J:['00111','00010','00010','00010','10010','10010','01100'],
  K:['10001','10010','10100','11000','10100','10010','10001'],
  L:['10000','10000','10000','10000','10000','10000','11111'],
  M:['10001','11011','10101','10101','10001','10001','10001'],
  N:['10001','11001','10101','10011','10001','10001','10001'],
  O:['01110','10001','10001','10001','10001','10001','01110'],
  P:['11110','10001','10001','11110','10000','10000','10000'],
  Q:['01110','10001','10001','10001','10101','10010','01101'],
  R:['11110','10001','10001','11110','10100','10010','10001'],
  S:['01111','10000','10000','01110','00001','00001','11110'],
  T:['11111','00100','00100','00100','00100','00100','00100'],
  U:['10001','10001','10001','10001','10001','10001','01110'],
  V:['10001','10001','10001','10001','10001','01010','00100'],
  W:['10001','10001','10001','10101','10101','10101','01010'],
  X:['10001','10001','01010','00100','01010','10001','10001'],
  Y:['10001','10001','01010','00100','00100','00100','00100'],
  Z:['11111','00001','00010','00100','01000','10000','11111'],
  0:['01110','10001','10011','10101','11001','10001','01110'],
  1:['00100','01100','00100','00100','00100','00100','01110'],
  2:['01110','10001','00001','00010','00100','01000','11111'],
  3:['11110','00001','00001','01110','00001','00001','11110'],
  4:['00010','00110','01010','10010','11111','00010','00010'],
  5:['11111','10000','10000','11110','00001','00001','11110'],
  6:['01110','10000','10000','11110','10001','10001','01110'],
  7:['11111','00001','00010','00100','01000','01000','01000'],
  8:['01110','10001','10001','01110','10001','10001','01110'],
  9:['01110','10001','10001','01111','00001','00001','01110'],
  '&':['01000','10100','10100','01000','10101','10010','01101'],
  '/':['00001','00010','00010','00100','01000','01000','10000'],
  '-':['00000','00000','00000','11111','00000','00000','00000'],
  '+':['00000','00100','00100','11111','00100','00100','00000'],
  '.':['00000','00000','00000','00000','00000','00110','00110'],
  ':':['00000','00110','00110','00000','00110','00110','00000'],
  ' ':['00000','00000','00000','00000','00000','00000','00000'],
})

const clamp = value => Math.max(0, Math.min(255, Math.round(value)))
const hashString = value => [...value].reduce((hash, char) => ((hash * 33) ^ char.charCodeAt(0)) >>> 0, 5381)
const sanitize = value => value.toUpperCase().replace(/[^A-Z0-9&/+.\-: ]/g, ' ')

function hslToRgb(h, s, l) {
  const a = s * Math.min(l, 1 - l)
  const f = n => {
    const k = (n + h / 30) % 12
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
  }
  return [f(0) * 255, f(8) * 255, f(4) * 255]
}

function projectAccent(project) {
  return hslToRgb(22 + hashString(project.id) % 196, .48, .62)
}

function createRaster(project) {
  const pixels = Buffer.alloc(WIDTH * HEIGHT * 4)
  const accent = projectAccent(project)
  const seed = hashString(project.id)
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const index = (y * WIDTH + x) * 4
      const dx = (x - WIDTH * .82) / WIDTH
      const dy = (y - HEIGHT * .5) / HEIGHT
      const radial = Math.max(0, 1 - Math.hypot(dx * 1.65, dy * 1.75) * 2.15)
      const horizon = y / HEIGHT
      const accentMix = radial * .25
      pixels[index] = clamp(3 + horizon * 4 + accent[0] * accentMix)
      pixels[index + 1] = clamp(9 + horizon * 5 + accent[1] * accentMix)
      pixels[index + 2] = clamp(14 + horizon * 8 + accent[2] * accentMix)
      pixels[index + 3] = 255
    }
  }

  const setPixel = (x, y, color, alpha = 1) => {
    x = Math.round(x); y = Math.round(y)
    if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return
    const index = (y * WIDTH + x) * 4
    for (let channel = 0; channel < 3; channel += 1) {
      pixels[index + channel] = clamp(pixels[index + channel] * (1 - alpha) + color[channel] * alpha)
    }
  }
  const fillRect = (x, y, width, height, color, alpha = 1) => {
    for (let py = Math.max(0, y); py < Math.min(HEIGHT, y + height); py += 1) {
      for (let px = Math.max(0, x); px < Math.min(WIDTH, x + width); px += 1) setPixel(px, py, color, alpha)
    }
  }
  const drawDot = (cx, cy, radius, color, alpha = 1) => {
    const r2 = radius * radius
    for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
      for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
        const d2 = (x - cx) ** 2 + (y - cy) ** 2
        if (d2 <= r2) setPixel(x, y, color, alpha * (1 - Math.sqrt(d2) / Math.max(radius, 1) * .32))
      }
    }
  }
  const drawEllipse = (cx, cy, rx, ry, rotation, color, alpha = 1, width = 1) => {
    for (let step = 0; step < 900; step += 1) {
      const t = step / 900 * Math.PI * 2
      const ex = Math.cos(t) * rx, ey = Math.sin(t) * ry
      const x = cx + ex * Math.cos(rotation) - ey * Math.sin(rotation)
      const y = cy + ex * Math.sin(rotation) + ey * Math.cos(rotation)
      drawDot(x, y, width, color, alpha)
    }
  }
  const drawChar = (char, x, y, scale, color, alpha = 1) => {
    const glyph = FONT[char] || FONT[' ']
    glyph.forEach((row, gy) => {
      for (let gx = 0; gx < row.length; gx += 1) {
        if (row[gx] === '1') fillRect(x + gx * scale, y + gy * scale, scale, scale, color, alpha)
      }
    })
  }
  const textWidth = (value, scale) => sanitize(value).length * 6 * scale - scale
  const drawText = (value, x, y, scale, color, alpha = 1) => {
    sanitize(value).split('').forEach((char, index) => drawChar(char, x + index * 6 * scale, y, scale, color, alpha))
  }
  const wrapTitle = value => {
    const clean = sanitize(value)
    if (textWidth(clean, 10) <= 690) return [clean]
    const words = clean.split(' ')
    if (words.length > 1) {
      const midpoint = Math.ceil(words.length / 2)
      return [words.slice(0, midpoint).join(' '), words.slice(midpoint).join(' ')]
    }
    return [clean]
  }

  // Deterministic sparse star field.
  let random = seed || 1
  for (let i = 0; i < 110; i += 1) {
    random = (random * 1664525 + 1013904223) >>> 0
    const x = random % WIDTH
    random = (random * 1664525 + 1013904223) >>> 0
    const y = random % HEIGHT
    const brightness = 145 + (random % 95)
    drawDot(x, y, random % 13 === 0 ? 1.5 : .8, [brightness, brightness, brightness + 8], .34)
  }

  // Large abstract planet/orbit motif on the right.
  const planetX = 977, planetY = 322, planetRadius = 139
  drawEllipse(planetX, planetY, 225, 78, -.22, [180, 198, 214], .20, 1)
  drawEllipse(planetX, planetY, 266, 101, -.22, accent, .22, 1)
  for (let r = planetRadius; r >= 1; r -= 1) {
    const t = 1 - r / planetRadius
    const shade = .35 + t * .65
    drawDot(planetX - t * 24, planetY - t * 18, r, [
      accent[0] * shade, accent[1] * shade, accent[2] * shade,
    ], .022)
  }
  drawDot(planetX - 34, planetY - 36, planetRadius * .82, accent, .36)
  drawDot(planetX - 67, planetY - 62, planetRadius * .48, [232, 238, 242], .14)
  drawEllipse(planetX, planetY, 168, 48, -.22, [230, 225, 211], .27, 1)
  drawDot(1129, 198, 7, accent, .86)
  drawDot(805, 442, 5, [218, 229, 236], .70)

  const white = [232, 239, 244]
  const muted = [150, 168, 182]
  drawText('SANAM RAI / GALAXY CASE STUDY', 74, 62, 4, muted, .86)
  fillRect(74, 118, 118, 3, accent, .78)
  drawText(project.category, 74, 139, 4, accent, .98)

  const lines = wrapTitle(project.label)
  const titleScale = lines.some(line => textWidth(line, 10) > 690) ? 8 : 10
  lines.forEach((line, index) => drawText(line, 74, 208 + index * 88, titleScale, white, 1))

  const focus = project.focus.slice(0, 3).join(' / ')
  const focusY = lines.length === 1 ? 342 : 404
  drawText(focus, 74, focusY, 3, muted, .92)
  drawText('BUILD / SCALE / SOLVE', 74, 545, 4, white, .75)
  drawText(project.id, 900, 553, 3, muted, .68)

  return pixels
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
function crc32(buffer) {
  let c = 0xffffffff
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function pngChunk(type, data) {
  const name = Buffer.from(type)
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const checksum = Buffer.alloc(4)
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])))
  return Buffer.concat([length, name, data, checksum])
}
function encodePng(rgba) {
  const scanline = WIDTH * 4 + 1
  const raw = Buffer.alloc(scanline * HEIGHT)
  for (let y = 0; y < HEIGHT; y += 1) {
    const target = y * scanline
    raw[target] = 0
    rgba.copy(raw, target + 1, y * WIDTH * 4, (y + 1) * WIDTH * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(WIDTH, 0)
  ihdr.writeUInt32BE(HEIGHT, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

await mkdir(output, { recursive: true })
for (const project of PROJECT_NODES) {
  const file = resolve(output, project.id + '.png')
  const png = encodePng(createRaster(project))
  await writeFile(file, png)
  console.log('Generated social preview:', project.id, png.length + ' bytes')
}
