import test from 'node:test'
import assert from 'node:assert/strict'
import { Scene } from 'three'
import { createSun } from './scene/CelestialBody.js'
import { createSolarSystem } from './scene/SolarSystem.js'
import { SUN } from './data/solarSystem.js'
import { SUN_APPEARANCE } from './data/core.js'
import { disposeScene } from './utils/disposeScene.js'

function release(group) {
  const scene = new Scene(); scene.add(group)
  disposeScene(scene, { dispose() {}, forceContextLoss() {}, domElement: { remove() {} } })
}

test('Sun feedback stays bounded, reverses after rapid selections, and freezes surface motion', () => {
  const sun = createSun(SUN, false), surface = sun.group.getObjectByName('core-surface')
  const halo = sun.group.getObjectByName('core-corona')
  const uniforms = surface.material.uniforms
  sun.setInteraction(true, false)
  for (let i = 0; i < 60; i++) sun.update(.05)
  assert.equal(uniforms.activity.value, SUN_APPEARANCE.hoverActivity)
  sun.setInteraction(false, true)
  for (let i = 0; i < 60; i++) sun.update(.05)
  assert.equal(uniforms.activity.value, 1)
  assert.ok(halo.material.uniforms.strength.value <= SUN_APPEARANCE.innerStrength * 1.17)
  for (let i = 0; i < 20; i++) { sun.setInteraction(false, i % 2 === 0); sun.update(.016) }
  sun.setInteraction(false, false)
  for (let i = 0; i < 60; i++) sun.update(.05)
  assert.equal(uniforms.activity.value, 0)
  assert.equal(halo.material.uniforms.strength.value, SUN_APPEARANCE.innerStrength)
  const time = uniforms.time.value
  sun.setInteraction(true, true, true); sun.update(.05, false)
  assert.equal(uniforms.time.value, time)
  assert.equal(uniforms.activity.value, 1)
  sun.setInteraction(false, false, true)
  assert.equal(uniforms.activity.value, 0)
  for (const delta of [NaN, Infinity, -1]) sun.update(delta)
  assert.equal(uniforms.time.value, time)
  release(sun.group)
})

test('low-power Sun removes a corona layer, reduces surface work and releases every resource', () => {
  const desktop = createSun(SUN, false), mobile = createSun(SUN, true)
  assert.equal(desktop.group.children.length, 3)
  assert.equal(mobile.group.children.length, 2)
  const full = desktop.group.getObjectByName('core-surface'), small = mobile.group.getObjectByName('core-surface')
  assert.ok(small.geometry.attributes.position.count < full.geometry.attributes.position.count)
  assert.equal(small.material.defines.SUN_OCTAVES, 2)
  assert.equal(full.material.defines.SUN_OCTAVES, 3)
  for (const sun of [desktop, mobile]) {
    let geometryCount = 0, materialCount = 0
    const count = sun.group.children.length
    sun.group.children.forEach(mesh => {
      mesh.geometry.addEventListener('dispose', () => geometryCount++)
      mesh.material.addEventListener('dispose', () => materialCount++)
    })
    release(sun.group)
    assert.equal(geometryCount, count); assert.equal(materialCount, count)
  }
})

test('Core selection changes its own presentation without changing planetary lighting or stopping all orbits', () => {
  const system = createSolarSystem({ lowPower: false })
  const light = system.group.children.find(object => object.isPointLight), intensity = light.intensity
  const before = system.simulation.position('projects')
  const surface = system.targets.get('core').visuals.getObjectByName('core-surface')
  system.setInteraction({ selectedBodyId: 'core', hoveredBodyId: null }, true)
  assert.equal(surface.material.uniforms.activity.value, 1)
  assert.equal(light.intensity, intensity)
  system.update(.05)
  assert.notDeepEqual(system.simulation.position('projects'), before)
  system.setInteraction({ selectedBodyId: 'projects', hoveredBodyId: null }, true)
  assert.equal(surface.material.uniforms.activity.value, 0)
  assert.equal(light.intensity, intensity)
  const current = system.simulation.position('projects'), time = surface.material.uniforms.time.value
  system.update(.05, false)
  assert.deepEqual(system.simulation.position('projects'), current)
  assert.equal(surface.material.uniforms.time.value, time)
  release(system.group)
})
