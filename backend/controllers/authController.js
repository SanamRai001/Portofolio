import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

import {
  JWT_ALGORITHM,
  JWT_AUDIENCE,
  JWT_EXPIRES_IN,
  JWT_ISSUER,
} from '../config/authConfig.js'
import User from '../models/userModel.js'
import { normalizeLoginInput } from '../utils/authInput.js'
import { verifyPassword } from '../utils/password.js'

dotenv.config()

const INVALID_CREDENTIALS = {
  success: false,
  message: 'Wrong credentials',
}

export const verifyUser = async (req, res) => {
  if (req.systemConfig?.auth !== true) {
    return res.json({
      success: true,
      message: 'Auth disabled',
    })
  }

  const credentials = normalizeLoginInput(
    req.body?.email,
    req.body?.password,
  )

  if (!credentials) {
    return res.status(400).json({
      success: false,
      message: 'Invalid login input',
    })
  }

  const { email, password } = credentials

  try {
    const user = await User.findOne({ email }).select('+password')

    if (!user || user.is_active === false) {
      return res.status(401).json(INVALID_CREDENTIALS)
    }

    const validPassword = await verifyPassword(password, user.password)

    if (!validPassword) {
      return res.status(401).json(INVALID_CREDENTIALS)
    }

    if (!process.env.JWT_SECRETKEY) {
      console.error('JWT_SECRETKEY is not configured')
      return res.status(500).json({
        success: false,
        message: 'Authentication service is unavailable',
      })
    }

    const token = jwt.sign(
      { email: user.email },
      process.env.JWT_SECRETKEY,
      {
        algorithm: JWT_ALGORITHM,
        audience: JWT_AUDIENCE,
        expiresIn: JWT_EXPIRES_IN,
        issuer: JWT_ISSUER,
        subject: String(user._id),
      },
    )

    return res.json({
      success: true,
      message: 'User logged in successfully',
      token,
    })
  } catch (error) {
    console.error('Authentication failed', error.message)
    return res.status(500).json({
      success: false,
      message: 'Authentication service is unavailable',
    })
  }
}
