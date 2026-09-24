import mongoose from 'mongoose'

import connectDB from '../config/db.js'
import User from '../models/userModel.js'
import { migrateLegacyPasswords } from '../utils/passwordMigration.js'

const apply = process.argv.includes('--apply')
const dryRun = !apply

const main = async () => {
  try {
    await connectDB()

    const users = await User.find()
      .select('+password')
      .lean()

    const summary = await migrateLegacyPasswords({
      users,
      dryRun,
      updatePassword: ({ id, expectedPassword, nextPassword }) => (
        User.updateOne(
          { _id: id, password: expectedPassword },
          { $set: { password: nextPassword } },
        )
      ),
    })

    const mode = dryRun ? 'DRY RUN' : 'APPLY'
    console.log(
      `Password migration ${mode}: scanned=${summary.scanned} legacy=${summary.legacy} migrated=${summary.migrated} conflicts=${summary.conflicts} skipped=${summary.skipped}`,
    )

    if (dryRun && summary.legacy > 0) {
      console.log('No records were changed. Re-run with --apply after reviewing the count.')
    }
  } catch (error) {
    console.error('Password migration failed:', error.message)
    process.exitCode = 1
  } finally {
    await mongoose.connection.close()
  }
}

main()
