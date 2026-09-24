export const deriveAuthRuntimeState = (authEnabled, token) => {
  const authKnown = typeof authEnabled === 'boolean'
  const hasToken = typeof token === 'string' && token.length > 0

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
