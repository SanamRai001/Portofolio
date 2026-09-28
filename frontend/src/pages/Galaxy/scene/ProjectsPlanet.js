import { ClampToEdgeWrapping, RepeatWrapping, SRGBColorSpace, TextureLoader } from 'three'
import { createCelestialBody } from './CelestialBody.js'

const desktopSurface = '/galaxy/projects-surface.webp'
const mobileSurface = '/galaxy/projects-surface-mobile.webp'

// The source image is close to tiled but its longitude edges differ. Blend only
// the narrow meridian at the UV join; the other 95% is the untouched albedo.
const seamBlend = `
  #ifdef USE_MAP
    vec4 sampledDiffuseColor = texture2D(map, vMapUv);
    float edge = min(vMapUv.x, 1. - vMapUv.x);
    if (edge < .025) {
      vec4 oppositeColor = texture2D(map, vec2(1. - vMapUv.x, vMapUv.y));
      sampledDiffuseColor = mix(sampledDiffuseColor, oppositeColor,
        .5 * (1. - smoothstep(0., .025, edge)));
    }
    diffuseColor *= sampledDiffuseColor;
  #endif
`

export function blendProjectsLongitudeSeam(material) {
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', seamBlend)
  }
}

// Keep the existing procedural planet visible while its original surface asset loads.
// The same light and geometry remain in use after the material receives the map.
export function createProjectsPlanet(body, lowPower, onSurfaceReady = () => {}) {
  const group = createCelestialBody(body, lowPower)
  const surface = group.getObjectByName(`${body.id}-surface`)
  let disposed = false, loaded = false, texture

  if (typeof document !== 'undefined') {
    texture = new TextureLoader().load(lowPower ? mobileSurface : desktopSurface, (map) => {
      if (disposed) { map.dispose(); return }
      loaded = true
      map.colorSpace = SRGBColorSpace
      map.wrapS = RepeatWrapping
      map.wrapT = ClampToEdgeWrapping
      surface.material.vertexColors = false
      surface.material.map = map
      surface.material.bumpMap = map
      surface.material.bumpScale = body.radius * .009
      surface.material.roughness = .94
      surface.material.metalness = .03
      blendProjectsLongitudeSeam(surface.material)
      surface.material.needsUpdate = true
      onSurfaceReady()
    }, undefined, () => {
      // The procedural surface is a complete fallback if the asset cannot load.
      texture?.dispose()
    })
  }

  return {
    group,
    update(delta, animate = true) {
      if (animate && Number.isFinite(delta)) surface.rotation.y = (surface.rotation.y + Math.max(0, Math.min(delta, .05)) * body.spin) % (Math.PI * 2)
    },
    dispose() {
      disposed = true
      // Once installed, disposeScene owns this material's texture.
      if (!loaded) texture?.dispose()
    },
  }
}
