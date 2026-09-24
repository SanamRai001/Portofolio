import test from 'node:test'
import assert from 'node:assert/strict'

import { persistLegacyPasswordUpgrade } from './passwordUpgrade.js'

test('persistLegacyPasswordUpgrade hashes and conditionally persists the legacy password', async () => {
  const calls = []

  const result = await persistLegacyPasswordUpgrade({
    id: 'user-1',
    storedPassword: 'legacy-password',
    plainPassword: 'legacy-password',
    hash: async (value) => `hash:${value}`,
    updatePassword: async (payload) => {
      calls.push(payload)
      return { modifiedCount: 1 }
    },
  })

  assert.equal(result, true)
  assert.deepEqual(calls, [{
    id: 'user-1',
    expectedPassword: 'legacy-password',
    nextPassword: 'hash:legacy-password',
  }])
})

test('persistLegacyPasswordUpgrade fails closed when the conditional write does not persist', async () => {
  await assert.rejects(
    persistLegacyPasswordUpgrade({
      id: 'user-1',
      storedPassword: 'legacy-password',
      plainPassword: 'legacy-password',
      hash: async () => 'hashed-password',
      updatePassword: async () => ({ modifiedCount: 0 }),
    }),
    /not persisted/,
  )
})
