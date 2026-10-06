import test from 'node:test'
import assert from 'node:assert/strict'

import { LAB_EXPERIMENTS } from './data/lab.js'
import { JOURNEY_WAYPOINTS } from './data/journey.js'
import { projectById } from './data/projects.js'
import { createNavigationController } from './navigation/NavigationController.js'
import {
  bindGalaxyHistory,
  openGalaxyProject,
} from './navigation/GalaxyHistory.js'

function createWindow(pathname = '/galaxy') {
  const listeners = new Map()
  const entries = [{ url: pathname, state: null }]
  let index = 0
  const location = { pathname: '/galaxy', search: '', hash: '' }

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
    dispatchEvent(event) {
      emit(event.type)
      return true
    },
  }
}

test('Journey cross-links only reference projects with internal G4A case studies', () => {
  const backend = JOURNEY_WAYPOINTS.find(waypoint => waypoint.id === 'backend')
  const research = JOURNEY_WAYPOINTS.find(waypoint => waypoint.id === 'research')
  const unrelated = JOURNEY_WAYPOINTS.filter(waypoint => !['backend', 'research'].includes(waypoint.id))

  assert.deepEqual([...backend.relatedProjects], ['reposcout', 'dear-future'])
  assert.deepEqual([...research.relatedProjects], ['statescout', 'reality-archive'])
  assert.ok(unrelated.every(waypoint => waypoint.relatedProjects.length === 0))

  for (const projectId of [...backend.relatedProjects, ...research.relatedProjects]) {
    assert.ok(projectById(projectId)?.caseStudy, `${projectId} must have a G4A case study`)
  }
})

test('Lab uses internal case studies only where matching Projects evidence exists', () => {
  const linked = LAB_EXPERIMENTS.filter(experiment => experiment.projectId)
  const externalOnly = LAB_EXPERIMENTS.filter(experiment => !experiment.projectId)

  assert.deepEqual(linked.map(experiment => experiment.id), ['state-space', 'reality-reconstruction'])
  assert.deepEqual(linked.map(experiment => experiment.projectId), ['statescout', 'reality-archive'])
  assert.deepEqual(externalOnly.map(experiment => experiment.id), ['vector-reconstruction', 'expressive-small-models'])

  for (const experiment of linked) {
    assert.ok(projectById(experiment.projectId)?.caseStudy)
  }
  assert.ok(externalOnly.every(experiment => experiment.href.startsWith('https://github.com/')))
})

test('cross-world project navigation preserves world -> Projects -> detail hierarchy', () => {
  const win = createWindow('/galaxy/journey')
  const navigation = createNavigationController()
  const dispose = bindGalaxyHistory({ navigation, win })

  assert.equal(navigation.getSnapshot().selectedBodyId, 'journey')
  navigation.complete(navigation.getSnapshot().transitionId)
  assert.equal(navigation.getSnapshot().mode, 'body_focused')

  assert.equal(openGalaxyProject('statescout', win), true)
  assert.equal(win.location.pathname, '/galaxy/projects/statescout')
  assert.equal(win.history.length, 3)
  assert.equal(win.history.state.__galaxyDepth, 'project')
  assert.equal(navigation.getSnapshot().selectedBodyId, 'projects')
  assert.equal(navigation.getSnapshot().selectedProjectId, null)

  navigation.complete(navigation.getSnapshot().transitionId)
  assert.equal(navigation.getSnapshot().selectedProjectId, 'statescout')

  win.history.back()
  assert.equal(win.location.pathname, '/galaxy/projects')
  assert.equal(navigation.getSnapshot().selectedBodyId, 'projects')
  assert.equal(navigation.getSnapshot().selectedProjectId, null)

  win.history.back()
  assert.equal(win.location.pathname, '/galaxy/journey')
  assert.equal(navigation.getSnapshot().selectedBodyId, 'journey')

  dispose()
})

test('cross-linking from Projects adds only the project-detail level', () => {
  const win = createWindow('/galaxy/projects')
  const navigation = createNavigationController()
  const dispose = bindGalaxyHistory({ navigation, win })
  navigation.complete(navigation.getSnapshot().transitionId)

  assert.equal(openGalaxyProject('dear-future', win), true)
  assert.equal(win.history.length, 2)
  assert.equal(win.location.pathname, '/galaxy/projects/dear-future')
  assert.equal(navigation.getSnapshot().selectedProjectId, 'dear-future')

  win.history.back()
  assert.equal(win.location.pathname, '/galaxy/projects')
  assert.equal(navigation.getSnapshot().selectedProjectId, null)

  dispose()
})

test('invalid project cross-links fail without mutating route or history', () => {
  const win = createWindow('/galaxy/lab')
  const navigation = createNavigationController()
  const dispose = bindGalaxyHistory({ navigation, win })
  const beforeLength = win.history.length

  assert.equal(openGalaxyProject('not-a-project', win), false)
  assert.equal(win.location.pathname, '/galaxy/lab')
  assert.equal(win.history.length, beforeLength)
  assert.equal(navigation.getSnapshot().selectedBodyId, 'lab')

  dispose()
})
