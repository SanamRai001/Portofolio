import { Vector3 } from 'three'
import { JOURNEY_APPEARANCE } from '../data/journey.js'
import { createAxialRotation } from '../utils/axialRotation.js'
import { createJourneySurfaceMap } from '../utils/journeySurface.js'
import { GALAXY_TEXTURES } from '../data/photorealAssets.js'
import { createCelestialBody } from './CelestialBody.js'
import { createAuthoredSurfaceController, createLightAwareAtmosphere } from './PlanetLayers.js'
import { createJourneyRings } from './JourneyRings.js'
import { createSaturnSurfaceMaterial, configureSaturnAtlas } from './SaturnRealism.js'

export function createJourneyPlanet(body, lowPower, onSurfaceReady = () => {}) {
  const group = createCelestialBody(body, lowPower, { rings: false })
  const rings = createJourneyRings(body, lowPower)
  group.add(rings)
  const surface = group.getObjectByName(body.id + '-surface')
  const [width, height] = lowPower ? JOURNEY_APPEARANCE.mobileMapSize : JOURNEY_APPEARANCE.desktopMapSize
  const fallback = createJourneySurfaceMap(width, height)
  surface.material.dispose()
  surface.material = createSaturnSurfaceMaterial(body, lowPower, fallback)
  const rotation = createAxialRotation(surface, body.rotation)
  // Explicitly retain the ring geometry independently of the spinning
  // atmosphere. Its normal and the surface shadow agree in LOCAL space.
  const band = rings.getObjectByName('journey-ring-bands')
  const ringNormal = new Vector3(0, 0, 1).applyQuaternion(band.quaternion).applyQuaternion(rings.quaternion)
  const normalInSurface = new Vector3()
  function syncRingNormal() {
    normalInSurface.copy(ringNormal).applyQuaternion(surface.quaternion.clone().invert())
    surface.material.uniforms.ringNormalSurface.value.copy(normalInSurface)
  }
  syncRingNormal()

  const authored = typeof document === 'undefined' ? null : createAuthoredSurfaceController({
    surface,
    path: GALAXY_TEXTURES.journey,
    onReady: onSurfaceReady,
    configure(map) {
      // The shipped, attributed 2K Saturn map remains the authoritative
      // photographic colour source. The deterministic DataTexture stays as a
      // valid no-network fallback until the installed map succeeds.
      surface.material.uniforms.dayMap.value = configureSaturnAtlas(map)
      fallback.dispose()
    },
  })

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
      syncRingNormal()
    },
    dispose() { authored?.dispose() },
  }
}
