import test from 'node:test'
import assert from 'node:assert/strict'

import { formatPublicRequestLog } from './requestLog.js'

test('public request logs contain operational data without visitor IPs or query values', () => {
  const log = formatPublicRequestLog({
    method: 'GET',
    path: '/api/projects/',
    statusCode: 200,
    durationMs: 12.7,
  })

  assert.equal(log, '[LOG] GET /api/projects/ | 200 | 13ms')
  assert.equal(log.includes('127.0.0.1'), false)
  assert.equal(log.includes('?'), false)
})
