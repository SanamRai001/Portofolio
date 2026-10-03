import { CORE, CORE_COMPOSITION } from './core.js'
import { SKILLS, SKILLS_COMPOSITION, SKILLS_FRAME_RADIUS } from './skills.js'
import { IDENTITY, IDENTITY_COMPOSITION } from './identity.js'

const focus = (distance, azimuth, elevation, fov = 38) => Object.freeze({ distance, azimuth, elevation, fov })
const rotation = (axialTilt, surfaceSpeed, direction = 1, phase = 0, cloudSpeed = null) => Object.freeze({ axialTilt, surfaceSpeed, direction, phase, cloudSpeed })

// Scene units and radians/second; deliberately slower than an astronomy demo.
export const SUN = Object.freeze({ id: CORE.id, focus: Object.freeze({ ...focus(12, 0.3, 0.7), composition: CORE_COMPOSITION }), label: CORE.label, meaning: `${CORE.shortName} / ${CORE.label}`, radius: 2.1, color: '#ffd69b' })
export const PLANETS = Object.freeze([
  { id: IDENTITY.id, focus: Object.freeze({ ...focus(6.2, -0.4, 0.9), composition: IDENTITY_COMPOSITION }), label: IDENTITY.label, meaning: 'Identity', radius: 0.78, color: '#5eaaa1', surface: 'ocean', rotation: rotation(.12, .022, 1, 0, .031), orbit: { radius: 5.6, speed: 0.035, phase: 2.6, inclination: 0.06 } },
  { id: SKILLS.id, focus: Object.freeze({ ...focus(6.8, 0.5, 0.9), composition: SKILLS_COMPOSITION, frameRadius: SKILLS_FRAME_RADIUS }), label: SKILLS.label, meaning: 'Skills', radius: 0.88, color: '#a6b5cb', surface: 'engineered', rotation: rotation(-.18, .014), orbit: { radius: 8.7, speed: 0.024, phase: 5.7, inclination: -0.08 } },
  { id: 'projects', focus: focus(8, 0.35, 0.8), label: 'Projects', meaning: 'Projects', radius: 1.3, color: '#a58b79', surface: 'rock', rotation: rotation(.08, .045), orbit: { radius: 12.3, speed: 0.017, phase: 0.65, inclination: 0.1 } },
  { id: 'journey', focus: focus(10, -0.4, 0.75, 42), label: 'Journey', meaning: 'Journey', radius: 0.95, color: '#b9a5c5', surface: 'weathered', rotation: rotation(.31, .009, -1), ring: [1.235, 2.295], orbit: { radius: 16.4, speed: 0.011, phase: 3.7, inclination: -0.04 } },
].map(body => Object.freeze({ ...body, orbit: Object.freeze(body.orbit) })))
export const LAB = Object.freeze({ id: 'lab', focus: focus(5.6, -0.5, 0.85), label: 'The Lab', meaning: 'Unknown signal', radius: 0.65, color: '#897da4', position: [20, 1.4, -9] })
// A peripheral signal beyond Journey's orbit: deliberately away from Core,
 // with a complete focus target but no route/portal action until G2R.8.
export const BLACK_HOLE = Object.freeze({
  id: 'black-hole', label: 'Black Hole', meaning: 'Event horizon', radius: .70,
  color: '#b98566', position: [-18.5, 1.7, -20],
  focus: focus(6.2, -.18, .65, 40),
})
export const SYSTEM_MAP = Object.freeze([SUN, ...PLANETS, LAB, BLACK_HOLE])
export const SOLAR_STYLE = Object.freeze({ orbitColor: '#68717d', orbitOpacity: 0.23, segments: 128, mobileBodyScale: 1.28, overviewBodyScale: 1.5, mobileOverviewBodyScale: 1.12, sunLight: 2.8, ambient: 0.23 })
