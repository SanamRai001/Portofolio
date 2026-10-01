import {
  ClampToEdgeWrapping,
  DataTexture,
  LinearFilter,
  RepeatWrapping,
  RGBAFormat,
  SRGBColorSpace,
  UnsignedByteType,
} from 'three'

// Continuous 3D value noise: deterministic, seamless at the sphere's UV seam,
// and evaluated only when the Identity surface is constructed.
const mix = (a, b, t) => a + (b - a) * t
const smooth = value => value * value * (3 - 2 * value)
function hash(x, y, z) {
  const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + 19.27) * 43758.5453
  return n - Math.floor(n)
}
function noise(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z)
  const fx = smooth(x - ix), fy = smooth(y - iy), fz = smooth(z - iz)
  const plane = depth => mix(mix(hash(ix, iy, depth), hash(ix + 1, iy, depth), fx),
    mix(hash(ix, iy + 1, depth), hash(ix + 1, iy + 1, depth), fx), fy)
  return mix(plane(iz), plane(iz + 1), fz)
}
export function identityTerrain(x, y, z) {
  const warp = noise(x * 2 + 4, y * 2, z * 2) - .5
  return .66 * noise(x * 3.6 + warp, y * 3.6 + 7.2, z * 3.6 - 3.1)
    + .25 * noise(x * 7.8 + 5, y * 7.8 - 2, z * 7.8)
    + .09 * noise(x * 17.2, y * 17.2, z * 17.2 + 9)
}

function lerpColor(a, b, t) {
  return [
    Math.round(mix(a[0], b[0], t)),
    Math.round(mix(a[1], b[1], t)),
    Math.round(mix(a[2], b[2], t)),
  ]
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

// Browser-only Identity detail pass. The world stays procedurally complete if
// this richer material data is unavailable; no network asset is required.
export function createIdentitySurfaceMaps(width = 384, height = 192) {
  const safeWidth = Math.max(8, Math.floor(width))
  const safeHeight = Math.max(4, Math.floor(height))
  const albedo = new Uint8Array(safeWidth * safeHeight * 4)
  const roughness = new Uint8Array(albedo.length)
  const elevation = new Uint8Array(albedo.length)

  const deepOcean = [8, 26, 39], shallowOcean = [42, 93, 101]
  const lowLand = [65, 91, 68], highLand = [143, 148, 116], peak = [191, 181, 145]
  let offset = 0

  for (let row = 0; row < safeHeight; row++) {
    const latitude = -Math.PI / 2 + (row + .5) / safeHeight * Math.PI
    const cosLatitude = Math.cos(latitude)
    const y = Math.sin(latitude)
    for (let column = 0; column < safeWidth; column++) {
      const longitude = -Math.PI + (column + .5) / safeWidth * Math.PI * 2
      const x = cosLatitude * Math.cos(longitude)
      const z = cosLatitude * Math.sin(longitude)
      const field = identityTerrain(x, y, z)
      const micro = noise(x * 31 + 2.7, y * 31 - 4.2, z * 31 + 8.1) - .5
      const ocean = field < .48
      let rgb, rough, heightValue

      if (ocean) {
        const depth = Math.min(1, Math.max(0, (field - .18) / .3))
        rgb = lerpColor(deepOcean, shallowOcean, depth)
        rough = Math.round(mix(70, 46, depth) + micro * 10)
        heightValue = Math.round(18 + depth * 8 + micro * 2)
      } else {
        const land = Math.min(1, Math.max(0, (field - .48) / .34))
        const first = lerpColor(lowLand, highLand, Math.min(1, land / .72))
        rgb = lerpColor(first, peak, Math.max(0, (land - .72) / .28))
        rough = Math.round(mix(180, 218, land) + micro * 10)
        heightValue = Math.round(30 + land * 210 + micro * 18)
      }

      const coast = Math.exp(-Math.pow((field - .485) / .022, 2))
      rgb = lerpColor(rgb, [94, 131, 115], coast * .12)
      const materialVariation = 1 + micro * (ocean ? .09 : .15)
      rgb = rgb.map(value => Math.max(0, Math.min(255, Math.round(value * materialVariation))))
      rough = Math.max(25, Math.min(240, Math.round(rough + coast * 18)))
      heightValue = Math.max(0, Math.min(255, heightValue))

      albedo[offset] = rgb[0]; albedo[offset + 1] = rgb[1]; albedo[offset + 2] = rgb[2]; albedo[offset + 3] = 255
      roughness[offset] = rough; roughness[offset + 1] = rough; roughness[offset + 2] = rough; roughness[offset + 3] = 255
      elevation[offset] = heightValue; elevation[offset + 1] = heightValue; elevation[offset + 2] = heightValue; elevation[offset + 3] = 255
      offset += 4
    }
  }

  return {
    albedo: makeTexture(albedo, safeWidth, safeHeight, SRGBColorSpace),
    roughness: makeTexture(roughness, safeWidth, safeHeight),
    elevation: makeTexture(elevation, safeWidth, safeHeight),
  }
}
