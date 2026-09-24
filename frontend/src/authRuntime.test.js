import test from 'node:test'
import assert from 'node:assert/strict'

import {
  deriveAuthRuntimeState,
  isUsableToken,
} from './authRuntime.js'

test('isUsableToken accepts a JWT-shaped token only', () => {
  assert.equal(isUsableToken('header.payload.signature'), true)
  assert.equal(isUsableToken(' header.payload.signature '), true)
  assert.equal(isUsableToken(''), false)
  assert.equal(isUsableToken('undefined'), false)
  assert.equal(isUsableToken('null'), false)
  assert.equal(isUsableToken('not-a-jwt'), false)
  assert.equal(isUsableToken(null), false)
})

test('unknown auth state does not show overlay or request projects yet', () => {
  assert.deepEqual(
    deriveAuthRuntimeState(undefined, null),
    {
      authKnown: false,
      canRequestProjects: false,
      hasToken: false,
      showAuthOverlay: false,
      suspendBackground: false,
    },
  )
})

test('auth disabled allows projects without a token', () => {
  const state = deriveAuthRuntimeState(false, null)

  assert.equal(state.authKnown, true)
  assert.equal(state.canRequestProjects, true)
  assert.equal(state.showAuthOverlay, false)
  assert.equal(state.suspendBackground, false)
})

test('auth enabled without a token owns the screen and blocks protected requests', () => {
  const state = deriveAuthRuntimeState(true, null)

  assert.equal(state.authKnown, true)
  assert.equal(state.hasToken, false)
  assert.equal(state.canRequestProjects, false)
  assert.equal(state.showAuthOverlay, true)
  assert.equal(state.suspendBackground, true)
})

test('auth enabled with a JWT-shaped token allows protected requests and background runtime', () => {
  const state = deriveAuthRuntimeState(true, 'header.payload.signature')

  assert.equal(state.authKnown, true)
  assert.equal(state.hasToken, true)
  assert.equal(state.canRequestProjects, true)
  assert.equal(state.showAuthOverlay, false)
  assert.equal(state.suspendBackground, false)
})

test('invalid stored token sentinels are treated as missing', () => {
  for (const token of ['', 'undefined', 'null', 'garbage']) {
    const state = deriveAuthRuntimeState(true, token)

    assert.equal(state.hasToken, false)
    assert.equal(state.canRequestProjects, false)
    assert.equal(state.showAuthOverlay, true)
  }
})
