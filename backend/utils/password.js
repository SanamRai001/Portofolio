import crypto from 'crypto'
import bcrypt from 'bcrypt'

export const PASSWORD_SALT_ROUNDS = 12

const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$/

export const isBcryptHash = (value) => (
  typeof value === 'string' && BCRYPT_HASH_PATTERN.test(value)
)

export const hashPassword = async (password) => {
  if (typeof password !== 'string' || password.length === 0) {
    throw new TypeError('Password must be a non-empty string')
  }

  return bcrypt.hash(password, PASSWORD_SALT_ROUNDS)
}

const safeLegacyCompare = (candidate, stored) => {
  const candidateBuffer = Buffer.from(candidate)
  const storedBuffer = Buffer.from(stored)

  if (candidateBuffer.length !== storedBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(candidateBuffer, storedBuffer)
}

export const verifyStoredPassword = async (candidate, stored) => {
  if (
    typeof candidate !== 'string' ||
    typeof stored !== 'string' ||
    candidate.length === 0 ||
    stored.length === 0
  ) {
    return { valid: false, needsUpgrade: false }
  }

  if (isBcryptHash(stored)) {
    return {
      valid: await bcrypt.compare(candidate, stored),
      needsUpgrade: false,
    }
  }

  const valid = safeLegacyCompare(candidate, stored)

  return {
    valid,
    needsUpgrade: valid,
  }
}
