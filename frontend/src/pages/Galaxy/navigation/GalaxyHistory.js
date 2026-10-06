import { SYSTEM_MAP } from '../data/solarSystem.js'

export const GALAXY_ROOT = '/galaxy'

const BODY_PATHS = new Map(SYSTEM_MAP.map(body => [body.id, `${GALAXY_ROOT}/${body.id}`]))
const PATH_BODIES = new Map([...BODY_PATHS].map(([bodyId, path]) => [path, bodyId]))

function normalizePath(pathname = '/') {
  if (pathname === '/') return '/'
  return pathname.replace(/\/+$/, '') || '/'
}

function historyState(history, managed) {
  const current = history.state
  return {
    ...(current && typeof current === 'object' ? current : {}),
    __galaxyManaged: managed,
  }
}

function locationTarget(win, pathname) {
  return `${pathname}${win.location.search || ''}${win.location.hash || ''}`
}

export function galaxyPathForBody(bodyId) {
  return BODY_PATHS.get(bodyId) || null
}

export function parseGalaxyPath(pathname) {
  const normalized = normalizePath(pathname)
  if (normalized === GALAXY_ROOT) {
    return Object.freeze({ kind: 'overview', bodyId: null, canonicalPath: GALAXY_ROOT })
  }

  const bodyId = PATH_BODIES.get(normalized)
  if (bodyId) {
    return Object.freeze({ kind: 'body', bodyId, canonicalPath: galaxyPathForBody(bodyId) })
  }

  if (normalized.startsWith(`${GALAXY_ROOT}/`)) {
    return Object.freeze({ kind: 'invalid', bodyId: null, canonicalPath: GALAXY_ROOT })
  }

  return null
}

// Keeps the existing semantic navigation controller authoritative. History only
// mirrors body selection and replays it for direct links/back/forward.
export function bindGalaxyHistory({ navigation, win = window }) {
  let applyingLocation = false
  let previousSelectedBodyId = navigation.getSnapshot().selectedBodyId

  function replace(pathname, managed = Boolean(win.history.state?.__galaxyManaged)) {
    win.history.replaceState(historyState(win.history, managed), '', locationTarget(win, pathname))
  }

  function applyLocation() {
    const route = parseGalaxyPath(win.location.pathname)
    if (!route) return

    if (win.location.pathname !== route.canonicalPath) {
      replace(route.canonicalPath, false)
    }

    applyingLocation = true
    try {
      if (route.kind === 'body') {
        navigation.focusBody(route.bodyId)
      } else if (navigation.getSnapshot().selectedBodyId) {
        navigation.returnToOverview()
      }
    } finally {
      applyingLocation = false
      previousSelectedBodyId = navigation.getSnapshot().selectedBodyId
    }
  }

  function syncHistory() {
    const selectedBodyId = navigation.getSnapshot().selectedBodyId
    if (selectedBodyId === previousSelectedBodyId) return

    const previousBodyId = previousSelectedBodyId
    previousSelectedBodyId = selectedBodyId
    if (applyingLocation) return

    if (selectedBodyId) {
      const target = galaxyPathForBody(selectedBodyId)
      const currentRoute = parseGalaxyPath(win.location.pathname)

      if (previousBodyId === null && currentRoute?.kind === 'overview') {
        win.history.pushState(historyState(win.history, true), '', locationTarget(win, target))
      } else {
        replace(target)
      }
      return
    }

    if (!previousBodyId) return

    if (win.history.state?.__galaxyManaged) {
      win.history.back()
    } else {
      replace(GALAXY_ROOT, false)
    }
  }

  const unsubscribe = navigation.subscribe(syncHistory)
  win.addEventListener('popstate', applyLocation)
  applyLocation()

  return () => {
    unsubscribe()
    win.removeEventListener('popstate', applyLocation)
  }
}
