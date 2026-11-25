const STORAGE_KEY = 'sanam-lab-session-v1'
const valid = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
let fallback = null

export function getDemoSession() {
  try { return window.sessionStorage.getItem(STORAGE_KEY) }
  catch { return fallback }
}

export function demoHeaders(extra = {}) {
  const session = getDemoSession()
  const headers = { ...extra }
  if (valid(session)) headers['X-Demo-Session'] = session
  return Object.keys(headers).length ? headers : undefined
}

export function acceptDemoSession(response, expected) {
  const session = response?.data?.demoSession
  if (!valid(session) || (expected && session !== expected)) {
    throw new Error('Isolated demo session unavailable')
  }
  fallback = session
  try { window.sessionStorage.setItem(STORAGE_KEY, session) } catch { /* in-memory fallback */ }
}
