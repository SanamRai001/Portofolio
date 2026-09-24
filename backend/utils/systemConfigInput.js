import { SYSTEM_TOGGLE_KEYS } from '../config/systemConfig.js'

const ALLOWED_KEYS = new Set(SYSTEM_TOGGLE_KEYS)

export const parseSystemConfigUpdate = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {
      ok: false,
      message: 'System config update must be an object',
    }
  }

  const keys = Object.keys(body)

  if (keys.length === 0) {
    return {
      ok: false,
      message: 'At least one system config flag is required',
    }
  }

  const unknownKeys = keys.filter((key) => !ALLOWED_KEYS.has(key))

  if (unknownKeys.length > 0) {
    return {
      ok: false,
      message: `Unknown system config flag: ${unknownKeys[0]}`,
    }
  }

  const invalidKey = keys.find((key) => typeof body[key] !== 'boolean')

  if (invalidKey) {
    return {
      ok: false,
      message: `System config flag ${invalidKey} must be boolean`,
    }
  }

  return {
    ok: true,
    data: Object.fromEntries(keys.map((key) => [key, body[key]])),
  }
}
