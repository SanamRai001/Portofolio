import test, { before, after, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { build } from 'vite'
import react from '@vitejs/plugin-react'
import { JSDOM } from 'jsdom'
import React, { act } from 'react'
import axios from 'axios'
import { observeSectionReveals } from '../src/motion/sectionReveals.js'

let components, createRoot, directory, dom, root, container
const originalGet = axios.get, originalPost = axios.post
const config = { auth: false, db: true, cache: false, logging: false, pagination: false, rateLimit: false }
const calls = []
let currentConfig, saveConfig

before(async () => {
  // Keep Vite from switching the later React DOM import into production mode.
  process.env.NODE_ENV = 'test'
  const result = await build({
    configFile: false, logLevel: 'silent',
    plugins: [{ name: 'no-test-css', enforce: 'pre', load(id) { if (id.endsWith('.css')) return '' } }, react()],
    define: { 'import.meta.env.VITE_API_URL': JSON.stringify('https://api.test') },
    build: {
      write: false, minify: false,
      lib: { entry: fileURLToPath(new URL('./homepage-entry.jsx', import.meta.url)), formats: ['es'] },
      rollupOptions: { external: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'axios'] },
    },
  })
  directory = await mkdtemp(fileURLToPath(new URL('../node_modules/.homepage-test-', import.meta.url)))
  const output = (Array.isArray(result) ? result[0] : result).output.find((entry) => entry.type === 'chunk' && entry.isEntry)
  await writeFile(directory + '/entry.mjs', output.code)
  components = await import(pathToFileURL(directory + '/entry.mjs'))
})
after(async () => { if (directory) await rm(directory, { recursive: true, force: true }) })

beforeEach(async () => {
  dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://portfolio.test/', pretendToBeVisual: true })
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage, IS_REACT_ACT_ENVIRONMENT: true })
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: dom.window.navigator })
  currentConfig = { ...config }
  calls.length = 0
  saveConfig = async (change) => { currentConfig = { ...currentConfig, ...change }; return { data: { success: true, data: currentConfig } } }
  axios.get = async (url, options) => {
    calls.push({ method: 'get', url, options })
    if (url.endsWith('/api/system')) return { data: { success: true, data: currentConfig } }
    if (url.endsWith('/api/controls') || url.endsWith('/api/logs')) return { data: { success: true, data: [] } }
    if (url.endsWith('/api/projects')) return { data: { success: true, data: [{ _id: 'test', name: 'API project', description: 'Fixture', techStacks: ['Node.js'] }] } }
    throw new Error('Unexpected API: ' + url)
  }
  axios.post = async (url, change) => { calls.push({ method: 'post', url, change }); return saveConfig(change) }
  ;({ createRoot } = await import('react-dom/client'))
  container = document.getElementById('root')
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  axios.get = originalGet
  axios.post = originalPost
  dom.window.close()
})
const render = async (Component, props = {}) => act(async () => { root.render(React.createElement(Component, props)) })
const click = async (element) => act(async () => { element.dispatchEvent(new window.MouseEvent('click', { bubbles: true })) })
const toggle = (name) => container.querySelector(`[aria-label="Toggle ${name}"]`)
const projectRequests = () => calls.filter((call) => call.url.endsWith('/api/projects'))

test('homepage keeps real navigation and API projects without any canvas or mascot', async () => {
  await render(components.App)
  assert.equal(container.querySelectorAll('canvas, .LivingForge, .SystemCore, .HeroIsland').length, 0)
  assert.equal(container.querySelectorAll('[role="switch"]').length, 6)
  assert.ok(container.querySelector('a[href="/galaxy"]'))
  assert.ok(container.querySelector('#architecture-story .RequestPipeline'))
  assert.ok(container.textContent.includes('API project'))
  assert.equal(projectRequests().length, 1)
  assert.equal(projectRequests()[0].options.headers, undefined)
  assert.match(container.textContent, /Rate Limit Flag/)
})

test('lab serializes writes and synchronizes its DOM map after API acknowledgement', async () => {
  const updates = []
  await render(components.SystemControl, { handleToggle: (next) => updates.push(next) })
  let finish
  saveConfig = () => new Promise((resolve) => { finish = resolve })
  await click(toggle('cache'))
  assert.equal(toggle('cache').getAttribute('aria-checked'), 'true')
  assert.ok([...container.querySelectorAll('[role="switch"]')].every((button) => button.disabled))
  await click(toggle('db'))
  assert.equal(calls.filter((call) => call.method === 'post').length, 1)
  assert.deepEqual(calls.find((call) => call.method === 'post').change, { cache: true })
  await act(async () => finish({ data: { success: true, data: { ...config, cache: true } } }))
  const cacheState = [...container.querySelectorAll('.BackendLabMappedState')].find((node) => node.textContent.includes('Cache'))
  assert.equal(cacheState.querySelector('dd').textContent, 'ON')
  assert.equal(updates.at(-1).cache, true)
  assert.equal(toggle('cache').disabled, false)
})

test('failed config writes revert both switch and map to the acknowledged state', async (t) => {
  t.mock.method(console, 'error', () => {})
  const updates = []
  await render(components.SystemControl, { handleToggle: (next) => updates.push(next) })
  saveConfig = async () => { throw new Error('offline') }
  await click(toggle('db'))
  assert.equal(toggle('db').getAttribute('aria-checked'), 'true')
  const database = [...container.querySelectorAll('.BackendLabMappedState')].find((node) => node.textContent.includes('Database'))
  assert.equal(database.querySelector('dd').textContent, 'ON')
  assert.equal(updates.at(-1).db, true)
  assert.match(container.textContent, /Sync failed — change reverted/)
})

test('auth-enabled homepage blocks background access and protected project fetches', async () => {
  currentConfig.auth = true
  await render(components.App)
  const dialog = container.querySelector('[role="dialog"]')
  assert.equal(dialog.getAttribute('aria-modal'), 'true')
  assert.equal(dialog.getAttribute('aria-labelledby'), 'auth-dialog-title')
  assert.ok(container.querySelector('.AppBackground').hasAttribute('inert'))
  assert.equal(container.querySelector('.AppBackground').getAttribute('aria-hidden'), 'true')
  assert.match(dialog.textContent, /viewer@portfolio.dev/)
  assert.equal(document.activeElement.id, 'viewer-email')
  assert.equal(projectRequests().length, 0)
})

test('authenticated requests retain the bearer token and changing cache refetches projects', async () => {
  localStorage.setItem('token', 'header.payload.signature')
  currentConfig.auth = true
  await render(components.App)
  assert.equal(container.querySelector('[role="dialog"]'), null)
  assert.equal(projectRequests()[0].options.headers.Authorization, 'Bearer header.payload.signature')
  await click(toggle('cache'))
  assert.equal(projectRequests().length, 2)
})

test('replaced project request is aborted and backend error messages remain visible', async (t) => {
  t.mock.method(console, 'error', () => {})
  await render(components.Projects, { systemToggle: config })
  const signal = projectRequests()[0].options.signal
  axios.get = async () => { throw { response: { status: 503, data: { message: 'Database is disabled.' } } } }
  await render(components.Projects, { systemToggle: { ...config, db: false } })
  assert.equal(signal.aborted, true)
  assert.match(container.textContent, /Database is disabled\./)
})

function revealEnvironment() {
  const preference = new window.EventTarget()
  preference.matches = false
  const observers = []
  class Observer {
    constructor(callback) { this.callback = callback; this.targets = new Set(); observers.push(this) }
    observe(node) { this.targets.add(node) }
    unobserve(node) { this.targets.delete(node) }
    disconnect() { this.targets.clear() }
    enter(node) { this.callback([{ target: node, isIntersecting: true, boundingClientRect: { top: 100 } }]) }
  }
  return { preference, observers, environment: { IntersectionObserver: Observer, matchMedia: () => preference } }
}

test('reveals enhance visible content once and clean up observers and classes', () => {
  container.innerHTML = '<section data-reveal><a href="#">Link</a></section><section data-reveal>Later</section>'
  const h = revealEnvironment(), section = container.firstElementChild
  assert.equal(section.className, '')
  const cleanup = observeSectionReveals(container, h.environment)
  assert.equal(h.observers.length, 1)
  assert.equal(h.observers[0].targets.size, 2)
  h.observers[0].enter(section)
  assert.equal(section.className, 'SectionRevealEntering')
  assert.equal(h.observers[0].targets.has(section), false)
  section.querySelector('a').focus()
  assert.equal(section.className, '')
  cleanup()
  assert.equal(h.observers[0].targets.size, 0)
  assert.equal(container.querySelectorAll('.SectionRevealEntering').length, 0)
})

test('reduced motion and hidden tabs never leave hidden or animating content', () => {
  container.innerHTML = '<section data-reveal>One</section><section data-reveal>Two</section>'
  const h = revealEnvironment()
  h.preference.matches = true
  const cleanup = observeSectionReveals(container, h.environment)
  assert.equal(h.observers[0].targets.size, 0)
  h.preference.matches = false
  h.preference.dispatchEvent(new window.Event('change'))
  assert.equal(h.observers[0].targets.size, 2)
  h.observers[0].enter(container.firstElementChild)
  Object.defineProperty(document, 'hidden', { configurable: true, value: true })
  document.dispatchEvent(new window.Event('visibilitychange'))
  assert.equal(h.observers[0].targets.size, 0)
  assert.equal(container.querySelectorAll('.SectionRevealEntering').length, 0)
  cleanup()
})
