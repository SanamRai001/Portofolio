import test from 'node:test'
import assert from 'node:assert/strict'

import {
  UNSAFE_PRIVILEGED_SEED_EMAILS,
  deactivateUnsafeSeedPrivilegedAccounts,
} from './deactivateUnsafeSeedUsers.js'

test('deactivateUnsafeSeedPrivilegedAccounts targets only known privileged seed accounts', async () => {
  const calls = []

  const summary = await deactivateUnsafeSeedPrivilegedAccounts({
    UserModel: {
      updateMany: async (...args) => {
        calls.push(args)
        return { matchedCount: 2, modifiedCount: 2 }
      },
    },
  })

  assert.deepEqual(summary, {
    matchedCount: 2,
    modifiedCount: 2,
  })

  assert.deepEqual(calls, [[
    {
      email: { $in: UNSAFE_PRIVILEGED_SEED_EMAILS },
      role: { $in: ['admin', 'super_admin'] },
      is_active: { $ne: false },
    },
    {
      $set: { is_active: false },
    },
  ]])
})

test('cleanup is idempotent when there is nothing active to change', async () => {
  const summary = await deactivateUnsafeSeedPrivilegedAccounts({
    UserModel: {
      updateMany: async () => ({ matchedCount: 0, modifiedCount: 0 }),
    },
  })

  assert.deepEqual(summary, {
    matchedCount: 0,
    modifiedCount: 0,
  })
})
