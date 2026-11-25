import mongoose from 'mongoose'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import userModel from '../models/userModel.js'
import connectDB from '../config/db.js'
import { hashPassword } from '../utils/password.js'

export const DEMO_VIEWER = Object.freeze({
  id: 3,
  email: 'viewer@portfolio.dev',
  password: 'viewer123',
  role: 'viewer',
  is_active: true,
})

export const seedDemoViewer = async ({
  UserModel = userModel,
  hash = hashPassword,
} = {}) => {
  const password = await hash(DEMO_VIEWER.password)

  const result = await UserModel.updateOne(
    { email: DEMO_VIEWER.email },
    {
      $set: {
        id: DEMO_VIEWER.id,
        email: DEMO_VIEWER.email,
        password,
        role: DEMO_VIEWER.role,
        is_active: DEMO_VIEWER.is_active,
      },
    },
    { upsert: true },
  )

  return {
    email: DEMO_VIEWER.email,
    matchedCount: result?.matchedCount ?? 0,
    modifiedCount: result?.modifiedCount ?? 0,
    upsertedCount: result?.upsertedCount ?? 0,
  }
}

export const runDemoViewerSeed = async ({
  connect = connectDB,
  close = () => mongoose.connection.close(),
} = {}) => {
  try {
    await connect()
    const result = await seedDemoViewer()

    console.log(
      `Demo viewer ready: ${result.email} (${result.upsertedCount > 0 ? 'created' : 'updated/reactivated'})`,
    )
  } catch (error) {
    console.error('Demo viewer seed failed:', error.message)
    process.exitCode = 1
  } finally {
    await close()
  }
}

const executedDirectly = (
  process.argv[1]
  && fileURLToPath(import.meta.url) === resolve(process.argv[1])
)

if (executedDirectly) {
  runDemoViewerSeed()
}
