import { AmbientLight, BufferGeometry, Group, LineBasicMaterial, LineLoop, PointLight, Vector3 } from 'three'
import { SUN, PLANETS, LAB, SOLAR_STYLE } from '../data/solarSystem.js'
import { createOrbitSimulation, orbitPosition } from '../utils/orbits.js'
import { createSun, createCelestialBody, createLab } from './CelestialBody.js'

export function createSolarSystem(profile) {
  const group = new Group(), simulation = createOrbitSimulation(PLANETS), bodies = new Map()
  const sun = createSun(SUN, profile.lowPower)
  group.add(sun.group, new PointLight('#ffe0b2', SOLAR_STYLE.sunLight, 0, 0), new AmbientLight('#9cb3dc', SOLAR_STYLE.ambient))
  // Constant falloff is an intentional art-direction approximation; light still
  // comes from the Sun and uses each body's normals for the day/night terminator.
  const orbitMaterial = new LineBasicMaterial({ color: SOLAR_STYLE.orbitColor, transparent: true, opacity: SOLAR_STYLE.orbitOpacity, depthWrite: false })
  for (const body of PLANETS) {
    const mesh = createCelestialBody(body, profile.lowPower)
    mesh.name = body.id
    mesh.position.fromArray(simulation.position(body.id))
    bodies.set(body.id, mesh)
    const points = Array.from({ length: SOLAR_STYLE.segments }, (_, i) => new Vector3(...orbitPosition(body.orbit, i / SOLAR_STYLE.segments * Math.PI * 2)))
    group.add(new LineLoop(new BufferGeometry().setFromPoints(points), orbitMaterial), mesh)
  }
  const lab = createLab(LAB)
  group.add(lab)
  return {
    group, simulation, bodies,
    resize(portrait) { bodies.forEach(body => body.scale.setScalar(portrait ? SOLAR_STYLE.mobileBodyScale : 1)) },
    update(delta) {
      simulation.update(delta)
      sun.update(delta)
      bodies.forEach((mesh, id) => { mesh.position.fromArray(simulation.position(id)) })
    },
  }
}
