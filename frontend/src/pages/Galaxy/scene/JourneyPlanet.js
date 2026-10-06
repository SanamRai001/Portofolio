import {
  BufferGeometry,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3,
} from 'three'
import {
  JOURNEY_APPEARANCE,
  JOURNEY_RING_APPEARANCE,
  JOURNEY_TRAJECTORY,
  JOURNEY_WAYPOINTS,
} from '../data/journey.js'
import { createAxialRotation } from '../utils/axialRotation.js'
import { createJourneySurfaceMap } from '../utils/journeySurface.js'
import { orbitPosition } from '../utils/orbits.js'
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
  const [width, height] = lowPower
    ? JOURNEY_APPEARANCE.mobileMapSize
    : JOURNEY_APPEARANCE.desktopMapSize

  const fallback = createJourneySurfaceMap(width, height)
  surface.material.dispose()
  surface.material = createSaturnSurfaceMaterial(body, lowPower, fallback)
  const rotation = createAxialRotation(surface, body.rotation)

  // Physical Saturn rings remain independent of the spinning atmosphere.
  const band = rings.getObjectByName('journey-ring-bands')
  const ringNormal = new Vector3(0, 0, 1)
    .applyQuaternion(band.quaternion)
    .applyQuaternion(rings.quaternion)
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

  // G3D trajectory: one fixed semantic arc outside the physical ring system.
  // Waypoints do not orbit; their order must remain readable as progression.
  const trajectory = new Group()
  trajectory.name = 'journey-trajectory'
  trajectory.visible = false

  const pathOrbit = {
    radius: JOURNEY_TRAJECTORY.radius,
    inclination: JOURNEY_TRAJECTORY.inclination,
  }
  const segments = lowPower
    ? JOURNEY_TRAJECTORY.mobileSegments
    : JOURNEY_TRAJECTORY.desktopSegments
  const points = Array.from({ length: segments + 1 }, (_, index) => {
    const t = index / segments
    const phase = JOURNEY_TRAJECTORY.startPhase
      + (JOURNEY_TRAJECTORY.endPhase - JOURNEY_TRAJECTORY.startPhase) * t
    return new Vector3(...orbitPosition(pathOrbit, phase))
  })
  const path = new Line(
    new BufferGeometry().setFromPoints(points),
    new LineBasicMaterial({
      color: '#c3b8aa',
      transparent: true,
      opacity: .27,
      depthWrite: false,
    }),
  )
  path.name = 'journey-trajectory-path'
  trajectory.add(path)

  const nodes = new Map()
  const hitMeshes = []
  const markerGeometry = new SphereGeometry(1, lowPower ? 8 : 12, lowPower ? 6 : 8)
  const hitGeometry = new SphereGeometry(.28, 8, 6)
  const hitMaterial = new MeshBasicMaterial()

  for (const waypoint of JOURNEY_WAYPOINTS) {
    const root = new Group()
    root.name = `journey-${waypoint.id}`
    root.position.fromArray(orbitPosition(pathOrbit, waypoint.phase))

    const mesh = new Mesh(markerGeometry, new MeshStandardMaterial({
      color: waypoint.color,
      emissive: waypoint.color,
      emissiveIntensity: .12,
      metalness: .18,
      roughness: .62,
    }))
    mesh.scale.setScalar(.11)

    const hit = new Mesh(hitGeometry, hitMaterial)
    hit.layers.set(1)
    hit.userData.bodyId = `journey:${waypoint.id}`

    root.add(mesh, hit)
    trajectory.add(root)
    nodes.set(waypoint.id, { root, mesh })
    hitMeshes.push(hit)
  }

  group.add(trajectory)
  let active = false

  return {
    group,
    nodes,
    get hitMeshes() {
      return active ? hitMeshes : []
    },
    setSelection(state) {
      active = state.selectedBodyId === body.id && state.mode === 'body_focused'
      trajectory.visible = active

      for (const waypoint of JOURNEY_WAYPOINTS) {
        const selected = active && state.selectedJourneyId === waypoint.id
        const hovered = active && state.hoveredJourneyId === waypoint.id
        const mesh = nodes.get(waypoint.id).mesh
        mesh.scale.setScalar(.11 * (selected ? 1.55 : hovered ? 1.28 : 1))
        mesh.material.emissiveIntensity = selected ? .85 : hovered ? .42 : .12
      }
    },
    update(delta, animate = true) {
      rotation.update(delta, animate)
      syncRingNormal()
    },
    dispose() {
      authored?.dispose()
    },
  }
}
