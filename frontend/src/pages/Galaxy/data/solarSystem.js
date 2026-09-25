const focus = (distance, azimuth, elevation, fov = 38) => Object.freeze({ distance, azimuth, elevation, fov })

// Scene units and radians/second; deliberately slower than an astronomy demo.
export const SUN = Object.freeze({ id: 'core', focus: focus(12, 0.3, 0.7), label: 'Core', meaning: 'Sanam / Core', radius: 2.1, color: '#ffd69b' })
export const PLANETS = Object.freeze([
  { id: 'identity', focus: focus(6.2, -0.4, 0.9), label: 'Identity', meaning: 'Identity', radius: 0.78, color: '#5eaaa1', surface: 'ocean', orbit: { radius: 5.6, speed: 0.035, phase: 2.6, inclination: 0.06 } },
  { id: 'skills', focus: focus(6.8, 0.5, 0.9), label: 'Skills', meaning: 'Skills', radius: 0.88, color: '#a6b5cb', surface: 'engineered', orbit: { radius: 8.7, speed: 0.024, phase: 5.7, inclination: -0.08 } },
  { id: 'projects', focus: focus(8, 0.35, 0.8), label: 'Projects', meaning: 'Projects', radius: 1.3, color: '#a58b79', surface: 'rock', orbit: { radius: 12.3, speed: 0.017, phase: 0.65, inclination: 0.1 } },
  { id: 'journey', focus: focus(10, -0.4, 0.75, 42), label: 'Journey', meaning: 'Journey', radius: 0.95, color: '#b9a5c5', surface: 'weathered', ring: [1.45, 2.15], orbit: { radius: 16.4, speed: 0.011, phase: 3.7, inclination: -0.04 } },
].map(body => Object.freeze({ ...body, orbit: Object.freeze(body.orbit) })))
export const LAB = Object.freeze({ id: 'lab', focus: focus(5.6, -0.5, 0.85), label: 'The Lab', meaning: 'Unknown signal', radius: 0.65, color: '#897da4', position: [20, 1.4, -9] })
export const SYSTEM_MAP = Object.freeze([SUN, ...PLANETS, LAB])
export const SOLAR_STYLE = Object.freeze({ orbitColor: '#68717d', orbitOpacity: 0.23, segments: 128, mobileBodyScale: 1.28, sunLight: 2.8, ambient: 0.23 })
