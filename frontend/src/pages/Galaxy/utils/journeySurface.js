import {
  ClampToEdgeWrapping,
  DataTexture,
  LinearFilter,
  RepeatWrapping,
  RGBAFormat,
  SRGBColorSpace,
  UnsignedByteType,
} from 'three'

const clamp01 = n => Math.max(0, Math.min(1, n))
const mix = (a, b, t) => a + (b - a) * t
const smooth = n => n * n * (3 - 2 * n)
const smoothstep = (a, b, n) => smooth(clamp01((n - a) / (b - a)))
const mixColor = (a, b, t) => a.map((n, i) => Math.round(mix(n, b[i], t)))

function hash(x, y, z) {
  const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + 29.31) * 43758.5453
  return n - Math.floor(n)
}

function noise(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z)
  const fx = smooth(x - ix), fy = smooth(y - iy), fz = smooth(z - iz)
  const plane = d => mix(
    mix(hash(ix, iy, d), hash(ix + 1, iy, d), fx),
    mix(hash(ix, iy + 1, d), hash(ix + 1, iy + 1, d), fx), fy,
  )
  return mix(plane(iz), plane(iz + 1), fz)
}

function storm(latitude, longitude, centerLat, centerLon, width, height) {
  const longitudeDelta = Math.atan2(Math.sin(longitude - centerLon), Math.cos(longitude - centerLon))
  const dx = longitudeDelta * Math.cos(centerLat) / width
  const dy = (latitude - centerLat) / height
  return Math.exp(-2.4 * (dx * dx + dy * dy))
}

function makeMap(data, width, height) {
  const texture = new DataTexture(data, width, height, RGBAFormat, UnsignedByteType)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  texture.wrapT = ClampToEdgeWrapping
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
  return texture
}

// Fictional cloud-top albedo, not a rocky terrain height field.
// Every sample uses a spherical direction, so longitude joins are continuous.
// The bands vary slowly with 3D turbulence instead of repeating UV stripes.
export function createJourneySurfaceMap(width = 384, height = 192) {
  const w = Math.max(8, Math.floor(width)), h = Math.max(4, Math.floor(height))
  const pixels = new Uint8Array(w * h * 4)
  const charcoal = [86, 82, 92], umber = [127, 101, 91]
  const cream = [198, 175, 155], gold = [170, 143, 121]
  const stormCream = [218, 202, 183]

  let offset = 0
  for (let row = 0; row < h; row++) {
    const latitude = -Math.PI / 2 + (row + .5) / h * Math.PI
    const y = Math.sin(latitude), latitudeRadius = Math.cos(latitude)
    for (let column = 0; column < w; column++) {
      const longitude = -Math.PI + (column + .5) / w * Math.PI * 2
      const x = latitudeRadius * Math.cos(longitude)
      const z = latitudeRadius * Math.sin(longitude)

      const large = noise(x * 3.4 + 4, y * 3.4 - 2, z * 3.4 + 6) - .5
      const medium = noise(x * 8.7 - 3, y * 8.7 + 7, z * 8.7) - .5
      const fine = noise(x * 23.1 + 5, y * 23.1 - 4, z * 23.1 + 3) - .5
      const shear = large * .062 + medium * .022
      const axis = latitude + shear
      const bands = Math.sin(axis * 17.5 + .25) * .25
        + Math.sin(axis * 35. + medium * .7) * .105
      const variation = clamp01(.49 + bands + medium * .16 + fine * .075)
      let rgb = mixColor(charcoal, cream, smoothstep(.13, .88, variation))

      const warmth = smoothstep(.42, .78,
        noise(x * 2.7 - 6, y * 2.7 + 1, z * 2.7 + 3))
      rgb = mixColor(rgb, umber, warmth * .23)
      rgb = mixColor(rgb, gold, smoothstep(.57, .77, variation) * .13)

      // A few localized, low-contrast storm ovals interrupt the bands.
      const stormA = storm(latitude, longitude, .26, 1.15, .18, .095)
      const stormB = storm(latitude, longitude, -.36, -1.9, .14, .075)
      rgb = mixColor(rgb, stormCream, clamp01(stormA * .32 + stormB * .19))
      const grain = 1 + fine * .065
      for (let channel = 0; channel < 3; channel++) pixels[offset + channel] = Math.max(0, Math.min(255, Math.round(rgb[channel] * grain)))
      pixels[offset + 3] = 255
      offset += 4
    }
  }
  return makeMap(pixels, w, h)
}
