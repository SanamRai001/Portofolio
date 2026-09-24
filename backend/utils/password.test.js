import test from 'node:test'
import assert from 'node:assert/strict'

import {
  hashPassword,
  isBcryptHash,
  verifyPassword,
} from './password.js'

test('hashPassword stores a bcrypt hash instead of plaintext', async () => {
  const password = 'viewer123'
  const hash = await hashPassword(password)

  assert.notEqual(hash, password)
  assert.equal(isBcryptHash(hash), true)
})

test('verifyPassword validates only bcrypt-backed credentials', async () => {
  const password = 'viewer123'
  const hash = await hashPassword(password)

  assert.equal(await verifyPassword(password, hash), true)
  assert.equal(await verifyPassword('wrong-password', hash), false)
})

test('verifyPassword rejects plaintext stored values', async () => {
  assert.equal(
    await verifyPassword('legacy-password', 'legacy-password'),
    false,
  )
})
