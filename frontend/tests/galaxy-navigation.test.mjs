import test, { before, after, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'vite'
import react from '@vitejs/plugin-react'
import { JSDOM } from 'jsdom'
import React, { act } from 'react'
import { createNavigationController } from '../src/pages/Galaxy/navigation/NavigationController.js'

let components, directory, dom, root, container, navigation
before(async () => {
  process.env.NODE_ENV = 'test'
  const result = await build({ configFile: false, logLevel: 'silent', plugins: [react()],
    build: { write: false, minify: false, lib: { entry: fileURLToPath(new URL('./galaxy-navigation-entry.jsx', import.meta.url)), formats: ['es'] },
      rollupOptions: { external: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime'] } } })
  directory = await mkdtemp(fileURLToPath(new URL('../node_modules/.galaxy-test-', import.meta.url)))
  const output = (Array.isArray(result) ? result[0] : result).output.find(entry => entry.type === 'chunk' && entry.isEntry)
  await writeFile(directory + '/entry.mjs', output.code)
  components = await import(pathToFileURL(directory + '/entry.mjs'))
})
after(async () => { if (directory) await rm(directory, { recursive: true, force: true }) })
beforeEach(async () => {
  dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'https://portfolio.test/galaxy', pretendToBeVisual: true })
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true })
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: dom.window.navigator })
  const { createRoot } = await import('react-dom/client')
  container = document.getElementById('root'); root = createRoot(container)
  navigation = createNavigationController()
})
afterEach(async () => { await act(async () => root.unmount()); dom.window.close() })
const button = name => container.querySelector(`button[aria-label="${name}"]`)
const render = async (staticView = true) => act(async () => root.render(React.createElement(components.GalaxyNavigation, { navigation, staticView },
  selectedBodyId => React.createElement(components.SolarDiagram, { width: 346, height: 494, prefix: 'test', selectedBodyId }))))
const click = async node => act(async () => node.dispatchEvent(new window.MouseEvent('click', { bubbles: true })))
const escape = async () => act(async () => window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' })))

test('six native map buttons select the same static architecture with visible selected feedback', async () => {
  await render()
  assert.equal(container.querySelectorAll('.GalaxySystemMap button').length, 6)
  for (const [label, id] of [['Core', 'core'], ['Identity', 'identity'], ['Skills', 'skills'], ['Projects', 'projects'], ['Journey', 'journey'], ['The Lab', 'lab']]) {
    assert.equal(button(label).type, 'button')
    assert.equal(button(label).tabIndex, 0)
    await click(button(label))
    assert.equal(navigation.getSnapshot().mode, 'body_focused')
    assert.equal(navigation.getSnapshot().selectedBodyId, id)
    assert.equal(button(label).getAttribute('aria-pressed'), 'true')
    assert.equal(container.querySelectorAll('[aria-pressed="true"]').length, 1)
    assert.equal(container.querySelector(`[data-body="${id}"]`).getAttribute('opacity'), '1')
    assert.match(container.querySelector('[role="status"]').textContent, /Static selection/)
  }
  assert.match(container.textContent, /Content locked/)
})

test('keyboard focus exposes feedback; Escape and System return preserve usable focus', async () => {
  await render()
  await act(async () => button('Projects').focus())
  assert.equal(navigation.getSnapshot().hoveredBodyId, 'projects')
  await click(button('Projects'))
  await escape()
  assert.equal(navigation.getSnapshot().mode, 'overview')
  assert.equal(document.activeElement, button('Projects'))
  await click(button('Identity'))
  await act(async () => container.querySelector('.GalaxyBack').focus())
  await click(container.querySelector('.GalaxyBack'))
  assert.equal(navigation.getSnapshot().mode, 'overview')
  assert.equal(document.activeElement, button('Identity'))
  assert.equal(container.querySelector('.GalaxyBack'), null)
})

test('rapid runtime selections synchronize the HUD; context failure settles the latest selection', async () => {
  await render(false)
  await act(async () => { navigation.focusBody('identity'); navigation.focusBody('projects'); navigation.focusBody('journey') })
  assert.equal(button('Journey').getAttribute('aria-pressed'), 'true')
  assert.match(container.querySelector('[role="status"]').textContent, /NavigatingJourney/)
  await render(true)
  assert.equal(navigation.getSnapshot().mode, 'body_focused')
  assert.match(container.textContent, /Static selection/)
  await escape()
  assert.equal(navigation.getSnapshot().mode, 'overview')
})

test('unmount removes keyboard subscriptions and repeat entry installs one working handler', async () => {
  await render()
  await click(button('Skills'))
  await act(async () => root.render(null))
  await escape()
  assert.equal(navigation.getSnapshot().selectedBodyId, 'skills')
  navigation = createNavigationController()
  await render(); await click(button('Journey')); await escape()
  assert.equal(navigation.getSnapshot().mode, 'overview')
})

test('Core reveals only after arrival and never leaks into rapid alternate selections', async () => {
  await render(false)
  await click(button('Core'))
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
  await act(async () => { navigation.focusBody('identity'); navigation.focusBody('core'); navigation.focusBody('projects'); navigation.complete(oldSequence) })
  assert.equal(core(), null)
  assert.equal(button('Projects').getAttribute('aria-pressed'), 'true')
  assert.equal(container.querySelectorAll('#core-name').length, 0)
})

test('static Core has the same content, shared return action, and safe focus restoration', async () => {
  await render()
  await click(button('Core'))
  assert.equal(container.querySelector('.CoreIdentity').getAttribute('aria-hidden'), 'false')
  assert.match(container.querySelector('.GalaxySolarDiagram').getAttribute('aria-label'), /Core signal: Sanam Rai/)
  const link = container.querySelector('.CoreLinks a[href="/"]')
  await act(async () => link.focus())
  await escape()
  assert.equal(document.activeElement, button('Core'))
  assert.equal(container.querySelector('.CoreIdentity'), null)
  assert.equal(navigation.getSnapshot().mode, 'overview')
  await act(async () => root.render(null))
  navigation = createNavigationController()
  await render()
  assert.equal(container.querySelector('.CoreIdentity'), null)
})
