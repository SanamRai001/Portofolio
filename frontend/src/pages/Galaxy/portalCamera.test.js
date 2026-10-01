import test from 'node:test'
import assert from 'node:assert/strict'
import { PerspectiveCamera, Vector3 } from 'three'
import { BLACK_HOLE } from './data/solarSystem.js'
import { createPortalCameraMotion } from './scene/PortalCameraMotion.js'
import { PORTAL_PHASES } from './navigation/PortalController.js'

test('G2R.8B uses the existing camera, approaches the black-hole anchor and plunges only after approach', () => {
  const camera = new PerspectiveCamera(40, 1.5, .1, 650)
  camera.position.set(9, 6, 13)
  const anchor = new Vector3(...BLACK_HOLE.position)
  const start = camera.position.clone(), initialDistance = start.distanceTo(anchor)
  const calls = []
  const motion = createPortalCameraMotion(camera, (id, point) => {
    assert.equal(id, BLACK_HOLE.id)
    calls.push(id)
    return point.copy(anchor)
  })
  assert.equal(motion.apply({ mode: PORTAL_PHASES.IDLE, progress: 0 }), false)
  assert.deepEqual(camera.position.toArray(), start.toArray())
  assert.equal(motion.apply({ mode: PORTAL_PHASES.APPROACH, progress: 0 }), true)
  assert.ok(camera.position.distanceTo(start) < 1e-8)
  motion.apply({ mode: PORTAL_PHASES.APPROACH, progress: .5 })
  const midway = camera.position.distanceTo(anchor)
  assert.ok(midway < initialDistance && midway > BLACK_HOLE.radius * 3.8)
  motion.apply({ mode: PORTAL_PHASES.APPROACH, progress: 1 })
  const nearDistance = camera.position.distanceTo(anchor)
  assert.ok(nearDistance > BLACK_HOLE.radius * 2.2)
  motion.apply({ mode: PORTAL_PHASES.PLUNGE, progress: .5 })
  assert.ok(camera.position.distanceTo(anchor) < nearDistance)
  assert.ok(camera.fov > 40)
  motion.apply({ mode: PORTAL_PHASES.BLACKOUT, progress: 1 })
  assert.ok(camera.position.distanceTo(anchor) < .1, 'camera only penetrates close to horizon under blackout')
  assert.equal(camera.fov, 84)
  assert.ok(calls.length >= 4)
})

test('G2R.8B cancellation resets portal camera ownership; reduced blackout has no forced camera flight', () => {
  const camera = new PerspectiveCamera(42, 1, .1, 650)
  camera.position.set(2, 8, 11)
  const baseline = camera.position.clone()
  const anchor = new Vector3(...BLACK_HOLE.position)
  const motion = createPortalCameraMotion(camera, (_id, point) => point.copy(anchor))
  assert.equal(motion.apply({ mode: PORTAL_PHASES.BLACKOUT, progress: 1 }), false)
  assert.deepEqual(camera.position.toArray(), baseline.toArray())
  motion.apply({ mode: PORTAL_PHASES.APPROACH, progress: .7 })
  const progressed = camera.position.clone()
  assert.ok(progressed.distanceTo(baseline) > 1)
  motion.apply({ mode: PORTAL_PHASES.IDLE, progress: 0 })
  // CameraRig normally owns returning motion after portal cancellation.
  // Its latest position must become the next session's starting point.
  camera.position.set(4, 7, 13)
  const retry = camera.position.clone()
  motion.apply({ mode: PORTAL_PHASES.APPROACH, progress: 0 })
  assert.ok(camera.position.distanceTo(retry) < 1e-8)
  motion.apply({ mode: PORTAL_PHASES.APPROACH, progress: NaN })
  assert.ok([...camera.position, camera.fov].every(Number.isFinite))
})
