import {
  Color, DoubleSide, Group, Mesh, RingGeometry, ShaderMaterial,
} from 'three'
import { JOURNEY_RING_APPEARANCE } from '../data/journey.js'
import { SATURN_RING_PROFILE_GLSL } from './SaturnOptics.js'

// G2R.13: one transparent annulus with Cassini-reference C/B/A density bands.
// The same radial density source is used for its projected surface shadow.
export function createJourneyRings(body, lowPower) {
  const style = JOURNEY_RING_APPEARANCE
  const inner = body.radius * body.ring[0], outer = body.radius * body.ring[1]
  const material = new ShaderMaterial({
    defines: { RING_DETAIL_HIGH: lowPower ? 0 : 1 },
    uniforms: {
      innerRadius: { value: inner },
      outerRadius: { value: outer },
      planetRadius: { value: body.radius },
      innerTint: { value: new Color(style.innerTint) },
      outerTint: { value: new Color(style.outerTint) },
    },
    vertexShader: [
      'varying float vRadius;',
      'varying vec2 vDisk;',
      'varying vec3 vWorldPosition;',
      'varying vec3 vPlanetCenter;',
      'varying vec3 vRingNormal;',
      'void main() {',
      '  vDisk = position.xy;',
      '  vRadius = length(position.xy);',
      '  vec4 world = modelMatrix * vec4(position, 1.);',
      '  vWorldPosition = world.xyz;',
      '  vPlanetCenter = (modelMatrix * vec4(0., 0., 0., 1.)).xyz;',
      '  vRingNormal = normalize(mat3(modelMatrix) * vec3(0., 0., 1.));',
      '  gl_Position = projectionMatrix * viewMatrix * world;',
      '}',
    ].join('\n'),
    fragmentShader: [
      'uniform float innerRadius;',
      'uniform float outerRadius;',
      'uniform float planetRadius;',
      'uniform vec3 innerTint;',
      'uniform vec3 outerTint;',
      'varying float vRadius;',
      'varying vec2 vDisk;',
      'varying vec3 vWorldPosition;',
      'varying vec3 vPlanetCenter;',
      'varying vec3 vRingNormal;',
      SATURN_RING_PROFILE_GLSL,
      'float hash21(vec2 p) {',
      '  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);',
      '}',
      'void main() {',
      '  float r = vRadius / planetRadius;',
      '  float t = clamp((vRadius - innerRadius) / (outerRadius - innerRadius), 0., 1.);',
      '  float alpha = saturnRingDensity(r);',
      '  if (alpha < .005) discard;',
      '  float nearDetail = 1. - smoothstep(7., 23., distance(cameraPosition, vPlanetCenter));',
      '  #if RING_DETAIL_HIGH',
      '    // Derivative-filter fine ringlets so distant annuli do not shimmer.',
      '    float phase = t * 1180. + 1.8 * sin(t * 59.);',
      '    float ringletAA = 1. - smoothstep(.45, 1.7, fwidth(phase));',
      '    float ringlet = sin(phase) * ringletAA * nearDetail;',
      '    float azimuth = atan(vDisk.y, vDisk.x);',
      '    float fleck = hash21(floor(vec2(r * 620., azimuth * 135.)));',
      '    alpha *= 1. + ringlet * .12 + (fleck - .5) * .045 * nearDetail;',
      '  #endif',
      '  // Directional light shared with the planet surface: Sun at origin.',
      '  vec3 sunDirection = normalize(-vPlanetCenter);',
      '  float incidence = abs(dot(normalize(vRingNormal), sunDirection));',
      '  float light = .43 + .57 * sqrt(incidence);',
      '  // Planet casts a true projected shadow into the back ring sector.',
      '  vec3 towardPlanet = vPlanetCenter - vWorldPosition;',
      '  float rayDistance = dot(towardPlanet, sunDirection);',
      '  float missSquared = dot(towardPlanet, towardPlanet) - rayDistance * rayDistance;',
      '  float shadow = step(0., rayDistance)',
      '    * (1. - smoothstep(planetRadius * planetRadius * .91,',
      '                        planetRadius * planetRadius * 1.07, missSquared));',
      '  vec3 palette = mix(innerTint, outerTint, smoothstep(1.92, 2.12, r));',
      '  // Cassini images: inner C appears dusky, B is warm and dense, A is cooler.',
      '  palette *= mix(.74, 1.03, smoothstep(1.255, 1.54, r));',
      '  palette *= .96 + .045 * sin(r * 73. + .2);',
      '  gl_FragColor = vec4(palette * light * (1. - .88 * shadow), clamp(alpha, 0., .84));',
      '  #include <tonemapping_fragment>',
      '  #include <colorspace_fragment>',
      '}',
    ].join('\n'),
    extensions: { derivatives: true },
    side: DoubleSide,
    transparent: true,
    depthWrite: false,
    depthTest: true,
  })
  const geometry = new RingGeometry(
    inner, outer, lowPower ? style.mobileSegments : style.desktopSegments,
    lowPower ? 1 : style.desktopRadialSegments,
  )
  const mesh = new Mesh(geometry, material)
  mesh.name = 'journey-ring-bands'
  // RingGeometry starts in XY. Align the plane normal with Saturn's tilt
  // instead of an independently guessed visual angle.
  mesh.rotation.x = -Math.PI / 2
  const group = new Group()
  group.name = 'journey-rings'
  group.rotation.z = body.rotation.axialTilt
  group.add(mesh)
  return group
}
