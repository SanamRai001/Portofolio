import { createAxialRotation } from '../utils/axialRotation.js'
import { createAuthoredSurfaceController, installAuthoredSurfaceMap } from './PlanetLayers.js'
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
  const group = createCelestialBody(body, lowPower, { smoothRock: true })
  const surface = group.getObjectByName(`${body.id}-surface`)
  const rotation = createAxialRotation(surface, body.rotation)
  const authored = typeof document === 'undefined' ? null : createAuthoredSurfaceController({
    surface,
    path: lowPower ? mobileSurface : desktopSurface,
    onReady: onSurfaceReady,
    configure(map) {
      installAuthoredSurfaceMap(surface, map, {
        bumpScale: body.radius * .009,
        roughness: .94,
        metalness: .03,
      })
      blendProjectsLongitudeSeam(surface.material)
      surface.material.needsUpdate = true
    },
  })

  return {
    group,
    update(delta, animate = true) {
      rotation.update(delta, animate)
    },
    dispose() {
      authored?.dispose()
    },
  }
}
