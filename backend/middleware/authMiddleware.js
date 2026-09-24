import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'

import {
  JWT_ALGORITHM,
  JWT_AUDIENCE,
  JWT_ISSUER,
} from '../config/authConfig.js'

dotenv.config()

export const readBearerToken = (authorizationHeader) => {
  if (typeof authorizationHeader !== 'string') return null

  const match = authorizationHeader.match(/^Bearer\s+([^\s]+)$/i)
  return match?.[1] ?? null
}

const authenticate = (req, res, next) => {
  if (req.systemConfig?.auth !== true) {
    return next()
  }

  if (!process.env.JWT_SECRETKEY) {
    console.error('JWT_SECRETKEY is not configured')
    return res.status(500).json({
      success: false,
      message: 'Authentication service is unavailable',
    })
  }

  const token = readBearerToken(req.headers.authorization)

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    })
  }

  try {
    req.user = jwt.verify(
      token,
      process.env.JWT_SECRETKEY,
      {
        algorithms: [JWT_ALGORITHM],
        audience: JWT_AUDIENCE,
        issuer: JWT_ISSUER,
      },
    )
    return next()
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    })
  }
}

export default authenticate
