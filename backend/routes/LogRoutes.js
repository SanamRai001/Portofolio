import express from 'express'
import { findDemoSession, expiredDemo } from '../utils/demoSessions.js'

const router = express.Router()
router.get('/', (req, res) => {
  res.set('Cache-Control', 'no-store')
  const session = findDemoSession(req)
  if (!session) return expiredDemo(res)
  return res.json({ success: true, message: 'Session logs fetched', data: session.flags.logging ? session.logs : [] })
})
export default router
