import { randomBytes } from 'node:crypto'
import { DEFAULT_SYSTEM_CONFIG } from '../config/systemConfig.js'

export const DEMO_HEADER = 'x-demo-session'
export const DEMO_TTL_MS = 30 * 60 * 1000
export const DEMO_CAPACITY = 1000
export const PUBLIC_DEMO_CONFIG = Object.freeze({ ...DEFAULT_SYSTEM_CONFIG, db: true })

// One process owns its bounded ephemeral demo sessions. No Mongo config writes.
export function createDemoStore({ now = Date.now, ttl = DEMO_TTL_MS, capacity = DEMO_CAPACITY } = {}) {
  const sessions = new Map()
  function get(id) {
    if (typeof id !== 'string' || !/^[a-f0-9]{64}$/.test(id)) return null
    const session = sessions.get(id)
    if (!session) return null
    if (session.expiresAt <= now()) { sessions.delete(id); return null }
    return session
  }
  function create() {
    const time = now()
    for (const [id, session] of sessions) {
      if (session.expiresAt <= time) sessions.delete(id)
    }
    if (sessions.size >= capacity) return null
    const id = randomBytes(32).toString('hex')
    const session = { id, expiresAt: time + ttl, flags: { ...PUBLIC_DEMO_CONFIG }, logs: [], cache: null }
    sessions.set(id, session)
    return session
  }
  return { get, create }
}
export const demoSessions = createDemoStore()
export const findDemoSession = req => demoSessions.get(req.get(DEMO_HEADER))
export const expiredDemo = res => res.status(409).json({
  success: false, message: 'Demo session expired or unavailable. Reload the Lab to start a new session.',
})
