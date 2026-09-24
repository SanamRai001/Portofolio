import { hashPassword } from './password.js'

export const persistLegacyPasswordUpgrade = async ({
  id,
  storedPassword,
  plainPassword,
  updatePassword,
  hash = hashPassword,
}) => {
  if (typeof updatePassword !== 'function') {
    throw new TypeError('updatePassword must be a function')
  }

  const nextPassword = await hash(plainPassword)
  const result = await updatePassword({
    id,
    expectedPassword: storedPassword,
    nextPassword,
  })

  if (result?.modifiedCount !== 1) {
    throw new Error('Legacy password upgrade was not persisted')
  }

  return true
}
