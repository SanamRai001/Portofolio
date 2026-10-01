import test from 'node:test'
import assert from 'node:assert/strict'
import { Scene, Texture } from 'three'
import {
  createAuthoredSurfaceController,
  createCloudLayer,
  createLightAwareAtmosphere,
  createNightSideLayer,
  installAuthoredSurfaceMap,
} from './scene/PlanetLayers.js'
import { disposeScene } from './utils/disposeScene.js'

function release(...objects) {
  const scene = new Scene()
  objects.forEach(object => scene.add(object))
  disposeScene(scene, { dispose() {}, forceContextLoss() {}, domElement: { remove() {} } })
}

test('G2R.3 atmosphere is Sun-aware and uses a cheaper low-power sphere', () => {
  const high = createLightAwareAtmosphere(1.05, { lowPower: false, color: '#77aaff', strength: .3 })
  const low = createLightAwareAtmosphere(1.05, { lowPower: true, color: '#77aaff', strength: .3 })
  assert.ok(low.geometry.attributes.position.count < high.geometry.attributes.position.count)
  assert.equal(high.material.uniforms.strength.value, .3)
  assert.match(high.material.fragmentShader, /normalize\(-worldPosition\)/)
  assert.match(high.material.fragmentShader, /daylight/)
  assert.equal(high.material.depthWrite, false)
  release(high, low)
})

test('G2R.3 cloud shell rotates independently, freezes deterministically and scales work by quality', () => {
  const high = createCloudLayer(1.03, {
    lowPower: false,
    opacity: .31,
    seed: 4,
    rotation: { axialTilt: .21, surfaceSpeed: .08, direction: -1 },
  })
  const low = createCloudLayer(1.03, {
    lowPower: true,
    rotation: { axialTilt: .21, surfaceSpeed: .08, direction: -1 },
  })
  assert.equal(high.mesh.rotation.z, .21)
  assert.equal(high.mesh.material.defines.CLOUD_OCTAVES, 2)
  assert.equal(low.mesh.material.defines.CLOUD_OCTAVES, 1)
  assert.ok(low.mesh.geometry.attributes.position.count < high.mesh.geometry.attributes.position.count)

  const before = high.mesh.rotation.y
  high.update(.05, true)
  assert.notEqual(high.mesh.rotation.y, before)
  const frozen = high.mesh.rotation.y
  high.update(.05, false)
  assert.equal(high.mesh.rotation.y, frozen)
  release(high.mesh, low.mesh)
})

test('G2R.3 night-side layer emits only from the Sun-opposed side and keeps low-power work bounded', () => {
  const high = createNightSideLayer(1.006, { lowPower: false, strength: .42, seed: 7 })
  const low = createNightSideLayer(1.006, { lowPower: true, strength: .42, seed: 7 })
  assert.equal(high.material.defines.NIGHT_OCTAVES, 2)
  assert.equal(low.material.defines.NIGHT_OCTAVES, 1)
  assert.ok(low.geometry.attributes.position.count < high.geometry.attributes.position.count)
  assert.match(high.material.fragmentShader, /normalize\(-worldPosition\)/)
  assert.match(high.material.fragmentShader, /float night/)
  assert.equal(high.material.depthWrite, false)
  release(high, low)
})

test('G2R.3 authored surface install preserves physical material controls', () => {
  const map = new Texture()
  const surface = { material: { vertexColors: true, map: null, bumpMap: null } }
  installAuthoredSurfaceMap(surface, map, { bumpScale: .015, roughness: .82, metalness: .08 })
  assert.equal(surface.material.vertexColors, false)
  assert.equal(surface.material.map, map)
  assert.equal(surface.material.bumpMap, map)
  assert.equal(surface.material.bumpScale, .015)
  assert.equal(surface.material.roughness, .82)
  assert.equal(surface.material.metalness, .08)
  assert.equal(surface.material.needsUpdate, true)
  map.dispose()
})

test('G2R.3 authored surface controller hands installed textures to the scene and rejects late loads', () => {
  const installedMap = new Texture()
  let installedDisposals = 0
  installedMap.addEventListener('dispose', () => { installedDisposals += 1 })
  let installedLoad
  const installedLoader = {
    load(path, onLoad) {
      assert.equal(path, '/planet.webp')
      installedLoad = onLoad
      return installedMap
    },
  }
  const installedSurface = { material: { vertexColors: true } }
  let ready = 0
  const installed = createAuthoredSurfaceController({
    surface: installedSurface,
    path: '/planet.webp',
    loader: installedLoader,
    onReady: () => { ready += 1 },
  })
  installedLoad(installedMap)
  assert.equal(installed.loaded, true)
  assert.equal(installedSurface.material.map, installedMap)
  assert.equal(ready, 1)
  installed.dispose()
  assert.equal(installedDisposals, 0, 'installed texture is scene-owned')

  const lateMap = new Texture()
  let lateDisposals = 0
  lateMap.addEventListener('dispose', () => { lateDisposals += 1 })
  let lateLoad
  const late = createAuthoredSurfaceController({
    surface: { material: { vertexColors: true } },
    path: '/late.webp',
    loader: { load(_path, onLoad) { lateLoad = onLoad; return lateMap } },
    onReady: () => { throw new Error('late load must not become ready') },
  })
  late.dispose()
  assert.equal(lateDisposals, 1)
  lateLoad(lateMap)
  assert.equal(late.loaded, false)
  assert.equal(lateDisposals, 1, 'late callback is idempotently disposed')
})
