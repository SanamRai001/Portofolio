import test, { before, after, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'vite'
import react from '@vitejs/plugin-react'
import { JSDOM } from 'jsdom'
import React, { act } from 'react'
import { createNavigationController } from '../src/pages/Galaxy/navigation/NavigationController.js'
import { createPortalController } from '../src/pages/Galaxy/navigation/PortalController.js'

let components, directory, dom, root, container, navigation
before(async () => {
  process.env.NODE_ENV = 'test'
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    plugins: [react()],
    build: {
      write: false,
      minify: false,
      lib: {
        entry: fileURLToPath(new URL('./galaxy-navigation-entry.jsx', import.meta.url)),
        formats: ['es'],
      },
      rollupOptions: {
        external: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
      },
    },
  })
  directory = await mkdtemp(fileURLToPath(new URL('../node_modules/.galaxy-test-', import.meta.url)))
  const output = (Array.isArray(result) ? result[0] : result).output
    .find(entry => entry.type === 'chunk' && entry.isEntry)
  await writeFile(directory + '/entry.mjs', output.code)
  components = await import(pathToFileURL(directory + '/entry.mjs'))
})

after(async () => {
  if (directory) await rm(directory, { recursive: true, force: true })
})

beforeEach(async () => {
  dom = new JSDOM(
    '<!doctype html><div id="root"></div>',
    { url: 'https://portfolio.test/galaxy', pretendToBeVisual: true },
  )
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    IS_REACT_ACT_ENVIRONMENT: true,
  })
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: dom.window.navigator,
  })
  const { createRoot } = await import('react-dom/client')
  container = document.getElementById('root')
  root = createRoot(container)
  navigation = createNavigationController()
})

afterEach(async () => {
  await act(async () => root.unmount())
  dom.window.close()
})

const stage = () => container.querySelector('.GalaxyStage')
const body = id => container.querySelector(`[data-body="${id}"]`)
const click = async node => act(async () => {
  node.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
})
const selectBody = async id => click(body(id))
const escape = async () => act(async () => {
  window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }))
})
const stageKey = async key => act(async () => {
  stage().dispatchEvent(new window.KeyboardEvent('keydown', { key, bubbles: true }))
})

const render = async (staticView = true, portal = null) => act(async () => {
  root.render(React.createElement(
    components.GalaxyNavigation,
    { navigation, staticView, portal, reducedMotion: false },
    (selectedBodyId, state) => React.createElement(components.SolarDiagram, {
      width: 346,
      height: 494,
      prefix: 'test',
      selectedBodyId,
      selectedSkillId: state.selectedSkillId,
      hoveredSkillId: state.hoveredSkillId,
      selectedProjectId: state.selectedProjectId,
      hoveredProjectId: state.hoveredProjectId,
      selectedJourneyId: state.selectedJourneyId,
      hoveredJourneyId: state.hoveredJourneyId,
      onBodySelect: navigation.focusBody,
      onBodyHover: navigation.setHover,
      onSkillSelect: navigation.selectSkill,
      onSkillHover: navigation.setSkillHover,
      onProjectSelect: navigation.selectProject,
      onProjectHover: navigation.setProjectHover,
      onJourneySelect: navigation.selectJourney,
      onJourneyHover: navigation.setJourneyHover,
    }),
  ))
})

test('visible system-map buttons are removed while direct world selection remains available', async () => {
  await render()

  assert.equal(container.querySelector('.GalaxySystemMap'), null)
  assert.equal(container.querySelectorAll('[data-body]').length, 7)

  for (const id of ['core', 'identity', 'skills', 'projects', 'journey', 'lab', 'black-hole']) {
    await selectBody(id)
    assert.equal(navigation.getSnapshot().mode, 'body_focused')
    assert.equal(navigation.getSnapshot().selectedBodyId, id)
    assert.equal(body(id).getAttribute('opacity'), '1')
    if (id === 'lab') assert.match(container.textContent, /Content locked/)
    assert.match(container.querySelector('[role="status"]').textContent, /Static selection/)
  }

  assert.match(container.textContent, /Portal inactive/)
})

test('Galaxy stage is the keyboard navigation surface and return restores usable focus', async () => {
  await render()
  await act(async () => stage().focus())
  assert.equal(navigation.getSnapshot().hoveredBodyId, 'core')

  await stageKey('ArrowRight')
  await stageKey('ArrowRight')
  await stageKey('ArrowRight')
  assert.equal(navigation.getSnapshot().hoveredBodyId, 'projects')

  await stageKey('Enter')
  assert.equal(navigation.getSnapshot().selectedBodyId, 'projects')
  assert.equal(navigation.getSnapshot().mode, 'body_focused')

  await escape()
  assert.equal(navigation.getSnapshot().mode, 'overview')
  assert.equal(document.activeElement, stage())

  await selectBody('identity')
  await act(async () => container.querySelector('.GalaxyBack').focus())
  await click(container.querySelector('.GalaxyBack'))
  assert.equal(navigation.getSnapshot().mode, 'overview')
  assert.equal(document.activeElement, stage())
  assert.equal(container.querySelector('.GalaxyBack'), null)
})

test('rapid runtime selections synchronize the HUD; context failure settles the latest selection', async () => {
  await render(false)
  await act(async () => {
    navigation.focusBody('identity')
    navigation.focusBody('projects')
    navigation.focusBody('journey')
  })
  assert.equal(navigation.getSnapshot().selectedBodyId, 'journey')
  assert.match(container.querySelector('[role="status"]').textContent, /NavigatingJourney/)

  await render(true)
  assert.equal(navigation.getSnapshot().mode, 'body_focused')
  assert.match(container.textContent, /Static selection/)
  await escape()
  assert.equal(navigation.getSnapshot().mode, 'overview')
})

test('unmount removes keyboard subscriptions and repeat entry installs one working handler', async () => {
  await render()
  await selectBody('skills')
  await act(async () => root.render(null))
  await escape()
  assert.equal(navigation.getSnapshot().selectedBodyId, 'skills')

  navigation = createNavigationController()
  await render()
  await selectBody('journey')
  await escape()
  assert.equal(navigation.getSnapshot().mode, 'overview')
})

test('Core reveals only after arrival and never leaks into rapid alternate selections', async () => {
  await render(false)
  await selectBody('core')
  const core = () => container.querySelector('.CoreIdentity')

  assert.equal(core().getAttribute('aria-hidden'), 'true')
  assert.equal(core().hasAttribute('inert'), true)

  await act(async () => navigation.complete(navigation.getSnapshot().transitionId))
  assert.equal(core().getAttribute('aria-hidden'), 'false')
  assert.equal(core().hasAttribute('inert'), false)
  assert.equal(core().querySelector('h2').textContent, 'Sanam Rai')
  assert.match(core().textContent, /Backend-focused Full-Stack Developer/)
  assert.match(core().textContent, /Build • Scale • Solve/)
  assert.equal(core().querySelectorAll('a').length, 2)

  const oldSequence = navigation.getSnapshot().transitionId
  await act(async () => {
    navigation.focusBody('identity')
    navigation.focusBody('core')
    navigation.focusBody('projects')
    navigation.complete(oldSequence)
  })

  assert.equal(core(), null)
  assert.equal(navigation.getSnapshot().selectedBodyId, 'projects')
  assert.equal(container.querySelectorAll('#core-name').length, 0)
})

test('static Core has the same content, shared return action, and safe focus restoration', async () => {
  await render()
  await selectBody('core')

  assert.equal(container.querySelector('.CoreIdentity').getAttribute('aria-hidden'), 'false')
  assert.match(
    container.querySelector('.GalaxySolarDiagram').getAttribute('aria-label'),
    /Core signal: Sanam Rai/,
  )

  const link = container.querySelector('.CoreLinks a[href="/"]')
  await act(async () => link.focus())
  await escape()

  assert.equal(document.activeElement, stage())
  assert.equal(container.querySelector('.CoreIdentity'), null)
  assert.equal(navigation.getSnapshot().mode, 'overview')

  await act(async () => root.render(null))
  navigation = createNavigationController()
  await render()
  assert.equal(container.querySelector('.CoreIdentity'), null)
})

test('Identity arrives through the shared controller, shows a semantic learning cycle and clears rapid retargets', async () => {
  await render(false)
  await act(async () => navigation.setHover('identity', 'keyboard'))
  assert.match(container.querySelector('[role="status"]').textContent, /IdentityWorking model/)

  await selectBody('identity')
  const identity = () => container.querySelector('.IdentityContent')
  assert.equal(identity().getAttribute('aria-hidden'), 'true')
  assert.ok(identity().hasAttribute('inert'))

  await act(async () => navigation.complete(navigation.getSnapshot().transitionId))
  assert.equal(identity().getAttribute('aria-hidden'), 'false')
  assert.equal(identity().hasAttribute('inert'), false)
  assert.equal(identity().querySelector('h2').textContent, 'How I approach difficult things.')
  assert.deepEqual(
    [...identity().querySelectorAll('.IdentityLoop strong')].map(node => node.textContent),
    ['Learn', 'Build', 'Break', 'Understand', 'Fix', 'Repeat'],
  )
  assert.equal(identity().querySelectorAll('img').length, 0)
  assert.equal(identity().querySelectorAll('.IdentityPrinciples article').length, 3)
  assert.deepEqual(
    [...identity().querySelectorAll('.IdentityPrinciples h3')].map(node => node.textContent),
    ['Trace before changing', 'Build to understand', 'Simplify after understanding'],
  )
  assert.equal(identity().querySelectorAll('.IdentityDirections dt').length, 3)
  assert.doesNotMatch(identity().textContent, /Portrait signal|Image pending|Sanam Rai/)
  assert.doesNotMatch(
    identity().textContent,
    /Build • Scale • Solve|Backend-focused Full-Stack Developer/,
  )

  const stale = navigation.getSnapshot().transitionId
  await act(async () => {
    navigation.focusBody('core')
    navigation.focusBody('identity')
    navigation.focusBody('journey')
    navigation.complete(stale)
  })
  assert.equal(identity(), null)
  assert.equal(container.querySelector('.CoreIdentity'), null)
  assert.equal(navigation.getSnapshot().selectedBodyId, 'journey')
  assert.equal(navigation.getSnapshot().mode, 'focusing_body')
})

test('fallback Identity presents the personal world and both return paths restore stage focus', async () => {
  await render()
  await selectBody('identity')

  assert.match(
    container.querySelector('.GalaxySolarDiagram').getAttribute('aria-label'),
    /Identity: How I approach difficult things\./,
  )
  const earth = container.querySelector('[data-body="identity"] > circle')
  assert.ok(Number(earth.getAttribute('r')) > 100)
  assert.equal(container.querySelectorAll('#identity-title').length, 1)

  await act(async () => container.querySelector('.IdentityReturn').focus())
  await escape()
  assert.equal(document.activeElement, stage())
  assert.equal(container.querySelector('.IdentityContent'), null)

  await selectBody('identity')
  await act(async () => container.querySelector('.IdentityReturn').focus())
  await click(container.querySelector('.IdentityReturn'))
  assert.equal(navigation.getSnapshot().mode, 'overview')
  assert.equal(document.activeElement, stage())

  await selectBody('identity')
  await act(async () => root.render(null))
  await escape()
  assert.equal(navigation.getSnapshot().selectedBodyId, 'identity')

  navigation = createNavigationController()
  await render()
  assert.equal(container.querySelector('.IdentityContent'), null)
  assert.equal(navigation.getSnapshot().mode, 'overview')
})

test('Skills details use native controls and never start another camera flight', async () => {
  await render(false)
  await selectBody('skills')
  const content = () => container.querySelector('.SkillsContent')

  assert.equal(content().hasAttribute('inert'), true)
  await act(async () => navigation.selectSkill('node'))
  assert.equal(navigation.getSnapshot().selectedSkillId, null)

  await act(async () => navigation.complete(navigation.getSnapshot().transitionId))
  assert.equal(content().hasAttribute('inert'), false)

  const groups = content().querySelectorAll('.SkillGroup')
  assert.equal(groups.length, 3)
  assert.deepEqual(
    [...groups].map(group => group.querySelector('h3').textContent),
    ['Runtime & APIs', 'Data & Persistence', 'System Delivery'],
  )
  assert.deepEqual(
    [...groups].map(group => group.querySelectorAll('button').length),
    [3, 3, 4],
  )

  const nodes = content().querySelectorAll('.SkillsDirectory button')
  assert.equal(nodes.length, 10)
  const transition = navigation.getSnapshot().transitionId

  for (const node of nodes) {
    await act(async () => node.focus())
    assert.ok(navigation.getSnapshot().hoveredSkillId)
    await click(node)
    assert.equal(node.getAttribute('aria-pressed'), 'true')
    assert.equal(content().querySelectorAll('[aria-pressed="true"]').length, 1)
    assert.equal(
      content().querySelector('.SkillDetail h3').textContent,
      node.querySelector('span:last-child').textContent,
    )
    assert.equal(content().querySelectorAll('.SkillDetail li').length, 4)
    assert.equal(document.activeElement, node)
    assert.equal(navigation.getSnapshot().transitionId, transition)
  }

  assert.doesNotMatch(content().textContent, /\d+%/)
  await escape()
  assert.equal(content(), null)
  assert.equal(document.activeElement, stage())
  assert.equal(navigation.getSnapshot().selectedSkillId, null)
})

test('Skills resets local selections after rapid retarget, fallback entry and unmount', async () => {
  await render()
  await selectBody('skills')
  await click(container.querySelector('.SkillsDirectory button'))
  assert.equal(navigation.getSnapshot().selectedSkillId, 'node')

  await act(async () => {
    navigation.focusBody('identity')
    navigation.focusBody('skills')
    navigation.focusBody('core')
    navigation.focusBody('journey')
  })
  assert.equal(container.querySelector('.SkillsContent'), null)
  assert.equal(navigation.getSnapshot().selectedSkillId, null)
  assert.equal(navigation.getSnapshot().hoveredSkillId, null)

  await selectBody('skills')
  assert.match(container.querySelector('.SkillDetail').textContent, /Explore one capability ring/)

  await act(async () => container.querySelector('.SkillsContent .IdentityReturn').focus())
  await click(container.querySelector('.SkillsContent .IdentityReturn'))
  assert.equal(document.activeElement, stage())

  await selectBody('skills')
  await act(async () => root.render(null))
  navigation = createNavigationController()
  await render()
  assert.equal(container.querySelector('.SkillsContent'), null)
  assert.equal(navigation.getSnapshot().selectedSkillId, null)
})

test('fallback satellite clicks share Skills selection with the native technology directory', async () => {
  await render()
  await selectBody('skills')

  assert.equal(container.querySelectorAll('[data-skill]').length, 10)
  await click(container.querySelector('[data-skill="postgres"] rect'))
  assert.equal(navigation.getSnapshot().selectedSkillId, 'postgres')
  assert.equal(container.querySelector('.SkillDetail h3').textContent, 'PostgreSQL')
  assert.match(
    container.querySelector('.GalaxySolarDiagram').getAttribute('aria-label'),
    /three capability rings with ten technology signals, selected PostgreSQL/,
  )

  await selectBody('identity')
  assert.equal(container.querySelectorAll('[data-skill]').length, 0)
})

test('Projects exposes six accessible project signals without starting another camera flight', async () => {
  await render(false)
  await selectBody('projects')
  const content = () => container.querySelector('.ProjectsContent')

  assert.equal(content().hasAttribute('inert'), true)
  await act(async () => navigation.selectProject('statescout'))
  assert.equal(navigation.getSnapshot().selectedProjectId, null)

  await act(async () => navigation.complete(navigation.getSnapshot().transitionId))
  assert.equal(content().hasAttribute('inert'), false)

  const projects = content().querySelectorAll('.ProjectsDirectory button')
  assert.equal(projects.length, 6)
  const transition = navigation.getSnapshot().transitionId

  for (const project of projects) {
    await act(async () => project.focus())
    assert.ok(navigation.getSnapshot().hoveredProjectId)
    await click(project)
    assert.equal(project.getAttribute('aria-pressed'), 'true')
    assert.equal(content().querySelectorAll('[aria-pressed="true"]').length, 1)
    assert.equal(
      content().querySelector('.ProjectSignalDetail h3').textContent,
      project.querySelector('strong').textContent,
    )
    assert.equal(content().querySelectorAll('.ProjectSignalDetail li').length, 4)
    assert.equal(navigation.getSnapshot().transitionId, transition)
  }

  assert.match(
    content().querySelector('.ProjectSignalDetail a').href,
    /github\.com\/SanamRai001\//,
  )

  await escape()
  assert.equal(content(), null)
  assert.equal(document.activeElement, stage())
  assert.equal(navigation.getSnapshot().selectedProjectId, null)
})


test('Journey exposes five real progression waypoints without starting another camera flight', async () => {
  await render(false)
  await selectBody('journey')
  const content = () => container.querySelector('.JourneyContent')

  assert.equal(content().hasAttribute('inert'), true)
  await act(async () => navigation.selectJourney('mih'))
  assert.equal(navigation.getSnapshot().selectedJourneyId, null)

  await act(async () => navigation.complete(navigation.getSnapshot().transitionId))
  assert.equal(content().hasAttribute('inert'), false)

  const waypoints = content().querySelectorAll('.JourneyPath button')
  assert.equal(waypoints.length, 5)
  assert.deepEqual(
    [...waypoints].map(button => button.querySelector('strong').textContent),
    ['BIT Foundation', 'QA Lens', 'Backend Direction', 'Production Systems', 'Research & Exploration'],
  )

  const transition = navigation.getSnapshot().transitionId
  for (const waypoint of waypoints) {
    await act(async () => waypoint.focus())
    assert.ok(navigation.getSnapshot().hoveredJourneyId)
    await click(waypoint)
    assert.equal(waypoint.getAttribute('aria-pressed'), 'true')
    assert.equal(content().querySelectorAll('[aria-pressed="true"]').length, 1)
    assert.equal(
      content().querySelector('.JourneyDetail h3').textContent,
      waypoint.querySelector('strong').textContent,
    )
    assert.equal(content().querySelectorAll('.JourneyDetail li').length, 3)
    assert.equal(navigation.getSnapshot().transitionId, transition)
  }

  assert.match(content().textContent, /MIH Group/)
  assert.match(content().textContent, /StateScout|Reality Archive/)

  await escape()
  assert.equal(content(), null)
  assert.equal(document.activeElement, stage())
  assert.equal(navigation.getSnapshot().selectedJourneyId, null)
})

test('fallback Journey waypoint clicks share selection with the semantic path', async () => {
  await render()
  await selectBody('journey')

  assert.equal(container.querySelectorAll('[data-journey]').length, 5)
  await click(container.querySelector('[data-journey="mih"] circle'))
  assert.equal(navigation.getSnapshot().selectedJourneyId, 'mih')
  assert.equal(container.querySelector('.JourneyDetail h3').textContent, 'Production Systems')
  assert.match(
    container.querySelector('.GalaxySolarDiagram').getAttribute('aria-label'),
    /Journey: five progression waypoints, selected Production Systems/,
  )

  await selectBody('identity')
  assert.equal(container.querySelectorAll('[data-journey]').length, 0)
})

test('black-hole static focus remains inspectable when no portal host is configured', async () => {
  await render()
  await selectBody('black-hole')

  assert.equal(navigation.getSnapshot().selectedBodyId, 'black-hole')
  assert.equal(navigation.getSnapshot().mode, 'body_focused')
  assert.match(
    container.querySelector('.GalaxySolarDiagram').getAttribute('aria-label'),
    /Black Hole: fictional event horizon/,
  )
  assert.match(container.querySelector('[role="status"]').textContent, /Black Hole/)
  assert.match(container.textContent, /Portal inactive/)
  assert.ok(container.querySelector('[data-body="black-hole"] ellipse'))

  await act(async () => container.querySelector('.GalaxyBack').focus())
  await escape()
  assert.equal(navigation.getSnapshot().mode, 'overview')
  assert.equal(document.activeElement, stage())
})

test('Black Hole automatically begins the existing horizon transition after camera arrival', async () => {
  const commits = []
  const portal = createPortalController({ onCommit: path => commits.push(path) })
  await render(false, portal)

  assert.equal(container.querySelector('.GalaxyPortalEnter'), null)
  await selectBody('black-hole')
  assert.equal(navigation.getSnapshot().mode, 'focusing_body')
  assert.equal(portal.getSnapshot().mode, 'idle')

  await act(async () => navigation.complete(navigation.getSnapshot().transitionId))
  assert.equal(navigation.getSnapshot().mode, 'body_focused')
  assert.equal(portal.getSnapshot().mode, 'approach')
  assert.equal(container.querySelector('.GalaxyPortalEnter'), null)

  await act(async () => container.querySelector('.GalaxyBack').focus())
  await escape()
  assert.equal(portal.getSnapshot().mode, 'idle')
  assert.equal(navigation.getSnapshot().mode, 'returning_overview')
  assert.deepEqual(commits, [])

  await act(async () => navigation.complete(navigation.getSnapshot().transitionId))
  await selectBody('black-hole')
  await act(async () => navigation.complete(navigation.getSnapshot().transitionId))
  assert.equal(portal.getSnapshot().mode, 'approach')

  await click(container.querySelector('.GalaxyBack'))
  assert.equal(portal.getSnapshot().mode, 'idle')
  assert.deepEqual(commits, [])
})

test('static/reduced fallback automatically enters blackout without a redundant CTA', async () => {
  const commits = []
  const portal = createPortalController({ onCommit: path => commits.push(path) })
  await render(true, portal)
  await selectBody('black-hole')

  assert.equal(navigation.getSnapshot().mode, 'body_focused')
  assert.equal(portal.getSnapshot().mode, 'blackout')
  assert.equal(container.querySelector('.GalaxyPortalEnter'), null)
  assert.deepEqual(commits, [], 'no navigation without a fully opaque veil')

  await escape()
  assert.equal(portal.getSnapshot().mode, 'idle')
  assert.equal(navigation.getSnapshot().mode, 'overview')
  assert.deepEqual(commits, [])
})
