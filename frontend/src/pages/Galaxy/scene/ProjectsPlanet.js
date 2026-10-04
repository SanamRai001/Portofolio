import { PROJECTS_APPEARANCE } from '../data/projects.js'
import { GALAXY_TEXTURES } from '../data/photorealAssets.js'
import { createAxialRotation } from '../utils/axialRotation.js'
import { createAuthoredSurfaceController, createLightAwareAtmosphere } from './PlanetLayers.js'
import { createCelestialBody } from './CelestialBody.js'
import { createMarsSurfaceMaterial } from './MarsRealism.js'

// G2R.14: keep the original non-displaced sphere and procedural vertex-colour
// fallback until the physical, attributed 2K Mars JPEG loads. The old fake
// settlement emissive layer is removed: Mars does not have illuminated cities.
export function createProjectsPlanet(body, lowPower, onSurfaceReady = () => {}) {
  const group = createCelestialBody(body, lowPower, { smoothRock: true })
  const surface = group.getObjectByName(body.id + '-surface')
  const rotation = createAxialRotation(surface, body.rotation)

  // Mars has a thin, dusty atmosphere: one very faint sunward rim on desktop,
  // with no added mobile mesh or frame loop.
  if (!lowPower) {
    const dust = createLightAwareAtmosphere(body.radius * PROJECTS_APPEARANCE.dustScale, {
      color: PROJECTS_APPEARANCE.dustColor,
      strength: PROJECTS_APPEARANCE.dustStrength,
      lowPower: false,
    })
    dust.name = 'projects-dust-limb'
    group.add(dust)
  }

  const authored = typeof document === 'undefined' ? null : createAuthoredSurfaceController({
    surface,
    path: GALAXY_TEXTURES.projects,
    onReady: onSurfaceReady,
    configure(map) {
      // Material replacement only AFTER success: offline/404 users keep the
      // existing visible procedural planet, and installed maps become scene-owned.
      const fallback = surface.material
      surface.material = createMarsSurfaceMaterial(lowPower, map)
      fallback.dispose()
    },
  })

  return {
    group,
    update(delta, animate = true) {
      rotation.update(delta, animate)
    },
    dispose() { authored?.dispose() },
  }
}
