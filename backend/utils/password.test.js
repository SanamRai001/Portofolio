import test from 'node:test'
import assert from 'node:assert/strict'

import {
  hashPassword,
  isBcryptHash,
  verifyStoredPassword,
} from './password.js'

test('hashPassword stores a bcrypt hash instead of plaintext', async () => {
  const password = 'Viewer@123#'
  const hash = await hashPassword(password)

  assert.notEqual(hash, password)
  assert.equal(isBcryptHash(hash), true)
})

test('verifyStoredPassword validates a bcrypt hash', async () => {
  const password = 'Viewer@123#'
  const hash = await hashPassword(password)

  assert.deepEqual(
    await verifyStoredPassword(password, hash),
    { valid: true, needsUpgrade: false },
  )

  assert.deepEqual(
    await verifyStoredPassword('wrong-password', hash),
    { valid: false, needsUpgrade: false },
  )
})

test('verifyStoredPassword marks a valid legacy plaintext password for upgrade', async () => {
  assert.deepEqual(
    await verifyStoredPassword('legacy-password', 'legacy-password'),
    { valid: true, needsUpgrade: true },
  )
})

test('verifyStoredPassword rejects an invalid legacy plaintext password', async () => {
  assert.deepEqual(
    await verifyStoredPassword('wrong-password', 'legacy-password'),
    { valid: false, needsUpgrade: false },
  )
})
