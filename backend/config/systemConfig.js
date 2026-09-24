export const SYSTEM_TOGGLE_KEYS = [
  'auth',
  'db',
  'cache',
  'logging',
  'rateLimit',
  'pagination',
]

export const DEFAULT_SYSTEM_CONFIG = Object.freeze({
  auth: false,
  db: false,
  cache: false,
  logging: false,
  rateLimit: false,
  pagination: false,
})
