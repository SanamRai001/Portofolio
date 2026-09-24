import { performance } from 'node:perf_hooks'

import { addLogs } from '../utils/logStore.js'
import { formatPublicRequestLog } from '../utils/requestLog.js'

const loggingMiddleware = (req, res, next) => {
  if (req.systemConfig?.logging !== true) {
    return next()
  }

  const startedAt = performance.now()

  res.once('finish', () => {
    const requestPath = `${req.baseUrl || ''}${req.path || ''}` || '/'
    const durationMs = performance.now() - startedAt
    const log = formatPublicRequestLog({
      method: req.method,
      path: requestPath,
      statusCode: res.statusCode,
      durationMs,
    })

    addLogs(log)
    console.log(log)
  })

  return next()
}

export default loggingMiddleware
