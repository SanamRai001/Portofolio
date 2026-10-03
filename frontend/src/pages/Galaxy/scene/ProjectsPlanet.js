import { GALAXY_TEXTURES } from '../data/photorealAssets.js'
import { createAxialRotation } from '../utils/axialRotation.js'
import { createAuthoredSurfaceController, createLightAwareAtmosphere } from './PlanetLayers.js'
import { createCelestialBody } from './CelestialBody.js'
import { configureMarsAtlas, createMarsSurfaceMaterial } from './MarsRealism.js'

// Keep the existing correctly spherical, no-displacement procedural surface
// visible until the attributed local Mars atlas is actually loaded. The
// source photography then takes over without introducing new mesh geometry.
export function createProjectsPlanet(body, lowPower, onSurfaceReady = () => {}) {
  const group = createCelestialBody(body, lowPower, { smoothRock: true })
  const surface = group.getObjectByName(body.id + '-surface')
  const rotation = createAxialRotation(surface, body.rotation)

  // G2R.14 removes the fictional settlement-lights layer. Real Mars has no
  // Earth-like illuminated cities; the unlit hemisphere follows the Sun.
  // This desktop-only rim is narrow and day-aware, not a glowing orange halo.
  if (!lowPower) {
    const dust = createLightAwareAtmosphere(body.radius * 1.022, {
      color: '#ca9f83',
      strength: .115,
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
      // Once the real atlas succeeds, install its seam-safe, directionally
      // lit gas-free rock shader. Colour must not be treated as bump height.
      const photographic = configureMarsAtlas(map)
      const old = surface.material
      surface.material = createMarsSurfaceMaterial(photographic, lowPower)
      old.dispose()
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
