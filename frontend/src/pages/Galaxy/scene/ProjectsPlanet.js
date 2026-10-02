import { PROJECTS_APPEARANCE } from '../data/projects.js'
import { createAxialRotation } from '../utils/axialRotation.js'
import { createAuthoredSurfaceController, createLightAwareAtmosphere, createNightSideLayer, installAuthoredSurfaceMap } from './PlanetLayers.js'
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

  const night = createNightSideLayer(body.radius * PROJECTS_APPEARANCE.nightScale, {
    color: PROJECTS_APPEARANCE.nightColor,
    strength: lowPower ? PROJECTS_APPEARANCE.lowPowerStrength : PROJECTS_APPEARANCE.nightStrength,
    lowPower,
    seed: PROJECTS_APPEARANCE.nightSeed,
  })
  night.name = 'projects-night-side'
  const nightRotation = createAxialRotation(night, body.rotation)
  group.add(night)

  // A thin dust-scattering edge gives this rocky world some depth against
  // black space. Sun-facing only, intentionally far below Identity's haze.
  // Desktop only: preserve the existing strict low-power triangle ceiling.
  if (!lowPower) {
    const dust = createLightAwareAtmosphere(body.radius * 1.027, {
      color: '#b87851',
      strength: .16,
      lowPower: false,
    })
    dust.name = 'projects-dust-limb'
    group.add(dust)
  }

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
      nightRotation.update(delta, animate)
    },
    dispose() {
      authored?.dispose()
    },
  }
}
