import test from 'node:test'
import assert from 'node:assert/strict'
import { Scene } from 'three'
import { PLANETS } from './data/solarSystem.js'
import { SKILL_NODES } from './data/skills.js'
import { createSkillsPlanet } from './scene/SkillsPlanet.js'
import { createSolarSystem } from './scene/SolarSystem.js'
import { createNavigationController } from './navigation/NavigationController.js'
import { skillInteraction } from './navigation/SkillInteraction.js'
import { disposeScene } from './utils/disposeScene.js'
import { createSkillsSurfaceMaps } from './utils/skillsSurface.js'
const body = PLANETS.find(body => body.id === 'skills')
function release(group) {
  const scene = new Scene(); scene.add(group)
  disposeScene(scene, { dispose() {}, forceContextLoss() {}, domElement: { remove() {} } })
}
const focused = { selectedBodyId: 'skills', mode: 'body_focused', selectedSkillId: null, hoveredSkillId: null }

test('satellite selection stays local, ignores invalid/in-flight signals and clears on retarget', () => {
  const nav = createNavigationController(), input = skillInteraction(nav)
  input.focusBody('skill:node'); assert.equal(nav.getSnapshot().selectedSkillId, null)
  input.focusBody('skills'); input.focusBody('skill:node')
  assert.equal(nav.getSnapshot().selectedSkillId, null)
  nav.complete(nav.getSnapshot().transitionId)
  const transition = nav.getSnapshot().transitionId
  input.setHover('skill:node'); assert.equal(nav.getSnapshot().hoveredSkillId, 'node')
  nav.setSkillHover('react', 'keyboard'); input.setHover(null)
  assert.equal(nav.getSnapshot().hoveredSkillId, 'react')
  input.focusBody('skill:node'); input.focusBody('skill:unknown')
  assert.equal(nav.getSnapshot().selectedSkillId, 'node')
  assert.equal(nav.getSnapshot().transitionId, transition)
  input.focusBody('identity')
  assert.equal(nav.getSnapshot().selectedSkillId, null)
  assert.equal(nav.getSnapshot().hoveredSkillId, null)
  nav.focusBody('skills'); nav.complete(nav.getSnapshot().transitionId)
  assert.equal(nav.getSnapshot().hoveredSkillId, null)
})

test('Skills satellites are hidden/unpickable outside focus and use independent bounded clocks', () => {
  const planet = createSkillsPlanet(body, false)
  assert.equal(planet.hitMeshes.length, 0)
  const initial = planet.simulation.position('node')
  planet.update(.05)
  assert.deepEqual(planet.simulation.position('node'), initial)
  planet.setSelection(focused)
  assert.equal(planet.hitMeshes.length, 10)
  assert.ok(planet.hitMeshes.every(mesh => mesh.layers.mask === 2))
  planet.setSelection({ ...focused, selectedSkillId: 'node', hoveredSkillId: 'react' })
  for (let i = 0; i < 300; i++) planet.update(.05)
  assert.deepEqual(planet.simulation.position('node'), initial)
  assert.ok(Math.abs(planet.simulation.rate('react') - .35) < .0001)
  for (const skill of SKILL_NODES) {
    const position = planet.nodes.get(skill.id).root.position
    assert.ok(position.toArray().every(Number.isFinite))
    assert.ok(Math.abs(position.length() - skill.orbit.radius) < 1e-8)
  }
  const frozen = planet.simulation.position('react')
  planet.update(.05, false); planet.update(NaN); planet.update(-1)
  assert.deepEqual(planet.simulation.position('react'), frozen)
  planet.setSelection(focused); planet.update(.05)
  assert.notDeepEqual(planet.simulation.position('node'), initial)
  planet.setSelection({ ...focused, selectedBodyId: 'journey' })
  assert.equal(planet.hitMeshes.length, 0)
  assert.equal(planet.nodes.get('node').mesh.material.emissiveIntensity, .12)
  release(planet.group)
})

test('Skills uses shared satellite resources, cheaper low-power orbits and complete disposal', () => {
  const full = createSkillsPlanet(body, false), low = createSkillsPlanet(body, true)
  const lines = planet => planet.group.getObjectByName('skills-satellites').children.filter(child => child.isLineLoop)
  assert.equal(lines(full).length, 3)
  assert.ok(lines(low)[0].geometry.attributes.position.count < lines(full)[0].geometry.attributes.position.count)
  assert.equal(full.nodes.get('node').mesh.geometry, full.nodes.get('react').mesh.geometry)
  for (const planet of [full, low]) {
    const geometries = new Set(), materials = new Set()
    planet.group.traverse(object => { if (object.geometry) geometries.add(object.geometry); if (object.material) materials.add(object.material) })
    let g = 0, m = 0
    geometries.forEach(item => item.addEventListener('dispose', () => g++))
    materials.forEach(item => item.addEventListener('dispose', () => m++))
    release(planet.group)
    assert.equal(g, geometries.size); assert.equal(m, materials.size)
  }
})

test('solar picker exposes Skills-local targets only after arrival and removes them immediately on leaving', () => {
  const solar = createSolarSystem({ lowPower: true })
  solar.setInteraction({ ...focused, mode: 'focusing_body' }, true)
  assert.equal(solar.hitMeshes.length, 7)
  solar.setInteraction(focused, true); assert.equal(solar.hitMeshes.length, 17)
  solar.setInteraction({ ...focused, selectedBodyId: 'core' }, true)
  assert.equal(solar.hitMeshes.length, 6)
  release(solar.group)
})


test('Skills generated material maps are deterministic and separate rock from metal response', () => {
  const first = createSkillsSurfaceMaps(24, 12)
  const second = createSkillsSurfaceMaps(24, 12)
  for (const key of ['albedo', 'roughness', 'metalness', 'elevation']) {
    assert.equal(first[key].image.width, 24)
    assert.equal(first[key].image.height, 12)
    assert.deepEqual(first[key].image.data, second[key].image.data)
  }
  const metal = first.metalness.image.data
  const rough = first.roughness.image.data
  assert.ok(Math.min(...metal) < Math.max(...metal))
  assert.ok(Math.min(...rough) < Math.max(...rough))
  assert.notDeepEqual(first.albedo.image.data, first.metalness.image.data)
  for (const maps of [first, second]) Object.values(maps).forEach(texture => texture.dispose())
})
