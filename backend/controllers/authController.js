import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

import User from '../models/userModel.js'
import { hashPassword, verifyStoredPassword } from '../utils/password.js'

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

  const { email, password } = req.body ?? {}

  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    email.length === 0 ||
    password.length === 0
  ) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
    })
  }

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
      const upgradedPassword = await hashPassword(password)

      try {
        await User.updateOne(
          { _id: user._id, password: user.password },
          { $set: { password: upgradedPassword } },
        )
      } catch (upgradeError) {
        console.warn('Legacy password upgrade failed', upgradeError.message)
      }
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
      { expiresIn: '1h' },
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
