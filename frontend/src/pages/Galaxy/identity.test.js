import test from 'node:test'
import assert from 'node:assert/strict'
import { Scene } from 'three'
import { createIdentityPlanet } from './scene/IdentityPlanet.js'
import { createSolarSystem } from './scene/SolarSystem.js'
import { PLANETS } from './data/solarSystem.js'
import { IDENTITY_APPEARANCE as style } from './data/identity.js'
import { identityTerrain } from './utils/identitySurface.js'
import { disposeScene } from './utils/disposeScene.js'
const identity = PLANETS.find(body => body.id === 'identity')
function release(group) {
  const scene = new Scene(); scene.add(group)
  disposeScene(scene, { dispose() {}, forceContextLoss() {}, domElement: { remove() {} } })
}

test('Identity terrain is deterministic, continuous, finite and has both land and ocean regions', () => {
  const samples = []
  for (let i = 0; i < 200; i++) {
    const y = 1 - 2 * (i + .5) / 200, angle = i * 2.399963, r = Math.sqrt(1 - y * y)
    const xyz = [r * Math.cos(angle), y, r * Math.sin(angle)]
    const field = identityTerrain(...xyz)
    assert.equal(field, identityTerrain(...xyz))
    assert.ok(Number.isFinite(field) && field >= 0 && field <= 1)
    assert.ok(Math.abs(field - identityTerrain(xyz[0] + .000001, xyz[1], xyz[2])) < .00001)
    samples.push(field)
  }
  assert.ok(samples.filter(value => value < .48).length > 40)
  assert.ok(samples.filter(value => value >= .48).length > 40)
})

test('Identity slows locally, freezes while paused, bounds atmosphere feedback and resets on deselect', () => {
  const planet = createIdentityPlanet(identity, false)
  const surface = planet.group.getObjectByName('identity-surface'), atmosphere = planet.group.getObjectByName('identity-atmosphere')
  planet.update(.05)
  const normalStep = surface.rotation.y
  planet.setInteraction(false, true, true)
  planet.update(.05)
  assert.ok(Math.abs((surface.rotation.y - normalStep) / normalStep - style.selectedSpeed) < 1e-10)
  assert.equal(atmosphere.material.uniforms.strength.value, style.atmosphereStrength * (1 + style.selectedBoost))
  const angle = surface.rotation.y
  planet.update(.05, false)
  for (const delta of [NaN, Infinity, -1]) planet.update(delta)
  assert.equal(surface.rotation.y, angle)
  for (let i = 0; i < 30; i++) { planet.setInteraction(i % 2 === 0, i % 3 === 0); planet.update(.016) }
  planet.setInteraction(false, false)
  for (let i = 0; i < 90; i++) planet.update(.05)
  assert.equal(atmosphere.material.uniforms.strength.value, style.atmosphereStrength)
  assert.ok(surface.rotation.y < .15)
  release(planet.group)
})

test('low-power Identity keeps two lightweight meshes, fewer vertices and complete disposal', () => {
  const full = createIdentityPlanet(identity, false), small = createIdentityPlanet(identity, true)
  assert.equal(full.group.children.length, 2); assert.equal(small.group.children.length, 2)
  assert.ok(small.group.children[0].geometry.attributes.position.count < full.group.children[0].geometry.attributes.position.count / 3)
  for (const planet of [full, small]) {
    let geometries = 0, materials = 0
    for (const mesh of planet.group.children) {
      assert.equal(mesh.material.map, mesh.material.isMeshStandardMaterial ? null : undefined)
      mesh.geometry.addEventListener('dispose', () => geometries++)
      mesh.material.addEventListener('dispose', () => materials++)
    }
    release(planet.group)
    assert.equal(geometries, 2); assert.equal(materials, 2)
  }
})

test('Identity/Core/Identity/Journey resets atmosphere and resumes Identity orbit through the shared API', () => {
  const system = createSolarSystem({ lowPower: false })
  const surface = system.targets.get('identity').visuals.getObjectByName('identity-surface')
  const atmosphere = system.targets.get('identity').visuals.getObjectByName('identity-atmosphere')
  for (const selectedBodyId of ['identity', 'core', 'identity', 'journey']) {
    system.setInteraction({ selectedBodyId, hoveredBodyId: null }, true)
    assert.equal(atmosphere.material.uniforms.strength.value, style.atmosphereStrength * (selectedBodyId === 'identity' ? 1 + style.selectedBoost : 1))
  }
  const before = system.simulation.position('identity')
  system.update(.05)
  assert.notDeepEqual(system.simulation.position('identity'), before)
  const frozen = system.simulation.position('identity'), rotation = surface.rotation.y
  system.update(.05, false)
  assert.deepEqual(system.simulation.position('identity'), frozen)
  assert.equal(surface.rotation.y, rotation)
  release(system.group)
})
