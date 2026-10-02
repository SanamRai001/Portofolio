import { PLANETS, LAB, BLACK_HOLE, SOLAR_STYLE } from '../data/solarSystem.js'
import { orbitPosition } from './orbits.js'
const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0)
// Portrait rolls the orbital major axis vertically and looks across the plane.
// Fit the entire swept orbit envelope, not just the first frame.
export function getOverview(width, height) {
  const portrait = width / height < 0.85
  // A more cinematic, lower desktop angle opens the horizontal planetary spread.
  // Keep the proven portrait camera exactly as it was.
  const elevation = portrait ? 0.38 : 0.45
  const direction = [0, Math.sin(elevation), Math.cos(elevation)]
  const right = portrait ? [0, -direction[2], direction[1]] : [1, 0, 0]
  const up = portrait ? [1, 0, 0] : [0, direction[2], -direction[1]]
  const fov = portrait ? 58 : 46
  const tanY = Math.tan(fov * Math.PI / 360), tanX = tanY * width / height
  const bodyScale = portrait ? SOLAR_STYLE.mobileBodyScale : 1
  // Desktop reserves the *rendered* overview size, not merely the base radius.
  // Portrait retains its previous framing constants and envelope calculation.
  const desktopVisualScale = portrait ? 1 : SOLAR_STYLE.overviewBodyScale
  const fitMargin = portrait ? 0.88 : 0.94
  let distance = 0
  function fit(point, radius) {
    const depth = dot(point, direction)
    distance = Math.max(distance, depth + (Math.abs(dot(point, right)) + radius) / (tanX * fitMargin), depth + (Math.abs(dot(point, up)) + radius) / (tanY * fitMargin))
  }
  for (const body of PLANETS) for (let step = 0; step < 128; step++) {
    // Identity's decorative desktop Moon reaches 2.62 Earth radii; the other
    // envelopes include any ring geometry. Reserve those swept silhouettes.
    const extent = body.id === 'identity' && !portrait ? 2.62 : (body.ring?.[1] || 1.12)
    fit(orbitPosition(body.orbit, step / 128 * Math.PI * 2), body.radius * extent * bodyScale * desktopVisualScale)
  }
  fit(LAB.position, LAB.radius * 2 * desktopVisualScale)
  // Preserve the swept orbit envelope while also keeping the new peripheral
  // black-hole silhouette on-screen at both landscape and portrait sizes.
  fit(BLACK_HOLE.position, BLACK_HOLE.radius * 2.2 * bodyScale * desktopVisualScale)
  return { portrait, fov, distance, direction, right, up, tanX, tanY, bodyScale }
}
export function projectOverview(point, view) {
  const depth = view.distance - dot(point, view.direction)
  return { x: dot(point, view.right) / (depth * view.tanX), y: -dot(point, view.up) / (depth * view.tanY), depth }
}
