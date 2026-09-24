import test from 'node:test'
import assert from 'node:assert/strict'

import { parseSystemConfigUpdate } from './systemConfigInput.js'

test('accepts a partial boolean system config update', () => {
  assert.deepEqual(
    parseSystemConfigUpdate({ cache: true, logging: false }),
    {
      ok: true,
      data: {
        cache: true,
        logging: false,
      },
    },
  )
})

test('rejects an empty config update', () => {
  assert.equal(parseSystemConfigUpdate({}).ok, false)
})

test('rejects unknown system fields', () => {
  const result = parseSystemConfigUpdate({
    auth: true,
    updatedAt: 'forged',
  })

  assert.equal(result.ok, false)
  assert.match(result.message, /updatedAt/)
})

test('rejects non-boolean toggle values', () => {
  const result = parseSystemConfigUpdate({ db: 'true' })

  assert.equal(result.ok, false)
  assert.match(result.message, /db/)
})
