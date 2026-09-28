import test from 'node:test'
import assert from 'node:assert/strict'
import { BufferGeometry, Mesh, MeshBasicMaterial, Scene, Texture } from 'three'
import { getPerformanceProfile } from './utils/performance.js'
import { createRenderLoop } from './utils/renderLoop.js'
import { disposeScene } from './utils/disposeScene.js'
import { createCameraRig } from './scene/CameraRig.js'
import { SUN, PLANETS, LAB, SYSTEM_MAP } from './data/solarSystem.js'
import { createOrbitSimulation, orbitPosition } from './utils/orbits.js'
import { getOverview, projectOverview } from './utils/overview.js'
import { createSolarSystem } from './scene/SolarSystem.js'
import { createStarField } from './scene/StarField.js'

function loopHarness(options = {}) {
  const scheduled = new Map(), deltas = []
  let id = 0
  const loop = createRenderLoop({
    render: (delta) => deltas.push(delta),
    requestFrame: (callback) => { scheduled.set(++id, callback); return id },
    cancelFrame: (frame) => scheduled.delete(frame),
    ...options,
  })
  return {
    loop, scheduled, deltas,
    advance(time) {
      const pending = [...scheduled.values()]
      scheduled.clear()
      pending.forEach((callback) => callback(time))
    },
  }
}

test('desktop DPR is bounded and each constrained device hint selects low power', () => {
  const desktop = getPerformanceProfile({ pixelRatio: 3 })
  assert.equal(desktop.dpr, 1.5)
  assert.equal(desktop.parallax, true)
  for (const hint of [{ width: 390 }, { coarsePointer: true }, { deviceMemory: 4 }, { hardwareConcurrency: 2 }]) {
    const profile = getPerformanceProfile({ ...hint, pixelRatio: 3 })
    assert.equal(profile.lowPower, true)
    assert.equal(profile.dpr, 1)
    assert.equal(profile.fps, 30)
    assert.equal(profile.parallax, false)
    assert.ok(profile.starCounts.reduce((a, b) => a + b) < desktop.starCounts.reduce((a, b) => a + b))
  }
})

test('missing hardware hints remain valid; reduced motion disables parallax', () => {
  assert.equal(getPerformanceProfile({ deviceMemory: 0, hardwareConcurrency: 0 }).lowPower, false)
  assert.equal(getPerformanceProfile({ pixelRatio: NaN }).dpr, 1)
  assert.equal(getPerformanceProfile({ reducedMotion: true }).parallax, false)
})

test('loop has one frame, pauses while hidden and resumes without a time jump', () => {
  const h = loopHarness()
  h.loop.setState({ active: true, continuous: true })
  h.loop.invalidate()
  h.loop.invalidate()
  assert.equal(h.scheduled.size, 1)
  h.advance(0)
  h.advance(17)
  assert.equal(h.deltas.length, 2)
  h.loop.setState({ active: false, continuous: true })
  assert.equal(h.scheduled.size, 0)
  h.advance(90000)
  assert.equal(h.deltas.length, 2)
  h.loop.setState({ active: true, continuous: true })
  h.advance(90001)
  assert.equal(h.deltas.at(-1), 0)
})

test('paused/reduced-motion scene renders once then only on invalidation', () => {
  const h = loopHarness()
  h.loop.setState({ active: true, continuous: false })
  h.advance(0)
  assert.equal(h.scheduled.size, 0)
  h.advance(17)
  assert.equal(h.deltas.length, 1)
  h.loop.invalidate()
  h.advance(20)
  assert.equal(h.deltas.length, 2)
  assert.equal(h.scheduled.size, 0)
})

test('low power rendering is throttled and large frame gaps are bounded', () => {
  const h = loopHarness({ fps: 30 })
  h.loop.setState({ active: true, continuous: true })
  h.advance(0)
  h.advance(16)
  assert.equal(h.deltas.length, 1)
  h.advance(34)
  assert.equal(h.deltas.length, 2)
  h.advance(5000)
  assert.equal(h.deltas.at(-1), 0.05)
})

test('disposing cancels frames and prevents later state events from restarting', () => {
  const h = loopHarness()
  h.loop.setState({ active: true, continuous: true })
  h.loop.dispose()
  h.loop.dispose()
  h.loop.setState({ active: true, continuous: true })
  h.loop.invalidate()
  h.advance(17)
  assert.equal(h.scheduled.size, 0)
  assert.equal(h.deltas.length, 0)
})

test('a runtime render failure stops the loop and reports fallback exactly once', () => {
  let failures = 0
  const h = loopHarness({ render: () => { throw new Error('context failure') }, onError: () => { failures += 1 } })
  h.loop.setState({ active: true, continuous: true })
  h.advance(0)
  h.loop.invalidate()
  h.advance(17)
  assert.equal(failures, 1)
  assert.equal(h.scheduled.size, 0)
})

test('overview camera stays bounded, resets and composes portrait separately', () => {
  const rig = createCameraRig()
  const home = rig.camera.position.clone()
  rig.point(100, -100)
  rig.update(100)
  assert.ok(rig.camera.position.distanceTo(home) < 0.7)
  rig.reset()
  assert.deepEqual(rig.camera.position.toArray(), home.toArray())
  rig.resize(390, 520)
  assert.equal(rig.camera.aspect, 390 / 520)
  assert.equal(rig.camera.fov, 58)
  assert.equal(rig.camera.up.x, 1)
})

test('star layers are deterministic, finite and separated in real 3D depth', () => {
  const profile = getPerformanceProfile({ width: 390 })
  const first = createStarField(profile), second = createStarField(profile)
  assert.equal(first.group.children.length, 3)
  first.group.children.forEach((points, index) => {
    const positions = points.geometry.attributes.position
    assert.equal(positions.count, profile.starCounts[index])
    assert.deepEqual(positions.array, second.group.children[index].geometry.attributes.position.array)
    for (let i = 0; i < positions.count; i += 1) {
      const radius = Math.hypot(positions.getX(i), positions.getY(i), positions.getZ(i))
      assert.ok(radius >= 84.99 + index * 80 && radius <= 135.01 + index * 80)
    }
  })
  for (const field of [first, second]) field.group.children.forEach((points) => {
    points.geometry.dispose()
    points.material.dispose()
  })
})

test('shared GPU resources are disposed once and the canvas/context are released', () => {
  const scene = new Scene(), geometry = new BufferGeometry(), texture = new Texture()
  const material = new MeshBasicMaterial({ map: texture })
  scene.add(new Mesh(geometry, material), new Mesh(geometry, material))
  const counts = { geometry: 0, material: 0, texture: 0, renderer: 0, context: 0, canvas: 0 }
  geometry.addEventListener('dispose', () => { counts.geometry += 1 })
  material.addEventListener('dispose', () => { counts.material += 1 })
  texture.addEventListener('dispose', () => { counts.texture += 1 })
  disposeScene(scene, {
    dispose: () => { counts.renderer += 1 },
    forceContextLoss: () => { counts.context += 1 },
    domElement: { remove: () => { counts.canvas += 1 } },
  })
  assert.deepEqual(counts, { geometry: 1, material: 1, texture: 1, renderer: 1, context: 1, canvas: 1 })
  assert.equal(scene.children.length, 0)
})


test('G2 orbits remain finite and bounded; paused and slowed bodies keep independent clocks', () => {
  const a = createOrbitSimulation(PLANETS), b = createOrbitSimulation(PLANETS)
  a.setPaused('identity', true)
  a.setRate('skills', 0.5)
  const frozen = a.position('identity')
  for (let i = 0; i < 20000; i++) { a.update(0.05); b.update(0.05) }
  assert.deepEqual(a.position('identity'), frozen)
  assert.notDeepEqual(a.position('skills'), b.position('skills'))
  assert.deepEqual(a.position('projects'), b.position('projects'))
  for (const body of PLANETS) {
    const p = a.position(body.id)
    assert.ok(p.every(Number.isFinite))
    assert.ok(Math.abs(Math.hypot(...p) - body.orbit.radius) < 1e-9)
  }
  const previous = a.position('projects')
  a.update(NaN); a.update(Infinity); a.update(-1)
  assert.deepEqual(a.position('projects'), previous)
  a.setPaused('identity', false); a.update(0.05)
  assert.ok(Math.hypot(...a.position('identity').map((v, i) => v - frozen[i])) < 0.02)
})

test('G2 overview contains full swept orbital envelopes at desktop, laptop and phone stage sizes', () => {
  for (const [width, height] of [[1360,630],[1200,530],[346,494]]) {
    const view = getOverview(width, height)
    for (const body of PLANETS) for (let step = 0; step < 360; step++) {
      const p = projectOverview(orbitPosition(body.orbit, step * Math.PI / 180), view)
      const radius = body.radius * (body.ring?.[1] || 1.12) * view.bodyScale
      assert.ok(Math.abs(p.x) + radius / (p.depth * view.tanX) < 0.92, body.id + ' horizontal')
      assert.ok(Math.abs(p.y) + radius / (p.depth * view.tanY) < 0.92, body.id + ' vertical')
    }
    const lab = projectOverview(LAB.position, view)
    assert.ok(Math.abs(lab.x) < 0.9 && Math.abs(lab.y) < 0.9)
  }
})

test('G2 configuration and rendered bodies preserve hierarchy, materials and cleanup', () => {
  assert.equal(PLANETS.length, 4)
  assert.equal(SYSTEM_MAP.length, 6)
  assert.equal(new Set(PLANETS.map(body => body.surface)).size, 4)
  assert.ok(SUN.radius > Math.max(...PLANETS.map(body => body.radius)))
  const system = createSolarSystem(getPerformanceProfile({ width: 390 }))
  assert.equal(system.bodies.size, 4)
  assert.equal(system.group.children.filter(child => child.isLineLoop).length, 4)
  system.resize(true)
  system.update(0.05)
  let geometryCount = 0, disposed = 0, triangles = 0
  system.group.traverse(object => {
    if (object.geometry) {
      geometryCount++
      object.geometry.addEventListener('dispose', () => { disposed++ })
      if (object.isMesh) triangles += (object.geometry.index?.count || 0) / 3
    }
  })
  assert.ok(triangles < 12000)
  const scene = new Scene(); scene.add(system.group)
  disposeScene(scene, { dispose() {}, forceContextLoss() {}, domElement: { remove() {} } })
  assert.equal(disposed, geometryCount)
})
