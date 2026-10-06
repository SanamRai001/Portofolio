import { SYSTEM_MAP } from '../data/solarSystem.js'
import { projectById } from '../data/projects.js'

export const GALAXY_ROOT = '/galaxy'

const BODY_PATHS = new Map(SYSTEM_MAP.map(body => [body.id, `${GALAXY_ROOT}/${body.id}`]))
const PATH_BODIES = new Map([...BODY_PATHS].map(([bodyId, path]) => [path, bodyId]))

function normalizePath(pathname = '/') {
  if (pathname === '/') return '/'
  return pathname.replace(/\/+$/, '') || '/'
}

function historyState(history, managed, depth = 'world', parentManaged = null) {
  const current = history.state
  const state = {
    ...(current && typeof current === 'object' ? current : {}),
    __galaxyManaged: managed,
    __galaxyDepth: depth,
  }

  if (parentManaged !== null) state.__galaxyParentManaged = parentManaged
  else if (depth !== 'project') delete state.__galaxyParentManaged

  return state
}

function locationTarget(win, pathname) {
  return `${pathname}${win.location.search || ''}${win.location.hash || ''}`
}

export function galaxyPathForBody(bodyId) {
  return BODY_PATHS.get(bodyId) || null
}

export function galaxyPathForProject(projectId) {
  return projectById(projectId) ? `${GALAXY_ROOT}/projects/${projectId}` : null
}

export function parseGalaxyPath(pathname) {
  const normalized = normalizePath(pathname)
  if (normalized === GALAXY_ROOT) {
    return Object.freeze({
      kind: 'overview',
      bodyId: null,
      projectId: null,
      canonicalPath: GALAXY_ROOT,
    })
  }

  const projectMatch = normalized.match(/^\/galaxy\/projects\/([^/]+)$/)
  if (projectMatch) {
    const project = projectById(projectMatch[1])
    if (project) {
      return Object.freeze({
        kind: 'project',
        bodyId: 'projects',
        projectId: project.id,
        canonicalPath: galaxyPathForProject(project.id),
      })
    }

    return Object.freeze({
      kind: 'invalid',
      bodyId: null,
      projectId: null,
      canonicalPath: GALAXY_ROOT,
    })
  }

  const bodyId = PATH_BODIES.get(normalized)
  if (bodyId) {
    return Object.freeze({
      kind: 'body',
      bodyId,
      projectId: null,
      canonicalPath: galaxyPathForBody(bodyId),
    })
  }

  if (normalized.startsWith(`${GALAXY_ROOT}/`)) {
    return Object.freeze({
      kind: 'invalid',
      bodyId: null,
      projectId: null,
      canonicalPath: GALAXY_ROOT,
    })
  }

  return null
}

// G4 keeps NavigationController authoritative. History mirrors only stable
// semantic destinations: overview, a focused world, or a focused project.
export function bindGalaxyHistory({ navigation, win = window }) {
  let applyingLocation = false
  let pendingProjectId = null
  let previous = {
    bodyId: navigation.getSnapshot().selectedBodyId,
    projectId: navigation.getSnapshot().selectedProjectId,
  }

  function replace(
    pathname,
    managed = Boolean(win.history.state?.__galaxyManaged),
    depth = 'world',
  ) {
    win.history.replaceState(
      historyState(win.history, managed, depth),
      '',
      locationTarget(win, pathname),
    )
  }

  function clearPendingProject() {
    pendingProjectId = null
  }

  function applyLocation() {
    const route = parseGalaxyPath(win.location.pathname)
    if (!route) return

    if (win.location.pathname !== route.canonicalPath) {
      replace(route.canonicalPath, false, route.kind === 'project' ? 'project' : 'world')
    }

    applyingLocation = true
    try {
      if (route.kind === 'project') {
        pendingProjectId = route.projectId
        const snapshot = navigation.getSnapshot()

        if (snapshot.selectedBodyId !== 'projects') {
          navigation.focusBody('projects')
        } else if (snapshot.mode === 'body_focused') {
          navigation.selectProject(route.projectId)
          clearPendingProject()
        }
      } else if (route.kind === 'body') {
        clearPendingProject()
        if (
          route.bodyId === 'projects'
          && navigation.getSnapshot().selectedBodyId === 'projects'
        ) {
          navigation.clearProjectSelection()
        } else {
          navigation.focusBody(route.bodyId)
        }
      } else {
        clearPendingProject()
        if (navigation.getSnapshot().selectedBodyId) navigation.returnToOverview()
      }
    } finally {
      applyingLocation = false
      const snapshot = navigation.getSnapshot()
      previous = {
        bodyId: snapshot.selectedBodyId,
        projectId: snapshot.selectedProjectId,
      }
    }
  }

  function syncHistory() {
    const snapshot = navigation.getSnapshot()

    if (
      pendingProjectId
      && snapshot.selectedBodyId === 'projects'
      && snapshot.mode === 'body_focused'
      && snapshot.selectedProjectId !== pendingProjectId
    ) {
      applyingLocation = true
      try {
        navigation.selectProject(pendingProjectId)
      } finally {
        applyingLocation = false
        clearPendingProject()
      }
    }

    const current = {
      bodyId: navigation.getSnapshot().selectedBodyId,
      projectId: navigation.getSnapshot().selectedProjectId,
    }

    if (
      current.bodyId === previous.bodyId
      && current.projectId === previous.projectId
    ) return

    const prior = previous
    previous = current
    if (applyingLocation) return

    // Project detail is one level deeper than the Projects world. Entering it
    // pushes once so browser Back returns to Mars; changing projects replaces
    // that detail entry so exploration does not flood browser history.
    if (current.bodyId === 'projects' && current.projectId) {
      const target = galaxyPathForProject(current.projectId)
      const currentRoute = parseGalaxyPath(win.location.pathname)

      if (prior.bodyId === 'projects' && !prior.projectId && currentRoute?.kind === 'body') {
        const parentManaged = Boolean(win.history.state?.__galaxyManaged)
        win.history.pushState(
          historyState(win.history, true, 'project', parentManaged),
          '',
          locationTarget(win, target),
        )
      } else {
        const currentState = win.history.state
        const parentManaged = currentState?.__galaxyDepth === 'project'
          ? Boolean(currentState.__galaxyParentManaged)
          : Boolean(currentState?.__galaxyManaged)

        win.history.replaceState(
          historyState(win.history, Boolean(currentState?.__galaxyManaged), 'project', parentManaged),
          '',
          locationTarget(win, target),
        )
      }
      return
    }

    // Clearing only the local project selection should return to the Projects
    // world, not all the way to the Galaxy overview.
    if (
      current.bodyId === 'projects'
      && !current.projectId
      && prior.bodyId === 'projects'
      && prior.projectId
    ) {
      if (
        win.history.state?.__galaxyManaged
        && win.history.state?.__galaxyDepth === 'project'
      ) {
        win.history.back()
      } else {
        replace(galaxyPathForBody('projects'), false, 'world')
      }
      return
    }

    if (current.bodyId) {
      const target = galaxyPathForBody(current.bodyId)
      const currentRoute = parseGalaxyPath(win.location.pathname)

      if (prior.bodyId === null && currentRoute?.kind === 'overview') {
        win.history.pushState(
          historyState(win.history, true, 'world'),
          '',
          locationTarget(win, target),
        )
      } else {
        replace(target, Boolean(win.history.state?.__galaxyManaged), 'world')
      }
      return
    }

    if (!prior.bodyId) return

    const historyMeta = win.history.state
    if (
      prior.projectId
      && historyMeta?.__galaxyManaged
      && historyMeta?.__galaxyDepth === 'project'
    ) {
      if (historyMeta.__galaxyParentManaged && typeof win.history.go === 'function') {
        win.history.go(-2)
      } else {
        replace(GALAXY_ROOT, false, 'world')
      }
      return
    }

    if (historyMeta?.__galaxyManaged) {
      win.history.back()
    } else {
      replace(GALAXY_ROOT, false, 'world')
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
