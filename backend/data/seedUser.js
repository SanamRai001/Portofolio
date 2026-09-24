import mongoose from 'mongoose'

import userModel from '../models/userModel.js'
import connectDB from '../config/db.js'
import { hashPassword } from '../utils/password.js'

const viewer = {
  id: 3,
  email: 'viewer@portfolio.dev',
  password: 'viewer123',
  role: 'viewer',
  is_active: true,
}

const seed = async () => {
  try {
    await connectDB()

    const password = await hashPassword(viewer.password)

    await userModel.updateOne(
      { email: viewer.email },
      {
        $set: {
          id: viewer.id,
          password,
          role: viewer.role,
          is_active: viewer.is_active,
        },
      },
      { upsert: true },
    )

    console.log('Demo viewer seeded successfully')
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  } finally {
    await mongoose.connection.close()
  }
}

seed()
