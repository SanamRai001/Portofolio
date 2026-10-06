import test from 'node:test'
import assert from 'node:assert/strict'
import { Scene } from 'three'
import { createIdentityPlanet } from './scene/IdentityPlanet.js'
import { createSolarSystem } from './scene/SolarSystem.js'
import { PLANETS } from './data/solarSystem.js'
import { IDENTITY, IDENTITY_APPEARANCE as style } from './data/identity.js'
import { createIdentitySurfaceMaps, identityTerrain } from './utils/identitySurface.js'
import { disposeScene } from './utils/disposeScene.js'
const identity = PLANETS.find(body => body.id === 'identity')
function release(group) {
  const scene = new Scene(); scene.add(group)
  disposeScene(scene, { dispose() {}, forceContextLoss() {}, domElement: { remove() {} } })
}


test('G3E Identity is a working model, not a duplicate biography', () => {
  assert.equal(IDENTITY.title, 'How I approach difficult things.')
  assert.deepEqual(
    IDENTITY.principles.map(principle => principle.id),
    ['trace', 'build', 'simplify'],
  )
  assert.deepEqual(
    IDENTITY.learningStyle,
    ['Learn', 'Build', 'Break', 'Understand', 'Fix', 'Repeat'],
  )
  assert.deepEqual(
    IDENTITY.directions.map(direction => direction.label),
    ['Backend & systems', 'AI & automation', 'Research & experiments'],
  )
  assert.equal('portrait' in IDENTITY, false)
  assert.equal('metadata' in IDENTITY, false)
  assert.equal('traits' in IDENTITY, false)
})

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
  const clouds = planet.group.getObjectByName('identity-clouds')
  const cloudStart = clouds.rotation.y
  planet.update(.05)
  const normalStep = surface.rotation.y
  assert.notEqual(clouds.rotation.y, cloudStart)
  assert.ok(identity.rotation.cloudSpeed > identity.rotation.surfaceSpeed)
  assert.ok(style.selectedSpeed >= .75 && style.selectedSpeed < 1, 'focused Earth must visibly spin, not appear frozen')
  assert.ok(style.hoverSpeed >= style.selectedSpeed && style.hoverSpeed <= 1)
  planet.setInteraction(false, true, true)
  planet.update(.05)
  assert.ok(Math.abs((surface.rotation.y - normalStep) / normalStep - style.selectedSpeed) < 1e-10)
  assert.equal(atmosphere.material.uniforms.strength.value, style.atmosphereStrength * (1 + style.selectedBoost))
  const angle = surface.rotation.y, cloudAngle = clouds.rotation.y
  planet.update(.05, false)
  for (const delta of [NaN, Infinity, -1]) planet.update(delta)
  assert.equal(surface.rotation.y, angle)
  assert.equal(clouds.rotation.y, cloudAngle)
  for (let i = 0; i < 30; i++) { planet.setInteraction(i % 2 === 0, i % 3 === 0); planet.update(.016) }
  planet.setInteraction(false, false)
  for (let i = 0; i < 90; i++) planet.update(.05)
  assert.equal(atmosphere.material.uniforms.strength.value, style.atmosphereStrength)
  assert.ok(surface.rotation.y < .15)
  release(planet.group)
})

test('Identity keeps quality-scaled layers and owns a desktop-only textured Moon with complete disposal', () => {
  const full = createIdentityPlanet(identity, false), small = createIdentityPlanet(identity, true)
  assert.equal(full.group.children.length, 4)
  assert.equal(small.group.children.length, 3)
  const moon = full.group.getObjectByName('identity-moon')
  const orbit = full.group.getObjectByName('identity-moon-orbit')
  assert.ok(moon && orbit)
  assert.equal(small.group.getObjectByName('identity-moon'), undefined)
  for (let i = 0; i < 3; i++) {
    assert.ok(small.group.children[i].geometry.attributes.position.count < full.group.children[i].geometry.attributes.position.count)
  }
  const start = orbit.rotation.y
  full.update(.05, true)
  assert.notEqual(orbit.rotation.y, start)
  const frozen = orbit.rotation.y
  full.update(.05, false)
  assert.equal(orbit.rotation.y, frozen, 'Moon follows reduced-motion/pause contract')
  assert.equal(full.group.getObjectByName('identity-clouds').material.defines.CLOUD_OCTAVES, 2)
  assert.equal(small.group.getObjectByName('identity-clouds').material.defines.CLOUD_OCTAVES, 1)
  assert.ok(small.group.getObjectByName('identity-clouds').material.uniforms.opacity.value < style.cloudOpacity)
  for (const planet of [full, small]) {
    let geometries = 0, materials = 0
    planet.group.traverse(mesh => {
      if (!mesh.isMesh) return
      assert.equal(mesh.material.map, mesh.material.isMeshStandardMaterial ? null : undefined)
      mesh.geometry.addEventListener('dispose', () => geometries++)
      mesh.material.addEventListener('dispose', () => materials++)
    })
    release(planet.group)
    assert.equal(geometries, planet === full ? 4 : 3)
    assert.equal(materials, planet === full ? 4 : 3)
  }
})

test('Identity/Core/Identity/Journey resets atmosphere and resumes Identity orbit through the shared API', () => {
  const system = createSolarSystem({ lowPower: false })
  const surface = system.targets.get('identity').visuals.getObjectByName('identity-surface')
  const atmosphere = system.targets.get('identity').visuals.getObjectByName('identity-atmosphere')
  const clouds = system.targets.get('identity').visuals.getObjectByName('identity-clouds')
  for (const selectedBodyId of ['identity', 'core', 'identity', 'journey']) {
    system.setInteraction({ selectedBodyId, hoveredBodyId: null }, true)
    assert.equal(atmosphere.material.uniforms.strength.value, style.atmosphereStrength * (selectedBodyId === 'identity' ? 1 + style.selectedBoost : 1))
  }
  const before = system.simulation.position('identity')
  system.update(.05)
  assert.notDeepEqual(system.simulation.position('identity'), before)
  const frozen = system.simulation.position('identity'), rotation = surface.rotation.y, cloudRotation = clouds.rotation.y
  system.update(.05, false)
  assert.deepEqual(system.simulation.position('identity'), frozen)
  assert.equal(surface.rotation.y, rotation)
  assert.equal(clouds.rotation.y, cloudRotation)
  release(system.group)
})


test('Identity generated surface maps are deterministic, quality-sized and materially distinct', () => {
  const first = createIdentitySurfaceMaps(24, 12)
  const second = createIdentitySurfaceMaps(24, 12)
  for (const key of ['albedo', 'roughness', 'elevation']) {
    assert.equal(first[key].image.width, 24)
    assert.equal(first[key].image.height, 12)
    assert.deepEqual(first[key].image.data, second[key].image.data)
  }
  const rough = first.roughness.image.data
  const height = first.elevation.image.data
  assert.ok(Math.min(...rough) < Math.max(...rough))
  assert.ok(Math.min(...height) < Math.max(...height))
  assert.notDeepEqual(first.albedo.image.data, first.roughness.image.data)
  for (const maps of [first, second]) Object.values(maps).forEach(texture => texture.dispose())
})
