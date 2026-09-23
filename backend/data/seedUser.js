import mongoose from 'mongoose'

import userModel from '../models/userModel.js'
import connectDB from '../config/db.js'
import { hashPassword } from '../utils/password.js'

const data = [
  {
    id: 1,
    email: 'superadmin@portfolio.dev',
    password: 'superadmin123',
    role: 'super_admin',
    is_active: true,
  },
  {
    id: 2,
    email: 'admin@portfolio.dev',
    password: 'admin123',
    role: 'admin',
    is_active: true,
  },
  {
    id: 3,
    email: 'viewer@portfolio.dev',
    password: 'viewer123',
    role: 'viewer',
    is_active: true,
  },
]

const seed = async () => {
  try {
    await connectDB()

    const users = await Promise.all(
      data.map(async (user) => ({
        ...user,
        password: await hashPassword(user.password),
      })),
    )

    await userModel.insertMany(users)
    console.log('User seeded successfully')
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  } finally {
    await mongoose.connection.close()
  }
}

seed()
