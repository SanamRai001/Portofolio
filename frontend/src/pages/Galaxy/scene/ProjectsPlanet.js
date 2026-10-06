import {
  BufferGeometry,
  Group,
  LineBasicMaterial,
  LineLoop,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  OctahedronGeometry,
  SphereGeometry,
  Vector3,
} from 'three'
import {
  PROJECT_NODES,
  PROJECT_ORBITS,
  PROJECTS_APPEARANCE,
} from '../data/projects.js'
import { GALAXY_TEXTURES } from '../data/photorealAssets.js'
import { createAxialRotation } from '../utils/axialRotation.js'
import { createOrbitSimulation, orbitPosition } from '../utils/orbits.js'
import { createAuthoredSurfaceController, createLightAwareAtmosphere } from './PlanetLayers.js'
import { createCelestialBody } from './CelestialBody.js'
import { createMarsSurfaceMaterial } from './MarsRealism.js'

// G3B keeps Mars itself unchanged and adds a local project constellation that
// appears only after Projects arrival. The nodes are semantic portfolio signals,
// not decorative moons, and reuse the scene's existing clock/picking pipeline.
export function createProjectsPlanet(body, lowPower, onSurfaceReady = () => {}) {
  const group = createCelestialBody(body, lowPower, { smoothRock: true })
  const surface = group.getObjectByName(body.id + '-surface')
  const rotation = createAxialRotation(surface, body.rotation)

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
      const fallback = surface.material
      surface.material = createMarsSurfaceMaterial(lowPower, map)
      fallback.dispose()
    },
  })

  const constellation = new Group()
  constellation.name = 'projects-constellation'
  constellation.visible = false

  const simulation = createOrbitSimulation(PROJECT_NODES)
  const nodes = new Map()
  const hitMeshes = []
  const geometry = new OctahedronGeometry(1, 0)
  const hitGeometry = new SphereGeometry(.28, 8, 6)
  const hitMaterial = new MeshBasicMaterial()
  const lineMaterial = new LineBasicMaterial({
    color: '#a58f83',
    transparent: true,
    opacity: .18,
    depthWrite: false,
  })

  for (const orbit of PROJECT_ORBITS) {
    const count = lowPower ? 48 : 80
    const points = Array.from(
      { length: count },
      (_, i) => new Vector3(...orbitPosition(orbit, i / count * Math.PI * 2)),
    )
    constellation.add(new LineLoop(
      new BufferGeometry().setFromPoints(points),
      lineMaterial,
    ))
  }

  for (const project of PROJECT_NODES) {
    const root = new Group()
    root.name = `project-${project.id}`
    root.position.fromArray(simulation.position(project.id))

    const material = new MeshStandardMaterial({
      color: project.color,
      metalness: .18,
      roughness: .68,
      emissive: project.color,
      emissiveIntensity: .08,
    })
    const mesh = new Mesh(geometry, material)
    mesh.scale.setScalar(project.radius)
    mesh.rotation.set(.45, project.orbit.phase, .35)

    const hit = new Mesh(hitGeometry, hitMaterial)
    hit.layers.set(1)
    hit.userData.bodyId = `project:${project.id}`

    root.add(mesh, hit)
    constellation.add(root)
    nodes.set(project.id, { root, mesh })
    hitMeshes.push(hit)
  }

  group.add(constellation)
  let active = false

  return {
    group,
    nodes,
    simulation,
    get hitMeshes() {
      return active ? hitMeshes : []
    },
    setSelection(state) {
      active = state.selectedBodyId === body.id && state.mode === 'body_focused'
      constellation.visible = active

      for (const project of PROJECT_NODES) {
        const selected = active && state.selectedProjectId === project.id
        const hovered = active && state.hoveredProjectId === project.id
        simulation.setPaused(project.id, selected)
        simulation.setRate(project.id, hovered ? .42 : 1)

        const mesh = nodes.get(project.id).mesh
        mesh.scale.setScalar(project.radius * (selected ? 1.38 : hovered ? 1.18 : 1))
        mesh.material.emissiveIntensity = selected ? .72 : hovered ? .34 : .08
      }
    },
    update(delta, animate = true) {
      rotation.update(delta, animate)
      if (!active || !animate) return
      simulation.update(delta)
      nodes.forEach((node, id) => node.root.position.fromArray(simulation.position(id)))
    },
    dispose() {
      authored?.dispose()
    },
  }
}
