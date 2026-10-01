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
        float field = noise(p);
        #if CLOUD_OCTAVES > 1
          field = field * .68 + noise(p.yzx * 2.13 + 3.7) * .32;
        #endif
        float cloud = smoothstep(.49, .72, field);
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
        vec3 p = surface * 11. + vec3(seed * .31);
        float density = noise(p);
        #if NIGHT_OCTAVES > 1
          density = density * .7 + noise(p.yzx * 2.37 + 4.1) * .3;
        #endif
        density = smoothstep(.68, .82, density);
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
