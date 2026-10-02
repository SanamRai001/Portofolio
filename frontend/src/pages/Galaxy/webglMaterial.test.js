import test from 'node:test'
import assert from 'node:assert/strict'
import { Scene } from 'three'
import { createSun } from './scene/CelestialBody.js'
import { createCloudLayer } from './scene/PlanetLayers.js'
import { createProjectsPlanet } from './scene/ProjectsPlanet.js'
import { createSolarSystem } from './scene/SolarSystem.js'
import { SUN, PLANETS } from './data/solarSystem.js'
import { getPerformanceProfile } from './utils/performance.js'
import { disposeScene } from './utils/disposeScene.js'

const release = (group) => {
  const scene = new Scene()
  scene.add(group)
  disposeScene(scene, { dispose() {}, forceContextLoss() {}, domElement: { remove() {} } })
}

test('WebGL material pass confines active-region photosphere shading to desktop without additional geometry', () => {
  const desktop = createSun(SUN, false), phone = createSun(SUN, true)
  const surface = desktop.group.getObjectByName('core-surface')
  const mobile = phone.group.getObjectByName('core-surface')
  assert.equal(surface.material.defines.SUN_OCTAVES, 3)
  assert.equal(mobile.material.defines.SUN_OCTAVES, 2)
  assert.match(surface.material.fragmentShader, /#if SUN_OCTAVES > 2[\s\S]*float regionA[\s\S]*float penumbra[\s\S]*float umbra/)
  assert.equal(desktop.group.children.length, 4, 'surface, two existing corona shells and prominences only')
  assert.equal(phone.group.children.length, 2, 'mobile still has surface and one corona shell')
  const before = surface.material.uniforms.time.value
  desktop.update(.05, true)
  assert.ok(surface.material.uniforms.time.value > before)
  desktop.update(.05, false)
  assert.equal(surface.material.uniforms.time.value, surface.material.uniforms.time.value)
  release(desktop.group)
  release(phone.group)
})

test('WebGL cloud detail is quality-gated and retains one independent paused rotation controller', () => {
  const rotation = { axialTilt: .17, surfaceSpeed: .07, direction: 1 }
  const high = createCloudLayer(1.08, { lowPower: false, rotation })
  const low = createCloudLayer(1.08, { lowPower: true, rotation })
  const fragment = high.mesh.material.fragmentShader
  assert.equal(high.mesh.material.defines.CLOUD_OCTAVES, 2)
  assert.equal(low.mesh.material.defines.CLOUD_OCTAVES, 1)
  assert.match(fragment, /#if CLOUD_OCTAVES > 1[\s\S]*vec3 warp[\s\S]*float weather[\s\S]*float wisps/)
  assert.match(fragment, /#else\s*cloud = smoothstep\(\.49, \.72, noise\(p\)\);/)
  const start = high.mesh.rotation.y
  high.update(.05, true)
  assert.notEqual(high.mesh.rotation.y, start)
  const freeze = high.mesh.rotation.y
  high.update(.05, false)
  assert.equal(high.mesh.rotation.y, freeze)
  release(high.mesh); release(low.mesh)
})

test('Projects gains a low-strength sunlit dust limb on desktop but none in low-power', () => {
  const body = PLANETS.find(p => p.id === 'projects')
  const high = createProjectsPlanet(body, false), low = createProjectsPlanet(body, true)
  const haze = high.group.getObjectByName('projects-dust-limb')
  assert.ok(haze)
  assert.equal(haze.material.uniforms.strength.value, .16)
  assert.match(haze.material.fragmentShader, /sunDirection/)
  assert.equal(low.group.getObjectByName('projects-dust-limb'), undefined)
  release(high.group); release(low.group)
})

test('low-power WebGL system remains strictly below 12000 total mesh triangles', () => {
  const profile = getPerformanceProfile({ width: 390, coarsePointer: true })
  const system = createSolarSystem(profile)
  let triangles = 0
  system.group.traverse(object => {
    if (!object.isMesh || !object.visible || !object.geometry) return
    const geometry = object.geometry
    triangles += (geometry.index ? geometry.index.count : geometry.attributes.position?.count || 0) / 3
  })
  assert.ok(triangles < 12000, `low-power total ${triangles} must stay below 12000`)
  system.dispose()
  release(system.group)
})
