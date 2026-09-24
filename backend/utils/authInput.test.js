import test from 'node:test'
import assert from 'node:assert/strict'

import {
  LOGIN_EMAIL_MAX_LENGTH,
  LOGIN_PASSWORD_MAX_LENGTH,
} from '../config/authConfig.js'
import { normalizeLoginInput } from './authInput.js'

test('normalizeLoginInput trims surrounding email whitespace', () => {
  assert.deepEqual(
    normalizeLoginInput('  Viewer@gmail.com  ', 'Viewer@123#'),
    {
      email: 'Viewer@gmail.com',
      password: 'Viewer@123#',
    },
  )
})

test('normalizeLoginInput rejects missing and non-string credentials', () => {
  assert.equal(normalizeLoginInput(undefined, 'password'), null)
  assert.equal(normalizeLoginInput('viewer@example.com', undefined), null)
  assert.equal(normalizeLoginInput('', 'password'), null)
  assert.equal(normalizeLoginInput('viewer@example.com', ''), null)
})

test('normalizeLoginInput rejects oversized credentials', () => {
  assert.equal(
    normalizeLoginInput('a'.repeat(LOGIN_EMAIL_MAX_LENGTH + 1), 'password'),
    null,
  )
  assert.equal(
    normalizeLoginInput('viewer@example.com', 'p'.repeat(LOGIN_PASSWORD_MAX_LENGTH + 1)),
    null,
  )
})
