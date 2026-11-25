import { performance } from 'node:perf_hooks'
import { formatPublicRequestLog } from '../utils/requestLog.js'

export default function loggingMiddleware(req, res, next) {
  const session = req.demoSession
  if (!session || req.systemConfig?.logging !== true) return next()
  const startedAt = performance.now()
  res.once('finish', () => {
    const log = formatPublicRequestLog({
      method: req.method, path: `${req.baseUrl || ''}${req.path || ''}` || '/',
      statusCode: res.statusCode, durationMs: performance.now() - startedAt,
    })
    session.logs.unshift(log)
    if (session.logs.length > 50) session.logs.pop()
  })
  return next()
}
