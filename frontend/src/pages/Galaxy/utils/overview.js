import { PLANETS, LAB, SOLAR_STYLE } from '../data/solarSystem.js'
import { orbitPosition } from './orbits.js'
const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0)
// Portrait rolls the orbital major axis vertically and looks across the plane.
// Fit the entire swept orbit envelope, not just the first frame.
export function getOverview(width, height) {
  const portrait = width / height < 0.85
  const elevation = portrait ? 0.38 : 0.62
  const direction = [0, Math.sin(elevation), Math.cos(elevation)]
  const right = portrait ? [0, -direction[2], direction[1]] : [1, 0, 0]
  const up = portrait ? [1, 0, 0] : [0, direction[2], -direction[1]]
  const fov = portrait ? 58 : 46
  const tanY = Math.tan(fov * Math.PI / 360), tanX = tanY * width / height
  const bodyScale = portrait ? SOLAR_STYLE.mobileBodyScale : 1
  let distance = 0
  function fit(point, radius) {
    const depth = dot(point, direction)
    distance = Math.max(distance, depth + (Math.abs(dot(point, right)) + radius) / (tanX * 0.88), depth + (Math.abs(dot(point, up)) + radius) / (tanY * 0.88))
  }
  for (const body of PLANETS) for (let step = 0; step < 128; step++) {
    fit(orbitPosition(body.orbit, step / 128 * Math.PI * 2), body.radius * (body.ring?.[1] || 1.12) * bodyScale)
  }
  fit(LAB.position, LAB.radius * 2)
  return { portrait, fov, distance, direction, right, up, tanX, tanY, bodyScale }
}
export function projectOverview(point, view) {
  const depth = view.distance - dot(point, view.direction)
  return { x: dot(point, view.right) / (depth * view.tanX), y: -dot(point, view.up) / (depth * view.tanY), depth }
}
