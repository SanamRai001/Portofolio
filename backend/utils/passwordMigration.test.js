import test from 'node:test'
import assert from 'node:assert/strict'

import {
  findLegacyPasswordUsers,
  migrateLegacyPasswords,
} from './passwordMigration.js'

test('findLegacyPasswordUsers selects only non-bcrypt password records', () => {
  const users = [
    { _id: '1', password: 'plaintext-one' },
    { _id: '2', password: '$2b$12$abcdefghijklmnopqrstuv012345678901234567890123456789' },
    { _id: '3', password: '' },
    { _id: '4' },
    { _id: '5', password: 'plaintext-two' },
  ]

  assert.deepEqual(
    findLegacyPasswordUsers(users).map((user) => user._id),
    ['1', '5'],
  )
})

test('dry-run reports legacy records without writing or hashing', async () => {
  let updateCalls = 0
  let hashCalls = 0

  const summary = await migrateLegacyPasswords({
    users: [
      { _id: '1', password: 'plaintext' },
      { _id: '2', password: '$2b$12$abcdefghijklmnopqrstuv012345678901234567890123456789' },
    ],
    dryRun: true,
    hash: async () => {
      hashCalls += 1
      return 'hash'
    },
    updatePassword: async () => {
      updateCalls += 1
      return { modifiedCount: 1 }
    },
  })

  assert.deepEqual(summary, {
    scanned: 2,
    legacy: 1,
    migrated: 0,
    conflicts: 0,
    skipped: 1,
    dryRun: true,
  })
  assert.equal(hashCalls, 0)
  assert.equal(updateCalls, 0)
})

test('apply mode hashes plaintext users and performs conditional updates', async () => {
  const calls = []

  const summary = await migrateLegacyPasswords({
    users: [
      { _id: '1', password: 'alpha' },
      { _id: '2', password: 'beta' },
    ],
    dryRun: false,
    hash: async (value) => `hashed:${value}`,
    updatePassword: async (payload) => {
      calls.push(payload)
      return { modifiedCount: payload.id === '1' ? 1 : 0 }
    },
  })

  assert.deepEqual(calls, [
    {
      id: '1',
      expectedPassword: 'alpha',
      nextPassword: 'hashed:alpha',
    },
    {
      id: '2',
      expectedPassword: 'beta',
      nextPassword: 'hashed:beta',
    },
  ])

  assert.deepEqual(summary, {
    scanned: 2,
    legacy: 2,
    migrated: 1,
    conflicts: 1,
    skipped: 0,
    dryRun: false,
  })
})
