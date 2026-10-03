import test from 'node:test'
import assert from 'node:assert/strict'
import { DoubleSide, Scene } from 'three'
import { SUN } from './data/solarSystem.js'
import { SUN_APPEARANCE } from './data/core.js'
import { createSun } from './scene/CelestialBody.js'
import {
  SUN_SHADER_CONTRACT, createSolarCorona, createSolarFilaments,
  createSolarSurfaceMaterial,
} from './scene/SunRealism.js'
import { disposeScene } from './utils/disposeScene.js'

function release(group) {
  const scene = new Scene()
  scene.add(group)
  disposeScene(scene, { dispose() {}, forceContextLoss() {}, domElement: { remove() {} } })
}

test('G2R.12 Sun uses the same continuum-light palette on desktop and mobile without orange authored-map colour', () => {
  const high = createSolarSurfaceMaterial(SUN_APPEARANCE, false)
  const low = createSolarSurfaceMaterial(SUN_APPEARANCE, true)
  assert.equal(high.defines.SUN_OCTAVES, 3)
  assert.equal(low.defines.SUN_OCTAVES, 2)
  assert.match(SUN_SHADER_CONTRACT.surface, /dot\(authored, vec3\(\.2126,\.7152,\.0722\)\)/)
  assert.match(SUN_SHADER_CONTRACT.surface, /textureVariation/)
  assert.match(SUN_SHADER_CONTRACT.surface, /pow\(facing, \.43\)/)
  assert.match(SUN_SHADER_CONTRACT.surface, /pow\(facing, \.32\)/)
  assert.match(SUN_SHADER_CONTRACT.surface, /smoothstep\(\.986, \.995, regionA\)/)
  assert.match(SUN_SHADER_CONTRACT.surface, /umbra \* \.35/)
  assert.match(SUN_SHADER_CONTRACT.surface, /#if SUN_OCTAVES > 2/)
  assert.match(SUN_SHADER_CONTRACT.surface, /normalize\(solarDirection\)/)
  assert.match(SUN_SHADER_CONTRACT.surface, /#include <colorspace_fragment>/)
  assert.equal(high.uniforms.ivory.value.getHexString(), 'fff6e4')
  assert.equal(low.uniforms.ivory.value.getHexString(), high.uniforms.ivory.value.getHexString())
  high.dispose()
  low.dispose()
})

test('G2R.12 solar corona is thin, asymmetric, low-cost on phone and fully scene-owned', () => {
  const full = createSolarCorona(SUN.radius, SUN_APPEARANCE, false, 64)
  const phone = createSolarCorona(SUN.radius, SUN_APPEARANCE, true, 40)
  assert.ok(full.outer)
  assert.equal(phone.outer, null)
  assert.ok(full.inner.geometry.parameters.radius > SUN.radius)
  assert.ok(full.inner.geometry.parameters.radius < SUN.radius * 1.04)
  assert.ok(full.outer.geometry.parameters.radius < SUN.radius * 1.08)
  assert.ok(phone.inner.geometry.attributes.position.count < full.inner.geometry.attributes.position.count)
  assert.match(SUN_SHADER_CONTRACT.corona, /sin\(angle \* 4\./)
  assert.match(SUN_SHADER_CONTRACT.corona, /pow\(1\. - facing, 4\.7\)/)
  assert.equal(full.inner.material.depthWrite, false)
  const scene = new Scene()
  scene.add(full.inner, full.outer, phone.inner)
  let disposed = 0
  for (const mesh of [full.inner, full.outer, phone.inner]) {
    mesh.material.addEventListener('dispose', () => disposed++)
  }
  disposeScene(scene, { dispose() {}, forceContextLoss() {}, domElement: { remove() {} } })
  assert.equal(disposed, 3)
})

test('G2R.12 desktop prominence ribbons taper and stay near the limb, not tall decorative tubes', () => {
  const ribbons = createSolarFilaments(SUN.radius, SUN_APPEARANCE)
  assert.equal(ribbons.children.length, 2)
  for (const ribbon of ribbons.children) {
    const geom = ribbon.geometry, positions = geom.attributes.position, uv = geom.attributes.uv
    assert.equal(positions.count, 50)
    assert.equal(geom.index.count, 24 * 6)
    assert.equal(ribbon.material.side, DoubleSide)
    assert.equal(ribbon.material.depthWrite, false)
    assert.equal(ribbon.material.depthTest, true)
    let farthest = 0
    for (let i = 0; i < positions.count; i++) {
      const length = Math.hypot(positions.getX(i), positions.getY(i), positions.getZ(i))
      farthest = Math.max(farthest, length)
    }
    assert.ok(farthest < SUN.radius * 1.095)
    assert.equal(uv.getX(0), 0)
    assert.equal(uv.getX(positions.count - 1), 1)
  }
  assert.match(SUN_SHADER_CONTRACT.filament, /baseOpacity \* taper \* across/)
  release(ribbons)
})

test('G2R.12 focus feedback and filament motion freeze use one original Sun update clock', () => {
  const presentation = createSun(SUN, false)
  const surface = presentation.group.getObjectByName('core-surface')
  const ribbons = presentation.group.getObjectByName('core-prominences')
  presentation.update(.05, true)
  assert.ok(surface.material.uniforms.time.value > 0)
  assert.equal(ribbons.children[0].material.uniforms.time.value, surface.material.uniforms.time.value)
  const frozen = surface.material.uniforms.time.value
  presentation.setInteraction(false, true, true)
  presentation.update(.05, false)
  assert.equal(surface.material.uniforms.time.value, frozen)
  for (const ribbon of ribbons.children) {
    assert.equal(ribbon.material.uniforms.time.value, frozen)
    assert.equal(ribbon.material.uniforms.activity.value, 1)
  }
  presentation.dispose()
  release(presentation.group)
  const lowPower = createSun(SUN, true)
  assert.equal(lowPower.group.getObjectByName('core-prominences'), undefined)
  lowPower.dispose()
  release(lowPower.group)
})
