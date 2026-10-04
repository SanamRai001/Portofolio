import test from 'node:test'
import assert from 'node:assert/strict'
import { Scene, Vector3 } from 'three'
import { PLANETS, SOLAR_STYLE } from './data/solarSystem.js'
import { orbitPosition } from './utils/orbits.js'
import { getPerformanceProfile } from './utils/performance.js'
import { orbitRateTarget } from './navigation/NavigationController.js'
import { createSolarSystem } from './scene/SolarSystem.js'
import { disposeScene } from './utils/disposeScene.js'

const TAU = Math.PI * 2
const deltaVector = (from, to) => new Vector3(...from).distanceTo(new Vector3(...to))
const wrap = (value) => ((value % TAU) + TAU) % TAU
function release(system) {
  system.dispose()
  const scene = new Scene()
  scene.add(system.group)
  disposeScene(scene, { dispose() {}, forceContextLoss() {}, domElement: { remove() {} } })
}

test('G2R.M all four planetary roots revolve along their drawn LineLoop paths; every surface rotates independently', () => {
  const system = createSolarSystem(getPerformanceProfile({ width: 1440, reducedMotion: false }))
  system.resize(false)
  system.setInteraction({ selectedBodyId: null, hoveredBodyId: null }, true)

  const initial = new Map(PLANETS.map(body => {
    const root = system.bodies.get(body.id)
    const surface = system.targets.get(body.id).visuals.getObjectByName(body.id + '-surface')
    const orbit = system.group.getObjectByName(body.id + '-orbit')
    assert.ok(root && surface && orbit?.isLineLoop, body.id + ' scene objects must exist')
    assert.deepEqual(root.position.toArray(), system.simulation.position(body.id), body.id + ' starts on simulation path')
    assert.equal(orbit.geometry.attributes.position.count, SOLAR_STYLE.segments)
    assert.equal(orbit.material.transparent, true)
    assert.equal(orbit.material.depthWrite, false)
    assert.equal(orbit.material.opacity, SOLAR_STYLE.orbitOpacity)
    for (const step of [0, 13, 48, 91, 127]) {
      const expected = orbitPosition(body.orbit, step / SOLAR_STYLE.segments * TAU)
      const a = orbit.geometry.attributes.position
      const actual = [a.getX(step), a.getY(step), a.getZ(step)]
      assert.ok(deltaVector(actual, expected) < .000005, body.id + ' orbit path must match simulation geometry')
    }
    return [body.id, {
      world: root.position.toArray(),
      spin: surface.rotation.y,
      surface,
    }]
  }))

  // Twelve seconds of overview with 50-ms scene ticks: not a mock orbit
  // calculation; these are the actual root/mesh transforms rendered by WebGL.
  for (let i = 0; i < 240; i++) system.update(.05, true)
  for (const body of PLANETS) {
    const previous = initial.get(body.id)
    const root = system.bodies.get(body.id)
    const after = root.position.toArray()
    assert.ok(deltaVector(previous.world, after) > body.orbit.radius * .10,
      body.id + ' revolution must be observable in overview after 12 seconds')
    assert.ok(deltaVector(after, system.simulation.position(body.id)) < .000001,
      body.id + ' rendered root must track orbital simulation')
    const expectedSpin = wrap(previous.spin + 12 * body.rotation.surfaceSpeed * body.rotation.direction)
    assert.ok(Math.abs(previous.surface.rotation.y - expectedSpin) < 1e-7,
      body.id + ' surface should spin with authored axial direction')
  }

  // This also prevents an easy-to-miss regression where only shaders animate
  // while every planetary transform remains stationary.
  release(system)
})

test('G2R.M selected body intentionally holds position for camera lock while continuing to spin; others still revolve', () => {
  assert.equal(orbitRateTarget('identity', { selectedBodyId: 'identity', hoveredBodyId: null }), 0)
  assert.equal(orbitRateTarget('journey', { selectedBodyId: null, hoveredBodyId: 'journey' }), .45)
  const system = createSolarSystem(getPerformanceProfile({ width: 1440, reducedMotion: false }))
  system.resize(false)
  const planet = system.targets.get('projects')
  const surface = planet.visuals.getObjectByName('projects-surface')
  const selectedOrbit = system.group.getObjectByName('projects-orbit')
  const otherOrbit = system.group.getObjectByName('identity-orbit')
  system.setInteraction({ selectedBodyId: 'projects', hoveredBodyId: null }, true)
  assert.equal(selectedOrbit.material.opacity, SOLAR_STYLE.orbitSelectedOpacity)
  assert.equal(otherOrbit.material.opacity, SOLAR_STYLE.orbitMutedOpacity)
  for (let i = 0; i < 100; i++) system.update(.05, true)
  assert.equal(system.simulation.rate('projects'), 0)
  const locked = system.bodies.get('projects').position.toArray()
  const otherBefore = system.bodies.get('identity').position.toArray()
  const spin = surface.rotation.y
  for (let i = 0; i < 80; i++) system.update(.05, true)
  assert.deepEqual(system.bodies.get('projects').position.toArray(), locked,
    'focused planet must stop revolving once focus settles')
  assert.notEqual(surface.rotation.y, spin, 'focused planet must keep rotating')
  assert.ok(deltaVector(otherBefore, system.bodies.get('identity').position.toArray()) > .01,
    'non-selected planets must keep revolving')
  system.setInteraction({ selectedBodyId: null, hoveredBodyId: 'journey' }, true)
  for (let i = 0; i < 100; i++) system.update(.05, true)
  assert.equal(system.simulation.rate('journey'), .45, 'hover should slow, not freeze')
  assert.equal(selectedOrbit.material.opacity, SOLAR_STYLE.orbitOpacity)
  const beforeResume = system.bodies.get('projects').position.toArray()
  system.update(.05, true)
  assert.ok(deltaVector(beforeResume, system.bodies.get('projects').position.toArray()) > 0,
    'previously focused planet must resume normal orbit')

  const positions = new Map(PLANETS.map(body => [body.id, system.bodies.get(body.id).position.toArray()]))
  const angles = new Map(PLANETS.map(body => [body.id,
    system.targets.get(body.id).visuals.getObjectByName(body.id + '-surface').rotation.y]))
  for (let i = 0; i < 10; i++) system.update(.05, false)
  for (const body of PLANETS) {
    assert.deepEqual(system.bodies.get(body.id).position.toArray(), positions.get(body.id),
      'Pause/reduced motion freezes all orbital movement')
    assert.equal(system.targets.get(body.id).visuals.getObjectByName(body.id + '-surface').rotation.y,
      angles.get(body.id), 'Pause/reduced motion freezes surface spin')
  }
  release(system)
})

test('G2R.M orbit paths have adequate contrast in overview, but stay subdued during other-body focus', () => {
  assert.ok(SOLAR_STYLE.orbitOpacity >= .42 && SOLAR_STYLE.orbitOpacity <= .60)
  assert.ok(SOLAR_STYLE.orbitMutedOpacity >= .18 && SOLAR_STYLE.orbitMutedOpacity < SOLAR_STYLE.orbitOpacity)
  assert.ok(SOLAR_STYLE.orbitSelectedOpacity >= SOLAR_STYLE.orbitOpacity)
  const phone = createSolarSystem(getPerformanceProfile({ width: 390 }))
  phone.resize(true)
  for (const body of PLANETS) {
    const loop = phone.group.getObjectByName(body.id + '-orbit')
    assert.ok(loop && loop.material.opacity >= .42)
    assert.equal(loop.geometry.type, 'BufferGeometry')
    assert.equal(loop.geometry.attributes.position.count, SOLAR_STYLE.segments)
  }
  phone.setInteraction({ selectedBodyId: 'skills', hoveredBodyId: null }, true)
  for (const body of PLANETS) assert.equal(
    phone.group.getObjectByName(body.id + '-orbit').material.opacity,
    body.id === 'skills' ? SOLAR_STYLE.orbitSelectedOpacity : SOLAR_STYLE.orbitMutedOpacity,
  )
  release(phone)
})
