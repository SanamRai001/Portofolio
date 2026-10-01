import test from 'node:test'
import assert from 'node:assert/strict'
import { BufferGeometry, Mesh, MeshBasicMaterial, Scene, Texture, Vector3 } from 'three'
import { getPerformanceProfile } from './utils/performance.js'
import { createRenderLoop, shouldRunSceneLoop } from './utils/renderLoop.js'
import { disposeScene } from './utils/disposeScene.js'
import { createCameraRig } from './scene/CameraRig.js'
import { SUN, PLANETS, LAB, BLACK_HOLE, SYSTEM_MAP, SOLAR_STYLE } from './data/solarSystem.js'
import { PROJECTS_APPEARANCE } from './data/projects.js'
import { createOrbitSimulation, orbitPosition } from './utils/orbits.js'
import { getOverview, projectOverview } from './utils/overview.js'
import { createSolarSystem } from './scene/SolarSystem.js'
import { blendProjectsLongitudeSeam } from './scene/ProjectsPlanet.js'
import { createStarField, STAR_DEPTH_TIERS } from './scene/StarField.js'

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
        * (view.portrait ? SOLAR_STYLE.mobileOverviewBodyScale : SOLAR_STYLE.overviewBodyScale)
      assert.ok(Math.abs(p.x) + radius / (p.depth * view.tanX) < 0.95, body.id + ' horizontal')
      assert.ok(Math.abs(p.y) + radius / (p.depth * view.tanY) < 0.95, body.id + ' vertical')
    }
    const lab = projectOverview(LAB.position, view)
    assert.ok(Math.abs(lab.x) < 0.9 && Math.abs(lab.y) < 0.9)
  }
})

test('G2 configuration and rendered bodies preserve hierarchy, materials and cleanup', () => {
  assert.equal(PLANETS.length, 4)
  assert.equal(SYSTEM_MAP.length, 7)
  assert.equal(new Set(PLANETS.map(body => body.surface)).size, 4)
  assert.ok(SUN.radius > Math.max(...PLANETS.map(body => body.radius)))
  const system = createSolarSystem(getPerformanceProfile({ width: 390 }))
  assert.equal(system.bodies.size, 4)
  assert.equal(system.group.children.filter(child => child.isLineLoop).length, 4)
  system.resize(true)
  assert.equal(system.targets.get('core').visuals.scale.x, SOLAR_STYLE.mobileOverviewBodyScale)
  system.setInteraction({ selectedBodyId: 'projects', hoveredBodyId: null }, true)
  assert.equal(system.targets.get('core').visuals.scale.x, 1)
  system.setInteraction({ selectedBodyId: null, hoveredBodyId: null }, true)
  assert.equal(system.targets.get('core').visuals.scale.x, SOLAR_STYLE.mobileOverviewBodyScale)
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

test('Projects preserves its authored-surface fallback and keeps settlement lights locked to terrain', () => {
  const system = createSolarSystem(getPerformanceProfile({ width: 1440, reducedMotion: false }))
  const visuals = system.targets.get('projects').visuals
  const surface = visuals.getObjectByName('projects-surface')
  const night = visuals.getObjectByName('projects-night-side')
  assert.ok(surface)
  assert.ok(night)
  assert.equal(surface.material.vertexColors, true)
  assert.equal(surface.material.map, null)
  assert.equal(night.material.defines.NIGHT_OCTAVES, 2)
  assert.equal(night.material.uniforms.strength.value, PROJECTS_APPEARANCE.nightStrength)

  const positions = surface.geometry.attributes.position
  const radius = SYSTEM_MAP.find(body => body.id === 'projects').radius
  for (let i = 0; i < positions.count; i++) {
    const length = Math.hypot(positions.getX(i), positions.getY(i), positions.getZ(i))
    assert.ok(Math.abs(length - radius) < 1e-5, 'textured surface must not pinch at pole triangles')
  }

  system.update(.05, true)
  assert.ok(surface.rotation.y > 0)
  assert.ok(Math.abs(surface.rotation.y - night.rotation.y) < 1e-12, 'settlement layer must remain surface-locked')

  const surfaceFrozen = surface.rotation.y, nightFrozen = night.rotation.y
  system.update(.05, false)
  assert.equal(surface.rotation.y, surfaceFrozen)
  assert.equal(night.rotation.y, nightFrozen)

  system.dispose()
  const scene = new Scene(); scene.add(system.group)
  disposeScene(scene, { dispose() {}, forceContextLoss() {}, domElement: { remove() {} } })

  const low = createSolarSystem(getPerformanceProfile({ width: 390, reducedMotion: false }))
  const lowNight = low.targets.get('projects').visuals.getObjectByName('projects-night-side')
  assert.equal(lowNight.material.defines.NIGHT_OCTAVES, 1)
  assert.equal(lowNight.material.uniforms.strength.value, PROJECTS_APPEARANCE.lowPowerStrength)
  low.dispose()
  const lowScene = new Scene(); lowScene.add(low.group)
  disposeScene(lowScene, { dispose() {}, forceContextLoss() {}, domElement: { remove() {} } })
})

test('Projects map smooths its longitude join while retaining the standard material lighting', () => {
  const material = {}
  blendProjectsLongitudeSeam(material)
  const shader = { fragmentShader: 'before\n#include <map_fragment>\nafter' }
  material.onBeforeCompile(shader)
  assert.match(shader.fragmentShader, /texture2D\(map, vMapUv\)/)
  assert.match(shader.fragmentShader, /texture2D\(map, vec2\(1\. - vMapUv\.x, vMapUv\.y\)\)/)
  assert.match(shader.fragmentShader, /diffuseColor \*= sampledDiffuseColor/)
  assert.ok(shader.fragmentShader.startsWith('before\n') && shader.fragmentShader.endsWith('\nafter'))
})

test('G2R.1 planet rotation is data-driven, deterministic and frozen when ambient motion is disabled', () => {
  for (const body of PLANETS) {
    assert.ok(Object.isFrozen(body.rotation))
    assert.ok(Number.isFinite(body.rotation.axialTilt))
    assert.ok(body.rotation.surfaceSpeed > 0)
    assert.ok(body.rotation.direction === 1 || body.rotation.direction === -1)
  }

  const system = createSolarSystem(getPerformanceProfile({ width: 1440, reducedMotion: false }))
  const surfaces = new Map(PLANETS.map(body => {
    const surface = system.targets.get(body.id).visuals.getObjectByName(`${body.id}-surface`)
    assert.ok(surface, `${body.id} surface`)
    assert.ok(Math.abs(surface.rotation.z - body.rotation.axialTilt) < 1e-12, `${body.id} tilt`)
    return [body.id, surface]
  }))
  const before = new Map([...surfaces].map(([id, surface]) => [id, surface.rotation.y]))

  system.update(.05, true)
  for (const [id, surface] of surfaces) assert.notEqual(surface.rotation.y, before.get(id), `${id} should rotate`)

  const moved = new Map([...surfaces].map(([id, surface]) => [id, surface.rotation.y]))
  system.update(.05, false)
  for (const [id, surface] of surfaces) assert.equal(surface.rotation.y, moved.get(id), `${id} should freeze`)

  const skillsConstellation = system.targets.get('skills').visuals.getObjectByName('skills-satellites')
  assert.equal(skillsConstellation.rotation.y, 0, 'planet spin must not rotate the skill constellation')

  system.dispose()
  const scene = new Scene(); scene.add(system.group)
  disposeScene(scene, { dispose() {}, forceContextLoss() {}, domElement: { remove() {} } })
})


test('offscreen Galaxy rendering stays alive only long enough to settle camera travel', () => {
  assert.equal(shouldRunSceneLoop({ inView: true, pageActive: true, hidden: false, travelling: false }), true)
  assert.equal(shouldRunSceneLoop({ inView: false, pageActive: true, hidden: false, travelling: true }), true)
  assert.equal(shouldRunSceneLoop({ inView: false, pageActive: true, hidden: false, travelling: false }), false)
  assert.equal(shouldRunSceneLoop({ inView: false, pageActive: false, hidden: false, travelling: true }), false)
  assert.equal(shouldRunSceneLoop({ inView: false, pageActive: true, hidden: true, travelling: true }), false)
})


test('G2R.2 hero Sun keeps prominence geometry high-quality only and freezes animation when disabled', () => {
  const high = createSolarSystem(getPerformanceProfile({ width: 1440, reducedMotion: false }))
  const highCore = high.targets.get('core').visuals
  const highSurface = highCore.getObjectByName('core-surface')
  const prominences = highCore.getObjectByName('core-prominences')
  assert.ok(prominences)
  assert.equal(prominences.children.length, 3)
  const prominenceTriangles = prominences.children.reduce((total, mesh) => total + (mesh.geometry.index?.count || 0) / 3, 0)
  assert.ok(prominenceTriangles > 0 && prominenceTriangles < 1000)

  const before = highSurface.material.uniforms.time.value
  high.update(.05, true)
  assert.ok(highSurface.material.uniforms.time.value > before)
  const frozen = highSurface.material.uniforms.time.value
  high.update(.05, false)
  assert.equal(highSurface.material.uniforms.time.value, frozen)

  const low = createSolarSystem(getPerformanceProfile({ width: 390, reducedMotion: false }))
  assert.equal(low.targets.get('core').visuals.getObjectByName('core-prominences'), undefined)

  for (const system of [high, low]) {
    system.dispose()
    const scene = new Scene(); scene.add(system.group)
    disposeScene(scene, { dispose() {}, forceContextLoss() {}, domElement: { remove() {} } })
  }
})


test('G2R.5 star tiers provide deterministic visual variety with bounded geometry/draw calls', () => {
  const fullProfile = getPerformanceProfile({ width: 1440, deviceMemory: 8, hardwareConcurrency: 8 })
  const lowProfile = getPerformanceProfile({ width: 390, coarsePointer: true })
  const high = createStarField(fullProfile), low = createStarField(lowProfile)
  assert.equal(STAR_DEPTH_TIERS.length, 3)
  for (const field of [high, low]) {
    assert.equal(field.group.children.length, 3, 'existing three draw calls remain')
    field.group.children.forEach((points, index) => {
      const geometry = points.geometry
      assert.equal(geometry.attributes.position.count, (field === high ? fullProfile : lowProfile).starCounts[index])
      assert.equal(geometry.attributes.starColor.count, geometry.attributes.position.count)
      assert.equal(geometry.attributes.brightness.count, geometry.attributes.position.count)
      assert.ok(Number.isFinite(STAR_DEPTH_TIERS[index].follow))
      assert.match(points.material.vertexShader, /attribute vec3 starColor/)
      assert.match(points.material.fragmentShader, /smoothstep/)
      for (const v of geometry.attributes.starColor.array) assert.ok(v >= 0 && v <= 1)
    })
    const scene = new Scene()
    scene.add(field.group)
    disposeScene(scene, { dispose() {}, forceContextLoss() {}, domElement: { remove() {} } })
  }
})

test('G2R.5 near/mid/far parallax tracks camera without ambient drift in reduced motion', () => {
  const field = createStarField(getPerformanceProfile({ width: 1440, reducedMotion: true }))
  const layers = field.group.children
  const camera = new Vector3(12, 6, -9)
  field.update(.05, camera, false)
  for (let i = 0; i < layers.length; i++) {
    assert.ok(layers[i].position.distanceTo(camera.clone().multiplyScalar(STAR_DEPTH_TIERS[i].follow)) < 1e-10)
    assert.equal(layers[i].rotation.y, 0, 'ambient drift must freeze')
  }
  const moved = new Vector3(-8, 3, 16)
  field.update(.05, moved, false)
  assert.equal(layers[0].position.length(), 0, 'near world-anchored layer has strongest relative parallax')
  assert.ok(layers[2].position.distanceTo(moved) < layers[1].position.distanceTo(moved))
  assert.ok(layers.every(layer => layer.rotation.y === 0))
  field.update(.05, moved, true)
  assert.notEqual(layers[0].rotation.y, 0)
  assert.notEqual(layers[1].rotation.y, 0)
  assert.notEqual(layers[2].rotation.y, 0)
  field.update(Number.NaN, moved, true)
  assert.ok(layers.every(layer => Number.isFinite(layer.rotation.y)))
  const scene = new Scene()
  scene.add(field.group)
  disposeScene(scene, { dispose() {}, forceContextLoss() {}, domElement: { remove() {} } })
})


test('G2R.7 keeps the distant black hole inside swept desktop and mobile overviews', () => {
  for (const [width, height] of [[1360, 630], [1200, 530], [346, 494]]) {
    const view = getOverview(width, height)
    const hole = projectOverview(BLACK_HOLE.position, view)
    const apparentRadius = BLACK_HOLE.radius * 2.2 * (view.portrait ? SOLAR_STYLE.mobileBodyScale : 1)
    assert.ok(Math.abs(hole.x) + apparentRadius / (hole.depth * view.tanX) < .95)
    assert.ok(Math.abs(hole.y) + apparentRadius / (hole.depth * view.tanY) < .95)
  }
  const low = createSolarSystem(getPerformanceProfile({ width: 390, reducedMotion: true }))
  assert.equal(low.targets.size, 7)
  assert.ok(low.targets.get(BLACK_HOLE.id).visuals.getObjectByName('black-hole-event-horizon'))
  assert.ok(low.hitMeshes.some(mesh => mesh.userData.bodyId === BLACK_HOLE.id))
  const scene = new Scene()
  scene.add(low.group)
  low.dispose()
  disposeScene(scene, { dispose() {}, forceContextLoss() {}, domElement: { remove() {} } })
})
