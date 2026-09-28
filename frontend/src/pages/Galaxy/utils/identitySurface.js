// Continuous 3D value noise: deterministic, seamless at the sphere's UV seam,
// and evaluated only when the Identity mesh is constructed.
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
