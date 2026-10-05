import {
  ClampToEdgeWrapping, RepeatWrapping, ShaderMaterial, SRGBColorSpace,
} from 'three'

// G2R.15: subdued, airless Mercury reference renderer. The credited 2K
// Solar System Scope atlas is albedo imagery; its luminance is NOT height.
// The scene's Sun is always world origin. No atmosphere/metallic response.
export const MERCURY_VERTEX = [
  'varying vec2 vMercuryUv;',
  'varying vec3 vMercuryNormal;',
  'varying vec3 vMercuryWorld;',
  'varying vec3 vMercuryCenter;',
  'void main() {',
  '  vMercuryUv = uv;',
  '  vMercuryNormal = normalize(mat3(modelMatrix) * normal);',
  '  vMercuryWorld = (modelMatrix * vec4(position, 1.)).xyz;',
  '  vMercuryCenter = (modelMatrix * vec4(0., 0., 0., 1.)).xyz;',
  '  gl_Position = projectionMatrix * viewMatrix * vec4(vMercuryWorld, 1.);',
  '}',
].join('\n')

export const MERCURY_FRAGMENT = [
  'uniform sampler2D dayMap;',
  'varying vec2 vMercuryUv;',
  'varying vec3 vMercuryNormal;',
  'varying vec3 vMercuryWorld;',
  'varying vec3 vMercuryCenter;',
  'vec3 sampleMercuryAlbedo(vec2 uv) {',
  '  vec3 source = texture2D(dayMap, uv).rgb;',
  '  // Narrow seam repair; do not alter the rest of the licensed atlas.',
  '  float edge = min(uv.x, 1. - uv.x);',
  '  if (edge < .019) {',
  '    vec3 opposite = texture2D(dayMap, vec2(1. - uv.x, uv.y)).rgb;',
  '    source = mix(source, opposite, .5 * (1. - smoothstep(0., .019, edge)));',
  '  }',
  '  return source;',
  '}',
  'void main() {',
  '  vec3 source = sampleMercuryAlbedo(vMercuryUv);',
  '  vec3 N = normalize(vMercuryNormal);',
  '  vec3 L = normalize(-vMercuryCenter);',
  '  #if MERCURY_DETAIL_HIGH == 1',
  '    // Gentle crater-ray and regolith contrast from the actual albedo.',
  '    // A brightness difference is NOT a measured topographic height map.',
  '    vec2 texel = vec2(1. / 2048., 1. / 1024.);',
  '    float centre = dot(source, vec3(.2126, .7152, .0722));',
  '    float west = dot(texture2D(dayMap, vMercuryUv - vec2(texel.x, 0.)).rgb, vec3(.2126, .7152, .0722));',
  '    float east = dot(texture2D(dayMap, vMercuryUv + vec2(texel.x, 0.)).rgb, vec3(.2126, .7152, .0722));',
  '    float north = dot(texture2D(dayMap, vMercuryUv + vec2(0., texel.y)).rgb, vec3(.2126, .7152, .0722));',
  '    float south = dot(texture2D(dayMap, vMercuryUv - vec2(0., texel.y)).rgb, vec3(.2126, .7152, .0722));',
  '    float localContrast = clamp(centre - (west + east + north + south) * .25, -.18, .18);',
  '    source *= 1. + localContrast * .31;',
  '  #endif',
  '  // NASA notes Mercury appears greyish-brown; do not turn its surface into',
  '  // MESSENGER exaggerated spectral false-color or a shiny machine world.',
  '  float luminance = dot(source, vec3(.2126, .7152, .0722));',
  '  vec3 neutralRock = vec3(luminance * 1.035, luminance * 1.005, luminance * .965);',
  '  vec3 albedo = mix(source, neutralRock, .32);',
  '  float sunDot = dot(N, L);',
  '  float irradiance = .013 + max(sunDot, 0.) * 1.23;',
  '  // Mercury has an exosphere, not a visible Earth-like scattering shell.',
  '  // Preserve a fairly hard unlit terminator and no fake night emissions.',
  '  float day = smoothstep(-.065, .055, sunDot);',
  '  vec3 colour = albedo * irradiance * day;',
  '  gl_FragColor = vec4(colour, 1.);',
  '  #include <tonemapping_fragment>',
  '  #include <colorspace_fragment>',
  '}',
].join('\n')

export function configureMercuryAtlas(map) {
  map.colorSpace = SRGBColorSpace
  map.wrapS = RepeatWrapping
  map.wrapT = ClampToEdgeWrapping
  return map
}

export function createMercurySurfaceMaterial(lowPower, map) {
  return new ShaderMaterial({
    defines: { MERCURY_DETAIL_HIGH: lowPower ? 0 : 1 },
    uniforms: { dayMap: { value: configureMercuryAtlas(map) } },
    vertexShader: MERCURY_VERTEX,
    fragmentShader: MERCURY_FRAGMENT,
  })
}
