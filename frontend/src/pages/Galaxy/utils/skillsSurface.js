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
const smoothstep = (a, b, value) => {
  const t = clamp01((value - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const colorMix = (a, b, t) => a.map((value, index) => Math.round(mix(value, b[index], t)))

function materialField(x, y, z) {
  const warped = Math.sin(x * 7.7 + y * 5.3 - z * 6.1 + Math.sin(z * 4.2) * .65)
  const medium = Math.sin(x * 17.3 - y * 13.1 + z * 11.7 + warped * .8)
  const fine = Math.sin(x * 39.1 + y * 31.7 - z * 35.9 + medium * .55)
  return clamp01(.5 + warped * .22 + medium * .17 + fine * .075)
}

function metalVein(x, y, z) {
  const primary = Math.sin(x * 12.7 - y * 9.9 + z * 15.3 + Math.sin(y * 8.1) * .6)
  const secondary = Math.sin(x * 23.9 + y * 17.1 - z * 19.7)
  const distance = Math.abs(primary * .72 + secondary * .28)
  return 1 - smoothstep(.08, .34, distance)
}

function impactField(x, y, z) {
  const a = Math.sin(x * 5.1 + y * 7.3 + z * 4.7)
  const b = Math.sin(x * 10.9 - y * 8.3 + z * 9.7)
  return clamp01(.5 + a * .3 + b * .2)
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

  const graphite = [24, 29, 34]
  const silicate = [63, 68, 72]
  const iron = [93, 101, 108]
  const warmMetal = [115, 84, 63]
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
      const vein = metalVein(x, y, z)
      const impact = impactField(x, y, z)

      const rocky = colorMix(graphite, silicate, smoothstep(.22, .78, field))
      const metallic = colorMix(iron, warmMetal, clamp01((impact - .42) * 1.4))
      const metalMix = clamp01(vein * .72 + smoothstep(.66, .9, field) * .28)
      let rgb = colorMix(rocky, metallic, metalMix)
      const mottling = .9 + (impact - .5) * .14
      rgb = rgb.map(value => Math.max(0, Math.min(255, Math.round(value * mottling))))

      const metal = Math.round(mix(45, 220, clamp01(metalMix * .85 + smoothstep(.74, .94, field) * .15)))
      const rough = Math.round(mix(205, 78, clamp01(metalMix * .8 + smoothstep(.7, .95, field) * .2)))
      const heightValue = Math.round(mix(72, 174, field) + vein * 18 + (impact - .5) * 14)

      albedo[offset] = rgb[0]; albedo[offset + 1] = rgb[1]; albedo[offset + 2] = rgb[2]; albedo[offset + 3] = 255
      roughness[offset] = rough; roughness[offset + 1] = rough; roughness[offset + 2] = rough; roughness[offset + 3] = 255
      metalness[offset] = metal; metalness[offset + 1] = metal; metalness[offset + 2] = metal; metalness[offset + 3] = 255
      const heightByte = Math.max(0, Math.min(255, heightValue))
      elevation[offset] = heightByte; elevation[offset + 1] = heightByte; elevation[offset + 2] = heightByte; elevation[offset + 3] = 255
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
