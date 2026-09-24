import { hashPassword, isBcryptHash } from './password.js'

export const findLegacyPasswordUsers = (users = []) => (
  users.filter((user) => (
    typeof user?.password === 'string' &&
    user.password.length > 0 &&
    !isBcryptHash(user.password)
  ))
)

export const migrateLegacyPasswords = async ({
  users = [],
  updatePassword,
  dryRun = true,
  hash = hashPassword,
}) => {
  if (typeof updatePassword !== 'function') {
    throw new TypeError('updatePassword must be a function')
  }

  const legacyUsers = findLegacyPasswordUsers(users)
  const summary = {
    scanned: users.length,
    legacy: legacyUsers.length,
    migrated: 0,
    conflicts: 0,
    skipped: users.length - legacyUsers.length,
    dryRun,
  }

  if (dryRun) {
    return summary
  }

  for (const user of legacyUsers) {
    const nextPassword = await hash(user.password)
    const result = await updatePassword({
      id: user._id,
      expectedPassword: user.password,
      nextPassword,
    })

    if (result?.modifiedCount === 1) {
      summary.migrated += 1
    } else {
      summary.conflicts += 1
    }
  }

  return summary
}
