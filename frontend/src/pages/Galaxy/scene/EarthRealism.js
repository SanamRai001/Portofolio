import {
  AdditiveBlending,
  Color,
  FrontSide,
  Mesh,
  NoColorSpace,
  RepeatWrapping,
  ClampToEdgeWrapping,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
} from 'three'

// A NASA-imagery renderer, not a generic procedural PlanetLayers replacement.
// All surface/cloud/atmosphere layers share ONE world-space solar direction.
// Atlas maps are equirectangular; high-quality land relief and glint are bounded.
const worldVertex = [
  'varying vec2 vEarthUv;',
  'varying vec3 vEarthNormal;',
  'varying vec3 vEarthWorld;',
  'void main() {',
  '  vEarthUv = uv;',
  '  vEarthNormal = normalize(mat3(modelMatrix) * normal);',
  '  vEarthWorld = (modelMatrix * vec4(position, 1.)).xyz;',
  '  gl_Position = projectionMatrix * viewMatrix * vec4(vEarthWorld, 1.);',
  '}',
].join('\n')

const surfaceFragment = [
  'uniform sampler2D dayMap;',
  'uniform sampler2D nightMap;',
  '#if EARTH_HIGH_QUALITY == 1',
  'uniform sampler2D waterMap;',
  'uniform sampler2D elevationMap;',
  '#endif',
  'uniform vec3 sunDirection;',
  'varying vec2 vEarthUv;',
  'varying vec3 vEarthNormal;',
  'varying vec3 vEarthWorld;',
  'void main() {',
  '  vec3 N = normalize(vEarthNormal);',
  '  vec3 V = normalize(cameraPosition - vEarthWorld);',
  '  vec3 L = normalize(sunDirection);',
  '  vec3 dayColor = texture2D(dayMap, vEarthUv).rgb;',
  '  float water = 0.;',
  '#if EARTH_HIGH_QUALITY == 1',
  '  // In three-globe water mask: white is ocean; black is land.',
  '  water = smoothstep(.22, .78, texture2D(waterMap, vEarthUv).r);',
  '  vec2 texel = vec2(1. / 1600., 1. / 800.);',
  '  float h0 = texture2D(elevationMap, vEarthUv).r;',
  '  float hx = texture2D(elevationMap, vEarthUv + vec2(texel.x, 0.)).r - h0;',
  '  float hy = texture2D(elevationMap, vEarthUv + vec2(0., texel.y)).r - h0;',
  '  vec3 T = normalize(cross(abs(N.y) > .985 ? vec3(1.,0.,0.) : vec3(0.,1.,0.), N));',
  '  vec3 B = normalize(cross(N, T));',
  '  N = normalize(N - (T * hx + B * hy) * (1. - water) * 1.0);',
  '#endif',
  '  float sunDot = dot(N, L);',
  '  float daylight = smoothstep(-.11, .15, sunDot);',
  '  float irradiance = max(sunDot, 0.);',
  '  // Keep unlit land nearly black; do not paste a uniformly lit Blue Marble.',
  '  vec3 day = dayColor * (0.009 + irradiance * 1.13) * daylight;',
  '  // Observed city-light data is emission, not daylight colour.',
  '  float city = texture2D(nightMap, vEarthUv).r;',
  '  float darkness = 1. - smoothstep(-.24, .08, sunDot);',
  '  vec3 night = vec3(1., .68, .38) * pow(max(city, 0.), .75) * darkness * .78;',
  '  float reflection = max(dot(reflect(-L, N), V), 0.);',
  '  float oceanGlint = water * pow(reflection, 94.) * irradiance * .56;',
  '  // Tiny broad off-specular response prevents the ocean becoming chrome.',
  '  float oceanSheen = water * pow(1. - max(dot(N, V), 0.), 5.) * irradiance * .025;',
  '  vec3 color = day + night + vec3(.87, .93, 1.) * (oceanGlint + oceanSheen);',
  '  gl_FragColor = vec4(color, 1.);',
  '  #include <tonemapping_fragment>',
  '  #include <colorspace_fragment>',
  '}',
].join('\n')

const cloudFragment = [
  'uniform sampler2D cloudMap;',
  'uniform vec3 sunDirection;',
  'varying vec2 vEarthUv;',
  'varying vec3 vEarthNormal;',
  'varying vec3 vEarthWorld;',
  'void main() {',
  '  float cloudLuma = texture2D(cloudMap, vEarthUv).r;',
  '  // Cloud composite is a grayscale NASA image over black, not an opaque map.',
  '  float coverage = smoothstep(.19, .72, cloudLuma);',
  '  float sunDot = dot(normalize(vEarthNormal), normalize(sunDirection));',
  '  float lit = smoothstep(-.18, .45, sunDot);',
  '  vec3 cloudColor = mix(vec3(.085, .115, .16), vec3(.88, .92, .98), lit);',
  '  float alpha = coverage * mix(.18, .85, lit);',
  '  if (alpha < .012) discard;',
  '  gl_FragColor = vec4(cloudColor, alpha);',
  '  #include <tonemapping_fragment>',
  '  #include <colorspace_fragment>',
  '}',
].join('\n')

const atmosphereFragment = [
  'uniform vec3 sunDirection;',
  'uniform vec3 atmosphereTint;',
  'uniform float strength;',
  'varying vec2 vEarthUv;',
  'varying vec3 vEarthNormal;',
  'varying vec3 vEarthWorld;',
  'void main() {',
  '  vec3 N = normalize(vEarthNormal);',
  '  vec3 V = normalize(cameraPosition - vEarthWorld);',
  '  float sunDot = dot(N, normalize(sunDirection));',
  '  float rim = pow(1. - max(dot(N, V), 0.), 4.8);',
  '  float day = smoothstep(-.26, .48, sunDot);',
  '  float twilight = exp(-pow((sunDot - .04) * 4.0, 2.));',
  '  float alpha = rim * (day * .58 + twilight * .28 + .048) * strength;',
  '  vec3 color = mix(atmosphereTint * .48, atmosphereTint, day);',
  '  gl_FragColor = vec4(color, alpha);',
  '  #include <tonemapping_fragment>',
  '  #include <colorspace_fragment>',
  '}',
].join('\n')

export const EARTH_SHADER_CONTRACT = Object.freeze({
  vertex: worldVertex,
  surface: surfaceFragment,
  clouds: cloudFragment,
  atmosphere: atmosphereFragment,
})

export function createEarthSurfaceMaterial({ maps, lowPower = false, sunDirection = new Vector3(0, 0, -1) }) {
  return new ShaderMaterial({
    defines: { EARTH_HIGH_QUALITY: lowPower ? 0 : 1 },
    uniforms: {
      dayMap: { value: maps.day },
      nightMap: { value: maps.night },
      waterMap: { value: maps.water || null },
      elevationMap: { value: maps.elevation || null },
      sunDirection: { value: sunDirection },
    },
    vertexShader: worldVertex,
    fragmentShader: surfaceFragment,
  })
}

export function createEarthCloudMaterial(map, sunDirection) {
  return new ShaderMaterial({
    uniforms: {
      cloudMap: { value: map },
      sunDirection: { value: sunDirection },
    },
    vertexShader: worldVertex,
    fragmentShader: cloudFragment,
    transparent: true,
    depthWrite: false,
  })
}

export function createEarthAtmosphere(radius, sunDirection, lowPower = false) {
  const material = new ShaderMaterial({
    uniforms: {
      sunDirection: { value: sunDirection },
      atmosphereTint: { value: new Color('#699fdd') },
      strength: { value: lowPower ? .29 * .72 : .29 },
    },
    vertexShader: worldVertex,
    fragmentShader: atmosphereFragment,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: FrontSide,
    blending: AdditiveBlending,
  })
  const mesh = new Mesh(new SphereGeometry(radius * 1.035, lowPower ? 28 : 64, lowPower ? 14 : 32), material)
  mesh.name = 'identity-atmosphere'
  return mesh
}

// Retain complete, self-contained fallback surface/procedural clouds on a failed
// request; install complete day/night (+ quality-tier masks) atomically.
// Scene owns installed maps via ShaderMaterial.uniforms. Orphans and late
// callbacks are disposed here, once, without invalidating an unmounted scene.
export function createEarthTextureController({
  paths, lowPower = false, loader = new TextureLoader(),
  onSurface, onCloud, onReady = () => {},
}) {
  const required = lowPower ? ['day', 'night'] : ['day', 'night', 'water', 'elevation']
  const loaded = new Map(), candidates = new Set(), installed = new Set(), released = new Set()
  let disposed = false, surfaceInstalled = false, cloudInstalled = false, failed = false

  function release(map) {
    if (!map || released.has(map)) return
    released.add(map)
    map.dispose?.()
  }
  function configure(key, map) {
    map.wrapS = RepeatWrapping
    map.wrapT = ClampToEdgeWrapping
    map.colorSpace = key === 'day' ? SRGBColorSpace : NoColorSpace
    map.needsUpdate = true
  }
  function receive(key, map) {
    candidates.add(map)
    if (disposed) { release(map); return }
    configure(key, map)
    loaded.set(key, map)
    if (key === 'cloud' && !cloudInstalled) {
      cloudInstalled = true
      installed.add(map)
      onCloud(map)
      onReady()
    }
    if (!failed && !surfaceInstalled && required.every(name => loaded.has(name))) {
      surfaceInstalled = true
      const maps = Object.fromEntries(required.map(name => [name, loaded.get(name)]))
      required.forEach(name => installed.add(loaded.get(name)))
      onSurface(maps)
      onReady()
    }
  }

  for (const key of [...required, 'cloud']) {
    const map = loader.load(paths[key], image => receive(key, image), undefined, () => {
      if (disposed) return
      if (key !== 'cloud') failed = true
      // A partial set is never rendered. Keep original sphere/cloud fallback.
      if (key !== 'cloud') for (const [name, unused] of loaded) {
        if (name !== 'cloud' && !installed.has(unused)) release(unused)
      }
    })
    candidates.add(map)
  }
  return {
    get surfaceReady() { return surfaceInstalled },
    get cloudsReady() { return cloudInstalled },
    dispose() {
      if (disposed) return
      disposed = true
      for (const map of candidates) if (!installed.has(map)) release(map)
    },
  }
}
