import test from 'node:test'
import assert from 'node:assert/strict'

import { DEMO_VIEWER, seedDemoViewer } from './seedUser.js'

test('demo viewer seed matches the credentials shown in the login UI', () => {
  assert.deepEqual(DEMO_VIEWER, {
    id: 3,
    email: 'viewer@portfolio.dev',
    password: 'viewer123',
    role: 'viewer',
    is_active: true,
  })
})

test('seedDemoViewer upserts and reactivates the public viewer with a hashed password', async () => {
  const calls = []
  const fakeHash = '$2b$12$abcdefghijklmnopqrstuvwxyz012345678901234567890123456'

  const summary = await seedDemoViewer({
    hash: async password => {
      assert.equal(password, DEMO_VIEWER.password)
      return fakeHash
    },
    UserModel: {
      updateOne: async (...args) => {
        calls.push(args)
        return { matchedCount: 1, modifiedCount: 1, upsertedCount: 0 }
      },
    },
  })

  assert.deepEqual(calls, [[
    { email: DEMO_VIEWER.email },
    {
      $set: {
        id: DEMO_VIEWER.id,
        email: DEMO_VIEWER.email,
        password: fakeHash,
        role: 'viewer',
        is_active: true,
      },
    },
    { upsert: true },
  ]])

  assert.deepEqual(summary, {
    email: DEMO_VIEWER.email,
    matchedCount: 1,
    modifiedCount: 1,
    upsertedCount: 0,
  })

  assert.notEqual(calls[0][1].$set.password, DEMO_VIEWER.password)
})

test('seedDemoViewer reports a newly created viewer without changing the contract', async () => {
  const summary = await seedDemoViewer({
    hash: async () => '$2b$12$abcdefghijklmnopqrstuvwxyz012345678901234567890123456',
    UserModel: {
      updateOne: async () => ({ matchedCount: 0, modifiedCount: 0, upsertedCount: 1 }),
    },
  })

  assert.equal(summary.email, 'viewer@portfolio.dev')
  assert.equal(summary.upsertedCount, 1)
})
