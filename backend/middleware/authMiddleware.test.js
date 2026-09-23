import test from 'node:test'
import assert from 'node:assert/strict'
import jwt from 'jsonwebtoken'

import authenticate, { readBearerToken } from './authMiddleware.js'

const createResponse = () => {
  const response = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(body) {
      this.body = body
      return this
    },
  }

  return response
}

test('readBearerToken accepts only a valid Bearer header', () => {
  assert.equal(readBearerToken('Bearer abc.def.ghi'), 'abc.def.ghi')
  assert.equal(readBearerToken('bearer abc.def.ghi'), 'abc.def.ghi')
  assert.equal(readBearerToken('Basic abc.def.ghi'), null)
  assert.equal(readBearerToken('Bearer'), null)
  assert.equal(readBearerToken('Bearer token extra'), null)
  assert.equal(readBearerToken(undefined), null)
})

test('authenticate bypasses JWT verification when auth is disabled', () => {
  const req = { systemConfig: { auth: false }, headers: {} }
  const res = createResponse()
  let called = false

  authenticate(req, res, () => {
    called = true
  })

  assert.equal(called, true)
  assert.equal(res.statusCode, 200)
})

test('authenticate rejects a missing bearer token when auth is enabled', () => {
  process.env.JWT_SECRETKEY = 'test-secret'

  const req = { systemConfig: { auth: true }, headers: {} }
  const res = createResponse()

  authenticate(req, res, () => {
    assert.fail('next should not be called')
  })

  assert.equal(res.statusCode, 401)
  assert.equal(res.body.message, 'Authentication required')
})

test('authenticate accepts a valid JWT and exposes its payload', () => {
  process.env.JWT_SECRETKEY = 'test-secret'
  const token = jwt.sign({ email: 'viewer@example.com' }, process.env.JWT_SECRETKEY, { expiresIn: '1h' })

  const req = {
    systemConfig: { auth: true },
    headers: { authorization: `Bearer ${token}` },
  }
  const res = createResponse()
  let called = false

  authenticate(req, res, () => {
    called = true
  })

  assert.equal(called, true)
  assert.equal(req.user.email, 'viewer@example.com')
})

test('authenticate rejects an invalid JWT without exposing verification details', () => {
  process.env.JWT_SECRETKEY = 'test-secret'

  const req = {
    systemConfig: { auth: true },
    headers: { authorization: 'Bearer invalid-token' },
  }
  const res = createResponse()

  authenticate(req, res, () => {
    assert.fail('next should not be called')
  })

  assert.equal(res.statusCode, 401)
  assert.equal(res.body.message, 'Invalid or expired token')
})
