import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = path => readFile(resolve(root, path), 'utf8')
const [home, galaxy, routing, manifestJson] = await Promise.all([
  read('dist/index.html'),
  read('dist/galaxy/index.html'),
  read('vercel.json'),
  read('dist/.vite/manifest.json'),
])

const homeDoc = new JSDOM(home).window.document
const page = homeDoc.querySelector('#root')
assert.ok(page?.querySelector('#hero-title'), 'Homepage H1 should be server-rendered')
assert.match(page.querySelector('#hero-title').textContent, /Sanam Rai/)
assert.ok(page.querySelector('#about'), 'About section missing in static output')
assert.ok(page.querySelector('a[href="/about"]'), 'Static biography must be linked')
assert.ok(page.querySelector('#selected-work'), 'Selected projects missing in static output')
assert.ok(page.querySelector('#system-controls'), 'Live Backend Lab shell missing in static output')
assert.equal(page.querySelectorAll('button[role="switch"]').length, 6)
assert.ok(page.querySelector('a[href="/galaxy"]'), 'Static link to Galaxy missing')
assert.ok(home.includes('<script type="module"'), 'Frontend script required for hydration')

const manifest = JSON.parse(manifestJson)
const styles = new Set()
const visited = new Set()
function collect(key) {
  if (visited.has(key)) return
  visited.add(key)
  const entry = manifest[key]
  assert.ok(entry, 'Missing manifest entry: ' + key)
  for (const css of entry.css || []) styles.add('/' + css)
  for (const dependency of entry.imports || []) collect(dependency)
}
collect('src/App.jsx')
assert.ok(styles.size > 0, 'Homepage stylesheet is missing from manifest')
for (const href of styles) {
  assert.ok([...homeDoc.querySelectorAll('link[rel="stylesheet"]')].some(
    link => link.getAttribute('href') === href,
  ), 'Stylesheet not available at initial paint: ' + href)
}

const galaxyDoc = new JSDOM(galaxy).window.document
assert.equal(galaxyDoc.querySelector('#root')?.childElementCount, 0,
  'Galaxy must not receive static homepage content')
assert.equal(galaxyDoc.title, 'Galaxy | Sanam Rai')
assert.equal(galaxyDoc.querySelector('link[rel="canonical"]').getAttribute('href'),
  'https://sanam-rai.com.np/galaxy')

const redirects = JSON.parse(routing)
for (const source of ['/galaxy', '/galaxy/:path*']) {
  assert.ok(redirects.rewrites.some(
    rule => rule.source === source && rule.destination === '/galaxy/index.html',
  ), 'Galaxy must use its separate HTML shell: ' + source)
}
console.log('Homepage prerender: semantic HTML, CSS, hydration entry and Galaxy isolation passed')
