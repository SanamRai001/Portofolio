import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import systemRoutes from '../routes/SystemRoutes.js'
import logRoutes from '../routes/LogRoutes.js'
import systemMiddleware from '../middleware/systemMiddleware.js'
import loggingMiddleware from '../middleware/loggingMiddleware.js'
import authenticate from '../middleware/authMiddleware.js'
import { createDemoStore, PUBLIC_DEMO_CONFIG } from './demoSessions.js'

test('session storage is bounded, expiring and creates independent state', () => {
  let time = 100
  const store = createDemoStore({ now: () => time, ttl: 50, capacity: 2 })
  const a = store.create()
  const b = store.create()
  assert.notEqual(a.id, b.id)
  a.flags.auth = true
  a.logs.push('first')
  a.cache = { projects: [1] }
  assert.deepEqual(b.flags, PUBLIC_DEMO_CONFIG)
  assert.deepEqual(b.logs, [])
  assert.equal(b.cache, null)
  assert.equal(store.create(), null)
  assert.equal(store.get('forged'), null)
  time += 50
  assert.equal(store.get(a.id), null)
  assert.ok(store.create())
})

test('HTTP demo sessions isolate config, authentication and request logs', async t => {
  const app = express()
  app.use(express.json())
  app.use('/api', systemRoutes)
  app.use('/api/logs', logRoutes)
  // Actual middleware, deterministic public read fixture; no DB or production access.
  app.get('/api/projects', systemMiddleware, authenticate, loggingMiddleware,
    (req,res) => res.json({ flags: req.systemConfig }))
  const server = app.listen(0, '127.0.0.1')
  t.after(() => new Promise(resolve => server.close(resolve)))
  if (!server.listening) await new Promise(resolve => server.once('listening', resolve))
  const base = 'http://127.0.0.1:' + server.address().port
  const request = async (path, id, body) => {
    const response = await fetch(base+path, {
      method: body ? 'POST' : 'GET',
      headers: { ...(id ? {'x-demo-session':id} : {}), ...(body ? {'content-type':'application/json'} : {}) },
      ...(body ? {body:JSON.stringify(body)} : {}),
    })
    return {status:response.status, body:await response.json(), cache:response.headers.get('cache-control')}
  }
  const a = (await request('/api/system')).body.demoSession
  const b = (await request('/api/system')).body.demoSession
  assert.notEqual(a,b)
  assert.equal((await request('/api/system',null,{auth:true})).status,409)
  assert.equal((await request('/api/system','f'.repeat(64),{auth:true})).status,409)
  assert.equal((await request('/api/system',a,{unknown:true})).status,400)
  assert.equal((await request('/api/system',a,{logging:true,cache:true})).status,200)
  assert.equal((await request('/api/projects',a)).body.flags.cache,true)
  assert.equal((await request('/api/projects',b)).body.flags.cache,false)
  assert.deepEqual((await request('/api/system',b)).body.data,PUBLIC_DEMO_CONFIG)
  assert.equal((await request('/api/logs',a)).body.data.length,1)
  assert.deepEqual((await request('/api/logs',b)).body.data,[])
  assert.equal((await request('/api/logs')).status,409)
  assert.equal((await request('/api/system',a,{auth:true})).body.data.auth,true)
  // Missing auth secret returns 500; with secret it returns 401. Neither permits access.
  assert.ok([401,500].includes((await request('/api/projects',a)).status))
  assert.equal((await request('/api/projects',b)).status,200)
  assert.equal((await request('/api/projects')).status,200)
  assert.equal((await request('/api/projects','f'.repeat(64))).status,409)
  assert.equal((await request('/api/system',a)).cache,'no-store')
})
