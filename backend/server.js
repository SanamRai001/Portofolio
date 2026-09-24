import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import connectDB from './config/db.js'
import { deactivateUnsafeSeedPrivilegedAccounts } from './data/deactivateUnsafeSeedUsers.js'

import projectRoutes from './routes/projectRoutes.js'
import authRoutes from './routes/AuthRoutes.js'
import systemRoutes from './routes/SystemRoutes.js'
import controlRoutes from './routes/ControlRoutes.js'
import logRoutes from './routes/LogRoutes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({
  origin: [
    'https://sanam-rai.com.np',
    'https://www.sanam-rai.com.np',
  ],
}))
app.use(express.json())
app.use(express.static('public'))

app.use('/api/projects', projectRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/', systemRoutes)
app.use('/api/controls', controlRoutes)
app.use('/api/logs', logRoutes)

app.get('/', (_req, res) => {
  res.send('Hello World!')
})

const start = async () => {
  try {
    await connectDB()

    const cleanup = await deactivateUnsafeSeedPrivilegedAccounts()

    if (cleanup.modifiedCount > 0) {
      console.warn(
        `Deactivated ${cleanup.modifiedCount} known unsafe privileged seed account(s).`,
      )
    }

    app.listen(PORT, () => console.log(`Running on port ${PORT}`))
  } catch (error) {
    console.error('Backend startup failed', error.message)
    process.exit(1)
  }
}

start()
