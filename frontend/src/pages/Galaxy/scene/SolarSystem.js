import { AmbientLight, BufferGeometry, Group, LineBasicMaterial, LineLoop, Mesh, MeshBasicMaterial, Object3D, PointLight, SphereGeometry, Vector3 } from 'three'
import { SUN, PLANETS, LAB, SOLAR_STYLE } from '../data/solarSystem.js'
import { createOrbitSimulation, orbitPosition } from '../utils/orbits.js'
import { orbitRateTarget } from '../navigation/NavigationController.js'
import { createSun, createCelestialBody, createLab } from './CelestialBody.js'

export function createSolarSystem(profile) {
  const group = new Group(), simulation = createOrbitSimulation(PLANETS), bodies = new Map(), targets = new Map(), orbits = new Map()
  let hovered = null
  function register(body, visuals) {
    const root = new Group(), focusAnchor = new Object3D()
    root.name = body.id
    root.position.copy(visuals.position); visuals.position.set(0, 0, 0)
    const interactionMesh = new Mesh(new SphereGeometry(body.radius * 1.5, 8, 6), new MeshBasicMaterial())
    interactionMesh.layers.set(1) // Camera uses layer 0; only the interaction raycaster sees layer 1.
    interactionMesh.userData.bodyId = body.id
    root.add(visuals, focusAnchor, interactionMesh)
    targets.set(body.id, { group: root, visuals, focusAnchor, interactionMesh })
    group.add(root)
    return root
  }
  const sun = createSun(SUN, profile.lowPower)
  register(SUN, sun.group)
  // Constant falloff preserves G2's art direction and readable terminators.
  group.add(new PointLight('#ffe0b2', SOLAR_STYLE.sunLight, 0, 0), new AmbientLight('#9cb3dc', SOLAR_STYLE.ambient))
  for (const body of PLANETS) {
    const root = register(body, createCelestialBody(body, profile.lowPower))
    root.position.fromArray(simulation.position(body.id))
    bodies.set(body.id, root)
    const points = Array.from({ length: SOLAR_STYLE.segments }, (_, i) => new Vector3(...orbitPosition(body.orbit, i / SOLAR_STYLE.segments * Math.PI * 2)))
    const line = new LineLoop(new BufferGeometry().setFromPoints(points), new LineBasicMaterial({ color: SOLAR_STYLE.orbitColor, transparent: true, opacity: SOLAR_STYLE.orbitOpacity, depthWrite: false }))
    orbits.set(body.id, line)
    group.add(line)
  }
  register(LAB, createLab(LAB))
  return {
    group, simulation, bodies, targets,
    hitMeshes: [...targets.values()].map(body => body.interactionMesh),
    getAnchor(id, point) { return targets.get(id)?.focusAnchor.getWorldPosition(point) },
    setInteraction(state, instant = false) {
      hovered = state.hoveredBodyId
      sun.setInteraction(hovered === SUN.id, state.selectedBodyId === SUN.id, instant)
      for (const body of PLANETS) {
        simulation.setRate(body.id, orbitRateTarget(body.id, state))
        orbits.get(body.id).material.opacity = state.selectedBodyId && state.selectedBodyId !== body.id ? 0.1 : SOLAR_STYLE.orbitOpacity
      }
      if (instant) targets.forEach((body, id) => body.visuals.scale.setScalar(id === hovered ? 1.02 : 1))
    },
    resize(portrait) { bodies.forEach(body => body.scale.setScalar(portrait ? SOLAR_STYLE.mobileBodyScale : 1)) },
    update(delta, animate = true) {
      sun.update(delta, animate)
      if (animate) {
        simulation.update(delta)
        bodies.forEach((body, id) => body.position.fromArray(simulation.position(id)))
      }
      targets.forEach((body, id) => {
        const scale = body.visuals.scale.x + ((id === hovered ? 1.02 : 1) - body.visuals.scale.x) * (1 - Math.exp(-delta * 12))
        body.visuals.scale.setScalar(scale)
      })
    },
  }
}
