import {
  AdditiveBlending, BufferGeometry, Color, DoubleSide, Float32BufferAttribute,
  Group, Mesh, ShaderMaterial, SphereGeometry, Vector3,
} from 'three'

// G2R.12: HMI continuum-light and eclipse-reference art direction.
// Full-disk observations are VIEW projections, not equirectangular sphere maps.
// Keep the older local sun map only as optional low-amplitude luminance detail;
// the seamless directional photosphere defines colour, granulation and spots.
const surfaceVertex = [
  'varying vec3 solarDirection;',
  'varying vec3 eyeNormal;',
  'varying vec3 eyeVector;',
  'varying vec2 solarUv;',
  'void main() {',
  '  solarDirection = normalize(position);',
  '  solarUv = uv;',
  '  vec4 p = modelViewMatrix * vec4(position, 1.);',
  '  eyeNormal = normalize(normalMatrix * normal);',
  '  eyeVector = -p.xyz;',
  '  gl_Position = projectionMatrix * p;',
  '}',
].join('\n')

const surfaceFragment = [
  'uniform float time;',
  'uniform float activity;',
  'uniform sampler2D surfaceMap;',
  'uniform bool hasSurfaceMap;',
  'uniform vec3 amber;',
  'uniform vec3 gold;',
  'uniform vec3 ivory;',
  'varying vec3 solarDirection;',
  'varying vec3 eyeNormal;',
  'varying vec3 eyeVector;',
  'varying vec2 solarUv;',
  'float hash(vec3 p) {',
  '  p = fract(p * .1031);',
  '  p += dot(p, p.yzx + 33.33);',
  '  return fract((p.x + p.y) * p.z);',
  '}',
  'float noise(vec3 p) {',
  '  vec3 i = floor(p), f = fract(p);',
  '  f = f * f * (3. - 2. * f);',
  '  return mix(mix(mix(hash(i), hash(i + vec3(1.,0.,0.)), f.x),',
  '                 mix(hash(i + vec3(0.,1.,0.)), hash(i + vec3(1.,1.,0.)), f.x), f.y),',
  '             mix(mix(hash(i + vec3(0.,0.,1.)), hash(i + vec3(1.,0.,1.)), f.x),',
  '                 mix(hash(i + vec3(0.,1.,1.)), hash(i + vec3(1.,1.,1.)), f.x), f.y), f.z);',
  '}',
  'void main() {',
  '  vec3 s = normalize(solarDirection);',
  '  float facing = clamp(dot(normalize(eyeNormal), normalize(eyeVector)), 0., 1.);',
  '  // A continuum-light full disk is subdued at this scale, not swirling lava.',
  '  // Directional noise has no longitude seam or compressed equirectangular poles.',
  '  float convection = noise(s * 8. + vec3(time * .0018, .8, -1.3));',
  '  float cells = noise(s * 49. + vec3(time * .006, -time * .003, .7));',
  '  float lanes = 1. - smoothstep(.045, .18, abs(cells - .51));',
  '  float granules = (cells - .5) * .105 - lanes * .036;',
  '  #if SUN_OCTAVES > 2',
  '    float fine = noise(s * 137. + vec3(-time * .012, .4, time * .008));',
  '    granules += (fine - .5) * .045;',
  '  #endif',
  '  float textureVariation = 0.;',
  '  if (hasSurfaceMap) {',
  '    // The previously shipped fictional/artist-coloured map is NOT used as',
  '    // physical colour. Only its faint luminance prevents an orange marble.',
  '    vec3 authored = texture2D(surfaceMap, vec2(fract(solarUv.x + time * .00018), solarUv.y)).rgb;',
  '    float latitudeFade = smoothstep(.10, .23, solarUv.y)',
  '      * (1. - smoothstep(.77, .90, solarUv.y));',
  '    textureVariation = (dot(authored, vec3(.2126,.7152,.0722)) - .5) * .055 * latitudeFade;',
  '  }',
  '  float detail = .958 + (convection - .5) * .070 + granules + textureVariation;',
  '  // Localized, irregular magnetic active regions: penumbra + darker umbra.',
  '  // Small and largely motion-independent, as in visible-light HMI images.',
  '  float jitter = (noise(s * 78. + vec3(2.1, -1.4, 4.7)) - .5) * .0030;',
  '  float regionA = dot(s, normalize(vec3(.29, .58, .76))) + jitter;',
  '  float penumbra = smoothstep(.986, .995, regionA);',
  '  float umbra = smoothstep(.996, .9990, regionA);',
  '  #if SUN_OCTAVES > 2',
  '    float regionB = dot(s, normalize(vec3(-.15, .49, .86))) - jitter * .8;',
  '    penumbra = max(penumbra, smoothstep(.991, .997, regionB) * .78);',
  '    umbra = max(umbra, smoothstep(.998, .99945, regionB) * .72);',
  '  #endif',
  '  detail *= 1. - penumbra * .23 - umbra * .35;',
  '  // A restrained bright facular surround; only visible at high quality.',
  '  #if SUN_OCTAVES > 2',
  '    float facula = smoothstep(.971, .986, regionA) * (1. - penumbra);',
  '    detail += facula * .038 * pow(1. - facing, .75);',
  '  #endif',
  '  // Visible photosphere is pale warm/near-white in this artistic exposure.',
  '  // A darker warmer limb separates the actual disk from its faint corona.',
  '  vec3 rimColour = mix(amber, gold, .70);',
  '  vec3 centreColour = mix(gold, ivory, .78);',
  '  vec3 colour = mix(rimColour, centreColour, pow(facing, .43));',
  '  colour *= detail * mix(.68, 1.055, pow(facing, .32)) * (1. + activity * .010);',
  '  gl_FragColor = vec4(colour, 1.);',
  '  #include <tonemapping_fragment>',
  '  #include <colorspace_fragment>',
  '}',
].join('\n')

const coronaVertex = [
  'varying vec3 n;',
  'varying vec3 eye;',
  'void main() {',
  '  vec4 p = modelViewMatrix * vec4(position, 1.);',
  '  n = normalize(normalMatrix * normal);',
  '  eye = -p.xyz;',
  '  gl_Position = projectionMatrix * p;',
  '}',
].join('\n')

const coronaFragment = [
  'uniform vec3 tint;',
  'uniform float strength;',
  'varying vec3 n;',
  'varying vec3 eye;',
  'void main() {',
  '  vec3 normalEye = normalize(n);',
  '  float facing = clamp(dot(normalEye, normalize(eye)), 0., 1.);',
  '  float rim = pow(1. - facing, 4.7);',
  '  float angle = atan(normalEye.y, normalEye.x);',
  '  // Very weak nonuniform streamers rather than a symmetric neon outline.',
  '  float streamers = .91 + .055 * sin(angle * 4. + .28) + .035 * sin(angle * 9. - .4);',
  '  gl_FragColor = vec4(tint, rim * strength * streamers);',
  '}',
].join('\n')

const filamentVertex = [
  'varying vec2 filamentUv;',
  'void main() {',
  '  filamentUv = uv;',
  '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);',
  '}',
].join('\n')

const filamentFragment = [
  'uniform vec3 tint;',
  'uniform float baseOpacity;',
  'uniform float time;',
  'uniform float activity;',
  'uniform float phase;',
  'varying vec2 filamentUv;',
  'void main() {',
  '  const float PI = 3.14159265;',
  '  float taper = pow(max(sin(PI * filamentUv.x), 0.), .72);',
  '  float across = 1. - abs(filamentUv.y * 2. - 1.);',
  '  float brightness = .93 + .07 * sin(phase + filamentUv.x * 12. + time * .24);',
  '  float alpha = baseOpacity * taper * across * brightness * (1. + activity * .10);',
  '  gl_FragColor = vec4(tint, alpha);',
  '}',
].join('\n')

export const SUN_SHADER_CONTRACT = Object.freeze({
  surfaceVertex, surface: surfaceFragment, corona: coronaFragment,
  filament: filamentFragment,
})

export function createSolarSurfaceMaterial(style, lowPower) {
  return new ShaderMaterial({
    defines: { SUN_OCTAVES: lowPower ? 2 : 3 },
    uniforms: {
      time: { value: 0 }, activity: { value: 0 },
      surfaceMap: { value: null }, hasSurfaceMap: { value: false },
      amber: { value: new Color(style.amber) },
      gold: { value: new Color(style.gold) },
      ivory: { value: new Color(style.ivory) },
    },
    vertexShader: surfaceVertex,
    fragmentShader: surfaceFragment,
  })
}

function coronaShell(radius, colour, strength, segments, name) {
  const material = new ShaderMaterial({
    uniforms: { tint: { value: new Color(colour) }, strength: { value: strength } },
    vertexShader: coronaVertex,
    fragmentShader: coronaFragment,
    transparent: true, depthWrite: false, depthTest: true, blending: AdditiveBlending,
  })
  const mesh = new Mesh(new SphereGeometry(radius, segments, Math.max(16, segments / 2)), material)
  mesh.name = name
  return mesh
}

export function createSolarCorona(radius, style, lowPower, segments) {
  return {
    inner: coronaShell(radius * style.innerScale, style.corona, style.innerStrength, segments, 'core-corona'),
    outer: lowPower ? null : coronaShell(
      radius * style.outerScale, style.outerCorona, style.outerStrength, segments, 'core-outer-corona',
    ),
  }
}

// The previous large constant-width tubes formed a conspicuous decorative crown.
// Use only two short, irregular tapered ribbon silhouettes around the Core limb.
export function createSolarFilaments(radius, style) {
  const group = new Group()
  group.name = 'core-prominences'
  const view = new Vector3(.226, .644, .731).normalize()
  const right = new Vector3(0, 1, 0).cross(view).normalize()
  const up = view.clone().cross(right).normalize()
  const specs = [
    { angle: .78, span: .084, rise: .072, phase: .65 },
    { angle: 4.50, span: .065, rise: .052, phase: 2.70 },
  ]

  specs.forEach((spec, index) => {
    const point = (t) => {
      const tilt = Math.sin(Math.PI * t)
      const a = spec.angle + spec.span * (2 * t - 1) + .009 * Math.sin(t * 7 + spec.phase) * tilt
      const direction = right.clone().multiplyScalar(Math.cos(a))
        .addScaledVector(up, Math.sin(a)).addScaledVector(view, .028).normalize()
      return direction.multiplyScalar(radius * (1.007 + spec.rise * Math.pow(Math.max(tilt, 0), .9)))
    }
    const positions = [], uv = [], indices = []
    const steps = 24
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const center = point(t)
      const tangent = point(Math.min(1, t + .006)).sub(point(Math.max(0, t - .006))).normalize()
      const side = view.clone().cross(tangent).normalize()
      const halfWidth = radius * .010 * (.18 + .82 * Math.sin(Math.PI * t))
        * (.86 + .14 * Math.sin(i * .93 + spec.phase))
      const left = center.clone().addScaledVector(side, -halfWidth)
      const rightPoint = center.clone().addScaledVector(side, halfWidth)
      positions.push(left.x, left.y, left.z, rightPoint.x, rightPoint.y, rightPoint.z)
      uv.push(t, 0, t, 1)
      if (i < steps) {
        const a = i * 2
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
      }
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2))
    geometry.setIndex(indices)
    const material = new ShaderMaterial({
      uniforms: {
        tint: { value: new Color(style.prominence) },
        baseOpacity: { value: style.prominenceOpacity },
        activity: { value: 0 }, time: { value: 0 }, phase: { value: spec.phase },
      },
      vertexShader: filamentVertex,
      fragmentShader: filamentFragment,
      transparent: true, depthWrite: false, depthTest: true, side: DoubleSide,
      blending: AdditiveBlending, toneMapped: false,
    })
    const mesh = new Mesh(geometry, material)
    mesh.name = 'core-filament-' + (index + 1)
    mesh.renderOrder = 3
    group.add(mesh)
  })
  return group
}
