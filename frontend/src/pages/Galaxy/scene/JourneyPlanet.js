import { JOURNEY_APPEARANCE } from '../data/journey.js'
import { createAxialRotation } from '../utils/axialRotation.js'
import { GALAXY_TEXTURES } from '../data/photorealAssets.js'
import { createCelestialBody } from './CelestialBody.js'
import { createAuthoredSurfaceController, createLightAwareAtmosphere, installAuthoredSurfaceMap } from './PlanetLayers.js'
import { createJourneyRings } from './JourneyRings.js'

export function createJourneyPlanet(body, lowPower, onSurfaceReady = () => {}) {
  const group = createCelestialBody(body, lowPower, { rings: false })
  const rings = createJourneyRings(body, lowPower)
  group.add(rings)
  const surface = group.getObjectByName(`${body.id}-surface`)
  const rotation = createAxialRotation(surface, body.rotation)

  const authored = typeof document === 'undefined' ? null : createAuthoredSurfaceController({
    surface,
    path: GALAXY_TEXTURES.journey,
    onReady: onSurfaceReady,
    configure(map) {
      installAuthoredSurfaceMap(surface, map, { roughness: 1, metalness: 0 })
      // Saturn's visible cloud tops are not displaced solid rock.
      surface.material.bumpMap = null
      surface.material.needsUpdate = true
    },
  })

  // The existing low-power scene is near its strict triangle budget.
  // Keep the complete gas-giant surface/rings there; the optional limb haze
  // is a desktop-only enhancement rather than a reason to relax that gate.
  if (!lowPower) {
    const haze = createLightAwareAtmosphere(body.radius * JOURNEY_APPEARANCE.hazeScale, {
      color: JOURNEY_APPEARANCE.hazeColor,
      strength: JOURNEY_APPEARANCE.hazeStrength,
      lowPower: false,
    })
    haze.name = 'journey-haze'
    group.add(haze)
  }

  return {
    group,
    update(delta, animate = true) {
      rotation.update(delta, animate)
    },
    dispose() { authored?.dispose() },
  }
}
