import { parseSystemConfigUpdate } from '../utils/systemConfigInput.js'
import { demoSessions, findDemoSession, expiredDemo } from '../utils/demoSessions.js'

const respond = (res, session, message) => res.json({
  success: true, message, data: { ...session.flags }, demoSession: session.id,
})

export const readSystemConfig = (req, res) => {
  res.set('Cache-Control', 'no-store')
  const session = findDemoSession(req) || demoSessions.create()
  if (!session) return res.status(503).json({ success: false, message: 'Demo capacity reached. Try again later.' })
  return respond(res, session, 'Demo configuration fetched')
}

export const updateSystemConfig = (req, res) => {
  res.set('Cache-Control', 'no-store')
  const session = findDemoSession(req)
  if (!session) return expiredDemo(res)
  const parsed = parseSystemConfigUpdate(req.body)
  if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.message })
  Object.assign(session.flags, parsed.data)
  return respond(res, session, 'Demo configuration updated')
}
