import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createNavigationController } from './navigation/NavigationController.js'
import {
  GALAXY_ROOT,
  bindGalaxyHistory,
  galaxyPathForBody,
  galaxyPathForProject,
  parseGalaxyPath,
} from './navigation/GalaxyHistory.js'

function createWindow(pathname = GALAXY_ROOT) {
  const listeners = new Map()
  const entries = [{ url: pathname, state: null }]
  let index = 0

  const location = { pathname: GALAXY_ROOT, search: '', hash: '' }

  function applyUrl(url) {
    const parsed = new URL(url, 'https://portfolio.test')
    location.pathname = parsed.pathname
    location.search = parsed.search
    location.hash = parsed.hash
  }

  function emit(type) {
    for (const listener of listeners.get(type) || []) listener(new Event(type))
  }

  function move(delta) {
    const next = index + delta
    if (next < 0 || next >= entries.length) return
    index = next
    applyUrl(entries[index].url)
    emit('popstate')
  }

  applyUrl(pathname)

  const history = {
    get state() { return entries[index].state },
    get length() { return entries.length },
    pushState(state, _title, url) {
      entries.splice(index + 1)
      entries.push({ state, url })
      index = entries.length - 1
      applyUrl(url)
    },
    replaceState(state, _title, url) {
      entries[index] = { state, url }
      applyUrl(url)
    },
    back() { move(-1) },
    forward() { move(1) },
    go(delta) { move(delta) },
  }

  return {
    location,
    history,
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set())
      listeners.get(type).add(listener)
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener)
    },
  }
}

test('Galaxy paths include canonical project-detail routes and reject unknown nesting', () => {
  assert.deepEqual(parseGalaxyPath('/galaxy'), {
    kind: 'overview',
    bodyId: null,
    projectId: null,
    canonicalPath: '/galaxy',
  })
  assert.deepEqual(parseGalaxyPath('/galaxy/'), {
    kind: 'overview',
    bodyId: null,
    projectId: null,
    canonicalPath: '/galaxy',
  })
  assert.deepEqual(parseGalaxyPath('/galaxy/projects/'), {
    kind: 'body',
    bodyId: 'projects',
    projectId: null,
    canonicalPath: '/galaxy/projects',
  })
  assert.deepEqual(parseGalaxyPath('/galaxy/black-hole'), {
    kind: 'body',
    bodyId: 'black-hole',
    projectId: null,
    canonicalPath: '/galaxy/black-hole',
  })
  assert.deepEqual(parseGalaxyPath('/galaxy/projects/statescout'), {
    kind: 'project',
    bodyId: 'projects',
    projectId: 'statescout',
    canonicalPath: '/galaxy/projects/statescout',
  })
  assert.deepEqual(parseGalaxyPath('/galaxy/projects/not-real'), {
    kind: 'invalid',
    bodyId: null,
    projectId: null,
    canonicalPath: '/galaxy',
  })
  assert.deepEqual(parseGalaxyPath('/galaxy/projects/statescout/more'), {
    kind: 'invalid',
    bodyId: null,
    projectId: null,
    canonicalPath: '/galaxy',
  })
  assert.equal(parseGalaxyPath('/projects'), null)
  assert.equal(galaxyPathForBody('journey'), '/galaxy/journey')
  assert.equal(galaxyPathForBody('missing'), null)
  assert.equal(galaxyPathForProject('reality-archive'), '/galaxy/projects/reality-archive')
  assert.equal(galaxyPathForProject('missing'), null)
})

test('overview selections push once, retargets replace, and System returns through history', () => {
  const win = createWindow('/galaxy')
  const navigation = createNavigationController()
  const dispose = bindGalaxyHistory({ navigation, win })

  navigation.focusBody('projects')
  assert.equal(win.location.pathname, '/galaxy/projects')
  assert.equal(win.history.length, 2)
  assert.equal(win.history.state.__galaxyManaged, true)

  navigation.focusBody('skills')
  assert.equal(win.location.pathname, '/galaxy/skills')
  assert.equal(win.history.length, 2, 'retargeting must not flood browser history')

  navigation.goBack()
  assert.equal(win.location.pathname, '/galaxy')
  assert.equal(navigation.getSnapshot().selectedBodyId, null)

  win.history.forward()
  assert.equal(win.location.pathname, '/galaxy/skills')
  assert.equal(navigation.getSnapshot().selectedBodyId, 'skills')

  dispose()
})

test('project exploration adds one nested history level and replaces project-to-project retargets', () => {
  const win = createWindow('/galaxy')
  const navigation = createNavigationController()
  const dispose = bindGalaxyHistory({ navigation, win })

  navigation.focusBody('projects')
  navigation.complete(navigation.getSnapshot().transitionId)
  assert.equal(win.location.pathname, '/galaxy/projects')
  assert.equal(win.history.length, 2)

  navigation.selectProject('statescout')
  assert.equal(win.location.pathname, '/galaxy/projects/statescout')
  assert.equal(win.history.length, 3)
  assert.equal(win.history.state.__galaxyDepth, 'project')
  assert.equal(win.history.state.__galaxyParentManaged, true)

  navigation.selectProject('reality-archive')
  assert.equal(win.location.pathname, '/galaxy/projects/reality-archive')
  assert.equal(win.history.length, 3, 'switching project case studies replaces the detail entry')

  win.history.back()
  assert.equal(win.location.pathname, '/galaxy/projects')
  assert.equal(navigation.getSnapshot().selectedBodyId, 'projects')
  assert.equal(navigation.getSnapshot().selectedProjectId, null)
  assert.equal(navigation.getSnapshot().mode, 'body_focused')

  win.history.forward()
  assert.equal(win.location.pathname, '/galaxy/projects/reality-archive')
  assert.equal(navigation.getSnapshot().selectedBodyId, 'projects')
  assert.equal(navigation.getSnapshot().selectedProjectId, 'reality-archive')

  dispose()
})

test('System return from a managed project detail skips the nested Projects history entry', () => {
  const win = createWindow('/galaxy')
  const navigation = createNavigationController()
  const dispose = bindGalaxyHistory({ navigation, win })

  navigation.focusBody('projects')
  navigation.complete(navigation.getSnapshot().transitionId)
  navigation.selectProject('statescout')
  assert.equal(win.history.length, 3)

  navigation.goBack()

  assert.equal(win.location.pathname, '/galaxy')
  assert.equal(navigation.getSnapshot().selectedBodyId, null)
  assert.equal(navigation.getSnapshot().selectedProjectId, null)

  dispose()
})

test('direct world deep links focus without manufacturing history and System canonicalizes to overview', () => {
  const win = createWindow('/galaxy/projects?from=share#focus')
  const navigation = createNavigationController()
  const dispose = bindGalaxyHistory({ navigation, win })

  assert.equal(navigation.getSnapshot().selectedBodyId, 'projects')
  assert.equal(win.history.length, 1)
  assert.equal(win.location.search, '?from=share')
  assert.equal(win.location.hash, '#focus')

  navigation.goBack()
  assert.equal(win.location.pathname, '/galaxy')
  assert.equal(win.history.length, 1)
  assert.equal(navigation.getSnapshot().selectedBodyId, null)

  dispose()
})

test('direct project deep links resolve after Mars arrival without inventing prior history', () => {
  const win = createWindow('/galaxy/projects/statescout?from=share')
  const navigation = createNavigationController()
  const dispose = bindGalaxyHistory({ navigation, win })

  assert.equal(navigation.getSnapshot().selectedBodyId, 'projects')
  assert.equal(navigation.getSnapshot().selectedProjectId, null)
  assert.equal(navigation.getSnapshot().mode, 'focusing_body')
  assert.equal(win.history.length, 1)

  navigation.complete(navigation.getSnapshot().transitionId)

  assert.equal(navigation.getSnapshot().mode, 'body_focused')
  assert.equal(navigation.getSnapshot().selectedProjectId, 'statescout')
  assert.equal(win.location.pathname, '/galaxy/projects/statescout')
  assert.equal(win.location.search, '?from=share')
  assert.equal(win.history.length, 1)

  navigation.clearProjectSelection()
  assert.equal(win.location.pathname, '/galaxy/projects')
  assert.equal(navigation.getSnapshot().selectedBodyId, 'projects')
  assert.equal(navigation.getSnapshot().selectedProjectId, null)
  assert.equal(win.history.length, 1)

  dispose()
})

test('browser Back and Forward replay semantic Galaxy world selection', () => {
  const win = createWindow('/galaxy')
  const navigation = createNavigationController()
  const dispose = bindGalaxyHistory({ navigation, win })

  navigation.focusBody('identity')
  assert.equal(navigation.getSnapshot().selectedBodyId, 'identity')

  win.history.back()
  assert.equal(navigation.getSnapshot().selectedBodyId, null)
  assert.equal(navigation.getSnapshot().mode, 'returning_overview')

  win.history.forward()
  assert.equal(navigation.getSnapshot().selectedBodyId, 'identity')
  assert.equal(navigation.getSnapshot().mode, 'focusing_body')

  dispose()
})

test('invalid Galaxy subpaths fail closed to the system overview', () => {
  const win = createWindow('/galaxy/not-a-world')
  const navigation = createNavigationController()
  const dispose = bindGalaxyHistory({ navigation, win })

  assert.equal(win.location.pathname, '/galaxy')
  assert.equal(navigation.getSnapshot().selectedBodyId, null)
  assert.equal(navigation.getSnapshot().mode, 'overview')

  dispose()
})

test('Vercel serves Galaxy project deep links through the SPA entry', async () => {
  const config = JSON.parse(await readFile(new URL('../../../vercel.json', import.meta.url), 'utf8'))
  assert.ok(config.rewrites.some(rule => rule.source === '/galaxy' && rule.destination === '/index.html'))
  assert.ok(config.rewrites.some(rule => rule.source === '/galaxy/:path*' && rule.destination === '/index.html'))
})
