import { Color, Float32BufferAttribute, Group, Mesh, MeshStandardMaterial, SphereGeometry, Vector3 } from 'three'
import { IDENTITY_APPEARANCE } from '../data/identity.js'
import { createAxialRotation } from '../utils/axialRotation.js'
import { identityTerrain } from '../utils/identitySurface.js'
import { GALAXY_TEXTURES } from '../data/photorealAssets.js'
import { createAuthoredSurfaceController, createCloudLayer, installAuthoredSurfaceMap } from './PlanetLayers.js'
import {
  createEarthAtmosphere,
  createEarthCloudMaterial,
  createEarthSurfaceMaterial,
  createEarthTextureController,
} from './EarthRealism.js'

export function createIdentityPlanet(body, lowPower, onSurfaceReady = () => {}) {
  const style = IDENTITY_APPEARANCE, group = new Group()
  const segments = lowPower ? 32 : 80
  const geometry = new SphereGeometry(body.radius, segments, segments / 2)
  const positions = geometry.attributes.position, colors = []
  const ocean = new Color(style.ocean), shallows = new Color(style.shallows)
  const land = new Color(style.land), highlands = new Color(style.highlands), color = new Color()
  // Complete procedural fallback on missing assets, unavailable WebGL and in
  // Node tests. Replace the visible material ONLY after coherent NASA maps load.
  for (let i = 0; i < positions.count; i++) {
    const field = identityTerrain(positions.getX(i) / body.radius, positions.getY(i) / body.radius, positions.getZ(i) / body.radius)
    if (field < .48) color.copy(ocean).lerp(shallows, Math.max(0, (field - .25) / .23))
    else color.copy(land).lerp(highlands, Math.min(1, (field - .48) / .32))
    colors.push(color.r, color.g, color.b)
  }
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  const surface = new Mesh(geometry, new MeshStandardMaterial({
    vertexColors: true, roughness: style.surfaceRoughness, metalness: style.surfaceMetalness,
  }))
  surface.name = 'identity-surface'
  const rotation = createAxialRotation(surface, body.rotation)

  // A single direction shared by the surface, cloud and atmosphere shaders.
  // Sun resides at the system origin, so the planet-center-to-Sun vector is
  // updated with the EXISTING scene clock, not a second RAF or fake key light.
  const sunDirection = new Vector3(0, 0, -1)
  const worldCenter = new Vector3()
  const atmosphere = createEarthAtmosphere(body.radius, sunDirection, lowPower)
  const clouds = createCloudLayer(body.radius * 1.012, {
    color: style.cloud,
    opacity: style.cloudOpacity * (lowPower ? .72 : 1),
    lowPower, seed: style.cloudSeed,
    rotation: {
      axialTilt: body.rotation.axialTilt,
      surfaceSpeed: body.rotation.cloudSpeed || body.rotation.surfaceSpeed * 1.35,
      direction: body.rotation.direction,
      phase: .43,
    },
  })
  clouds.mesh.name = 'identity-clouds'
  group.add(surface, clouds.mesh, atmosphere)

  const earthAsset = typeof document === 'undefined' ? null : createEarthTextureController({
    paths: {
      ...GALAXY_TEXTURES.earth,
      day: lowPower ? GALAXY_TEXTURES.earth.dayLow : GALAXY_TEXTURES.earth.dayHigh,
    },
    lowPower,
    onReady: onSurfaceReady,
    onSurface(maps) {
      const previous = surface.material
      surface.material = createEarthSurfaceMaterial({ maps, lowPower, sunDirection })
      previous.dispose()
    },
    onCloud(map) {
      const previous = clouds.mesh.material
      clouds.mesh.material = createEarthCloudMaterial(map, sunDirection)
      previous.dispose()
    },
  })

  // Unselectable decorative Moon. Omit on low-power to preserve the strict
  // mobile geometry gate, and retain the original scene-owned authored loader.
  let moonRotation = null, moonAsset = null
  if (!lowPower) {
    const pivot = new Group()
    pivot.name = 'identity-moon-orbit'
    const moon = new Mesh(
      new SphereGeometry(body.radius * .22, 24, 12),
      new MeshStandardMaterial({ color: '#aaa49d', roughness: 1, metalness: 0 }),
    )
    moon.name = 'identity-moon'
    moon.position.set(body.radius * 2.4, body.radius * .1, 0)
    pivot.add(moon)
    moonRotation = createAxialRotation(pivot, { axialTilt: .07, surfaceSpeed: .012, phase: 2.2 })
    group.add(pivot)
    if (typeof document !== 'undefined') {
      moonAsset = createAuthoredSurfaceController({
        surface: moon, path: GALAXY_TEXTURES.moon, onReady: onSurfaceReady,
        configure(map) {
          installAuthoredSurfaceMap(moon, map, {
            roughness: 1, metalness: 0, bumpScale: body.radius * .001,
          })
        },
      })
    }
  }

  let targetActivity = 0, activity = 0, targetSpeed = 1, speed = 1
  function present() {
    atmosphere.material.uniforms.strength.value = style.atmosphereStrength * (1 + activity)
  }
  function updateSolarDirection() {
    group.getWorldPosition(worldCenter)
    if (worldCenter.lengthSq() > .00001) sunDirection.copy(worldCenter).negate().normalize()
  }
  return {
    group,
    setInteraction(hovered, selected, instant = false) {
      targetActivity = selected ? style.selectedBoost : hovered ? style.hoverBoost : 0
      targetSpeed = selected ? style.selectedSpeed : hovered ? style.hoverSpeed : 1
      if (instant) { activity = targetActivity; speed = targetSpeed; present() }
    },
    update(delta, animate = true) {
      const dt = Number.isFinite(delta) ? Math.max(0, Math.min(delta, .05)) : 0
      const blend = 1 - Math.exp(-dt * 6)
      activity += (targetActivity - activity) * blend
      speed += (targetSpeed - speed) * blend
      if (Math.abs(activity - targetActivity) < .0001) activity = targetActivity
      if (Math.abs(speed - targetSpeed) < .0001) speed = targetSpeed
      present()
      updateSolarDirection()
      rotation.update(dt, animate, speed)
      clouds.update(dt, animate)
      moonRotation?.update(dt, animate)
    },
    dispose() { earthAsset?.dispose(); moonAsset?.dispose() },
  }
}
