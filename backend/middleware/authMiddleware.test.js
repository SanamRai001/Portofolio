import test from 'node:test'
import assert from 'node:assert/strict'
import jwt from 'jsonwebtoken'

import {
  JWT_ALGORITHM,
  JWT_AUDIENCE,
  JWT_ISSUER,
} from '../config/authConfig.js'
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

const signTestToken = (overrides = {}) => {
  const {
    algorithm = JWT_ALGORITHM,
    audience = JWT_AUDIENCE,
    issuer = JWT_ISSUER,
  } = overrides

  return jwt.sign(
    { email: 'viewer@example.com' },
    process.env.JWT_SECRETKEY,
    {
      algorithm,
      audience,
      issuer,
      subject: 'user-1',
      expiresIn: '1h',
    },
  )
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

test('authenticate accepts a valid scoped JWT and exposes its payload', () => {
  process.env.JWT_SECRETKEY = 'test-secret'
  const token = signTestToken()

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
  assert.equal(req.user.sub, 'user-1')
  assert.equal(req.user.aud, JWT_AUDIENCE)
  assert.equal(req.user.iss, JWT_ISSUER)
})

test('authenticate rejects a token with the wrong audience', () => {
  process.env.JWT_SECRETKEY = 'test-secret'
  const token = signTestToken({ audience: 'other-client' })

  const req = {
    systemConfig: { auth: true },
    headers: { authorization: `Bearer ${token}` },
  }
  const res = createResponse()

  authenticate(req, res, () => {
    assert.fail('next should not be called')
  })

  assert.equal(res.statusCode, 401)
})

test('authenticate rejects a token signed with an unapproved algorithm', () => {
  process.env.JWT_SECRETKEY = 'test-secret'
  const token = signTestToken({ algorithm: 'HS384' })

  const req = {
    systemConfig: { auth: true },
    headers: { authorization: `Bearer ${token}` },
  }
  const res = createResponse()

  authenticate(req, res, () => {
    assert.fail('next should not be called')
  })

  assert.equal(res.statusCode, 401)
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
