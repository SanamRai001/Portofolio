import { JOURNEY_APPEARANCE } from '../data/journey.js'
import { createAxialRotation } from '../utils/axialRotation.js'
import { createJourneySurfaceMap } from '../utils/journeySurface.js'
import { createCelestialBody } from './CelestialBody.js'
import { createLightAwareAtmosphere } from './PlanetLayers.js'

export function createJourneyPlanet(body, lowPower) {
  // Keep the existing ring meshes unchanged; G2R.6 owns their replacement.
  const group = createCelestialBody(body, lowPower)
  const surface = group.getObjectByName(`${body.id}-surface`)
  const rotation = createAxialRotation(surface, body.rotation)

  if (typeof document !== 'undefined') {
    const [width, height] = lowPower
      ? JOURNEY_APPEARANCE.mobileMapSize
      : JOURNEY_APPEARANCE.desktopMapSize
    surface.material.vertexColors = false
    surface.material.color.set('#ffffff')
    surface.material.map = createJourneySurfaceMap(width, height)
    surface.material.roughness = JOURNEY_APPEARANCE.surfaceRoughness
    surface.material.metalness = 0
    // This is a visible cloud-top atmosphere, not rocky topography.
    surface.material.bumpMap = null
    surface.material.needsUpdate = true
  }

  const haze = createLightAwareAtmosphere(body.radius * JOURNEY_APPEARANCE.hazeScale, {
    color: JOURNEY_APPEARANCE.hazeColor,
    strength: lowPower ? JOURNEY_APPEARANCE.lowPowerHazeStrength : JOURNEY_APPEARANCE.hazeStrength,
    lowPower,
  })
  haze.name = 'journey-haze'
  group.add(haze)

  return {
    group,
    update(delta, animate = true) {
      rotation.update(delta, animate)
    },
  }
}
