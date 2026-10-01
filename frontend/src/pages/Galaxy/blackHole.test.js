import test from 'node:test'
import assert from 'node:assert/strict'
import { Scene } from 'three'
import { BLACK_HOLE, SYSTEM_MAP } from './data/solarSystem.js'
import { BLACK_HOLE_APPEARANCE as STYLE } from './data/blackHole.js'
import { createBlackHole } from './scene/BlackHole.js'
import { createSolarSystem } from './scene/SolarSystem.js'
import { disposeScene } from './utils/disposeScene.js'

function release(group) {
  const scene = new Scene()
  scene.add(group)
  disposeScene(scene, { dispose() {}, forceContextLoss() {}, domElement: { remove() {} } })
}

test('G2R.7 black-hole target exists once and is distinct from Lab and the orbiting worlds', () => {
  assert.equal(SYSTEM_MAP.filter(body => body.id === BLACK_HOLE.id).length, 1)
  assert.ok(!BLACK_HOLE.orbit)
  assert.notDeepEqual(BLACK_HOLE.position, SYSTEM_MAP.find(body => body.id === 'lab').position)
  assert.ok(BLACK_HOLE.radius > 0 && BLACK_HOLE.focus.fov > 0)
})

test('G2R.7 black-hole material has a depth-writing horizon and high/low accretion tiers', () => {
  const high = createBlackHole(BLACK_HOLE, false)
  const low = createBlackHole(BLACK_HOLE, true)
  for (const [presentation, detail, segments, radialSegments] of [
    [high, 1, STYLE.desktopSegments, STYLE.desktopRadialSegments],
    [low, 0, STYLE.mobileSegments, 1],
  ]) {
    const disk = presentation.group.getObjectByName('black-hole-accretion-disk')
    const core = presentation.group.getObjectByName('black-hole-event-horizon')
    assert.ok(disk && core)
    assert.equal(core.material.depthWrite, true)
    assert.equal(core.material.color.getHexString(), '000000')
    assert.equal(disk.material.depthWrite, false)
    assert.equal(disk.material.depthTest, true)
    assert.equal(disk.material.transparent, true)
    assert.equal(disk.material.defines.BLACK_HOLE_FINE, detail)
    assert.equal(disk.geometry.parameters.thetaSegments, segments)
    assert.equal(disk.geometry.parameters.phiSegments, radialSegments)
    assert.equal(disk.material.uniforms.innerRadius.value, BLACK_HOLE.radius * STYLE.diskInnerScale)
    assert.equal(disk.material.uniforms.outerRadius.value, BLACK_HOLE.radius * STYLE.diskOuterScale)
    assert.match(disk.material.fragmentShader, /beaming/)
    assert.match(disk.material.fragmentShader, /fwidth\(ripple\)/)
    assert.match(disk.material.vertexShader, /innerWeight/)
  }
  assert.ok(high.group.getObjectByName('black-hole-photon-halo'), 'desktop has a local photon-ring approximation')
  assert.equal(low.group.getObjectByName('black-hole-photon-halo'), undefined, 'low power skips secondary geometry')
  assert.ok(low.group.getObjectByName('black-hole-accretion-disk').geometry.index.count < high.group.getObjectByName('black-hole-accretion-disk').geometry.index.count)

  for (const presentation of [high, low]) {
    const geometries = new Set(), materials = new Set()
    presentation.group.traverse(item => {
      if (item.geometry) geometries.add(item.geometry)
      if (item.material) materials.add(item.material)
    })
    let freedGeo = 0, freedMat = 0
    geometries.forEach(item => item.addEventListener('dispose', () => { freedGeo++ }))
    materials.forEach(item => item.addEventListener('dispose', () => { freedMat++ }))
    release(presentation.group)
    assert.equal(freedGeo, geometries.size)
    assert.equal(freedMat, materials.size)
  }
})

test('G2R.7 attention responds to selection while ambient disk time obeys pause/reduced motion', () => {
  const presentation = createBlackHole(BLACK_HOLE, false)
  const disk = presentation.group.getObjectByName('black-hole-accretion-disk')
  presentation.setInteraction(false, true, true)
  assert.equal(disk.material.uniforms.focusStrength.value, 1)
  const before = disk.material.uniforms.time.value
  presentation.update(.05, false)
  assert.equal(disk.material.uniforms.time.value, before)
  presentation.update(.05, true)
  assert.ok(disk.material.uniforms.time.value > before)
  presentation.setInteraction(false, false, true)
  assert.equal(disk.material.uniforms.focusStrength.value, 0)
  presentation.update(Number.NaN, true)
  assert.ok(Number.isFinite(disk.material.uniforms.time.value))
  release(presentation.group)
})

test('G2R.7 focus is a normal target in the single-loop solar presentation and does not activate a portal', () => {
  for (const lowPower of [false, true]) {
    const system = createSolarSystem({ lowPower })
    assert.equal(system.targets.size, SYSTEM_MAP.length)
    const target = system.targets.get(BLACK_HOLE.id)
    assert.ok(target)
    assert.deepEqual(target.group.position.toArray(), BLACK_HOLE.position)
    assert.ok(system.hitMeshes.includes(target.interactionMesh))
    assert.equal(target.interactionMesh.userData.bodyId, BLACK_HOLE.id)
    const disk = target.visuals.getObjectByName('black-hole-accretion-disk')
    system.setInteraction({ selectedBodyId: BLACK_HOLE.id, hoveredBodyId: null }, true)
    assert.equal(disk.material.uniforms.focusStrength.value, 1)
    const before = disk.material.uniforms.time.value
    system.update(.05, false)
    assert.equal(disk.material.uniforms.time.value, before)
    system.update(.05, true)
    assert.ok(disk.material.uniforms.time.value > before)
    system.dispose()
    release(system.group)
  }
})
