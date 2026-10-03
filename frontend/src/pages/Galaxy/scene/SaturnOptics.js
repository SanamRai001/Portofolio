// Cassini-reference-inspired apparent ring optical depth (not a particle simulator).
// Express radii in units of the planet radius, and share the SAME profile
// between the visible annulus and its projected shadow on the globe.
export const SATURN_RING_RADII = Object.freeze({
  inner: 1.235, cEnd: 1.525, bStart: 1.530,
  bEnd: 1.955, cassiniMiddle: 1.995, aStart: 2.030,
  encke: 2.212, outer: 2.295,
})

export const SATURN_RING_PROFILE_GLSL = [
  'float saturnRingDensity(float r) {',
  '  // C: notably translucent, so planet/background remain visible.',
  '  float c = smoothstep(1.235, 1.265, r) * (1. - smoothstep(1.49, 1.525, r));',
  '  c *= .12 + .048 * sin(r * 89. + .4);',
  '  // B: opaque-looking principal band but not an unbroken flat disk.',
  '  float b = smoothstep(1.530, 1.558, r) * (1. - smoothstep(1.943, 1.955, r));',
  '  b *= .60 + .12 * sin(r * 66. + 1.5);',
  '  // A: thinner with the much narrower Encke gap.',
  '  float a = smoothstep(2.030, 2.055, r) * (1. - smoothstep(2.270, 2.295, r));',
  '  a *= (.38 + .065 * sin(r * 98.)) * (1. - .88 * exp(-pow((r - 2.212) * 370., 2.)));',
  '  // Cassini Division is a genuine low-density opening, not black paint.',
  '  float cassiniRinglet = exp(-pow((r - 1.995) * 160., 2.)) * .027;',
  '  return clamp(c + b + a + cassiniRinglet, 0., .84);',
  '}',
].join('\n')

// Ring plane is linked to the globe's axial tilt in JourneyRings.js.
// This helper ensures a deterministic orientation even when surface rotation
// advances, rather than guessing a static shadow stripe on the texture.
export const SATURN_RING_AXIS = Object.freeze([0, 0, 1])
