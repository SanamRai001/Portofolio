import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

import {
  AUTH_TRANSITION_VERSION,
  JWT_ALGORITHM,
  JWT_AUDIENCE,
  JWT_EXPIRES_IN,
  JWT_ISSUER,
} from '../config/authConfig.js'
import User from '../models/userModel.js'
import { normalizeLoginInput } from '../utils/authInput.js'
import { verifyStoredPassword } from '../utils/password.js'
import { persistLegacyPasswordUpgrade } from '../utils/passwordUpgrade.js'

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

    const verification = await verifyStoredPassword(password, user.password)

    if (!verification.valid) {
      return res.status(401).json(INVALID_CREDENTIALS)
    }

    if (verification.needsUpgrade) {
      await persistLegacyPasswordUpgrade({
        id: user._id,
        storedPassword: user.password,
        plainPassword: password,
        updatePassword: ({ id, expectedPassword, nextPassword }) => (
          User.updateOne(
            { _id: id, password: expectedPassword },
            { $set: { password: nextPassword } },
          )
        ),
      })
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
      authVersion: AUTH_TRANSITION_VERSION,
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
