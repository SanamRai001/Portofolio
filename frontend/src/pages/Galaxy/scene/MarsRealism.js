import {
  ClampToEdgeWrapping, RepeatWrapping, ShaderMaterial, SRGBColorSpace,
} from 'three'

// G2R.14: the authored Solar System Scope albedo atlas owns the Mars colour.
// A false-colour MOLA height rendering is NOT used as a surface-colour map,
// and Mars has no speculative city lights on its unlit hemisphere.
export const MARS_VERTEX_SHADER = [
  'varying vec2 vMarsUv;',
  'varying vec3 vMarsLocal;',
  'varying vec3 vMarsNormal;',
  'varying vec3 vMarsWorld;',
  'varying vec3 vMarsCenter;',
  'void main() {',
  '  vMarsUv = uv;',
  '  vMarsLocal = normalize(position);',
  '  vMarsNormal = normalize(mat3(modelMatrix) * normal);',
  '  vMarsWorld = (modelMatrix * vec4(position, 1.)).xyz;',
  '  vMarsCenter = (modelMatrix * vec4(0., 0., 0., 1.)).xyz;',
  '  gl_Position = projectionMatrix * viewMatrix * vec4(vMarsWorld, 1.);',
  '}',
].join('\n')

export const MARS_FRAGMENT_SHADER = [
  'uniform sampler2D albedoMap;',
  'varying vec2 vMarsUv;',
  'varying vec3 vMarsLocal;',
  'varying vec3 vMarsNormal;',
  'varying vec3 vMarsWorld;',
  'varying vec3 vMarsCenter;',
  'vec3 marsAlbedo(vec2 uv) {',
  '  // The vendored 2K atlas has a visible longitude join. Only the',
  '  // final narrow 2% of either side is blended; all other pixels are real',
  '  // source albedo rather than a replacement copper noise field.',
  '  float x = fract(uv.x);',
  '  vec3 albedo = texture2D(albedoMap, vec2(x, uv.y)).rgb;',
  '  float edge = min(x, 1. - x);',
  '  if (edge < .020) {',
  '    vec3 counterpart = texture2D(albedoMap, vec2(1. - x, uv.y)).rgb;',
  '    albedo = mix(albedo, counterpart, .5 * (1. - smoothstep(0., .020, edge)));',
  '  }',
  '  return albedo;',
  '}',
  'void main() {',
  '  vec3 N = normalize(vMarsNormal);',
  '  vec3 L = normalize(-vMarsCenter);',
  '  float sunDot = dot(N, L);',
  '  float day = smoothstep(-.085, .13, sunDot);',
  '  float irradiance = max(sunDot, 0.);',
  '  vec3 albedo = marsAlbedo(vMarsUv);',
  '  // Slightly tame enhanced reds; preserve the atlas darker basaltic units',
  '  // and bright dust/polar regions rather than flattening them to one hue.',
  '  float luminance = dot(albedo, vec3(.2126, .7152, .0722));',
  '  albedo = mix(albedo, vec3(luminance), .035);',
  '  #if MARS_DETAIL_HIGH',
  '    // Very low-amplitude subpixel weathering, not invented topography.',
  '    float grain = sin(vMarsLocal.x * 101. + vMarsLocal.z * 33.)',
  '      * sin(vMarsLocal.y * 137. - vMarsLocal.z * 41.);',
  '    albedo *= 1. + grain * .014;',
  '  #endif',
  '  // Directional light from the actual world-space Core at (0,0,0).',
  '  // The sunset rim comes from a separate thin daylight-aware haze.',
  '  float diffuse = pow(irradiance, .90) * 1.10;',
  '  vec3 colour = albedo * (.016 + diffuse) * mix(.12, 1., day);',
  '  gl_FragColor = vec4(colour, 1.);',
  '  #include <tonemapping_fragment>',
  '  #include <colorspace_fragment>',
  '}',
].join('\n')

export function configureMarsAtlas(map) {
  map.colorSpace = SRGBColorSpace
  map.wrapS = RepeatWrapping
  map.wrapT = ClampToEdgeWrapping
  return map
}

export function createMarsSurfaceMaterial(map, lowPower) {
  return new ShaderMaterial({
    defines: { MARS_DETAIL_HIGH: lowPower ? 0 : 1 },
    uniforms: { albedoMap: { value: map } },
    vertexShader: MARS_VERTEX_SHADER,
    fragmentShader: MARS_FRAGMENT_SHADER,
  })
}
