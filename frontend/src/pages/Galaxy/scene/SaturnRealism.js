import {
  ClampToEdgeWrapping, Color, RepeatWrapping, ShaderMaterial, SRGBColorSpace,
  Vector3,
} from 'three'
import { SATURN_RING_PROFILE_GLSL } from './SaturnOptics.js'

// One optical model for the photographic Saturn atlas and the same-density
// ring shadow. No bumps: this globe is gas/cloud, not displaceable rock.
export const SATURN_SURFACE_VERTEX = [
  'uniform vec3 ringNormalSurface;',
  'varying vec2 vSaturnUv;',
  'varying vec3 vWorldNormal;',
  'varying vec3 vWorldPosition;',
  'varying vec3 vPlanetCenter;',
  'varying vec3 vWorldRingNormal;',
  'void main() {',
  '  vSaturnUv = uv;',
  '  vWorldNormal = normalize(mat3(modelMatrix) * normal);',
  '  vWorldRingNormal = normalize(mat3(modelMatrix) * ringNormalSurface);',
  '  vWorldPosition = (modelMatrix * vec4(position, 1.)).xyz;',
  '  vPlanetCenter = (modelMatrix * vec4(0., 0., 0., 1.)).xyz;',
  '  gl_Position = projectionMatrix * viewMatrix * vec4(vWorldPosition, 1.);',
  '}',
].join('\n')

export const SATURN_SURFACE_FRAGMENT = [
  'uniform sampler2D dayMap;',
  'uniform float planetRadius;',
  'varying vec2 vSaturnUv;',
  'varying vec3 vWorldNormal;',
  'varying vec3 vWorldPosition;',
  'varying vec3 vPlanetCenter;',
  'varying vec3 vWorldRingNormal;',
  SATURN_RING_PROFILE_GLSL,
  'void main() {',
  '  vec3 N = normalize(vWorldNormal);',
  '  vec3 L = normalize(-vPlanetCenter);',
  '  vec3 source = texture2D(dayMap, vSaturnUv).rgb;',
  '  #if SATURN_HIGH_QUALITY',
  '    // Very restrained belt modulation: local source atlas owns the hues.',
  '    float lat = vSaturnUv.y;',
  '    float filaments = sin(lat * 132. + sin(vSaturnUv.x * 24. + lat * 17.) * .32);',
  '    source *= 1. + filaments * .022;',
  '  #endif',
  '  float sunDot = dot(N, L);',
  '  float daylight = smoothstep(-.09, .16, sunDot);',
  '  float irradiance = .055 + max(sunDot, 0.) * .99;',
  '  // Directional ray from the cloud top to the ring plane. Only the',
  '  // common C/B/A optical profile may cast this shadow (Cassini is a gap).',
  '  vec3 planeNormal = normalize(vWorldRingNormal);',
  '  float denominator = dot(L, planeNormal);',
  '  float ringShadow = 0.;',
  '  if (abs(denominator) > .025 && sunDot > 0.) {',
  '    float rayT = -dot(vWorldPosition - vPlanetCenter, planeNormal) / denominator;',
  '    if (rayT > 0.) {',
  '      vec3 hit = vWorldPosition - vPlanetCenter + L * rayT;',
  '      float crossingRadius = length(hit) / planetRadius;',
  '      ringShadow = saturnRingDensity(crossingRadius) * .77;',
  '    }',
  '  }',
  '  vec3 colour = source * irradiance * mix(.17, 1., daylight) * (1. - ringShadow);',
  '  gl_FragColor = vec4(colour, 1.);',
  '  #include <tonemapping_fragment>',
  '  #include <colorspace_fragment>',
  '}',
].join('\n')

export function createSaturnSurfaceMaterial(body, lowPower, initialMap) {
  return new ShaderMaterial({
    defines: { SATURN_HIGH_QUALITY: lowPower ? 0 : 1 },
    uniforms: {
      dayMap: { value: initialMap },
      planetRadius: { value: body.radius },
      // The local ring-plane normal is converted back through the spinning
      // surface's transform in JourneyPlanet.js on the existing render tick.
      ringNormalSurface: { value: new Vector3(0, 1, 0) },
    },
    vertexShader: SATURN_SURFACE_VERTEX,
    fragmentShader: SATURN_SURFACE_FRAGMENT,
  })
}

export function configureSaturnAtlas(map) {
  map.colorSpace = SRGBColorSpace
  map.wrapS = RepeatWrapping
  map.wrapT = ClampToEdgeWrapping
  return map
}
