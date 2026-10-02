import {
  AdditiveBlending,
  ClampToEdgeWrapping,
  Color,
  Mesh,
  RepeatWrapping,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
} from 'three'
import { createAxialRotation } from '../utils/axialRotation.js'

function layerGeometry(radius, lowPower, segments) {
  const count = segments || (lowPower ? 28 : 48)
  return new SphereGeometry(radius, count, Math.max(12, Math.floor(count / 2)))
}

export function createLightAwareAtmosphere(radius, {
  color = '#8fc8ff',
  strength = .24,
  lowPower = false,
  segments,
} = {}) {
  const material = new ShaderMaterial({
    uniforms: {
      tint: { value: new Color(color) },
      strength: { value: strength },
    },
    vertexShader: `
      varying vec3 worldNormal;
      varying vec3 worldPosition;
      void main() {
        worldNormal = normalize(mat3(modelMatrix) * normal);
        worldPosition = (modelMatrix * vec4(position, 1.)).xyz;
        gl_Position = projectionMatrix * viewMatrix * vec4(worldPosition, 1.);
      }
    `,
    fragmentShader: `
      uniform vec3 tint;
      uniform float strength;
      varying vec3 worldNormal;
      varying vec3 worldPosition;
      void main() {
        vec3 normalDirection = normalize(worldNormal);
        vec3 viewDirection = normalize(cameraPosition - worldPosition);
        vec3 sunDirection = normalize(-worldPosition);
        float rim = pow(1. - max(dot(normalDirection, viewDirection), 0.), 2.65);
        float daylight = smoothstep(-.22, .55, dot(normalDirection, sunDirection));
        float alpha = rim * strength * mix(.16, 1., daylight);
        gl_FragColor = vec4(tint * mix(.62, 1.08, daylight), alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })
  const mesh = new Mesh(layerGeometry(radius, lowPower, segments), material)
  mesh.name = 'planet-atmosphere'
  return mesh
}

export function createCloudLayer(radius, {
  color = '#f0f4ef',
  opacity = .28,
  lowPower = false,
  segments,
  seed = 0,
  rotation = {},
} = {}) {
  const material = new ShaderMaterial({
    defines: { CLOUD_OCTAVES: lowPower ? 1 : 2 },
    uniforms: {
      tint: { value: new Color(color) },
      opacity: { value: opacity },
      seed: { value: Number.isFinite(seed) ? seed : 0 },
    },
    vertexShader: `
      varying vec3 surface;
      varying vec3 worldNormal;
      varying vec3 worldPosition;
      void main() {
        surface = normalize(position);
        worldNormal = normalize(mat3(modelMatrix) * normal);
        worldPosition = (modelMatrix * vec4(position, 1.)).xyz;
        gl_Position = projectionMatrix * viewMatrix * vec4(worldPosition, 1.);
      }
    `,
    fragmentShader: `
      uniform vec3 tint;
      uniform float opacity;
      uniform float seed;
      varying vec3 surface;
      varying vec3 worldNormal;
      varying vec3 worldPosition;
      float hash(vec3 p) {
        p = fract(p * .1031);
        p += dot(p, p.yzx + 33.33 + seed);
        return fract((p.x + p.y) * p.z);
      }
      float noise(vec3 p) {
        vec3 i = floor(p), f = fract(p);
        f = f * f * (3. - 2. * f);
        return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
                       mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                       mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
      }
      void main() {
        vec3 p = surface * 4.6 + vec3(seed * .17);
        float cloud;
        #if CLOUD_OCTAVES > 1
          // Domain-warped weather coverage adds broken, finer cloud banks to
          // desktop Identity instead of two interpolated, smudged noise bands.
          // The mobile tier retains its original single-noise fast path.
          vec3 warp = vec3(
            noise(p.yzx * 1.09 + 3.1),
            noise(p.zxy * 1.17 + 7.3),
            noise(p.xyz * 1.04 + 11.6)
          ) - .5;
          vec3 flow = p + warp * .58;
          float weather = noise(flow * .72);
          float cells = noise(flow * 1.17 + 1.4);
          float wisps = noise(flow.yzx * 2.7 + 3.7);
          float field = weather * .36 + cells * .44 + wisps * .20;
          float fine = noise(surface * 13.7 + vec3(seed * .19));
          cloud = smoothstep(.465, .675, field)
            * mix(.66, 1., smoothstep(.30, .72, fine));
        #else
          cloud = smoothstep(.49, .72, noise(p));
        #endif
        vec3 sunDirection = normalize(-worldPosition);
        float daylight = smoothstep(-.3, .55, dot(normalize(worldNormal), sunDirection));
        float alpha = cloud * opacity * mix(.24, 1., daylight);
        if (alpha < .008) discard;
        gl_FragColor = vec4(tint * mix(.62, 1.05, daylight), alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
  })
  const mesh = new Mesh(layerGeometry(radius, lowPower, segments), material)
  mesh.name = 'planet-clouds'
  const axial = createAxialRotation(mesh, rotation)
  return {
    mesh,
    update(delta, animate = true, rate = 1) {
      axial.update(delta, animate, rate)
    },
  }
}

export function createNightSideLayer(radius, {
  color = '#f3b15b',
  strength = .45,
  lowPower = false,
  segments,
  seed = 0,
} = {}) {
  const material = new ShaderMaterial({
    defines: { NIGHT_OCTAVES: lowPower ? 1 : 2 },
    uniforms: {
      tint: { value: new Color(color) },
      strength: { value: strength },
      seed: { value: Number.isFinite(seed) ? seed : 0 },
    },
    vertexShader: `
      varying vec3 surface;
      varying vec3 worldNormal;
      varying vec3 worldPosition;
      void main() {
        surface = normalize(position);
        worldNormal = normalize(mat3(modelMatrix) * normal);
        worldPosition = (modelMatrix * vec4(position, 1.)).xyz;
        gl_Position = projectionMatrix * viewMatrix * vec4(worldPosition, 1.);
      }
    `,
    fragmentShader: `
      uniform vec3 tint;
      uniform float strength;
      uniform float seed;
      varying vec3 surface;
      varying vec3 worldNormal;
      varying vec3 worldPosition;
      float hash(vec3 p) {
        p = fract(p * .1031);
        p += dot(p, p.yzx + 17.17 + seed);
        return fract((p.x + p.y) * p.z);
      }
      float noise(vec3 p) {
        vec3 i = floor(p), f = fract(p);
        f = f * f * (3. - 2. * f);
        return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
                       mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                       mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
      }
      void main() {
        // Two spatial scales: broad settlement regions only gate a sparse
        // field of fine lights. Using the broad field as emission itself made
        // the night side look like orange lava patches rather than cities.
        float region = noise(surface * 4.7 + vec3(seed * .31));
        float cityCluster = smoothstep(.5, .69, region);
        float lights = smoothstep(.72, .84,
          noise(surface * 64. + vec3(seed * .73, 2.7, -4.1)));
        #if NIGHT_OCTAVES > 1
          float minorLights = smoothstep(.77, .88,
            noise(surface.yzx * 108. + vec3(3.1, seed, -2.6)));
          lights = max(lights, minorLights * .36);
        #endif
        float density = cityCluster * lights;
        vec3 sunDirection = normalize(-worldPosition);
        float daylight = dot(normalize(worldNormal), sunDirection);
        float night = 1. - smoothstep(-.28, .12, daylight);
        float alpha = density * night * strength;
        if (alpha < .008) discard;
        gl_FragColor = vec4(tint, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
  })
  const mesh = new Mesh(layerGeometry(radius, lowPower, segments), material)
  mesh.name = 'planet-night-side'
  return mesh
}

export function installAuthoredSurfaceMap(surface, map, {
  bumpScale = 0,
  roughness = .9,
  metalness = .02,
  colorSpace = SRGBColorSpace,
  wrapS = RepeatWrapping,
  wrapT = ClampToEdgeWrapping,
} = {}) {
  map.colorSpace = colorSpace
  map.wrapS = wrapS
  map.wrapT = wrapT
  surface.material.vertexColors = false
  surface.material.map = map
  if (bumpScale > 0) {
    surface.material.bumpMap = map
    surface.material.bumpScale = bumpScale
  }
  surface.material.roughness = roughness
  surface.material.metalness = metalness
  surface.material.needsUpdate = true
  return map
}

export function createAuthoredSurfaceController({
  surface,
  path,
  configure = (map) => installAuthoredSurfaceMap(surface, map),
  onReady = () => {},
  loader = new TextureLoader(),
}) {
  let disposed = false
  let installed = false
  let texture
  const disposedTextures = new Set()

  function disposeTexture(candidate) {
    if (!candidate || disposedTextures.has(candidate)) return
    disposedTextures.add(candidate)
    candidate.dispose?.()
  }

  texture = loader.load(path, (map) => {
    if (disposed) {
      disposeTexture(map)
      return
    }
    installed = true
    configure(map, surface)
    onReady()
  }, undefined, () => {
    if (!installed) disposeTexture(texture)
  })

  return {
    get loaded() { return installed },
    dispose() {
      disposed = true
      // Once configured, the scene owns the texture through the material.
      if (!installed) disposeTexture(texture)
    },
  }
}
