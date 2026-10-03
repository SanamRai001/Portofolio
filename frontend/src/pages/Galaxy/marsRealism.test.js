import test from 'node:test'
import assert from 'node:assert/strict'
import { DataTexture, RGBAFormat, Scene, SRGBColorSpace, UnsignedByteType, RepeatWrapping, ClampToEdgeWrapping } from 'three'
import { PLANETS } from './data/solarSystem.js'
import { createProjectsPlanet } from './scene/ProjectsPlanet.js'
import { MARS_VERTEX_SHADER, MARS_FRAGMENT_SHADER, configureMarsAtlas, createMarsSurfaceMaterial } from './scene/MarsRealism.js'
import { disposeScene } from './utils/disposeScene.js'

const mars = PLANETS.find(body => body.id === 'projects')
function release(group) {
  const scene = new Scene()
  scene.add(group)
  disposeScene(scene, { dispose() {}, forceContextLoss() {}, domElement: { remove() {} } })
}

test('G2R.14 Mars atlas keeps real colour, seam blend, directionally lit uninhabited night side', () => {
  const texture = new DataTexture(new Uint8Array(16 * 8 * 4), 16, 8, RGBAFormat, UnsignedByteType)
  assert.equal(configureMarsAtlas(texture), texture)
  assert.equal(texture.colorSpace, SRGBColorSpace)
  assert.equal(texture.wrapS, RepeatWrapping)
  assert.equal(texture.wrapT, ClampToEdgeWrapping)
  const high = createMarsSurfaceMaterial(texture, false)
  const low = createMarsSurfaceMaterial(texture, true)
  assert.equal(high.defines.MARS_DETAIL_HIGH, 1)
  assert.equal(low.defines.MARS_DETAIL_HIGH, 0)
  assert.equal(high.uniforms.albedoMap.value, texture)
  assert.equal(low.uniforms.albedoMap.value, texture)
  assert.match(MARS_VERTEX_SHADER, /vMarsCenter = \(modelMatrix/)
  assert.match(MARS_VERTEX_SHADER, /vMarsNormal/)
  assert.match(MARS_FRAGMENT_SHADER, /float edge = min\(x, 1\. - x\)/)
  assert.match(MARS_FRAGMENT_SHADER, /edge < \.020/)
  assert.match(MARS_FRAGMENT_SHADER, /texture2D\(albedoMap, vec2\(1\. - x, uv\.y\)\)/)
  assert.match(MARS_FRAGMENT_SHADER, /vec3 L = normalize\(-vMarsCenter\)/)
  assert.match(MARS_FRAGMENT_SHADER, /smoothstep\(-\.085, \.13, sunDot\)/)
  assert.match(MARS_FRAGMENT_SHADER, /max\(sunDot, 0\.\)/)
  assert.match(MARS_FRAGMENT_SHADER, /#if MARS_DETAIL_HIGH/)
  assert.match(MARS_FRAGMENT_SHADER, /#include <colorspace_fragment>/)
  assert.doesNotMatch(MARS_FRAGMENT_SHADER, /city|lights|nightMap|bumpMap/i)
  assert.equal(high.depthWrite, true)
  assert.equal(low.depthWrite, true)
  high.dispose()
  low.dispose()
  texture.dispose()
})

test('G2R.14 old speculative emission geometry is gone from both tiers; one-rotation update and tiny dust rim remain', () => {
  const desktop = createProjectsPlanet(mars, false)
  const mobile = createProjectsPlanet(mars, true)
  const fullSurface = desktop.group.getObjectByName('projects-surface')
  const lowSurface = mobile.group.getObjectByName('projects-surface')
  assert.equal(desktop.group.getObjectByName('projects-night-side'), undefined)
  assert.equal(mobile.group.getObjectByName('projects-night-side'), undefined)
  assert.ok(desktop.group.getObjectByName('projects-dust-limb'))
  assert.equal(mobile.group.getObjectByName('projects-dust-limb'), undefined)
  assert.equal(desktop.group.children.length, 2)
  assert.equal(mobile.group.children.length, 1)
  assert.ok(fullSurface.geometry.attributes.position.count > lowSurface.geometry.attributes.position.count)
  const start = fullSurface.rotation.y
  desktop.update(.05, true)
  assert.notEqual(fullSurface.rotation.y, start)
  const freeze = fullSurface.rotation.y
  desktop.update(.05, false)
  assert.equal(fullSurface.rotation.y, freeze)
  let disposed = 0
  fullSurface.geometry.addEventListener('dispose', () => disposed++)
  release(desktop.group)
  release(mobile.group)
  assert.equal(disposed, 1)
})
