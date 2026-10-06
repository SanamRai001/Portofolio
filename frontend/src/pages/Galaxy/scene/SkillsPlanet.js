import { BoxGeometry, BufferGeometry, Group, LineBasicMaterial, LineLoop, Mesh, MeshBasicMaterial, MeshStandardMaterial, SphereGeometry, Vector3 } from 'three'
import { SKILL_GROUPS, SKILL_NODES, SKILL_ORBITS } from '../data/skills.js'
import { createAxialRotation } from '../utils/axialRotation.js'
import { GALAXY_TEXTURES } from '../data/photorealAssets.js'
import { createAuthoredSurfaceController } from './PlanetLayers.js'
import { createMercurySurfaceMaterial } from './MercuryRealism.js'
import { createOrbitSimulation, orbitPosition } from '../utils/orbits.js'
import { createCelestialBody } from './CelestialBody.js'

export function createSkillsPlanet(body, lowPower, onSurfaceReady = () => {}) {
  const group = createCelestialBody(body, lowPower), constellation = new Group()
  const surface = group.getObjectByName(`${body.id}-surface`)
  // Complete nonmetallic fallback until the credited Mercury atlas loads.
  // The old generic "engineered" planet had metallic response; Mercury's
  // regolith and crater plains have no shiny alloy-like surface.
  surface.material.roughness = .98
  surface.material.metalness = 0
  surface.material.color.set('#aca49a')
  const authored = typeof document === 'undefined' ? null : createAuthoredSurfaceController({
    surface,
    path: GALAXY_TEXTURES.skills,
    onReady: onSurfaceReady,
    configure(map) {
      // Upgrade only after the real JPEG loads; failure preserves the visible
      // fallback mesh. Scene disposal owns the successful texture uniform.
      const oldMaterial = surface.material
      surface.material = createMercurySurfaceMaterial(lowPower, map)
      oldMaterial.dispose()
    },
  })
  const rotation = createAxialRotation(surface, body.rotation)
  constellation.name = 'skills-satellites'; constellation.visible = false
  const simulation = createOrbitSimulation(SKILL_NODES), nodes = new Map(), hitMeshes = []
  const geometry = new BoxGeometry(1.7, .8, 1.2)
  const hitGeometry = new SphereGeometry(.25, 8, 6), hitMaterial = new MeshBasicMaterial()
  for (const orbit of SKILL_ORBITS) {
    const count = lowPower ? 48 : 80
    const group = SKILL_GROUPS.find(candidate => candidate.id === orbit.groupId)
    const points = Array.from({ length: count }, (_, i) => new Vector3(...orbitPosition(orbit, i / count * Math.PI * 2)))
    const material = new LineBasicMaterial({ color: group?.color || '#8292a2', transparent: true, opacity: .2, depthWrite: false })
    constellation.add(new LineLoop(new BufferGeometry().setFromPoints(points), material))
  }
  for (const skill of SKILL_NODES) {
    const root = new Group()
    root.name = `skill-${skill.id}`
    root.position.fromArray(simulation.position(skill.id))
    const mesh = new Mesh(geometry, new MeshStandardMaterial({ color: skill.color, metalness: .6, roughness: .42, emissive: skill.color, emissiveIntensity: .12 }))
    mesh.scale.setScalar(skill.radius)
    mesh.rotation.set(.2, skill.orbit.phase, .2)
    const hit = new Mesh(hitGeometry, hitMaterial)
    hit.layers.set(1); hit.userData.bodyId = `skill:${skill.id}`
    root.add(mesh, hit); constellation.add(root)
    nodes.set(skill.id, { root, mesh }); hitMeshes.push(hit)
  }
  group.add(constellation)
  let active = false
  return {
    group, nodes, simulation,
    get hitMeshes() { return active ? hitMeshes : [] },
    setSelection(state) {
      active = state.selectedBodyId === body.id && state.mode === 'body_focused'
      constellation.visible = active
      for (const skill of SKILL_NODES) {
        const selected = active && state.selectedSkillId === skill.id, hovered = active && state.hoveredSkillId === skill.id
        simulation.setPaused(skill.id, selected)
        simulation.setRate(skill.id, hovered ? .35 : 1)
        const mesh = nodes.get(skill.id).mesh
        mesh.scale.setScalar(skill.radius * (selected ? 1.35 : hovered ? 1.18 : 1))
        mesh.material.emissiveIntensity = selected ? .8 : hovered ? .45 : .12
      }
    },
    update(delta, animate = true) {
      rotation.update(delta, animate)
      if (!active || !animate) return
      simulation.update(delta)
      nodes.forEach((node, id) => node.root.position.fromArray(simulation.position(id)))
    },
    dispose() { authored?.dispose() },
  }
}
