import { Color, Float32BufferAttribute, Group, Mesh, MeshStandardMaterial, SphereGeometry } from 'three'
import { IDENTITY_APPEARANCE } from '../data/identity.js'
import { createAxialRotation } from '../utils/axialRotation.js'
import { identityTerrain } from '../utils/identitySurface.js'
import { createCloudLayer, createLightAwareAtmosphere } from './PlanetLayers.js'

export function createIdentityPlanet(body, lowPower) {
  const style = IDENTITY_APPEARANCE, group = new Group()
  const segments = lowPower ? 32 : 64
  const geometry = new SphereGeometry(body.radius, segments, segments / 2)
  const positions = geometry.attributes.position, colors = []
  const ocean = new Color(style.ocean), shallows = new Color(style.shallows)
  const land = new Color(style.land), highlands = new Color(style.highlands), color = new Color()
  for (let i = 0; i < positions.count; i++) {
    const field = identityTerrain(positions.getX(i) / body.radius, positions.getY(i) / body.radius, positions.getZ(i) / body.radius)
    if (field < .48) color.copy(ocean).lerp(shallows, Math.max(0, (field - .25) / .23))
    else color.copy(land).lerp(highlands, Math.min(1, (field - .48) / .32))
    colors.push(color.r, color.g, color.b)
  }
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  const surface = new Mesh(geometry, new MeshStandardMaterial({
    vertexColors: true,
    roughness: style.surfaceRoughness,
    metalness: style.surfaceMetalness,
  }))
  surface.name = 'identity-surface'
  const rotation = createAxialRotation(surface, body.rotation)

  const atmosphere = createLightAwareAtmosphere(body.radius * style.atmosphereScale, {
    color: style.atmosphere,
    strength: style.atmosphereStrength,
    lowPower,
  })
  atmosphere.name = 'identity-atmosphere'

  const clouds = createCloudLayer(body.radius * style.cloudScale, {
    color: style.cloud,
    opacity: style.cloudOpacity * (lowPower ? .72 : 1),
    lowPower,
    seed: style.cloudSeed,
    rotation: {
      axialTilt: body.rotation.axialTilt,
      surfaceSpeed: body.rotation.cloudSpeed || body.rotation.surfaceSpeed * 1.35,
      direction: body.rotation.direction,
      phase: .43,
    },
  })
  clouds.mesh.name = 'identity-clouds'
  group.add(surface, clouds.mesh, atmosphere)

  let targetActivity = 0, activity = 0, targetSpeed = 1, speed = 1
  function present() {
    atmosphere.material.uniforms.strength.value = style.atmosphereStrength * (1 + activity)
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
      rotation.update(dt, animate, speed)
      clouds.update(dt, animate)
    },
  }
}
