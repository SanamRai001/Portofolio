import {
  LOGIN_EMAIL_MAX_LENGTH,
  LOGIN_PASSWORD_MAX_LENGTH,
} from '../config/authConfig.js'

export const normalizeLoginInput = (email, password) => {
  if (typeof email !== 'string' || typeof password !== 'string') {
    return null
  }

  const normalizedEmail = email.trim()

  if (
    normalizedEmail.length === 0 ||
    normalizedEmail.length > LOGIN_EMAIL_MAX_LENGTH ||
    password.length === 0 ||
    password.length > LOGIN_PASSWORD_MAX_LENGTH
  ) {
    return null
  }

  return {
    email: normalizedEmail,
    password,
  }
}
