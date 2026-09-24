export const isUsableToken = (token) => {
  if (typeof token !== 'string') return false

  const normalized = token.trim()
  if (!normalized || normalized === 'undefined' || normalized === 'null') {
    return false
  }

  const segments = normalized.split('.')
  return segments.length === 3 && segments.every((segment) => segment.length > 0)
}

export const deriveAuthRuntimeState = (authEnabled, token) => {
  const authKnown = typeof authEnabled === 'boolean'
  const hasToken = isUsableToken(token)

  if (!authKnown) {
    return {
      authKnown: false,
      canRequestProjects: false,
      hasToken,
      showAuthOverlay: false,
      suspendBackground: false,
    }
  }

  const showAuthOverlay = authEnabled && !hasToken

  return {
    authKnown: true,
    canRequestProjects: !authEnabled || hasToken,
    hasToken,
    showAuthOverlay,
    suspendBackground: showAuthOverlay,
  }
}
