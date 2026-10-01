import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createPortalController, PORTAL_PHASES, PORTAL_TIMING, validatePortalDestination,
} from './navigation/PortalController.js'
import { createNavigationController } from './navigation/NavigationController.js'

function advanceTo(controller, desired) {
  for (let i = 0; i < 120 && controller.getSnapshot().mode !== desired; i++) {
    controller.advance(.05)
  }
  assert.equal(controller.getSnapshot().mode, desired)
}

test('G2R.8A portal accepts only an arrived black-hole target and a local destination', () => {
  for (const bad of ['', 'https://example.org', '//evil.org', 'javascript:alert(1)',
    '\\\\evil.org', '/lab?redirect=https://evil.org', null, 5]) {
    assert.throws(() => validatePortalDestination(bad), /local pathname/)
  }
  for (const valid of ['/', '/lab', '/work/galaxy']) assert.equal(validatePortalDestination(valid), valid)
  const commits = []
  const nav = createNavigationController()
  const portal = createPortalController({ destination: '/lab', onCommit: path => commits.push(path) })
  assert.equal(portal.begin(null, 'overview'), false)
  nav.focusBody('black-hole')
  assert.equal(portal.begin(nav.getSnapshot().selectedBodyId, nav.getSnapshot().mode), false, 'cannot start mid-flight')
  nav.complete(nav.getSnapshot().transitionId)
  assert.equal(portal.begin(nav.getSnapshot().selectedBodyId, nav.getSnapshot().mode), true)
  assert.equal(portal.getSnapshot().mode, PORTAL_PHASES.APPROACH)
  assert.equal(portal.begin('black-hole', 'body_focused'), false, 'only one active portal')
  assert.deepEqual(commits, [])
})

test('G2R.8A approach and plunge never commit a route until blackout is visibly acknowledged', () => {
  const commits = []
  const portal = createPortalController({ onCommit: destination => commits.push(destination) })
  const changes = []
  const unsubscribe = portal.subscribe(() => changes.push(portal.getSnapshot()))
  assert.equal(portal.begin('black-hole', 'body_focused'), true)
  const token = portal.getSnapshot().transitionId
  portal.advance(.05)
  assert.ok(portal.getMotion().progress > 0 && portal.getMotion().progress < 1)
  assert.equal(portal.confirmBlackout(token, true), false, 'premature cover acknowledgement cannot navigate')
  advanceTo(portal, PORTAL_PHASES.PLUNGE)
  assert.equal(portal.confirmBlackout(token, true), false)
  advanceTo(portal, PORTAL_PHASES.BLACKOUT)
  assert.equal(portal.getMotion().progress, 1)
  assert.deepEqual(commits, [])
  assert.equal(portal.confirmBlackout(token - 1, true), false, 'stale acknowledgement ignored')
  assert.equal(portal.confirmBlackout(token, false), false, 'non-opaque overlay is insufficient')
  assert.deepEqual(commits, [])
  assert.equal(portal.confirmBlackout(token, true), true)
  assert.deepEqual(commits, ['/'])
  assert.equal(portal.getSnapshot().mode, PORTAL_PHASES.COMMITTED)
  assert.equal(portal.confirmBlackout(token, true), false, 'commit cannot duplicate')
  assert.equal(portal.cancel(), false, 'commit cannot be undone')
  assert.deepEqual(changes.map(change => change.mode), ['approach', 'plunge', 'blackout', 'committed'])
  unsubscribe()
})

test('G2R.8A cancellation invalidates pending blackout and permits a new attempt', () => {
  const commits = []
  const portal = createPortalController({ onCommit: path => commits.push(path) })
  assert.equal(portal.begin('black-hole', 'body_focused'), true)
  const oldToken = portal.getSnapshot().transitionId
  advanceTo(portal, PORTAL_PHASES.BLACKOUT)
  assert.equal(portal.cancel(), true)
  assert.equal(portal.getSnapshot().mode, PORTAL_PHASES.IDLE)
  assert.equal(portal.confirmBlackout(oldToken, true), false)
  assert.equal(portal.begin('black-hole', 'body_focused'), true)
  const currentToken = portal.getSnapshot().transitionId
  assert.notEqual(currentToken, oldToken)
  assert.equal(portal.confirmBlackout(oldToken, true), false)
  advanceTo(portal, PORTAL_PHASES.BLACKOUT)
  assert.equal(portal.confirmBlackout(currentToken, true), true)
  assert.deepEqual(commits, ['/'])
})

test('G2R.8A reduced motion reaches blackout without a camera flight but still requires coverage', () => {
  const commits = []
  const portal = createPortalController({ destination: '/lab', onCommit: path => commits.push(path) })
  const changes = []
  portal.subscribe(() => changes.push(portal.getSnapshot().mode))
  assert.equal(portal.begin('black-hole', 'body_focused', { reduceMotion: true }), true)
  assert.deepEqual(changes, [PORTAL_PHASES.BLACKOUT])
  assert.equal(portal.getMotion().progress, 1)
  portal.advance(PORTAL_TIMING.approach + PORTAL_TIMING.plunge)
  assert.equal(portal.getSnapshot().mode, PORTAL_PHASES.BLACKOUT)
  assert.deepEqual(commits, [], 'no automatic commit during a reduced-motion blackout')
  const token = portal.getSnapshot().transitionId
  assert.equal(portal.confirmBlackout(token, true), true)
  assert.deepEqual(commits, ['/lab'])
})

test('G2R.8A phase clocks remain bounded under invalid and oversized deltas', () => {
  const portal = createPortalController()
  portal.begin('black-hole', 'body_focused')
  for (const delta of [Number.NaN, Infinity, -1, 0]) portal.advance(delta)
  assert.equal(portal.getMotion().progress, 0)
  portal.advance(1000)
  assert.ok(portal.getMotion().progress <= .05 / PORTAL_TIMING.approach + 1e-8)
  assert.equal(portal.getSnapshot().mode, PORTAL_PHASES.APPROACH)
})
