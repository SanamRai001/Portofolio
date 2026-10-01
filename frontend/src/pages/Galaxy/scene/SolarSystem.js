import { AmbientLight, BufferGeometry, Group, LineBasicMaterial, LineLoop, Mesh, MeshBasicMaterial, Object3D, PointLight, SphereGeometry, Vector3 } from 'three'
import { SUN, PLANETS, LAB, BLACK_HOLE, SOLAR_STYLE } from '../data/solarSystem.js'
import { createAxialRotation } from '../utils/axialRotation.js'
import { createOrbitSimulation, orbitPosition } from '../utils/orbits.js'
import { orbitRateTarget } from '../navigation/NavigationController.js'
import { createSkillsPlanet } from './SkillsPlanet.js'
import { createIdentityPlanet } from './IdentityPlanet.js'
import { createProjectsPlanet } from './ProjectsPlanet.js'
import { createJourneyPlanet } from './JourneyPlanet.js'
import { createSun, createCelestialBody, createLab } from './CelestialBody.js'
import { createBlackHole } from './BlackHole.js'

function createGenericPlanet(body, lowPower) {
  const group = createCelestialBody(body, lowPower)
  const surface = group.getObjectByName(`${body.id}-surface`)
  const rotation = createAxialRotation(surface, body.rotation)
  return {
    group,
    update(delta, animate = true) {
      rotation.update(delta, animate)
    },
  }
}

export function createSolarSystem(profile, { onSurfaceReady } = {}) {
  const group = new Group(), simulation = createOrbitSimulation(PLANETS), bodies = new Map(), targets = new Map(), orbits = new Map()
  const presentations = new Map()
  let hovered = null, selected = null, portrait = false
  const visualScale = id => (selected ? 1 : portrait ? SOLAR_STYLE.mobileOverviewBodyScale : SOLAR_STYLE.overviewBodyScale) * (id === hovered ? 1.02 : 1)
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
  const sun = createSun(SUN, profile.lowPower, onSurfaceReady)
  register(SUN, sun.group)
  // Constant falloff preserves G2's art direction and readable terminators.
  group.add(new PointLight('#ffe0b2', SOLAR_STYLE.sunLight, 0, 0), new AmbientLight('#9cb3dc', SOLAR_STYLE.ambient))
  for (const body of PLANETS) {
    const presentation = body.id === 'identity' ? createIdentityPlanet(body, profile.lowPower)
      : body.id === 'skills' ? createSkillsPlanet(body, profile.lowPower)
        : body.id === 'projects' ? createProjectsPlanet(body, profile.lowPower, onSurfaceReady)
          : body.id === 'journey' ? createJourneyPlanet(body, profile.lowPower)
            : createGenericPlanet(body, profile.lowPower)
    presentations.set(body.id, presentation)
    const root = register(body, presentation.group)
    root.position.fromArray(simulation.position(body.id))
    bodies.set(body.id, root)
    const points = Array.from({ length: SOLAR_STYLE.segments }, (_, i) => new Vector3(...orbitPosition(body.orbit, i / SOLAR_STYLE.segments * Math.PI * 2)))
    const line = new LineLoop(new BufferGeometry().setFromPoints(points), new LineBasicMaterial({ color: SOLAR_STYLE.orbitColor, transparent: true, opacity: SOLAR_STYLE.orbitOpacity, depthWrite: false }))
    orbits.set(body.id, line)
    group.add(line)
  }
  register(LAB, createLab(LAB))
  const blackHole = createBlackHole(BLACK_HOLE, profile.lowPower)
  presentations.set(BLACK_HOLE.id, blackHole)
  register(BLACK_HOLE, blackHole.group).position.fromArray(BLACK_HOLE.position)
  return {
    group, simulation, bodies, targets,
    dispose() { sun.dispose(); presentations.forEach(presentation => presentation.dispose?.()) },
    get hitMeshes() { return [...targets.values()].map(body => body.interactionMesh).concat(presentations.get('skills').hitMeshes) },
    getAnchor(id, point) { return targets.get(id)?.focusAnchor.getWorldPosition(point) },
    setInteraction(state, instant = false) {
      hovered = state.hoveredBodyId
      selected = state.selectedBodyId
      sun.setInteraction(hovered === SUN.id, state.selectedBodyId === SUN.id, instant)
      blackHole.setInteraction(hovered === BLACK_HOLE.id, state.selectedBodyId === BLACK_HOLE.id, instant)
      for (const body of PLANETS) {
        presentations.get(body.id)?.setSelection?.(state, instant)
        presentations.get(body.id)?.setInteraction?.(hovered === body.id, state.selectedBodyId === body.id, instant)
        simulation.setRate(body.id, orbitRateTarget(body.id, state))
        orbits.get(body.id).material.opacity = state.selectedBodyId && state.selectedBodyId !== body.id ? 0.1 : SOLAR_STYLE.orbitOpacity
      }
      if (instant) targets.forEach((body, id) => body.visuals.scale.setScalar(visualScale(id)))
    },
    resize(isPortrait) {
      portrait = isPortrait
      bodies.forEach(body => body.scale.setScalar(portrait ? SOLAR_STYLE.mobileBodyScale : 1))
      targets.forEach((body, id) => body.visuals.scale.setScalar(visualScale(id)))
    },
    update(delta, animate = true) {
      sun.update(delta, animate)
      presentations.forEach(presentation => presentation.update(delta, animate))
      if (animate) {
        simulation.update(delta)
        bodies.forEach((body, id) => body.position.fromArray(simulation.position(id)))
      }
      targets.forEach((body, id) => {
        const scale = body.visuals.scale.x + (visualScale(id) - body.visuals.scale.x) * (1 - Math.exp(-delta * 12))
        body.visuals.scale.setScalar(scale)
      })
    },
  }
}
