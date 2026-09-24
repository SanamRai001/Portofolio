import User from '../models/userModel.js'

export const UNSAFE_PRIVILEGED_SEED_EMAILS = [
  'admin@portfolio.dev',
  'superadmin@portfolio.dev',
]

export const deactivateUnsafeSeedPrivilegedAccounts = async ({
  UserModel = User,
} = {}) => {
  const result = await UserModel.updateMany(
    {
      email: { $in: UNSAFE_PRIVILEGED_SEED_EMAILS },
      role: { $in: ['admin', 'super_admin'] },
      is_active: { $ne: false },
    },
    {
      $set: { is_active: false },
    },
  )

  return {
    matchedCount: result?.matchedCount ?? 0,
    modifiedCount: result?.modifiedCount ?? 0,
  }
}
