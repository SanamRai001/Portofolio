import test from 'node:test'
import assert from 'node:assert/strict'
import { Raycaster, Scene, Vector2, Vector3 } from 'three'
import { SYSTEM_MAP, PLANETS } from './data/solarSystem.js'
import { createNavigationController, orbitRateTarget } from './navigation/NavigationController.js'
import { attachPointerInteractions } from './navigation/InteractionController.js'
import { createCameraRig, CAMERA_CLEARANCE } from './scene/CameraRig.js'
import { createSolarSystem } from './scene/SolarSystem.js'
import { createOrbitSimulation } from './utils/orbits.js'
import { createRenderLoop } from './utils/renderLoop.js'
import { disposeScene } from './utils/disposeScene.js'

const release = system => { const scene = new Scene(); scene.add(system.group); disposeScene(scene, { dispose() {}, forceContextLoss() {}, domElement: { remove() {} } }) }

test('latest selection wins; stale completions and invalid ids cannot corrupt navigation', () => {
  const nav = createNavigationController(), snapshots = []
  const unsubscribe = nav.subscribe(() => snapshots.push(nav.getSnapshot()))
  nav.focusBody('missing'); nav.goBack()
  assert.equal(snapshots.length, 0)
  nav.focusBody('identity')
  const first = nav.getSnapshot().transitionId
  nav.focusBody('projects'); nav.focusBody('journey'); nav.focusBody('core')
  nav.complete(first)
  assert.equal(nav.getSnapshot().mode, 'focusing_body')
  assert.equal(nav.getSnapshot().selectedBodyId, 'core')
  nav.complete(nav.getSnapshot().transitionId)
  assert.equal(nav.getSnapshot().mode, 'body_focused')
  nav.goBack()
  const returning = nav.getSnapshot().transitionId
  assert.equal(nav.getSnapshot().previousBodyId, 'core')
  nav.focusBody('lab'); nav.complete(returning)
  assert.equal(nav.getSnapshot().selectedBodyId, 'lab')
  nav.goBack(); nav.complete(nav.getSnapshot().transitionId)
  assert.equal(nav.getSnapshot().mode, 'overview')
  const count = snapshots.length
  unsubscribe(); nav.focusBody('projects')
  assert.equal(snapshots.length, count)
})

test('hover sources, selected priority and eased orbit recovery preserve immutable base speeds', () => {
  const nav = createNavigationController(), simulation = createOrbitSimulation(PLANETS)
  nav.setHover('identity'); nav.setHover('skills', 'keyboard'); nav.setHover(null)
  assert.equal(nav.getSnapshot().hoveredBodyId, 'skills')
  assert.equal(orbitRateTarget('skills', nav.getSnapshot()), .45)
  nav.focusBody('skills')
  assert.equal(orbitRateTarget('skills', nav.getSnapshot()), 0)
  const before = simulation.position('skills')
  simulation.setRate('skills', 0)
  assert.deepEqual(simulation.position('skills'), before)
  simulation.update(.05)
  assert.ok(simulation.rate('skills') > 0 && simulation.rate('skills') < 1)
  for (let i = 0; i < 60; i++) simulation.update(.05)
  assert.equal(simulation.rate('skills'), 0)
  assert.equal(simulation.rate('projects'), 1)
  const frozen = simulation.position('skills')
  simulation.update(.05)
  assert.deepEqual(simulation.position('skills'), frozen)
  nav.goBack()
  assert.equal(orbitRateTarget('skills', nav.getSnapshot()), 1)
  simulation.setRate('skills', 1); simulation.update(.05)
  assert.ok(simulation.rate('skills') > 0 && simulation.rate('skills') < 1)
  assert.equal(PLANETS.find(body => body.id === 'skills').orbit.speed, .024)
})

function rigHarness(width, height, reducedMotion = false) {
  const nav = createNavigationController(), system = createSolarSystem({ lowPower: true })
  const rig = createCameraRig({ getAnchor: system.getAnchor, onComplete: nav.complete, reducedMotion })
  rig.resize(width, height); system.resize(width / height < .85)
  let sequence = -1
  nav.subscribe(() => {
    const state = nav.getSnapshot()
    system.setInteraction(state, reducedMotion)
    if (state.transitionId !== sequence) { sequence = state.transitionId; rig.navigate(state) }
  })
  return { nav, system, rig, step(animate = true) { system.update(1 / 60, animate && !reducedMotion); rig.update(1 / 60) } }
}

test('camera paths remain above swept geometry for all targets, mobile, and interrupted flights', () => {
  for (const [width, height] of [[1360,630], [1200,530], [346,494]]) {
    const h = rigHarness(width, height)
    for (let phase = 0; phase < 4; phase++) {
      for (let t = 0; t < 700; t++) h.system.update(.05)
      for (const body of SYSTEM_MAP) {
        h.nav.focusBody(body.id)
        for (let i = 0; i < 85; i++) {
          h.step()
          assert.ok(h.rig.camera.position.y >= CAMERA_CLEARANCE - 1e-8)
          assert.ok([...h.rig.camera.position, ...h.rig.target, h.rig.camera.fov].every(Number.isFinite))
        }
        assert.equal(h.nav.getSnapshot().mode, 'body_focused')
        const anchor = h.system.getAnchor(body.id, new Vector3())
        assert.ok(h.rig.target.distanceTo(anchor) < 1e-8)
        if (body.orbit) {
          const offset = h.rig.camera.position.clone().sub(anchor)
          assert.ok(offset.x * -anchor.x + offset.z * -anchor.z > 0, 'focus faces the illuminated hemisphere')
        }
        const extent = body.radius * (body.ring?.[1] || 1.12) * (body.orbit && width / height < .85 ? 1.28 : 1)
        const distance = h.rig.camera.position.distanceTo(anchor)
        const apparent = extent / (distance * Math.tan(h.rig.camera.fov * Math.PI / 360))
        assert.ok(apparent < .82 && apparent > .15, body.id + ' focus size')
        // Camera tracks even if a later phase resumes the selected object.
        h.system.simulation.setRate(body.id, 1); h.step()
        assert.ok(h.rig.target.distanceTo(h.system.getAnchor(body.id, new Vector3())) < 1e-8)
      }
    }
    for (const body of SYSTEM_MAP) {
      const start = h.rig.camera.position.clone()
      h.nav.focusBody(body.id)
      assert.ok(h.rig.camera.position.distanceTo(start) < 1e-8, 'retarget never jumps')
      for (let i = 0; i < 5; i++) h.step()
    }
    h.nav.goBack()
    for (let i = 0; i < 85; i++) h.step()
    assert.equal(h.nav.getSnapshot().mode, 'overview')
    assert.ok(h.rig.target.length() < 1e-8)
    release(h.system)
  }
})

test('reduced motion snaps safely and paused orbits still allow camera travel and resize', () => {
  const reduced = rigHarness(346, 494, true)
  reduced.nav.focusBody('projects')
  assert.equal(reduced.nav.getSnapshot().mode, 'body_focused')
  assert.equal(reduced.rig.travelling, false)
  assert.equal(reduced.rig.camera.fov, 58)
  reduced.nav.goBack()
  assert.equal(reduced.nav.getSnapshot().mode, 'overview')
  release(reduced.system)
  const h = rigHarness(1360, 630)
  const position = h.system.simulation.position('journey')
  h.nav.focusBody('journey')
  for (let i = 0; i < 10; i++) h.step(false)
  h.rig.resize(346, 494)
  for (let i = 0; i < 85; i++) h.step(false)
  assert.equal(h.nav.getSnapshot().mode, 'body_focused')
  assert.deepEqual(h.system.simulation.position('journey'), position)
  assert.ok(h.rig.target.distanceTo(h.system.getAnchor('journey', new Vector3())) < 1e-8)
  release(h.system)
})

test('separate hit meshes are selectable but excluded from rendering; anchors move with roots', () => {
  const system = createSolarSystem({ lowPower: true }), rig = createCameraRig()
  system.group.updateMatrixWorld(true); rig.camera.updateMatrixWorld()
  const raycaster = new Raycaster(); raycaster.layers.set(1)
  for (const body of SYSTEM_MAP) {
    const entry = system.targets.get(body.id)
    assert.notEqual(entry.visuals, entry.interactionMesh)
    assert.notEqual(entry.focusAnchor, entry.interactionMesh)
    assert.equal(rig.camera.layers.test(entry.interactionMesh.layers), false)
    const point = entry.focusAnchor.getWorldPosition(new Vector3()).project(rig.camera)
    raycaster.setFromCamera(new Vector2(point.x, point.y), rig.camera)
    assert.equal(raycaster.intersectObjects(system.hitMeshes, false)[0].object.userData.bodyId, body.id)
  }
  release(system)
})

function pointerHarness() {
  const mount = new EventTarget(); mount.style = { cursor: '' }
  const nav = createNavigationController()
  const controller = attachPointerInteractions(mount, { navigation: nav, pick: x => x < 100 ? 'projects' : null, invalidate() {} })
  function emit(type, overrides = {}) {
    const event = new Event(type, { cancelable: true })
    Object.assign(event, { pointerId: 1, pointerType: 'touch', button: 0, clientX: 30, clientY: 30, isPrimary: true, ...overrides })
    mount.dispatchEvent(event)
    assert.equal(event.defaultPrevented, false)
  }
  return { mount, nav, controller, emit }
}

test('taps select; drags, long movement back, multitouch and cancellation do not; cleanup is idempotent', () => {
  const h = pointerHarness()
  for (const sequence of [
    ['pointerdown', 'pointermove', 'pointerup'],
    ['pointerdown', 'pointercancel', 'pointerup'],
    ['pointerdown', 'pointerleave', 'pointerup'],
  ]) {
    for (const type of sequence) h.emit(type, type === 'pointermove' ? { clientX: 60 } : {})
    assert.equal(h.nav.getSnapshot().selectedBodyId, null)
  }
  h.emit('pointerdown'); h.emit('pointerdown', { pointerId: 2, isPrimary: false })
  h.emit('pointerup', { pointerId: 2 }); h.emit('pointerup')
  assert.equal(h.nav.getSnapshot().selectedBodyId, null)
  h.emit('pointerdown'); h.emit('pointerup')
  assert.equal(h.nav.getSnapshot().selectedBodyId, 'projects')
  h.nav.goBack()
  h.emit('pointermove', { pointerType: 'mouse' })
  assert.equal(h.mount.style.cursor, 'pointer')
  assert.equal(h.nav.getSnapshot().hoveredBodyId, 'projects')
  h.controller.dispose(); h.controller.dispose()
  assert.equal(h.mount.style.cursor, '')
  assert.equal(h.nav.getSnapshot().hoveredBodyId, null)
  h.emit('pointerdown'); h.emit('pointerup')
  assert.equal(h.nav.getSnapshot().selectedBodyId, null)
})

test('frequent pointer invalidation cannot starve the continuous animation clock', () => {
  const frames = new Map(), deltas = []; let id = 0
  const loop = createRenderLoop({ render: d => deltas.push(d), requestFrame: cb => { frames.set(++id, cb); return id }, cancelFrame: key => frames.delete(key) })
  for (let time = 0; time < 100; time += 17) {
    loop.setState({ active: true, continuous: true }); loop.invalidate()
    const pending = [...frames.values()]; frames.clear(); pending.forEach(cb => cb(time))
    assert.equal(frames.size, 1)
  }
  assert.ok(deltas.slice(1).every(delta => delta > 0))
  loop.dispose()
})

test('Core reserves copy space, resizes into a stacked composition and clears its projection on retarget', () => {
  for (const reduced of [false, true]) {
    const h = rigHarness(1360, 630, reduced)
    h.nav.focusBody('core')
    for (let i = 0; i < 85; i++) h.step()
    h.rig.camera.updateMatrixWorld()
    const point = h.system.getAnchor('core', new Vector3()).project(h.rig.camera)
    assert.ok(Math.abs(point.x + .46) < 1e-8)
    assert.ok(Math.abs(point.y) < 1e-8)
    h.rig.resize(346, 320, 390)
    h.rig.camera.updateMatrixWorld()
    const mobile = h.system.getAnchor('core', new Vector3()).project(h.rig.camera)
    assert.ok(Math.abs(mobile.x) < 1e-8 && Math.abs(mobile.y + .2) < 1e-8)
    h.nav.focusBody('identity')
    for (let i = 0; i < 85; i++) h.step()
    assert.equal(h.rig.camera.view?.enabled, false)
    h.nav.focusBody('core'); h.step(); h.nav.goBack()
    for (let i = 0; i < 85; i++) h.step()
    assert.equal(h.rig.camera.view?.enabled, false)
    assert.equal(h.nav.getSnapshot().mode, 'overview')
    release(h.system)
  }
})
