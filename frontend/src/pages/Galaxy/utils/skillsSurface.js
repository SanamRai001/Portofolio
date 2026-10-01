import {
  ClampToEdgeWrapping,
  DataTexture,
  LinearFilter,
  RepeatWrapping,
  RGBAFormat,
  SRGBColorSpace,
  UnsignedByteType,
} from 'three'

const clamp01 = value => Math.max(0, Math.min(1, value))
const mix = (a, b, t) => a + (b - a) * t
const smooth = value => value * value * (3 - 2 * value)
const smoothstep = (a, b, value) => {
  const t = clamp01((value - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const colorMix = (a, b, t) => a.map((value, index) => Math.round(mix(value, b[index], t)))

function hash(x, y, z) {
  const n = Math.sin(x * 157.31 + y * 283.73 + z * 97.19 + 41.7) * 43758.5453
  return n - Math.floor(n)
}

function noise3(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z)
  const fx = smooth(x - ix), fy = smooth(y - iy), fz = smooth(z - iz)
  const plane = depth => mix(
    mix(hash(ix, iy, depth), hash(ix + 1, iy, depth), fx),
    mix(hash(ix, iy + 1, depth), hash(ix + 1, iy + 1, depth), fx),
    fy,
  )
  return mix(plane(iz), plane(iz + 1), fz)
}

function materialField(x, y, z) {
  const warp = noise3(x * 2.2 + 4, y * 2.2 - 3, z * 2.2 + 8) - .5
  return clamp01(
    .58 * noise3(x * 4.3 + warp * .9, y * 4.3 + 6, z * 4.3 - 2)
    + .28 * noise3(x * 9.2 - 4, y * 9.2 + 2, z * 9.2 + 7)
    + .14 * noise3(x * 21.5, y * 21.5 - 8, z * 21.5 + 3),
  )
}

function variationField(x, y, z) {
  return clamp01(
    .65 * noise3(x * 3.1 - 2, y * 3.1 + 9, z * 3.1 + 1)
    + .35 * noise3(x * 13.7 + 5, y * 13.7 - 4, z * 13.7),
  )
}

function sparseMetalSeam(x, y, z) {
  const a = noise3(x * 7.2 + 2, y * 7.2, z * 7.2 - 5)
  const b = noise3(x * 7.2 - 6, y * 7.2 + 4, z * 7.2 + 2)
  return 1 - smoothstep(.018, .075, Math.abs(a - b))
}

function makeTexture(data, width, height, colorSpace = '') {
  const texture = new DataTexture(data, width, height, RGBAFormat, UnsignedByteType)
  texture.wrapS = RepeatWrapping
  texture.wrapT = ClampToEdgeWrapping
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.generateMipmaps = false
  if (colorSpace) texture.colorSpace = colorSpace
  texture.needsUpdate = true
  return texture
}

export function createSkillsSurfaceMaps(width = 384, height = 192) {
  const safeWidth = Math.max(8, Math.floor(width))
  const safeHeight = Math.max(4, Math.floor(height))
  const albedo = new Uint8Array(safeWidth * safeHeight * 4)
  const roughness = new Uint8Array(albedo.length)
  const metalness = new Uint8Array(albedo.length)
  const elevation = new Uint8Array(albedo.length)

  const graphite = [34, 39, 45]
  const silicate = [73, 78, 82]
  const iron = [118, 125, 132]
  const oxidizedIron = [132, 91, 63]
  let offset = 0

  for (let row = 0; row < safeHeight; row++) {
    const latitude = -Math.PI / 2 + (row + .5) / safeHeight * Math.PI
    const cosLatitude = Math.cos(latitude)
    const y = Math.sin(latitude)

    for (let column = 0; column < safeWidth; column++) {
      const longitude = -Math.PI + (column + .5) / safeWidth * Math.PI * 2
      const x = cosLatitude * Math.cos(longitude)
      const z = cosLatitude * Math.sin(longitude)

      const field = materialField(x, y, z)
      const variation = variationField(x, y, z)
      const seam = sparseMetalSeam(x, y, z)

      // Broad irregular metal provinces do most of the work. The seam term is
      // intentionally weak so the result reads as geology, not contour lines.
      const province = smoothstep(.64, .86, field) * .48
        + smoothstep(.7, .9, variation) * .28
      const metalMix = clamp01(province + seam * .11)

      const rockTone = colorMix(graphite, silicate, smoothstep(.2, .78, field))
      const metalTone = colorMix(iron, oxidizedIron, smoothstep(.48, .82, variation))
      let rgb = colorMix(rockTone, metalTone, metalMix)

      const fine = noise3(x * 31 + 5, y * 31 - 2, z * 31 + 11) - .5
      const brightness = .92 + (variation - .5) * .12 + fine * .055
      rgb = rgb.map(value => Math.max(0, Math.min(255, Math.round(value * brightness))))

      const metal = Math.round(mix(32, 232, metalMix))
      const rough = Math.round(mix(216, 92, metalMix) + (variation - .5) * 12)
      const relief = clamp01(field * .72 + variation * .22 + fine * .06)
      const heightValue = Math.round(58 + relief * 142 + seam * 5)

      albedo[offset] = rgb[0]
      albedo[offset + 1] = rgb[1]
      albedo[offset + 2] = rgb[2]
      albedo[offset + 3] = 255

      const roughByte = Math.max(72, Math.min(232, rough))
      roughness[offset] = roughByte
      roughness[offset + 1] = roughByte
      roughness[offset + 2] = roughByte
      roughness[offset + 3] = 255

      metalness[offset] = metal
      metalness[offset + 1] = metal
      metalness[offset + 2] = metal
      metalness[offset + 3] = 255

      const heightByte = Math.max(0, Math.min(255, heightValue))
      elevation[offset] = heightByte
      elevation[offset + 1] = heightByte
      elevation[offset + 2] = heightByte
      elevation[offset + 3] = 255
      offset += 4
    }
  }

  return {
    albedo: makeTexture(albedo, safeWidth, safeHeight, SRGBColorSpace),
    roughness: makeTexture(roughness, safeWidth, safeHeight),
    metalness: makeTexture(metalness, safeWidth, safeHeight),
    elevation: makeTexture(elevation, safeWidth, safeHeight),
  }
}
