import {
  ClampToEdgeWrapping, RepeatWrapping, ShaderMaterial, SRGBColorSpace,
} from 'three'

// G2R.14 — the existing attributed Saturn/Solar System Scope Mars atlas is
// albedo imagery, not measured MOLA elevation. Retain that photographic colour,
// give it directional, explicitly controlled lighting, and only use sampled
// luminance derivatives as weak visual micro-contrast (never as true topology).
export const MARS_VERTEX = [
  'varying vec2 vMarsUv;',
  'varying vec3 vMarsNormal;',
  'varying vec3 vMarsWorld;',
  'varying vec3 vMarsCenter;',
  'void main() {',
  '  vMarsUv = uv;',
  '  vMarsNormal = normalize(mat3(modelMatrix) * normal);',
  '  vMarsWorld = (modelMatrix * vec4(position, 1.)).xyz;',
  '  vMarsCenter = (modelMatrix * vec4(0., 0., 0., 1.)).xyz;',
  '  gl_Position = projectionMatrix * viewMatrix * vec4(vMarsWorld, 1.);',
  '}',
].join('\n')

export const MARS_FRAGMENT = [
  'uniform sampler2D dayMap;',
  'varying vec2 vMarsUv;',
  'varying vec3 vMarsNormal;',
  'varying vec3 vMarsWorld;',
  'varying vec3 vMarsCenter;',
  'vec3 sampleMarsAlbedo(vec2 uv) {',
  '  vec3 source = texture2D(dayMap, uv).rgb;',
  '  // Only the narrow original longitude join is blended, retaining every',
  '  // other pixel of the original credited colour atlas.',
  '  float edge = min(uv.x, 1. - uv.x);',
  '  if (edge < .025) {',
  '    vec3 opposite = texture2D(dayMap, vec2(1. - uv.x, uv.y)).rgb;',
  '    source = mix(source, opposite, .5 * (1. - smoothstep(0., .025, edge)));',
  '  }',
  '  return source;',
  '}',
  'void main() {',
  '  vec3 source = sampleMarsAlbedo(vMarsUv);',
  '  vec3 N = normalize(vMarsNormal);',
  '  vec3 L = normalize(-vMarsCenter);',
  '  #if MARS_DETAIL_HIGH == 1',
  '    // Only a subtle albedo edge normal perturbation. This is deliberately',
  '    // not called MOLA height or actual displaced relief: the map is colour.',
  '    vec2 texel = vec2(1. / 2048., 1. / 1024.);',
  '    float albedoHere = dot(source, vec3(.2126, .7152, .0722));',
  '    float albedoEast = dot(texture2D(dayMap, vMarsUv + vec2(texel.x, 0.)).rgb, vec3(.2126, .7152, .0722));',
  '    float albedoNorth = dot(texture2D(dayMap, vMarsUv + vec2(0., texel.y)).rgb, vec3(.2126, .7152, .0722));',
  '    vec3 tangent = normalize(cross(abs(N.y) > .985 ? vec3(1.,0.,0.) : vec3(0.,1.,0.), N));',
  '    vec3 bitangent = normalize(cross(N, tangent));',
  '    N = normalize(N + (tangent * (albedoHere - albedoEast)',
  '      + bitangent * (albedoHere - albedoNorth)) * .17);',
  '  #endif',
  '  // Temper the strong copper/red enhancement of the artist-coloured atlas',
  '  // while keeping dark volcanic provinces, desert plains and polar tones.',
  '  float luminance = dot(source, vec3(.2126, .7152, .0722));',
  '  vec3 natural = vec3(luminance * 1.15, luminance * 1.05, luminance * .97);',
  '  vec3 albedo = mix(source, natural, .17);',
  '  float sunDot = dot(N, L);',
  '  float daylight = smoothstep(-.16, .11, sunDot);',
  '  float irradiance = mix(.008, .035 + max(sunDot, 0.) * 1.27, daylight);',
  '  // No settlements, artificial emission or colourized lights on Mars.',
  '  vec3 colour = albedo * irradiance;',
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

export function createMarsSurfaceMaterial(lowPower, map) {
  return new ShaderMaterial({
    defines: { MARS_DETAIL_HIGH: lowPower ? 0 : 1 },
    uniforms: { dayMap: { value: configureMarsAtlas(map) } },
    vertexShader: MARS_VERTEX,
    fragmentShader: MARS_FRAGMENT,
  })
}
