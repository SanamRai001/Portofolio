import { DEMO_HEADER, PUBLIC_DEMO_CONFIG, findDemoSession, expiredDemo } from '../utils/demoSessions.js'

export default function systemMiddleware(req, res, next) {
  res.set('Cache-Control', 'no-store')
  const session = findDemoSession(req)
  if (req.get(DEMO_HEADER) !== undefined && !session) return expiredDemo(res)
  req.demoSession = session
  // No session means public project reads under the fixed default, never global flags.
  req.systemConfig = { ...(session?.flags || PUBLIC_DEMO_CONFIG) }
  return next()
}
